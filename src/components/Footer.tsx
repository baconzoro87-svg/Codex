import type { ReactNode } from 'react';
import { FaFacebookF, FaInstagram, FaRegEnvelope, FaWhatsapp, FaYoutube } from 'react-icons/fa6';
import site from '../../shared/site.json';

const links: { label: string; href: string; icon: ReactNode; external: boolean }[] = [
  { label: 'youtube', href: site.socials.youtube, icon: <FaYoutube />, external: true },
  { label: 'instagram', href: site.socials.instagram, icon: <FaInstagram />, external: true },
  { label: 'whatsapp group', href: site.socials.whatsapp, icon: <FaWhatsapp />, external: true },
  { label: 'facebook', href: site.socials.facebook, icon: <FaFacebookF />, external: true },
  { label: 'email', href: `mailto:${site.socials.email}`, icon: <FaRegEnvelope />, external: false },
];

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-main">
          <div className="footer-about">
            <p className="footer-brand">{site.brand}</p>
            <p>{site.copy.contact}</p>
            <a className="link" href={`mailto:${site.socials.email}`}>{site.socials.email}</a>
          </div>
          <ul className="socials" aria-label="social links">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  aria-label={l.label}
                  title={l.label}
                  {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {l.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p className="copyright">© {new Date().getFullYear()} {site.brand}. all rights reserved.</p>
      </div>
    </footer>
  );
}
