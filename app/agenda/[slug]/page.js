import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import {
  getEvento,
  getEventos,
  formatRango,
  yaPaso,
  youtubeId,
  partirLinea,
} from "../../lib/agenda";
import { SITE } from "../../lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const eventos = await getEventos();
  return eventos.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const ev = await getEvento(params.slug);
  if (!ev) return { title: "Evento" };
  const lugar = [ev.ciudad, ev.pais].filter(Boolean).join(", ");
  return {
    title: `${ev.nombre} — fechas, contactos y referencias`,
    description:
      ev.descCorta ||
      `${ev.nombre}${lugar ? `, ${lugar}` : ""}. Fechas, información oficial y contactos, en la agenda de ${SITE.name}.`,
    alternates: { canonical: `/agenda/${ev.slug}` },
  };
}

export default async function Evento({ params }) {
  const ev = await getEvento(params.slug);
  if (!ev) notFound();

  const lugar = [ev.venue, ev.ciudad, ev.provincia, ev.pais]
    .filter(Boolean)
    .join(" · ");
  const pasado = yaPaso(ev);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.nombre,
    ...(ev.fechaInicio ? { startDate: ev.fechaInicio } : {}),
    ...(ev.fechaFin ? { endDate: ev.fechaFin } : {}),
    ...(ev.descCorta ? { description: ev.descCorta } : {}),
    ...(ev.web ? { sameAs: ev.web } : {}),
    ...(ev.organizador
      ? { organizer: { "@type": "Organization", name: ev.organizador } }
      : {}),
    ...(ev.ciudad || ev.pais
      ? {
          location: {
            "@type": "Place",
            name: ev.venue || ev.ciudad || ev.pais,
            address: [ev.ciudad, ev.provincia, ev.pais]
              .filter(Boolean)
              .join(", "),
          },
        }
      : {}),
    url: `${SITE.url}/agenda/${ev.slug}`,
  };

  const videos = ev.edicionesAnteriores
    .map((l) => ({ linea: l, yt: youtubeId(l) }))
    .filter((x) => x.yt);
  const otrasRefs = ev.edicionesAnteriores.filter((l) => !youtubeId(l));

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
            <Link href="/agenda">Agenda</Link>
            {ev.tipo ? ` / ${ev.tipo}` : ""}
          </div>
          <h1>{ev.nombre}</h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            <strong>{formatRango(ev)}</strong>
            {ev.estadoFechas === "Estimadas" ? " (a confirmar)" : ""}
            {pasado ? " — edición pasada" : ""}
            {lugar ? (
              <>
                <br />
                {lugar}
              </>
            ) : null}
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <div className="ev-ficha">
            <div className="ev-ficha__cuerpo reveal">
              {(ev.descLarga || ev.descCorta) && (
                <>
                  <h2 className="ev-h2">De qué se trata</h2>
                  {(ev.descLarga || ev.descCorta)
                    .split(/\n{2,}/)
                    .map((p, i) => (
                      <p className="ev-parrafo" key={i}>
                        {p}
                      </p>
                    ))}
                </>
              )}

              {videos.length > 0 && (
                <>
                  <h2 className="ev-h2">Ediciones anteriores</h2>
                  <div className="ev-videos">
                    {videos.map(({ linea, yt }) => {
                      const { etiqueta } = partirLinea(linea);
                      return (
                        <figure className="ev-video" key={yt}>
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${yt}`}
                            title={etiqueta || `Video de ${ev.nombre}`}
                            loading="lazy"
                            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                            allowFullScreen
                          />
                          {etiqueta ? (
                            <figcaption>{etiqueta}</figcaption>
                          ) : null}
                        </figure>
                      );
                    })}
                  </div>
                </>
              )}

              {otrasRefs.length > 0 && (
                <>
                  {videos.length === 0 && (
                    <h2 className="ev-h2">Ediciones anteriores</h2>
                  )}
                  <ul className="ev-lista">
                    {otrasRefs.map((l, i) => (
                      <Linea key={i} linea={l} />
                    ))}
                  </ul>
                </>
              )}
            </div>

            <aside className="ev-ficha__datos reveal">
              <h3 className="ev-datos__titulo">Información oficial</h3>

              {ev.web && (
                <a
                  className="btn"
                  href={ev.web}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sitio oficial
                </a>
              )}

              <dl className="ev-datos">
                {ev.organizador && (
                  <>
                    <dt>Organiza</dt>
                    <dd>{ev.organizador}</dd>
                  </>
                )}
                {ev.edicion && (
                  <>
                    <dt>Edición</dt>
                    <dd>{ev.edicion}</dd>
                  </>
                )}
                {ev.venue && (
                  <>
                    <dt>Lugar</dt>
                    <dd>{ev.venue}</dd>
                  </>
                )}
              </dl>

              {ev.contactos.length > 0 && (
                <>
                  <h3 className="ev-datos__titulo">Contactos</h3>
                  <ul className="ev-lista">
                    {ev.contactos.map((l, i) => (
                      <Linea key={i} linea={l} />
                    ))}
                  </ul>
                </>
              )}

              {ev.redes.length > 0 && (
                <>
                  <h3 className="ev-datos__titulo">Redes</h3>
                  <ul className="ev-lista">
                    {ev.redes.map((l, i) => (
                      <Linea key={i} linea={l} />
                    ))}
                  </ul>
                </>
              )}
            </aside>
          </div>

          {ev.fuentes.length > 0 && (
            <details className="ev-fuentes reveal">
              <summary>Fuentes de esta ficha</summary>
              <ul className="ev-lista">
                {ev.fuentes.map((l, i) => (
                  <Linea key={i} linea={l} />
                ))}
              </ul>
            </details>
          )}

          <div style={{ marginTop: "40px" }}>
            <Link className="btn" href="/agenda">
              ← Volver a la agenda
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

// Una línea de texto que puede traer "Etiqueta: valor" y/o una URL.
function Linea({ linea }) {
  const { etiqueta, texto, url } = partirLinea(linea);
  const visible = texto.replace(url || "", "").trim();
  return (
    <li>
      {etiqueta ? <span className="ev-etq">{etiqueta}</span> : null}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {visible || acortar(url)}
        </a>
      ) : (
        <span>{visible}</span>
      )}
    </li>
  );
}

function acortar(url) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
