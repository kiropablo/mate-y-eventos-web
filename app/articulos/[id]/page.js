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
import { SITE } from "../../lib/site";
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
    // Firma el equipo, no una persona: es la decisión editorial del proyecto
    // y coincide con cómo se escriben —voz del medio, no de Pablo ni de
    // Alexis—. Va por @id contra la Organización del layout, no repitiendo
    // nombre y URL, para que sea la misma entidad y no otra que se llama igual.
    author: { "@id": `${SITE.url}/#organization` },
    // Y acá aparece la persona, que es lo que faltaba: quién se hace cargo de
    // que esto salga. Pablo revisa, corrige y publica cada artículo desde el
    // panel, así que "editor" es literalmente lo que hace. Con esto el
    // artículo tiene un humano verificable detrás —con su LinkedIn, su cargo y
    // su experiencia declarada— sin contradecir que la firma sea del equipo.
    editor: { "@id": `${SITE.url}/#pablo-quiroga` },
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
            {/* La firma, visible. Estaba solo en el schema: el lector no
                tenía forma de saber quién se hace cargo de lo que lee, que es
                lo primero que mira alguien que va a usar esto para tomar una
                decisión de plata. */}
            <div className="ep-date" style={{ marginTop: "18px" }}>
              {formatFecha(art.fecha)} · Por el equipo de {SITE.name}, editado
              por{" "}
              <Link href="/sobre/pablo-quiroga">Pablo Quiroga</Link>
              {art.revisado && art.revisado !== art.fecha
                ? ` · Revisado el ${formatFecha(art.revisado)}`
                : ""}
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
