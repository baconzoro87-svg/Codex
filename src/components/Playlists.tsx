import site from '../../shared/site.json';
import { useApi, useReveal } from '../hooks';
import type { PlaylistInfo } from '../types';
import VideoCard from './VideoCard';

export default function Playlists() {
  const ref = useReveal<HTMLElement>();
  const { data } = useApi<{ playlists: PlaylistInfo[] }>('/api/playlists');
  const info = new Map((data?.playlists ?? []).map((p) => [p.id, p]));

  return (
    <section className="section reveal" id="playlists" ref={ref} aria-labelledby="playlists-title">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 id="playlists-title">playlists</h2>
            <p>five series, in order. each one opens on youtube.</p>
          </div>
          <a className="link" href={`https://www.youtube.com/@${site.handle}/playlists`} target="_blank" rel="noopener noreferrer">
            all playlists
          </a>
        </div>
        <ul className="grid grid-playlists">
          {site.playlists.map((id, i) => {
            const p = info.get(id);
            const count = p?.count;
            return (
              <li key={id}>
                <VideoCard
                  variant={i >= 3 ? 'wide' : undefined}
                  href={`https://www.youtube.com/playlist?list=${id}`}
                  title={p?.title || `playlist ${i + 1}`}
                  thumbnail={p?.thumbnail}
                  meta={[`playlist ${i + 1}`, count ? `${count}${count >= 15 ? '+' : ''} videos` : undefined]}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
