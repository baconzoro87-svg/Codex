interface Props {
  href: string;
  title: string;
  thumbnail?: string | null;
  meta?: (string | undefined | false)[];
  variant?: 'wide' | 'feature';
}

/** a thumbnail card that opens the video or playlist on youtube (no embedded player) */
export default function VideoCard({ href, title, thumbnail, meta = [], variant }: Props) {
  const line = meta.filter(Boolean).join(' · ');
  return (
    <a className={`card${variant ? ` card-${variant}` : ''}`} href={href} target="_blank" rel="noopener noreferrer">
      <span className="media">
        {thumbnail && <img src={thumbnail} alt="" loading="lazy" decoding="async" />}
        <span className="badge" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M9 7v10l8-5z" /></svg>
        </span>
      </span>
      <span className="card-body">
        {line && <span className="meta">{line}</span>}
        <span className="card-title">{title}</span>
        <span className="sr-only">, opens on youtube</span>
      </span>
    </a>
  );
}
