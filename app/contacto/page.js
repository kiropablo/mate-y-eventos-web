import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { SITE, LINKS } from "../lib/site";

export const metadata = {
  alternates: { canonical: "/contacto" },
  title: "Contacto",
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
          <div className="grid grid--2">
            <article className="card reveal">
              <div className="eyebrow" style={{ marginBottom: "12px" }}>
                Marcas
              </div>
              <h3>Quiero sponsorear</h3>
              <p>
                Si tu marca quiere llegar a la comunidad de eventos de LATAM,
                escribinos y te pasamos las oportunidades disponibles.
              </p>
              <a
                className="btn"
                style={{ marginTop: "18px" }}
                href={`mailto:${SITE.email}?subject=Sponsoreo%20-%20Mate%20y%20Eventos`}
              >
                Escribir sobre sponsoreo
              </a>
            </article>

            <article className="card reveal" style={{ transitionDelay: ".1s" }}>
              <div className="eyebrow" style={{ marginBottom: "12px" }}>
                Comunidad
              </div>
              <h3>Invitados y colaboraciones</h3>
              <p>
                ¿Tenés una historia que aporte valor a la industria, o una idea
                para colaborar? Nos encanta conocer gente del rubro.
              </p>
              <a
                className="btn btn--azul"
                style={{ marginTop: "18px" }}
                href={`mailto:${SITE.email}?subject=Invitado%20/%20Colaboración%20-%20Mate%20y%20Eventos`}
              >
                Proponer una idea
              </a>
            </article>
          </div>

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
