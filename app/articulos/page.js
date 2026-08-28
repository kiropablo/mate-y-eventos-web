import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { getArticulos, formatFecha } from "../lib/articulos";
import { SITE } from "../lib/site";
import { cortesDeEje } from "../lib/ejes";

export const metadata = {
  alternates: { canonical: "/articulos" },
  // El título nombra la colección, no un tema.
  //
  // Decía "Artículos sobre producción y negocio de eventos", que le robaba las
  // palabras a dos de sus propias landings: /articulos/eje/tecnico-produccion
  // se titula "Artículos sobre producción técnica de eventos" y
  // /articulos/eje/estrategia-negocio, "Artículos sobre estrategia y negocio
  // de eventos". Las tres páginas competían por la misma búsqueda y ninguna
  // quedaba como la principal. Ahora el índice es el índice y cada eje es su
  // tema; los cuatro ejes siguen nombrados en la descripción, que es donde
  // corresponde decir qué hay adentro.
  title: "Todos los artículos de la industria de eventos",
  description:
    "El archivo completo: producción, estrategia y negocio, liderazgo y equipos, tecnología y tendencias. Cada artículo amplía un episodio de Mate y Eventos.",
};

export const revalidate = 3600;

export default function Articulos() {
  const articulos = getArticulos();
  const ejes = cortesDeEje();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Artículos · ${SITE.name}`,
    url: `${SITE.url}/articulos`,
    description:
      "Análisis en profundidad sobre la industria de eventos en Latinoamérica.",
    isPartOf: { "@id": `${SITE.url}/#website` },
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
            Artículos sobre producción{" "}
            <br />
            y negocio de eventos
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            <strong>Lo que el episodio deja para leer.</strong> Cada
            conversación del podcast se convierte en un análisis que la ordena,
            la amplía y la deja lista para aplicar.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          {/* Los cuatro ejes, arriba de la grilla. Sin esto las landings por
              tema quedan huérfanas: solo se llega por el sitemap. */}
          {ejes.length > 1 ? (
            <div className="ag-chips" style={{ marginBottom: "34px" }}>
              {ejes.map((c) => (
                <Link key={c.slug} href={c.url} className="chip">
                  {c.titulo} ({c.articulos.length})
                </Link>
              ))}
            </div>
          ) : null}
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
