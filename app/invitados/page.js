import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { getInvitados } from "../lib/invitados";
import { migas } from "../lib/migas";
import { SITE, AUTORES } from "../lib/site";
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

// Los dos conductores entran a este listado, pero NO con una ficha propia.
//
// Pablo y Alexis ya son entidades del schema, declaradas una sola vez en
// layout.js, con /sobre/{id} como su ProfilePage. Darles además una ficha de
// invitado crearía un SEGUNDO Person con el mismo nombre: para Google y para
// una IA serían dos personas distintas que casualmente se llaman igual, y la
// autoridad se partiría en dos en vez de concentrarse. Es exactamente lo que
// el grafo de entidades del layout existe para evitar.
//
// Así que aparecen con su tarjeta —que es lo que se quería— y el link lleva a
// la página que ya tienen. Una persona, una página canónica.
function losConductores() {
  return AUTORES.map((a) => ({
    slug: a.id,
    href: `/sobre/${a.id}`,
    nombre: a.nombre,
    rol: a.jobTitle || a.cargo,
    bio: a.bio,
    foto: a.foto || `/${a.id.split("-")[0]}.jpg`,
    episodios: [],
    conduce: true,
  }));
}

export default function Invitados() {
  const invitados = getInvitados().map((i) => ({
    ...i,
    href: `/invitados/${i.slug}`,
    foto: i.foto ? `/invitados/${i.slug}.jpg` : "",
  }));
  // Los conductores primero: son los que sostienen todo lo demás.
  const lista = [...losConductores(), ...invitados];

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
                  url: `${SITE.url}${i.href}`,
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
          <h1>Las voces de la industria</h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
              {/* El texto ya no puede decir "los que pasaron por el podcast":
                  en esta lista están también los dos que lo conducen, y gente
                  del rubro que todavía no vino a grabar. Decir "vinieron a
                  contar cómo trabajan" de alguien que nunca vino sería falso,
                  y es el tipo de frase que nadie vuelve a leer después. */}
              {invitados.length === 0
                ? "Las personas de la industria que sostienen este medio, y las que pasaron a contar cómo trabajan."
                : `Los dos que conducen y ${invitados.length} ${
                    invitados.length === 1 ? "persona" : "personas"
                  } de la industria. Cada ficha lleva a lo que esa persona contó.`}
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
                  href={i.href}
                  key={i.slug}
                  className="inv-tarjeta reveal"
                >
                  {i.foto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      className="inv-tarjeta__foto"
                      src={i.foto}
                      alt=""
                      width={800}
                      height={1000}
                      loading="lazy"
                    />
                  ) : null}
                  <h2>{i.nombre}</h2>
                  {i.rol ? <span className="inv-tarjeta__rol">{i.rol}</span> : null}
                  {i.bio ? <p>{i.bio}</p> : null}
                  <span className="inv-tarjeta__eps">
                    {/* Los conductores están en TODOS los episodios, así que
                        contarlos no dice nada: dice que conducen. Y una ficha
                        sin episodio —alguien del rubro que todavía no vino— no
                        tiene que mentir diciendo «0 episodios». */}
                    {i.conduce
                      ? "Conduce el podcast"
                      : i.episodios.length === 0
                        ? "Todavía no pasó por el podcast"
                        : i.episodios.length === 1
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
