export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <a className="brand" href="#top" aria-label="aortic edu, back to top">aortic edu</a>
        <nav aria-label="main">
          <a href="#playlists">playlists</a>
          <a href="#latest">latest</a>
          <a className="avatar" href="#contact" aria-label="about haider and contact" title="about &amp; contact">
            <img src="/haider-sm.png" width={44} height={44} alt="haider" />
          </a>
        </nav>
      </div>
    </header>
  );
}
