import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import NewsletterForm from "../components/NewsletterForm";
import { LINKS } from "../lib/site";

export const metadata = {
  title: "Newsletter",
  description:
    "El newsletter de Mate y Eventos: ideas, aprendizajes y detrás de escena de la industria de eventos en LATAM, directo a tu mail.",
};

export default function Newsletter() {
  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Newsletter
          </div>
          <h1>
            La comunidad,<br />directo a tu mail.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Ideas, aprendizajes y detrás de escena de la industria de eventos.
            Contenido pensado, sin ruido, una vez por semana.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">01</span>Suscribite
          </div>
          <h2 className="clip" style={{ margin: "14px 0 8px" }}>
            Sumate.
          </h2>
          <p className="body reveal">
            Dejanos tu mail y sumate. Es la mejor forma de no depender de los
            algoritmos y recibir todo de primera mano.
          </p>
          <NewsletterForm />

          <div style={{ marginTop: "48px", maxWidth: "480px" }}>
            <p className="body">
              ¿Preferís LinkedIn? También publicamos una edición ahí. Suscribirte
              por mail es la opción principal, pero podés seguirnos por los dos
              lados.
            </p>
            <a
              className="btn btn--ghost"
              style={{ marginTop: "8px" }}
              href={LINKS.linkedinNewsletter}
              target="_blank"
              rel="noopener noreferrer"
            >
              Newsletter en LinkedIn
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
