// aortic edu — tiny web server: serves the built site and two json endpoints
//   GET /api/videos     latest uploads from the channel rss feed
//   GET /api/playlists  title + thumbnail for each configured playlist
// no api key, no dependencies.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFeed, fetchText, isChannelId } from './feed.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const CACHE_DIR = path.join(ROOT, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'data.json');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared', 'site.json'), 'utf8'));

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const REFRESH_MS = (Number(process.env.REFRESH_MINUTES) || 15) * 60 * 1000;
const MAX_VIDEOS = 12;

const log = (...a) => console.log(new Date().toISOString(), ...a);

// ---------- cache (memory + a small file so restarts start warm) ----------
const store = { channelId: '', videos: null, playlists: null };
try {
  Object.assign(store, JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')));
} catch { /* first run */ }

function persist() {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store));
  } catch (e) {
    log('could not write cache file:', e.message);
  }
}

// ---------- channel id: env -> site.json -> channel page -> playlist feed ----------
async function resolveChannelId() {
  const configured = process.env.CHANNEL_ID || site.channelId;
  if (isChannelId(configured)) return configured;
  if (isChannelId(store.channelId)) return store.channelId;

  let id = '';
  try {
    const html = await fetchText(`https://www.youtube.com/@${site.handle}`);
    id = (html.match(/"(?:channelId|externalId)":"(UC[\w-]{22})"/)
      || html.match(/channel_id=(UC[\w-]{22})/)
      || html.match(/youtube\.com\/channel\/(UC[\w-]{22})/) || [])[1] || '';
  } catch (e) {
    log('channel page lookup failed:', e.message);
  }
  if (!isChannelId(id)) {
    for (const pl of site.playlists) {
      try {
        id = parseFeed(await fetchText(`https://www.youtube.com/feeds/videos.xml?playlist_id=${pl}`)).channelId;
        if (isChannelId(id)) break;
      } catch (e) {
        log('playlist feed lookup failed:', e.message);
      }
    }
  }
  if (!isChannelId(id)) throw new Error('could not resolve channel id (set CHANNEL_ID in the service file)');
  store.channelId = id;
  persist();
  log('resolved channel id', id);
  return id;
}

// ---------- refreshers (stale data is kept if youtube is unreachable) ----------
async function refreshVideos() {
  const id = await resolveChannelId();
  const feed = parseFeed(await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`));
  store.videos = { updatedAt: Date.now(), channelId: id, videos: feed.entries.slice(0, MAX_VIDEOS) };
  persist();
}

async function refreshPlaylists() {
  const previous = new Map((store.playlists?.playlists || []).map((p) => [p.id, p]));
  const results = await Promise.all(site.playlists.map(async (id) => {
    const base = { id, title: null, thumbnail: null, url: `https://www.youtube.com/playlist?list=${id}` };
    try {
      const feed = await parseFeedFor(id);
      return { ...base, title: feed.title || null, thumbnail: feed.entries[0]?.thumbnail || null, count: feed.entries.length };
    } catch (e) {
      log(`playlist ${id} failed:`, e.message);
      return previous.get(id) || base;
    }
  }));
  store.playlists = { updatedAt: Date.now(), playlists: results };
  persist();
}
const parseFeedFor = async (id) => parseFeed(await fetchText(`https://www.youtube.com/feeds/videos.xml?playlist_id=${id}`));

let inflight = {};
function ensureFresh(key, fn) {
  const entry = store[key];
  if (entry && Date.now() - entry.updatedAt < REFRESH_MS) return Promise.resolve();
  inflight[key] ??= fn().finally(() => { delete inflight[key]; });
  return inflight[key];
}

async function serveData(res, key, fn) {
  try {
    await ensureFresh(key, fn);
  } catch (e) {
    log(`${key} refresh failed:`, e.message);
  }
  if (!store[key]) return json(res, 502, { error: 'youtube feed unavailable, try again shortly' });
  return json(res, 200, store[key]);
}

// ---------- http ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
};

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': MIME['.json'],
    'cache-control': status === 200 ? 'public, max-age=300' : 'no-store',
  });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  let file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST + path.sep) && file !== DIST) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (path.extname(rel)) { res.writeHead(404); return res.end('not found'); }
    file = path.join(DIST, 'index.html'); // single-page fallback
  }
  if (!fs.existsSync(file)) {
    res.writeHead(503, { 'content-type': MIME['.txt'] });
    return res.end('site not built yet. run: npm run build');
  }
  const ext = path.extname(file);
  const immutable = file.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname === '/api/videos') return void serveData(res, 'videos', refreshVideos);
    if (pathname === '/api/playlists') return void serveData(res, 'playlists', refreshPlaylists);
    if (pathname === '/api/health') return json(res, 200, { ok: true });
    serveStatic(req, res, pathname);
  } catch (e) {
    log('request error:', e.message);
    res.writeHead(500); res.end('server error');
  }
});

server.listen(PORT, HOST, () => {
  log(`aortic edu listening on http://${HOST}:${PORT}`);
  // warm the cache, then refresh on a timer
  const tick = () => {
    refreshVideos().catch((e) => log('videos refresh failed:', e.message));
    refreshPlaylists().catch((e) => log('playlists refresh failed:', e.message));
  };
  tick();
  setInterval(tick, REFRESH_MS).unref();
});

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)));
