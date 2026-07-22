import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { getArticulos, formatFecha } from "../lib/articulos";
import { SITE } from "../lib/site";

export const metadata = {
  alternates: { canonical: "/articulos" },
  title: "Artículos",
  description:
    "Análisis sobre producción, estrategia, tecnología y el lado humano de la industria de eventos. Cada artículo profundiza un episodio de Mate y Eventos.",
};

export const revalidate = 3600;

export default function Articulos() {
  const articulos = getArticulos();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Artículos · ${SITE.name}`,
    url: `${SITE.url}/articulos`,
    description:
      "Análisis en profundidad sobre la industria de eventos en Latinoamérica.",
    isPartOf: { "@id": `${SITE.url}/#organization` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Artículos
          </div>
          <h1>
            Lo que el episodio<br />deja para leer.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Cada conversación del podcast se convierte en un análisis que la
            ordena, la amplía y la deja lista para aplicar.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          {articulos.length === 0 ? (
            <div className="hold reveal">
              <span className="tag">Muy pronto</span>
              <p>
                Estamos preparando los primeros artículos. Mientras tanto,
                escuchá los episodios.
              </p>
              <div
                className="field-row"
                style={{ justifyContent: "center", maxWidth: "none" }}
              >
                <Link className="btn" href="/episodios">
                  Ver episodios
                </Link>
              </div>
            </div>
          ) : (
            <div className="art-grid">
              {articulos.map((art) => (
                <article className="art-card reveal" key={art.id}>
                  <Link href={`/articulos/${art.id}`}>
                    <div className="art-card__meta">
                      <span className="art-eje">{art.eje}</span>
                      <span className="art-card__min">
                        {art.lectura} min de lectura
                      </span>
                    </div>
                    <h2 className="art-card__titulo">{art.titulo}</h2>
                    <p className="art-card__bajada">{art.bajada}</p>
                    <div className="art-card__pie">
                      {formatFecha(art.fecha)}
                      {art.preguntas.length
                        ? ` · ${art.preguntas.length} preguntas respondidas`
                        : ""}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
