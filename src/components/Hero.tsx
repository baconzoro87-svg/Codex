import site from '../../shared/site.json';
import type { Video } from '../types';
import VideoCard from './VideoCard';

const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

interface Props {
  video?: Video;
  loading: boolean;
}

export default function Hero({ video, loading }: Props) {
  const showFeature = loading || !!video;
  return (
    <section className="hero" id="top">
      <div className={`container hero-grid${showFeature ? '' : ' hero-single'}`}>
        <div className="hero-copy">
          <p className="eyebrow">{site.brand}</p>
          <h1>learn. explore. understand.</h1>
          <p className="lead">{site.copy.lead}</p>
          <p className="about">{site.copy.about}</p>
          <div className="actions">
            <a className="btn btn-primary" href={site.channelUrl} target="_blank" rel="noopener noreferrer">
              visit the youtube channel
            </a>
            <a className="btn btn-secondary" href="#playlists">explore playlists</a>
          </div>
        </div>

        {showFeature && (
          <div className="hero-feature">
            <p className="feature-label">newest video</p>
            {video ? (
              <VideoCard
                variant="feature"
                href={video.url}
                title={video.title}
                thumbnail={video.thumbnail}
                meta={[date.format(new Date(video.published))]}
              />
            ) : (
              <div className="card card-feature" aria-busy="true">
                <div className="media skeleton" />
                <div className="card-body"><span className="skeleton-line" /></div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
