import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { SITE } from "../lib/site";

export const metadata = {
  alternates: { canonical: "/sponsors" },
  title: "Para marcas",
  description:
    "Sumá tu marca a Mate y Eventos y llegá a una audiencia específica de profesionales, productoras y agencias de la industria de eventos en LATAM.",
};

const AUDIENCIA = [
  "Productores y organizadores",
  "Técnicos y operadores",
  "Creativos y planners",
  "Agencias y marcas",
  "Empresarios y referentes",
  "Proveedores del rubro",
];

const FORMATOS = [
  ["Mención al aire", "Tu marca presentada en el episodio, con contexto real."],
  ["Segmento branded", "Un bloque del episodio dedicado a tu propuesta."],
  ["Placement en el set", "Presencia de marca en la grabación audiovisual."],
  ["Contenido co-creado", "Clips y piezas pensadas junto a tu equipo."],
  ["Presencia en redes", "Amplificación en Instagram, TikTok y LinkedIn."],
  ["Newsletter", "Un espacio en el mail semanal de la comunidad."],
];

export default function Sponsors() {
  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Para marcas
          </div>
          <h1>
            Llegá a los que<br />deciden en eventos.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            No es una audiencia masiva y genérica: es una comunidad específica de
            profesionales del rubro en Latinoamérica. Si tu marca vive de los
            eventos, están todos acá.
          </p>
          <a
            className="btn reveal"
            style={{ marginTop: "28px", transitionDelay: ".18s" }}
            href={`mailto:${SITE.email}?subject=Quiero%20ser%20sponsor%20de%20Mate%20y%20Eventos`}
          >
            Quiero ser sponsor
          </a>
        </div>
      </section>

      {/* Métricas */}
      <section className="nums" data-accent="magenta" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">01</span>Alcance
          </div>
          <h2 className="clip">Una audiencia que decide.</h2>
          <p
            className="body reveal"
            style={{ transitionDelay: ".1s", marginTop: "16px" }}
          >
            Detrás de Mate y Eventos hay productores con más de 18 años en la
            industria. Por eso llegamos a quien importa: profesionales del rubro
            que deciden. No ofrecemos alcance masivo — ofrecemos la audiencia
            exacta, en pleno crecimiento.
          </p>
          <div className="grid">
            <div className="stat reveal">
              <div className="n">
                <span className="cnt" data-to="32513">0</span>
              </div>
              <div className="l">Vistas en YouTube</div>
              <div className="rule" />
            </div>
            <div className="stat reveal" style={{ transitionDelay: ".1s" }}>
              <div className="n">
                +<span className="cnt" data-to="5">0</span>
                <span className="suf">%</span>
              </div>
              <div className="l">Crecimiento mensual</div>
              <div className="rule" />
            </div>
            <div className="stat reveal" style={{ transitionDelay: ".2s" }}>
              <div className="n">
                <span className="cnt" data-to="17">0</span>
              </div>
              <div className="l">Países en la audiencia</div>
              <div className="rule" />
            </div>
          </div>

          <div className="hold reveal" style={{ marginTop: "48px" }}>
            <span className="tag">Datos reales · actualizados</span>
            <p>
              Métricas reales de nuestras plataformas (Instagram, YouTube y
              TikTok). El detalle en vivo, con la evolución día a día,
              transparente y abierto en nuestro panel.
            </p>
            <a
              className="btn btn--ghost"
              href={SITE.datosUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver panel de métricas
            </a>
          </div>
        </div>
      </section>

      {/* Audiencia */}
      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">02</span>A quién llegás
          </div>
          <h2 className="clip" style={{ margin: "14px 0 20px" }}>
            Precisión, no volumen.
          </h2>
          <div className="grid">
            {AUDIENCIA.map((a, i) => (
              <article
                className="card reveal"
                key={a}
                style={{ transitionDelay: `${(i % 3) * 0.1}s` }}
              >
                <h3 style={{ fontSize: "1.15rem" }}>{a}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Formatos */}
      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">03</span>Cómo sumarte
          </div>
          <h2 className="clip" style={{ margin: "14px 0 20px" }}>
            Formatos de sponsoreo.
          </h2>
          <div className="grid">
            {FORMATOS.map(([t, d], i) => (
              <article
                className="card reveal"
                key={t}
                style={{ transitionDelay: `${(i % 3) * 0.1}s` }}
              >
                <h3 style={{ fontSize: "1.25rem" }}>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Fundadores */}
      <section className="cta" data-accent="magenta">
        <div className="glowplate" aria-hidden="true" />
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">04</span>Programa fundador
          </div>
          <h2 className="clip">Sé una de las primeras marcas.</h2>
          <p
            className="body reveal"
            style={{ transitionDelay: ".1s", marginTop: "18px" }}
          >
            Estamos abriendo un cupo de sponsors fundadores con condiciones
            preferenciales por acompañar el proyecto desde el comienzo.
          </p>
          <a
            className="btn reveal"
            style={{ transitionDelay: ".18s" }}
            href={`mailto:${SITE.email}?subject=Sponsor%20fundador%20-%20Mate%20y%20Eventos`}
          >
            Hablemos
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
