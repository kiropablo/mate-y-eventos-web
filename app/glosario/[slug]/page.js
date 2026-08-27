import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import ArticuloCuerpo from "../../components/ArticuloCuerpo";
import { getTermino, getTerminos } from "../../lib/glosario";
import { getArticuloDeEpisodio, getArticulos } from "../../lib/articulos";
import { articulosQueMencionan } from "../../lib/enlaces";
import { SITE } from "../../lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  return getTerminos().map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }) {
  const t = getTermino(params.slug);
  if (!t) return { title: "Glosario" };
  return {
    alternates: { canonical: `/glosario/${t.slug}` },
    // "{término}: qué es" y no "— qué significa en la industria de eventos".
    // Ese sufijo medía 60 caracteres y el layout le sumaba " · Mate y Eventos":
    // ninguna de las 59 páginas entraba entera en lo que muestra Google, ni
    // siquiera "VJ", que son dos letras. Además esta forma coincide con cómo
    // se busca de verdad ("qué es un rider técnico").
    title: `${t.termino}: qué es`,
    description: t.definicionCorta,
    openGraph: {
      type: "article",
      title: `${t.termino} · Glosario de ${SITE.name}`,
      description: t.definicionCorta,
      url: `${SITE.url}/glosario/${t.slug}`,
      siteName: SITE.name,
      locale: "es_AR",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t.termino} · Glosario de ${SITE.name}`,
      description: t.definicionCorta,
      images: ["/og-default.jpg"],
    },
  };
}

export default function Termino({ params }) {
  const t = getTermino(params.slug);
  if (!t) notFound();

  const articulo = getArticuloDeEpisodio(t.episodio);

  // Los relacionados que existen y están publicados.
  const todos = getTerminos();
  const relacionados = (t.relacionados || [])
    .map((slug) => todos.find((x) => x.slug === slug))
    .filter(Boolean);

  // Los artículos donde esta palabra está efectivamente escrita. Es distinto
  // del artículo del mismo episodio, que es de dónde salió la definición:
  // acá está dónde se usa. Al 27/8/2026, de los 59 términos publicados 43
  // aparecen en al menos un artículo, así que la mayoría deja de ser una
  // página suelta.
  // Se cortan en cuatro, y el corte es el mismo para lo que se ve y para lo
  // que se marca: "Timing" aparece en 13 artículos y una lista de 13 en una
  // barra lateral no la lee nadie. Declarar en el schema más de lo que la
  // página muestra sería marcar una relación que el lector no puede ver.
  const usadaEn = articulosQueMencionan(t, getArticulos())
    .filter((a) => !articulo || a.id !== articulo.id)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        "@id": `${SITE.url}/glosario/${t.slug}`,
        name: t.termino,
        ...(t.alias.length ? { alternateName: t.alias } : {}),
        description: t.definicionCorta,
        url: `${SITE.url}/glosario/${t.slug}`,
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          "@id": `${SITE.url}/glosario`,
          name: "Glosario de la industria de eventos",
          url: `${SITE.url}/glosario`,
        },
        // De dónde salió la definición y dónde se usa. El episodio es el
        // origen; los artículos son las páginas donde la palabra aparece
        // escrita, que es lo que cierra el circuito entre las dos secciones:
        // el artículo declara qué términos nombra y el término declara en qué
        // artículos está, con el mismo @id de los dos lados.
        subjectOf: [
          {
            "@type": "PodcastEpisode",
            name: t.episodioTitulo || "Episodio de Mate y Eventos",
            url: `${SITE.url}/episodios/${t.episodio}`,
          },
          ...usadaEn.map((a) => ({
            "@type": "Article",
            "@id": `${SITE.url}/articulos/${a.id}`,
            name: a.titulo,
            url: `${SITE.url}/articulos/${a.id}`,
          })),
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Glosario",
            item: `${SITE.url}/glosario`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: t.termino,
            item: `${SITE.url}/glosario/${t.slug}`,
          },
        ],
      },
    ],
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

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>
            <Link href="/glosario">Glosario</Link>
            {t.eje ? ` / ${t.eje}` : ""}
          </div>
          <h1>{t.termino}</h1>
          {t.alias.length > 0 && (
            <p className="glo-alias reveal">
              También se dice: {t.alias.join(" · ")}
            </p>
          )}
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            {t.definicionCorta}
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <div className="ev-ficha">
            <div className="ev-ficha__cuerpo reveal">
              {t.cuerpo ? (
                <ArticuloCuerpo markdown={t.cuerpo} />
              ) : (
                <p className="ev-parrafo">{t.definicionCorta}</p>
              )}
            </div>

            <aside className="ev-ficha__datos reveal">
              <h3 className="ev-datos__titulo">Dónde lo hablamos</h3>
              <p className="glo-episodio">
                {t.episodioTitulo || "Episodio de Mate y Eventos"}
                {t.minuto ? (
                  <>
                    <br />
                    <span className="glo-minuto">Minuto {t.minuto}</span>
                  </>
                ) : null}
              </p>
              <Link className="btn" href={`/episodios/${t.episodio}`}>
                Ver el episodio
              </Link>

              {/* El artículo de ese mismo episodio. Los 59 términos publicados
                  tienen uno y hasta ahora no se linkeaban nunca: el glosario
                  contesta qué es una palabra en tres líneas, el artículo la
                  desarrolla, y el que llega buscando el término no se enteraba
                  de que existía la pieza larga. */}
              {articulo ? (
                <>
                  <h3 className="ev-datos__titulo">Leelo desarrollado</h3>
                  <p className="glo-episodio">
                    <Link href={`/articulos/${articulo.id}`}>
                      {articulo.titulo}
                    </Link>
                  </p>
                </>
              ) : null}

              {/* Dónde se usa la palabra, además del artículo de su propio
                  episodio. Sale de buscar el término en el texto de los 42
                  artículos publicados, no de una lista escrita a mano: si acá
                  figura un artículo, la palabra está escrita ahí y se puede
                  comprobar con Ctrl+F. Es lo mismo que declara el schema, y va
                  visible porque marcar en el código una relación que el lector
                  no puede ver es justamente lo que Google penaliza. */}
              {usadaEn.length > 0 && (
                <>
                  <h3 className="ev-datos__titulo">Dónde se usa</h3>
                  <ul className="ev-lista">
                    {usadaEn.map((a) => (
                      <li key={a.id}>
                        <Link href={`/articulos/${a.id}`}>{a.titulo}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {relacionados.length > 0 && (
                <>
                  <h3 className="ev-datos__titulo">Términos relacionados</h3>
                  <ul className="ev-lista">
                    {relacionados.map((r) => (
                      <li key={r.slug}>
                        <Link href={`/glosario/${r.slug}`}>{r.termino}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </aside>
          </div>

          <div style={{ marginTop: "40px" }}>
            <Link className="btn" href="/glosario">
              ← Volver al glosario
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
