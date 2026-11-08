import site from '../../shared/site.json';
import { useReveal } from '../hooks';
import type { Video } from '../types';
import VideoCard from './VideoCard';

const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

interface Props {
  videos: Video[];
  loading: boolean;
  error: boolean;
}

export default function LatestVideos({ videos, loading, error }: Props) {
  const ref = useReveal<HTMLElement>();
  // the newest video is featured in the hero, so the grid shows the ones after it
  const list = videos.length > 1 ? videos.slice(1, 7) : videos;

  return (
    <section className="section section-soft reveal" id="latest" ref={ref} aria-labelledby="latest-title">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 id="latest-title">latest videos</h2>
            <p>new uploads appear here automatically.</p>
          </div>
          <a className="link" href={`https://www.youtube.com/@${site.handle}/videos`} target="_blank" rel="noopener noreferrer">
            all videos
          </a>
        </div>

        {loading && (
          <ul className="grid grid-videos" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i}>
                <div className="card">
                  <div className="media skeleton" />
                  <div className="card-body"><span className="skeleton-line" /></div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && list.length > 0 && (
          <ul className="grid grid-videos">
            {list.map((v) => (
              <li key={v.id}>
                <VideoCard href={v.url} title={v.title} thumbnail={v.thumbnail} meta={[date.format(new Date(v.published))]} />
              </li>
            ))}
          </ul>
        )}

        {!loading && list.length === 0 && (
          <p className="notice" role="status">
            {error ? "we couldn't load the latest videos right now. " : 'no videos to show yet. '}
            <a className="link" href={site.channelUrl} target="_blank" rel="noopener noreferrer">watch on youtube</a>
          </p>
        )}
      </div>
    </section>
  );
}
