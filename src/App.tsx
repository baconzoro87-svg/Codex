import Header from './components/Header';
import Hero from './components/Hero';
import Playlists from './components/Playlists';
import LatestVideos from './components/LatestVideos';
import Footer from './components/Footer';
import { useApi } from './hooks';
import type { Video } from './types';

export default function App() {
  // one request feeds both the hero's newest video and the latest-videos section
  const { data, error, loading } = useApi<{ videos: Video[] }>('/api/videos');
  const videos = data?.videos ?? [];

  return (
    <>
      <a className="skip" href="#main">skip to content</a>
      <Header />
      <main id="main">
        <Hero video={videos[0]} loading={loading} />
        <Playlists />
        <LatestVideos videos={videos} loading={loading} error={error} />
      </main>
      <Footer />
    </>
  );
}
