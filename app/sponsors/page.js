import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { SITE, STATS } from "../lib/site";
import { PRECIO_MES, LUGARES } from "../agenda/destacado/page";

const DESCRIPCION =
  "Sumá tu marca a Mate y Eventos y llegá a una audiencia específica de profesionales, productoras y agencias de la industria de eventos en LATAM.";

const OG_TITLE = "Llegá a los que deciden en eventos · Mate y Eventos";

export const metadata = {
  alternates: { canonical: "/sponsors" },
  title: "Para marcas",
  description: DESCRIPCION,
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/sponsors",
    siteName: SITE.name,
    title: OG_TITLE,
    description: DESCRIPCION,
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: DESCRIPCION,
    images: ["/og-default.jpg"],
  },
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
  // El único formato con precio publicado, porque es el único que se vende
  // solo: la agenda es el 91% del tráfico de búsqueda del sitio. El precio
  // sale de la página, no está escrito acá dos veces.
  [
    "Destacado en Agenda",
    `Tu evento arriba de todo en la agenda de la industria, todo el mes. ${LUGARES} lugares.`,
    `USD ${PRECIO_MES} por mes`,
    "/agenda/destacado",
  ],
];

// "22 de julio de 2026"
function fechaCorta(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, d)));
}

export default async function Sponsors() {
  // Congelado: antes salía en vivo de la API de YouTube. Ver STATS en
  // lib/site.js.
  const vistas = STATS.vistasYouTube;

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
            Llegá a los que <br />deciden en eventos.
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
                <span className="cnt" data-to={vistas}>
                  {vistas.toLocaleString("es-AR")}
                </span>
              </div>
              <div className="l">Vistas en YouTube</div>
              <div className="rule" />
            </div>
            <div className="stat reveal" style={{ transitionDelay: ".1s" }}>
              <div className="n">
                +<span className="cnt" data-to={STATS.crecimientoMensual}>
                  {STATS.crecimientoMensual}
                </span>
                <span className="suf">%</span>
              </div>
              <div className="l">Crecimiento mensual</div>
              <div className="rule" />
            </div>
            <div className="stat reveal" style={{ transitionDelay: ".2s" }}>
              <div className="n">
                <span className="cnt" data-to={STATS.paises}>
                  {STATS.paises}
                </span>
              </div>
              <div className="l">Países en la audiencia</div>
              <div className="rule" />
            </div>
          </div>

          <div className="hold reveal" style={{ marginTop: "48px" }}>
            <span className="tag">
              {`Datos al ${fechaCorta(STATS.actualizado)}`}
            </span>
            <p>
              Métricas reales de nuestras plataformas: Instagram, YouTube y
              TikTok. Los números están a la vista y actualizados a la fecha
              de arriba; si querés el detalle de una campaña puntual, pedilo y
              te lo pasamos.
            </p>
            {/* Acá iba el botón al panel de métricas. Se saca mientras el
                panel muestre todo en cero: mandar a un anunciante a un tablero
                vacío es peor que no ofrecerlo. Para reponerlo, este bloque
                vuelve tal cual con href={SITE.datosUrl}. */}
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
            {FORMATOS.map(([t, d, precio, adonde], i) => (
              <article
                className="card reveal"
                key={t}
                style={{ transitionDelay: `${(i % 3) * 0.1}s` }}
              >
                <h3 style={{ fontSize: "1.25rem" }}>
                  {t}
                  {precio ? <span className="card__pronto">{precio}</span> : null}
                </h3>
                <p>{d}</p>
                {adonde ? (
                  <p style={{ marginTop: "10px" }}>
                    <Link href={adonde}>Qué incluye y qué no &rarr;</Link>
                  </p>
                ) : null}
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
