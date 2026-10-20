import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import SalidaLink from "../components/SalidaLink";
import { SITE, LINKS } from "../lib/site";

// La dirección a la que mandan los videos.
//
// El problema que resuelve, con números: el canal genera unas 160.000 vistas
// de video entre YouTube, Instagram y TikTok, y el podcast tiene 622
// reproducciones de audio. La relación es de 260 a 1. No es que el contenido
// no guste: es que entre el short y Spotify no había ningún lugar a dónde
// mandar a la gente. Instagram y TikTok no dejan poner links en la pieza, así
// que el único camino posible es una dirección corta que alguien pueda leer en
// pantalla, escuchar en el audio o tocar desde la bio.
//
// Por eso esta página es /escuchar y no /escuchar-el-podcast: tiene que entrar
// en un comentario fijado y decirse en voz alta sin trabarse.
//
// Su único trabajo es repartir y medir. Nada de novedades, nada de scroll: el
// que llega acá ya decidió escuchar, y cada segundo que tarde en encontrar el
// botón de su app es alguien que se va.

export const metadata = {
  alternates: { canonical: "/escuchar" },
  title: "Escuchá el podcast",
  description:
    "Escuchá Mate y Eventos en Spotify, Apple Podcasts o YouTube. Nuevo episodio cada miércoles.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/escuchar",
    siteName: SITE.name,
    title: "Escuchá Mate y Eventos",
    description:
      "El podcast de la industria de eventos en Latinoamérica. Elegí dónde escucharlo.",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  // Esta página existe para repartir tráfico, no para competir en búsqueda:
  // si Google la posiciona, le saca lugar a /episodios, que sí tiene contenido.
  robots: { index: false, follow: true },
};

// El orden no es estético: es el de la audiencia real. Del export de Spotify
// del 12/10/2026 — Spotify 86,1%, navegador web 9,5%, Apple Podcasts 3,3%.
// YouTube va segundo igual porque es de donde viene la mayoría de los que
// llegan acá, y encontrarse con lo conocido baja el abandono.
const PLATAFORMAS = [
  {
    destino: "spotify",
    nombre: "Spotify",
    detalle: "Donde escucha el 86% de la audiencia",
    href: LINKS.spotify,
    clase: "btn btn--spotify",
  },
  {
    destino: "youtube",
    nombre: "YouTube",
    detalle: "Los episodios completos, en video",
    href: LINKS.youtube,
    clase: "btn",
  },
  {
    destino: "apple",
    nombre: "Apple Podcasts",
    detalle: "Para los que escuchan desde iPhone",
    href: LINKS.apple,
    clase: "btn btn--ghost",
  },
];

export default function Escuchar() {
  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Escuchar
          </div>
          <h1>
            Elegí dónde <br />
            escucharlo.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Mate y Eventos, el podcast de la industria de eventos en
            Latinoamérica. Episodio nuevo todos los miércoles.
          </p>

          <div
            className="reveal"
            style={{
              marginTop: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              maxWidth: "440px",
              transitionDelay: ".18s",
            }}
          >
            {PLATAFORMAS.map((p) => (
              <div key={p.destino}>
                <SalidaLink
                  destino={p.destino}
                  href={p.href}
                  className={p.clase}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {`Escuchar en ${p.nombre}`}
                </SalidaLink>
                <div
                  style={{
                    color: "var(--mute)",
                    fontSize: "13px",
                    marginTop: "6px",
                    textAlign: "center",
                  }}
                >
                  {p.detalle}
                </div>
              </div>
            ))}
          </div>

          <p
            className="body reveal"
            style={{ marginTop: "34px", transitionDelay: ".26s" }}
          >
            ¿Preferís leer primero? Están{" "}
            <a href="/episodios">todos los episodios</a> con su resumen, y la{" "}
            <a href="/agenda">agenda de eventos</a> de la industria.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
