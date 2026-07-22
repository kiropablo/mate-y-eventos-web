import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import ArticuloCuerpo from "../../components/ArticuloCuerpo";
import { getArticulo, getArticulos, formatFecha } from "../../lib/articulos";
import { SITE } from "../../lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  return getArticulos().map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }) {
  const art = getArticulo(params.id);
  if (!art) return { title: "Artículo" };
  return {
    title: art.titulo,
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

  const url = `${SITE.url}/articulos/${art.id}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: art.titulo,
    description: art.metaDescripcion,
    datePublished: art.fecha,
    dateModified: art.fecha,
    url,
    inLanguage: "es",
    articleSection: art.eje,
    keywords: art.etiquetas.join(", "),
    image: `${url}/opengraph-image`,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
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

  const jsonLd = faqLd ? [articleLd, faqLd] : [articleLd];

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
      </section>

      <Footer />
    </>
  );
}
