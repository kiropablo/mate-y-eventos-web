import Link from "next/link";
import Image from "next/image";
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
  MESES_LARGO,
  nombreConAnio,
  tituloDeEvento,
} from "../../lib/agenda";
import { SITE } from "../../lib/site";
import { migas } from "../../lib/migas";
import { todosLosCortes, textosDe } from "../cortes";

export const revalidate = 3600;

export async function generateStaticParams() {
  const eventos = await getEventos();
  return eventos.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const ev = await getEvento(params.slug);
  if (!ev) return { title: "Evento" };
  const lugar = [ev.ciudad, ev.pais].filter(Boolean).join(", ");
  // El año va en el título: "Expo Auto Chino 2026 — fechas…". Es lo que la
  // gente escribe cuando busca, y distingue una edición de la siguiente.
  // El armado está en lib/agenda porque también lo usan el OG y el Twitter:
  // si no, la ficha se comparte sin decir de qué edición es.
  const conAnio = nombreConAnio(ev);

  return {
    title: tituloDeEvento(ev),
    description:
      ev.descCorta ||
      `${conAnio}${lugar ? `, ${lugar}` : ""}. Fechas, información oficial y contactos, en la agenda de ${SITE.name}.`,
    alternates: { canonical: `/agenda/${ev.slug}` },
    openGraph: {
      type: "article",
      title: `${conAnio} — ${formatRango(ev)}`,
      description:
        ev.descCorta ||
        `${conAnio}${lugar ? `, ${lugar}` : ""}. Fechas, información oficial y contactos.`,
      url: `${SITE.url}/agenda/${ev.slug}`,
      siteName: SITE.name,
      locale: "es_AR",
      // No se declara imagen: Next usa la que genera opengraph-image.js para
      // esta ficha, con el nombre, la fecha y la sede del evento. Antes iba
      // una portada genérica igual para todos, porque el logo de Airtable
      // llega con un link que vence a las pocas horas.
    },
    twitter: {
      card: "summary_large_image",
      title: `${conAnio} — ${formatRango(ev)}`,
      description:
        ev.descCorta ||
        `${conAnio}${lugar ? `, ${lugar}` : ""}. Fechas e información oficial.`,
    },
  };
}

