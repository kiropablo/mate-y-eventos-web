import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import ArticuloCuerpo from "../../components/ArticuloCuerpo";
import {
  getArticulo,
  getArticulos,
  formatFecha,
  relacionados,
} from "../../lib/articulos";
import { SITE, AUTORES } from "../../lib/site";
import { migas } from "../../lib/migas";
import { terminosDelEpisodio } from "../../lib/glosario";

export const revalidate = 3600;

export async function generateStaticParams() {
  return getArticulos().map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }) {
  const art = getArticulo(params.id);
  if (!art) return { title: "Artículo" };
  return {
    // Misma escalera que en los episodios: si el título ya ocupa lo que
    // Google muestra, sumarle la marca solo consigue que el corte se lleve el
    // final del título en vez de la marca.
    title: {
      absolute:
        `${art.titulo} · ${SITE.name}`.length <= 70
          ? `${art.titulo} · ${SITE.name}`
          : art.titulo,
    },
    description: art.metaDescripcion,
    alternates: { canonical: `/articulos/${art.id}` },
    keywords: art.etiquetas,
    openGraph: {
      type: "article",
      title: art.titulo,
      description: art.metaDescripcion,
      publishedTime: art.fecha,
    },
  };
}

export default function Articulo({ params }) {
  const art = getArticulo(params.id);
  if (!art) notFound();

  const otros = relacionados(art, 3);
  // Los términos del glosario que salieron de este mismo episodio. Van acá
  // porque son la definición corta de las palabras que el artículo usa
  // largo, y hasta ahora las dos secciones no se enlazaban en ninguna
  // dirección aunque salen del mismo capítulo.
  const terminos = terminosDelEpisodio(art.episodio);

  const url = `${SITE.url}/articulos/${art.id}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: art.titulo,
    description: art.metaDescripcion,
    datePublished: art.fecha,
    dateModified: art.revisado || art.fecha,
    url,
    inLanguage: "es",
    articleSection: art.eje,
    keywords: art.etiquetas.join(", "),
    image: `${url}/opengraph-image`,
    // Firman los dos, por @id, apuntando a los nodos Person del layout. Antes
    // firmaba la Organización: para una máquina, las biografías de /sobre no
    // tenían nada que ver con quién escribe. En temas donde la experiencia
    // decide —cuánto cobrar, cómo elegir un proveedor— la autoría verificable
    // es de lo que más pesa a la hora de elegir a quién citar.
    author: AUTORES.map((a) => ({ "@id": `${SITE.url}/#${a.id}` })),
    publisher: { "@id": `${SITE.url}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isBasedOn: `${SITE.url}/episodios/${art.episodio}`,
  };

  // Este bloque es el que leen Google y los asistentes de IA para citar
  // a Mate y Eventos como fuente de la respuesta.
  const faqLd = art.preguntas.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: art.preguntas.map((q) => ({
          "@type": "Question",
          name: q.pregunta,
          acceptedAnswer: { "@type": "Answer", text: q.respuesta },
        })),
      }
    : null;

  const migasLd = migas([
    ["Artículos", "/articulos"],
    [art.titulo, null],
  ]);
  const jsonLd = faqLd
    ? [articleLd, faqLd, migasLd]
    : [articleLd, migasLd];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="magenta" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Link href="/articulos" className="ep-back">
            ← Todos los artículos
          </Link>

          <div className="art-head">
            <div className="art-head__meta">
              <span className="art-eje">{art.eje}</span>
              <span className="art-card__min">{art.lectura} min de lectura</span>
            </div>
            <h1>{art.titulo}</h1>
            <p className="lead">{art.bajada}</p>
            <div className="ep-date" style={{ marginTop: "18px" }}>
              {formatFecha(art.fecha)}
            </div>
          </div>
        </div>
      </section>

      <section className="section-p" data-accent="magenta" style={{ paddingTop: "40px" }}>
        <div className="wrap">
          <div className="art-col">
            <ArticuloCuerpo markdown={art.cuerpo} />

            {art.preguntas.length ? (
              <div className="art-faq">
                <div className="eyebrow" style={{ marginBottom: "22px" }}>
                  Preguntas frecuentes
                </div>
                {art.preguntas.map((q, i) => (
                  <details className="art-q" key={i} open={i === 0}>
                    <summary>{q.pregunta}</summary>
                    <p>{q.respuesta}</p>
                  </details>
                ))}
              </div>
            ) : null}

            {art.etiquetas.length ? (
              <div className="art-tags">
                {art.etiquetas.map((t) => (
                  <span className="art-tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="art-acciones">
              <Link className="btn btn--ghost" href={`/episodios/${art.episodio}`}>
                Escuchar el episodio
              </Link>
              <Link className="btn btn--ghost" href={`/articulos/${art.id}/imprimir`}>
                Ver versión para PDF
              </Link>
              <a
                className="btn btn--ghost"
                href={`/api/articulos/${art.id}/descargar`}
              >
                Descargar en texto
              </a>
            </div>
          </div>
        </div>

        {terminos.length > 0 && (
          <div className="wrap">
            <section className="rel reveal">
              <h2 className="ag-mes">Las palabras de este episodio</h2>
              <div className="ag-chips">
                {terminos.map((t) => (
                  <Link className="chip" href={`/glosario/${t.slug}`} key={t.slug}>
                    {t.termino}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {otros.length > 0 && (
          <div className="wrap">
            <section className="rel reveal">
              <h2 className="ag-mes">También te puede servir</h2>
              <div className="home-arts">
                {otros.map((a) => (
                  <Link
                    className="home-art"
                    href={`/articulos/${a.id}`}
                    key={a.id}
                  >
                    <span className="home-art__eje">{a.eje}</span>
                    <h3 className="home-art__tit">{a.titulo}</h3>
                    <p className="home-art__baj">{a.bajada}</p>
                    <span className="home-art__pie">{a.lectura} min</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
