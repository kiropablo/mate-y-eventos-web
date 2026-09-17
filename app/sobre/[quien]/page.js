import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import { getEpisodes, partirTitulo, formatDate } from "../../lib/youtube";
import { getArticulos } from "../../lib/articulos";
import { migas } from "../../lib/migas";
import { SITE, LINKS, AUTORES } from "../../lib/site";
import { jsonLdSeguro } from "../../lib/jsonld";

// La biografía se guarda en texto plano y el link se pone acá, al dibujarla.
//
// Guardarla con el <a> adentro obligaría a inyectar HTML crudo en la página, y
// además ese mismo texto lo lee el schema y la descripción de Google, donde una
// etiqueta no es un link: es basura en el medio de una oración.
function conLinkAV(texto) {
  return String(texto || "")
    .split("AV Eventos")
    .flatMap((trozo, i) =>
      i === 0
        ? [trozo]
        : [
            <a
              key={`av-${i}`}
              href={LINKS.webAvEventos}
              target="_blank"
              rel="noopener noreferrer"
            >
              AV Eventos
            </a>,
            trozo,
          ]
    );
}

// La página de cada uno.
//
// El nodo Person del layout necesitaba una dirección propia: hasta ahora las
// dos personas apuntaban a /sobre, o sea que para una máquina compartían
// página y no se distinguían. Un ProfilePage por persona es lo que corresponde
// y es lo que hace que la autoría sea verificable de punta a punta: del
// artículo al editor, del editor a su perfil, del perfil a su LinkedIn.
//
// Lo que NO hace esta página es listar los 41 episodios de cada uno. Los dos
// conducen todos, así que dos páginas con la misma lista de 41 serían casi el
// mismo documento con distinta biografía arriba, que es exactamente el
// problema de contenido duplicado que arreglamos en las landings de provincia.
// Van los últimos tres y el link a la sección.

export const revalidate = 3600;

const quienEs = (slug) => AUTORES.find((a) => a.id === slug) || null;

export function generateStaticParams() {
  return AUTORES.map((a) => ({ quien: a.id }));
}

export function generateMetadata({ params }) {
  const p = quienEs(params.quien);
  if (!p) return { title: "Sobre" };
  return {
    alternates: { canonical: `/sobre/${p.id}` },
    title: { absolute: `${p.nombre} — ${p.cargo} · ${SITE.name}` },
    description: p.bio,
    openGraph: {
      type: "profile",
      title: `${p.nombre} · ${SITE.name}`,
      description: p.bio,
      url: `${SITE.url}/sobre/${p.id}`,
      siteName: SITE.name,
      locale: "es_AR",
      images: [{ url: p.foto || `/${p.id.split("-")[0]}.jpg`, width: 800, height: 1000 }],
    },
  };
}