export default async function Evento({ params }) {
  const ev = await getEvento(params.slug);
  if (!ev) notFound();

  // Los cortes a los que pertenece este evento: su país, su tipo, su
  // provincia, su mes.
  //
  // Se sacan de todosLosCortes y no se arman a mano con ev.tipo porque una
  // landing solo existe si el grupo llega al mínimo de eventos: armar la URL
  // por las nuestras generaría links a 404 para los tipos con dos eventos.
  //
  // Hasta ahora las 314 fichas no linkeaban a ninguna de las 27 landings. El
  // tipo estaba impreso en el encabezado como texto plano al lado de un link
  // a /agenda. O sea que las páginas pensadas para las búsquedas genéricas
  // ("congresos en Argentina") no recibían nada de las fichas, que son por
  // donde entra el 91% de las visitas de búsqueda.
  const cortesDelEvento = todosLosCortes(await getEventos())
    .filter((c) => c.eventos.some((e) => e.slug === ev.slug))
    .map((c) => ({ url: c.url, etiqueta: textosDe(c).etiqueta, tipo: c.tipo }));
  const corteDelTipo = cortesDelEvento.find((c) => c.tipo === "tipo");

  const lugar = [ev.venue, ev.ciudad, ev.provincia, ev.pais]
    .filter(Boolean)
    .join(" · ");
  const pasado = yaPaso(ev);

  // Schema Event. Se emite solo si sabemos CUÁNDO y DÓNDE.
  //
  // Sin fecha de inicio, Google descarta la ficha entera. Y sin sede ni
  // ciudad no se puede armar una dirección: sale un Event sin location, que
  // es exactamente el error que marca Search Console. Son ocho eventos, casi
  // todos itinerantes o "internacionales", donde de verdad no sabemos dónde
  // se hacen todavía.
  //
  // La ficha se publica igual y se ve igual: lo único que no hacemos es
  // afirmarle a Google una ubicación que no tenemos.
  const sabemosDonde = Boolean(ev.venue || ev.ciudad);
  const jsonLd = ev.fechaInicio && sabemosDonde
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: ev.nombre,
        startDate: ev.fechaInicio,
        // Un evento de un solo día igual tiene fecha de cierre: es la misma
        // que la de inicio. Sin esto, Google lo marca como campo faltante.
        endDate: ev.fechaFin || ev.fechaInicio,
        // Schema.org no tiene un estado para "la fecha todavía no es firme":
        // los estados son programado, pospuesto, movido, cancelado. Poníamos
        // "pospuesto" a todo lo que no estuviera confirmado, así que seis
        // eventos con fecha tentativa le decían a Google —y a las IA— que la
        // organización los había pospuesto. No es un matiz: es una afirmación
        // falsa sobre un evento de un tercero. La fecha tentativa se aclara en
        // el texto de la ficha, que es donde corresponde.
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode:
          "https://schema.org/OfflineEventAttendanceMode",
        ...(ev.descCorta || ev.descLarga
          ? { description: ev.descCorta || ev.descLarga.slice(0, 300) }
          : {}),
        // La portada que generamos nosotros, no el adjunto de Airtable: ese
        // link lleva la hora de vencimiento adentro de la propia URL y Google
        // lo leía vivo o muerto según cuándo pasara. Esta sale de nuestro
        // dominio, mide 1200×630 y no vence.
        image: [`${SITE.url}/agenda/${ev.slug}/opengraph-image`],
        ...(ev.web ? { sameAs: ev.web } : {}),
        ...(ev.organizador
          ? {
              organizer: {
                "@type": "Organization",
                name: ev.organizador,
                ...(ev.web ? { url: ev.web } : {}),
              },
            }
          : {}),
        ...(ev.venue || ev.ciudad || ev.provincia || ev.pais
          ? {
              location: {
                "@type": "Place",
                name: ev.venue || ev.ciudad || ev.pais,
                address: {
                  "@type": "PostalAddress",
                  ...(ev.venue ? { streetAddress: ev.venue } : {}),
                  ...(ev.ciudad ? { addressLocality: ev.ciudad } : {}),
                  ...(ev.provincia ? { addressRegion: ev.provincia } : {}),
                  // El código ISO si lo conocemos; si no, el nombre tal cual.
                  // "Internacional" no entra por ninguna de las dos: no es un
                  // país, y ponerlo como tal es declarar algo falso.
                  ...(paisComoDireccion(ev.pais)
                    ? { addressCountry: paisComoDireccion(ev.pais) }
                    : {}),
                },
              },
            }
          : {}),
        url: `${SITE.url}/agenda/${ev.slug}`,
        isPartOf: { "@id": `${SITE.url}/#organization` },
      }
    : null;

  // Cuando el organizador confirmó los datos, lo declaramos también para los
  // buscadores y los asistentes de IA: lastReviewed es la propiedad estándar
  // para "esta página fue revisada para verificar que dice la verdad".
  // La ruta de la ficha. Sale siempre, incluso cuando el evento no llega a
  // tener nodo Event por falta de fecha o de lugar: la jerarquía del sitio no
  // depende de lo completa que esté la ficha.
  const migasLd = {
    "@context": "https://schema.org",
    ...migas([
      ["Agenda", "/agenda"],
      ...(corteDelTipo ? [[corteDelTipo.etiqueta, corteDelTipo.url]] : []),
      [ev.nombre, null],
    ]),
  };

  const jsonLdPagina = ev.verificado
    ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${SITE.url}/agenda/${ev.slug}#pagina`,
        url: `${SITE.url}/agenda/${ev.slug}`,
        name: ev.nombre,
        ...(ev.fechaVerificacion ? { lastReviewed: ev.fechaVerificacion } : {}),
        reviewedBy: { "@id": `${SITE.url}/#organization` },
        isPartOf: { "@id": `${SITE.url}/#organization` },
      }
    : null;

  const videos = ev.edicionesAnteriores
    .map((l) => ({ linea: l, yt: youtubeId(l) }))
    .filter((x) => x.yt);
  const otrasRefs = ev.edicionesAnteriores.filter((l) => !youtubeId(l));

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(migasLd) }}
      />
      {jsonLdPagina && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdPagina) }}
        />
      )}

      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>
            <Link href="/agenda">Agenda</Link>
            {ev.tipo ? (
              <>
                {" / "}
                {corteDelTipo ? (
                  <Link href={corteDelTipo.url}>{ev.tipo}</Link>
                ) : (
                  ev.tipo
                )}
              </>
            ) : null}
          </div>
          {ev.imagen ? (
            <Image
              className="ev-logo"
              src={ev.imagen}
              alt={`Logo de ${ev.nombre}`}
              width={480}
              height={200}
              priority
            />
          ) : null}
          <h1>{ev.nombre}</h1>
          {ev.verificado && (
            <Link className="sello reveal" href="/agenda/verificado">
              <span className="sello__tilde" aria-hidden>
                ✓
              </span>
              <span>
                Datos verificados por el organizador
                {ev.fechaVerificacion
                  ? ` · ${mesYAnio(ev.fechaVerificacion)}`
                  : ""}
              </span>
            </Link>
          )}
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            <strong>{formatRango(ev)}</strong>
            {ev.estadoFechas !== "Confirmadas" ? " (a confirmar)" : ""}
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
                  /* Si el evento contrató el destacado, el link a su sitio
                     es un link pago y hay que declararlo. Google trata como
                     compra de enlaces los que no lo dicen. */
                  rel={
                    ev.destacadoPago
                      ? "noopener noreferrer sponsored"
                      : "noopener noreferrer"
                  }
                >
                  Sitio oficial
                </a>
              )}

              {ev.fechaInicio && !pasado && (
                <a className="btn btn--ghost" href={`/api/agenda/${ev.slug}/ics`}>
                  + Agregar a mi calendario
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

          {cortesDelEvento.length > 0 ? (
            <section className="sem-bloque reveal" style={{ marginTop: "40px" }}>
              <h2 className="ag-mes">Seguir por acá</h2>
              <p className="sem-nota" style={{ marginBottom: "12px" }}>
                Los otros eventos de la agenda que comparten algo con este:
              </p>
              <div className="ag-chips">
                {cortesDelEvento.map((c) => (
                  <Link key={c.url} href={c.url} className="chip">
                    {c.etiqueta}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

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

// "agosto de 2026" — el día no aporta nada en un sello de verificación.
function mesYAnio(fechaISO) {
  const [a, m] = String(fechaISO).slice(0, 10).split("-").map(Number);
  return `${MESES_LARGO[m - 1].toLowerCase()} de ${a}`;
}

// Google prefiere el código ISO de dos letras en addressCountry. Solo los
// países que efectivamente aparecen en la agenda; el resto se omite antes que
// inventar un código equivocado.
const PAISES_ISO = {
  Argentina: "AR",
  Brasil: "BR",
  Chile: "CL",
  Uruguay: "UY",
  Paraguay: "PY",
  Bolivia: "BO",
  Perú: "PE",
  Colombia: "CO",
  México: "MX",
  Panamá: "PA",
  "El Salvador": "SV",
  "Estados Unidos": "US",
  España: "ES",
  Francia: "FR",
  Italia: "IT",
  Alemania: "DE",
  Jamaica: "JM",
  "Emiratos Árabes Unidos": "AE",
};

function paisISO(nombre) {
  return PAISES_ISO[String(nombre || "").trim()] || null;
}

// Lo que se puede declarar como país en una dirección.
//
// La lista de la agenda tiene entradas que no son países: "Internacional" es
// una etiqueta nuestra para los eventos que rotan de sede. Ponerla en
// addressCountry sería afirmarle a Google que existe un país llamado así.
const NO_SON_PAISES = new Set(["Internacional", "Itinerante", "Otro"]);

function paisComoDireccion(nombre) {
  const limpio = String(nombre || "").trim();
  if (!limpio || NO_SON_PAISES.has(limpio)) return null;
  return paisISO(limpio) || limpio;
}

function acortar(url) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
