import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { getInvitados } from "../lib/invitados";
import { migas } from "../lib/migas";
import { SITE } from "../lib/site";
import { jsonLdSeguro } from "../lib/jsonld";

// Quiénes pasaron por el podcast.
//
// Es un CollectionPage con su ItemList, igual que las landings de la agenda:
// para una máquina esto no es "una página con nombres", es una lista de
// personas con su ficha propia, cada una atada a los episodios donde habló.

export const revalidate = 3600;

export const metadata = {
  alternates: { canonical: "/invitados" },
  title: "Invitados",
  description:
    "Quiénes pasaron por Mate y Eventos: productores, técnicos, artistas y creativos de la industria de eventos, con el episodio donde hablaron.",
  openGraph: {
    type: "website",
    title: `Invitados · ${SITE.name}`,
    description:
      "Quiénes pasaron por el podcast, y en qué episodio hablaron.",
    url: `${SITE.url}/invitados`,
    siteName: SITE.name,
    locale: "es_AR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
};

export default function Invitados() {
  const lista = getInvitados();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE.url}/invitados`,
        url: `${SITE.url}/invitados`,
        name: `Invitados · ${SITE.name}`,
        description:
          "Quiénes pasaron por Mate y Eventos, con el episodio donde hablaron.",
        isPartOf: { "@id": `${SITE.url}/#website` },
        ...(lista.length
          ? {
              mainEntity: {
                "@type": "ItemList",
                numberOfItems: lista.length,
                itemListElement: lista.map((i, n) => ({
                  "@type": "ListItem",
                  position: n + 1,
                  url: `${SITE.url}/invitados/${i.slug}`,
                  name: i.nombre,
                })),
              },
            }
          : {}),
      },
      migas([["Invitados", "/invitados"]]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLd) }}
      />

      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span> Invitados
          </div>
          <h1>Quiénes pasaron por acá</h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            {lista.length === 0
              ? "Acá van a estar las personas que pasaron por el podcast, con el episodio donde hablaron."
              : lista.length === 1
                ? "Una persona de la industria que vino a contar cómo trabaja. Su ficha lleva al episodio donde habló."
                : `${lista.length} personas de la industria que vinieron a contar cómo trabajan. Cada ficha lleva al episodio donde hablaron.`}
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          {lista.length === 0 ? (
            <div className="adm-vacio">
              Todavía no hay fichas publicadas.
            </div>
          ) : (
            <div className="inv-grilla">
              {lista.map((i) => (
                <Link
                  href={`/invitados/${i.slug}`}
                  key={i.slug}
                  className="inv-tarjeta reveal"
                >
                  <h2>{i.nombre}</h2>
                  {i.rol ? <span className="inv-tarjeta__rol">{i.rol}</span> : null}
                  {i.bio ? <p>{i.bio}</p> : null}
                  <span className="inv-tarjeta__eps">
                    {i.episodios.length === 1
                      ? "1 episodio"
                      : `${i.episodios.length} episodios`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