export default async function Persona({ params }) {
  const p = quienEs(params.quien);
  if (!p) notFound();

  const otro = AUTORES.find((a) => a.id !== p.id);
  const foto = p.foto || `/${p.id.split("-")[0]}.jpg`;

  // Los episodios se piden a YouTube y pueden no venir: la página tiene que
  // salir igual, porque lo que la sostiene es la biografía y no la lista.
  let ultimos = [];
  let cuantos = 0;
  try {
    const eps = await getEpisodes();
    cuantos = eps.length;
    ultimos = eps.slice(0, 3);
  } catch {
    ultimos = [];
  }
  const articulos = getArticulos().length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${SITE.url}/sobre/${p.id}`,
        url: `${SITE.url}/sobre/${p.id}`,
        name: `${p.nombre} · ${SITE.name}`,
        isPartOf: { "@id": `${SITE.url}/#website` },
        // La persona ya está declarada entera en el layout, con su cargo, su
        // LinkedIn y dónde trabaja. Acá se la referencia por @id: repetirla
        // crearía una segunda entidad que se llama igual.
        mainEntity: { "@id": `${SITE.url}/#${p.id}` },
      },
      migas([
        ["Quiénes somos", "/sobre"],
        [p.nombre, null],
      ]),
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
            <span className="n">—</span>
            <Link href="/sobre">Quiénes somos</Link> / {p.nombre}
          </div>
          <h1>{p.nombre}</h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            {p.cargo} de <strong>{SITE.name}</strong>. {conLinkAV(p.bio)}
          </p>
          <div
            style={{
              marginTop: "26px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {p.perfil ? (
              <a
                className="btn btn--ghost"
                href={p.perfil}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            ) : null}
            {/* Al sitio de la productora, no a su LinkedIn: un botón que se
                llama como la empresa tiene que llevar a la empresa. */}
            <a
              className="btn btn--ghost"
              href={LINKS.webAvEventos}
              target="_blank"
              rel="noopener noreferrer"
            >
              AV Eventos
            </a>
          </div>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <div className="persona">
            <div className="persona__foto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt={p.nombre} width={800} height={1000} />
            </div>
            <div className="persona__texto">
              {p.presentacion ? (
                <section className="sem-bloque reveal">
                  <h2 className="ag-mes">Quién es</h2>
                  <p className="sem-nota">{conLinkAV(p.presentacion)}</p>
                </section>
              ) : null}

              <section className="sem-bloque reveal">
                <h2 className="ag-mes">El recorrido</h2>
                <dl className="ver-lista">
                  {p.recorrido.map(([titulo, texto]) => (
                    <div className="ver-item" key={titulo}>
                      <dt>{conLinkAV(titulo)}</dt>
                      <dd>{conLinkAV(texto)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="sem-nota" style={{ marginTop: "18px" }}>
                  Lo que le quedó de todo eso: <em>{p.obsesion}</em>
                </p>
              </section>

              <section className="sem-bloque reveal">
                <h2 className="ag-mes">Qué hace en {SITE.name}</h2>
                <p className="sem-nota">{p.enElMedio}</p>
                <p className="sem-nota">
                  {cuantos > 0
                    ? `Conduce los ${cuantos} episodios del podcast junto a ${otro?.nombre}, `
                    : `Conduce el podcast junto a ${otro?.nombre}, `}
                  que sale todos los miércoles. Los{" "}
                  <Link href="/articulos">{articulos} artículos del sitio</Link>{" "}
                  {/* Esta línea no es un detalle de oficina: el schema de cada
                      artículo declara a Pablo como "editor", y si la página no
                      lo dijera en ningún lado estaríamos declarando algo que el
                      lector no puede ver, que es la regla 13. Lo que cambia es
                      cómo se dice: "los revisa y publica" describe una tarea;
                      "responde por lo que dicen" es lo que significa ser el
                      editor de un medio.
                      Ojo con el salto de línea antes de la llave: JSX lo
                      convierte en un espacio y quedaba "el equipo , y él". */}
                  {p.id === "pablo-quiroga"
                    ? "los firma el equipo, y él los edita y responde por lo que dicen."
                    : "los firma el equipo."}
                </p>
              </section>
            </div>
          </div>

          {ultimos.length > 0 ? (
            <section className="sem-bloque reveal" style={{ marginTop: "40px" }}>
              <h2 className="ag-mes">Lo último que grabaron</h2>
              <div className="ag-tabla">
                {ultimos.map((ep) => (
                  <Link
                    href={`/episodios/${ep.id}`}
                    key={ep.id}
                    className="ag-fila"
                  >
                    <span className="ag-fila__fecha" aria-hidden>
                      ▸
                    </span>
                    <span className="ag-fila__cuerpo">
                      <span className="ag-fila__nombre">
                        {partirTitulo(ep.title).tema || ep.title}
                      </span>
                      <span className="ag-fila__meta">
                        {formatDate(ep.published)}
                      </span>
                    </span>
                    <span className="ag-fila__flecha" aria-hidden>
                      →
                    </span>
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: "22px" }}>
                <Link className="btn" href="/episodios">
                  Ver todos los episodios
                </Link>
              </div>
            </section>
          ) : null}

          {otro ? (
            <div style={{ marginTop: "44px" }}>
              <Link className="btn btn--ghost" href={`/sobre/${otro.id}`}>
                Conocé a {otro.nombre} →
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <Footer />
    </>
  );
}
