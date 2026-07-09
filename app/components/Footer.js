import Link from "next/link";
import { SITE, LINKS } from "../lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="brand">Mate y Eventos</div>
            <p className="lead">
              {SITE.tagline}. Un proyecto de Pablo Quiroga y Alexis Vidal.
            </p>
          </div>

          <div className="foot-cols">
            <div className="foot-col">
              <h4>Escuchar</h4>
              <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
              <a href={LINKS.spotify} target="_blank" rel="noopener noreferrer">
                Spotify
              </a>
              <a href={LINKS.apple} target="_blank" rel="noopener noreferrer">
                Apple Podcasts
              </a>
            </div>
            <div className="foot-col">
              <h4>Seguir</h4>
              <a
                href={LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a href={LINKS.tiktok} target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
              <a
                href={LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </div>
            <div className="foot-col">
              <h4>Proyecto</h4>
              <Link href="/sobre">Sobre</Link>
              <Link href="/sponsors">Para marcas</Link>
              <Link href="/newsletter">Newsletter</Link>
              <Link href="/contacto">Contacto</Link>
            </div>
          </div>
        </div>

        <div className="foot-bottom">
          <span>
            © {year} {SITE.name} · El medio de la industria de eventos en LATAM
          </span>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </div>
      </div>
    </footer>
  );
}
