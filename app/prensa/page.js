import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { SITE, LINKS } from "../lib/site";

export const metadata = {
  title: "Prensa",
  description:
    "Kit de prensa de Mate y Eventos: logos, media kit, fotos y contacto para medios y marcas.",
};

export default function Prensa() {
  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Prensa
          </div>
          <h1>
            Material<br />para prensa.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Todo lo que necesitás para escribir sobre Mate y Eventos o sumarnos a
            una nota: logos, media kit, fotos y contacto directo.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">01</span>Descargas
          </div>
          <div className="press-grid" style={{ marginTop: "30px" }}>
            <article className="press-card press-card--main reveal">
              <h3>Material de prensa completo</h3>
              <p>
                Media kit, logos, fotos en alta y todo el material de marca en
                una sola carpeta. Descargá lo que necesites.
              </p>
              <a
                className="btn"
                href={LINKS.pressDrive}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir carpeta de prensa
              </a>
            </article>

            <article className="press-card reveal" style={{ transitionDelay: ".08s" }}>
              <h3>Pack de logos</h3>
              <p>
                ¿Solo necesitás el logo? Isotipo en PNG (fondo transparente),
                versión cuadrada, banner y la guía de colores. En un ZIP.
              </p>
              <a
                className="btn btn--ghost"
                href="/prensa/mate-y-eventos-brand-pack.zip"
                download
              >
                Descargar logos (.zip)
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="section-p" data-accent="magenta" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">02</span>Contacto de prensa
          </div>
          <h2 className="clip" style={{ marginTop: "10px" }}>
            Hablemos.
          </h2>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Para entrevistas, notas o material adicional, escribinos y
            respondemos a la brevedad.
          </p>
          <a
            className="btn btn--azul"
            style={{ marginTop: "20px" }}
            href={`mailto:${SITE.email}?subject=Prensa%20-%20Mate%20y%20Eventos`}
          >
            {SITE.email}
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
