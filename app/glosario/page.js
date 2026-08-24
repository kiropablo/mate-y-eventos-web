import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import BuscadorGlosario from "./BuscadorGlosario";
import { getTerminos } from "../lib/glosario";
import { SITE } from "../lib/site";

export const metadata = {
  alternates: { canonical: "/glosario" },
  title: "Glosario de la industria de eventos",
  description:
    "Qué quiere decir rider técnico, backline, contra rider o photo opportunity, explicado como se usa de verdad en la industria de eventos, y con el episodio donde lo hablamos.",
  openGraph: {
    type: "website",
    title: "Glosario de la industria de eventos · Mate y Eventos",
    description:
      "Las palabras del rubro, explicadas como se usan de verdad y con el episodio donde salieron.",
    url: `${SITE.url}/glosario`,
    siteName: SITE.name,
    locale: "es_AR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Glosario de la industria de eventos · Mate y Eventos",
    description:
      "Las palabras del rubro, explicadas como se usan de verdad.",
    images: ["/og-default.jpg"],
  },
};

export const revalidate = 3600;

export default function Glosario() {
  const terminos = getTerminos();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTermSet",
        "@id": `${SITE.url}/glosario`,
        name: "Glosario de la industria de eventos",
        url: `${SITE.url}/glosario`,
        description:
          "Términos de la industria de eventos en Argentina y Latinoamérica, explicados con la voz del rubro y con el episodio del podcast donde se hablaron.",
        inLanguage: "es-AR",
        publisher: { "@id": `${SITE.url}/#organization` },
        hasDefinedTerm: terminos.map((t) => ({
          "@type": "DefinedTerm",
          "@id": `${SITE.url}/glosario/${t.slug}`,
          name: t.termino,
          description: t.definicionCorta,
          url: `${SITE.url}/glosario/${t.slug}`,
        })),
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
            <span className="n">—</span>Glosario
          </div>
          <h1>
            Las palabras{" "}
            <br />
            del rubro.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Rider técnico, backline, contra rider, photo opportunity. El vocabulario que en la industria
            se usa todo el tiempo y casi nunca se explica. Acá está cada uno
            como se dice de verdad, y con el episodio donde lo hablamos.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          {terminos.length === 0 ? (
            <>
              <div className="hold reveal">
                <span className="tag">En preparación</span>
                <p>
                  Estamos armando el glosario a partir de las transcripciones de
                  los episodios. Cada término va a salir de una conversación
                  real, con el link para ir a escucharla.
                </p>
              </div>
              <div style={{ marginTop: "34px" }}>
                <Link className="btn" href="/episodios">
                  Mientras tanto, escuchá los episodios
                </Link>
              </div>
            </>
          ) : (
            <BuscadorGlosario terminos={terminos.map(resumen)} />
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

// Al buscador solo le mandamos lo que necesita para filtrar y listar.
function resumen(t) {
  return {
    slug: t.slug,
    termino: t.termino,
    alias: t.alias,
    definicionCorta: t.definicionCorta,
  };
}
