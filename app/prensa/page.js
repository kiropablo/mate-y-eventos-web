import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { SITE } from "../lib/site";

export const metadata = {
  title: "Prensa",
  description:
    "Kit de prensa de Mate y Eventos: logos, colores, media kit y contacto para medios y marcas.",
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
            una nota: logos, identidad y contacto directo.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">01</span>Descargas
          </div>
          <div className="press-grid" style={{ marginTop: "30px" }}>
            <article className="press-card reveal">
              <h3>Pack de marca</h3>
              <p>
                Isotipo en PNG (fondo transparente), versión cuadrada, banner y
                la guía de colores y tipografías. Todo en un ZIP.
              </p>
              <a
                className="btn"
                href="/prensa/mate-y-eventos-brand-pack.zip"
                download
              >
                Descargar pack (.zip)
              </a>
            </article>

            <article className="press-card reveal" style={{ transitionDelay: ".08s" }}>
              <h3>Media kit</h3>
              <p>
                Presentación completa del proyecto, audiencia y métricas, pensada
                para marcas y medios.
              </p>
              <span className="press-soon">Próximamente</span>
            </article>

            <article className="press-card reveal" style={{ transitionDelay: ".16s" }}>
              <h3>Fotos</h3>
              <p>
                Fotos de los conductores y del detrás de escena, en alta
                resolución para publicaciones.
              </p>
              <span className="press-soon">Próximamente</span>
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
