import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { SITE, LINKS } from "../lib/site";
import FormContacto from "./FormContacto";

export const metadata = {
  alternates: { canonical: "/contacto" },
  title: "Contacto: sponsors, invitados y prensa",
  description:
    "Contactá a Mate y Eventos: propuestas de sponsoreo para marcas, o ideas para ser invitado y colaboraciones.",
};

export default function Contacto() {
  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Contacto
          </div>
          <h1>Hablemos.</h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Elegí el camino que corresponda y te respondemos lo antes posible.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          {/* Las dos tarjetas y el formulario al que llevan. Eran dos links
              `mailto:`, que no hacen nada si el navegador no tiene un programa
              de correo asociado; está contado en FormContacto.js. */}
          <FormContacto email={SITE.email} />

          <div style={{ marginTop: "48px" }}>
            <div className="eyebrow reveal">
              <span className="n">01</span>Seguinos
            </div>
            <div className="link-list">
              <a
                className="link-row"
                href={LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Instagram</span>
                <span>@mateyeventosok</span>
              </a>
              <a
                className="link-row"
                href={LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>TikTok</span>
                <span>@mate.y.eventos</span>
              </a>
              <a
                className="link-row"
                href={LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>LinkedIn</span>
                <span>Mate y Eventos</span>
              </a>
              <a className="link-row" href={`mailto:${SITE.email}`}>
                <span>Email</span>
                <span>{SITE.email}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
