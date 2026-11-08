// small, dependency-free helpers for youtube's public rss feeds (no api key needed)

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeXml(s = '') {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const first = (s, re) => {
  const m = s.match(re);
  return m ? decodeXml(m[1].trim()) : '';
};

/** parse a youtube channel or playlist atom feed into plain objects */
export function parseFeed(xml) {
  const firstEntry = xml.indexOf('<entry>');
  const head = firstEntry === -1 ? xml : xml.slice(0, firstEntry);
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
    const b = m[1];
    const id = first(b, /<yt:videoId>([\w-]{11})<\/yt:videoId>/);
    return {
      id,
      title: first(b, /<title>([\s\S]*?)<\/title>/),
      published: first(b, /<published>([\s\S]*?)<\/published>/),
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${id}`,
    };
  }).filter((e) => e.id);
  return {
    title: first(head, /<title>([\s\S]*?)<\/title>/),
    channelId: first(xml, /<yt:channelId>(UC[\w-]{22})<\/yt:channelId>/),
    entries,
  };
}

export const isChannelId = (s) => /^UC[\w-]{22}$/.test(s || '');

export async function fetchText(url, timeoutMs = 10000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; aortic-edu-site/1.0)',
      'accept-language': 'en',
      // avoids the eu cookie-consent redirect on youtube pages
      cookie: 'CONSENT=YES+1; SOCS=CAI',
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}
