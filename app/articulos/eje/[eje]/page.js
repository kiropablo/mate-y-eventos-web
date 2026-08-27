import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../../components/SiteNav";
import Footer from "../../../components/Footer";
import { formatFecha } from "../../../lib/articulos";
import { cortesDeEje, buscarEje } from "../../../lib/ejes";
import { migas } from "../../../lib/migas";
import { SITE } from "../../../lib/site";

// Una página por eje editorial.
//
// /articulos era una grilla plana de 41 piezas: una sola página para cuatro
// temas que no tienen nada que ver entre sí. Estas landings responden a la
// búsqueda entera —"artículos sobre producción de eventos"— en vez de a una
// pieza suelta, que es exactamente lo que ya hacen las 27 landings de la
// agenda, de donde entra el 91% del tráfico de búsqueda del sitio.

export const revalidate = 3600;

export function generateStaticParams() {
  return cortesDeEje().map((c) => ({ eje: c.slug }));
}

export function generateMetadata({ params }) {
  const corte = buscarEje(params.eje);
  if (!corte) return { title: "Artículos" };
  const n = corte.articulos.length;
  return {
    alternates: { canonical: `/articulos/eje/${corte.slug}` },
    title: `Artículos sobre ${corte.frase}`,
    description: `${n} ${n === 1 ? "artículo" : "artículos"} sobre ${corte.frase}. ${corte.texto}`,
    openGraph: {
      type: "website",
      title: `Artículos de ${corte.titulo} · ${SITE.name}`,
      description: corte.texto,
      url: `${SITE.url}/articulos/eje/${corte.slug}`,
      siteName: SITE.name,
      locale: "es_AR",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
  };
}

export default function EjeDeArticulos({ params }) {
  const corte = buscarEje(params.eje);
  if (!corte) notFound();

  const otros = cortesDeEje().filter((c) => c.slug !== corte.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE.url}/articulos/eje/${corte.slug}`,
        name: `Artículos de ${corte.titulo} · ${SITE.name}`,
        url: `${SITE.url}/articulos/eje/${corte.slug}`,
        description: corte.texto,
        isPartOf: { "@id": `${SITE.url}/#website` },
        about: corte.titulo,
      },
      {
        "@type": "ItemList",
        numberOfItems: corte.articulos.length,
        itemListElement: corte.articulos.map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE.url}/articulos/${a.id}`,
          name: a.titulo,
        })),
      },
      migas([
        ["Artículos", "/articulos"],
        [corte.titulo, null],
      ]),
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

      <section className="page-top" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>
            <Link href="/articulos">Artículos</Link> / {corte.titulo}
          </div>
          <h1>
            Artículos sobre{" "}
            <br />
            {corte.frase}
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            {corte.texto}
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          <div className="art-grid">
            {corte.articulos.map((art) => (
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
                  <div className="art-card__pie">{formatFecha(art.fecha)}</div>
                </Link>
              </article>
            ))}
          </div>

          {otros.length > 0 ? (
            <section className="sem-bloque reveal" style={{ marginTop: "48px" }}>
              <h2 className="ag-mes">Los otros ejes</h2>
              <div className="ag-chips">
                {otros.map((c) => (
                  <Link key={c.slug} href={c.url} className="chip">
                    {c.titulo} ({c.articulos.length})
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <div style={{ marginTop: "40px" }}>
            <Link className="btn" href="/articulos">
              ← Todos los artículos
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
