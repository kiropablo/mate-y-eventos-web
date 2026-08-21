import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import {
  getEventos,
  hoyISO,
  sumarDias,
  enCurso,
  TIPO_COLOR,
  MESES_LARGO,
} from "../../lib/agenda";
import { SITE } from "../../lib/site";

export const metadata = {
  alternates: { canonical: "/agenda/esta-semana" },
  title: "Esta semana en eventos",
  description:
    "Los eventos de la industria que arrancan en los próximos siete días en Argentina y Latinoamérica: congresos, expos, festivales y grandes producciones, con fecha y lugar.",
  openGraph: {
    type: "website",
    title: "Esta semana en eventos · Mate y Eventos",
    description:
      "Qué pasa en la industria de eventos en los próximos siete días. Se actualiza solo.",
    url: `${SITE.url}/agenda/esta-semana`,
    siteName: SITE.name,
    locale: "es_AR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Esta semana en eventos · Mate y Eventos",
    description:
      "Qué pasa en la industria de eventos en los próximos siete días.",
    images: ["/og-default.jpg"],
  },
};

// Más corto que el resto del sitio a propósito: es la única página cuyo
// contenido cambia solo con que pase el día.
export const revalidate = 900;

const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export default async function EstaSemana() {
  const hoy = hoyISO();
  // Siete días contando hoy: arrancando un lunes, la ventana es justo la
  // semana de lunes a domingo.
  const hasta = sumarDias(hoy, 6);
  const eventos = await getEventos();

  // Arrancaron antes y todavía están pasando.
  const ahora = eventos.filter((e) => enCurso(e, hoy) && e.fechaInicio < hoy);

  // Arrancan de hoy en adelante, dentro de la ventana.
  const arrancan = eventos.filter(
    (e) => e.fechaInicio && e.fechaInicio >= hoy && e.fechaInicio <= hasta
  );

  // Red de seguridad para las semanas flacas (enero, por ejemplo): si no
  // arranca casi nada, mostramos lo que viene después para que la página
  // nunca quede vacía.
  const semanaFloja = ahora.length + arrancan.length < 3;
  const loQueViene = semanaFloja
    ? eventos
        .filter((e) => e.fechaInicio && e.fechaInicio > hasta)
        .slice(0, 6)
    : [];

  const total = ahora.length + arrancan.length;

  // Agrupamos por día de arranque, en orden.
  const porDia = new Map();
  for (const e of arrancan) {
    if (!porDia.has(e.fechaInicio)) porDia.set(e.fechaInicio, []);
    porDia.get(e.fechaInicio).push(e);
  }
  const dias = [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b));

  const destacados = [...ahora, ...arrancan];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE.url}/agenda/esta-semana`,
        name: `Esta semana en eventos · ${SITE.name}`,
        url: `${SITE.url}/agenda/esta-semana`,
        description: `Eventos de la industria activos o que arrancan entre el ${legible(hoy)} y el ${legible(hasta)}.`,
        isPartOf: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "ItemList",
        name: "Eventos de esta semana",
        numberOfItems: destacados.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: destacados.map((ev, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Event",
            name: ev.nombre,
            startDate: ev.fechaInicio,
            ...(ev.fechaFin ? { endDate: ev.fechaFin } : {}),
            eventStatus:
              ev.estadoFechas === "Confirmadas"
                ? "https://schema.org/EventScheduled"
                : "https://schema.org/EventPostponed",
            url: `${SITE.url}/agenda/${ev.slug}`,
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
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Agenda",
            item: `${SITE.url}/agenda`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Esta semana",
            item: `${SITE.url}/agenda/esta-semana`,
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
            <Link href="/agenda">Agenda</Link> / Esta semana
          </div>
          <h1>
            Esta semana{" "}
            <br />
            en eventos.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            {total === 0 ? (
              <>
                Ningún evento arranca entre hoy y el {legible(hasta)}. Abajo,
                lo que viene después.
              </>
            ) : (
              <>
                <strong>
                  {total} {total === 1 ? "evento" : "eventos"}
                </strong>{" "}
                entre el {legible(hoy)} y el {legible(hasta)}. Esta página se
                arma sola con la agenda: siempre muestra los próximos siete
                días.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          {eventos.length === 0 ? (
            <div className="hold reveal">
              <span className="tag">Muy pronto</span>
              <p>
                Estamos cargando los primeros eventos de la agenda. ¿Conocés
                uno que tenga que estar? Sugerilo y lo sumamos.
              </p>
            </div>
          ) : (
            <>
              {ahora.length > 0 && (
                <section className="sem-bloque reveal">
                  <h2 className="ag-mes">Sucediendo ahora</h2>
                  <Tabla eventos={ahora} />
                </section>
              )}

              {dias.map(([dia, lista], i) => (
                <section
                  className="sem-bloque reveal"
                  key={dia}
                  style={{ transitionDelay: `${Math.min(i, 5) * 0.05}s` }}
                >
                  <h2 className="ag-mes">{tituloDia(dia, hoy)}</h2>
                  <Tabla eventos={lista} />
                </section>
              ))}

              {loQueViene.length > 0 && (
                <section className="sem-bloque reveal">
                  <h2 className="ag-mes">Lo que viene después</h2>
                  <p className="sem-nota">
                    Semana tranquila. Estos son los próximos eventos de la
                    agenda, para que los tengas en el radar.
                  </p>
                  <Tabla eventos={loQueViene} />
                </section>
              )}
            </>
          )}

          <div className="sem-cierre reveal">
            <p className="sem-nota">
              ¿No querés volver a entrar? Suscribite y los eventos nuevos te
              aparecen solos en tu calendario.
            </p>
            <div className="sus-botones">
              <Link className="btn" href="/agenda/calendario">
                Suscribirme al calendario
              </Link>
              <Link className="btn btn--ghost" href="/agenda">
                Ver la agenda completa
              </Link>
              <Link className="btn btn--ghost" href="/agenda/sugerir">
                + Sugerir evento
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

// La misma tabla compacta que usa /agenda, para que se sienta el mismo lugar.
function Tabla({ eventos }) {
  return (
    <div className="ag-tabla">
      {eventos.map((ev) => (
        <Link href={`/agenda/${ev.slug}`} key={ev.slug} className="ag-fila">
          <span className="ag-fila__fecha">{diaCorto(ev)}</span>
          <span className="ag-fila__cuerpo">
            <span className="ag-fila__nombre">
              <span
                className="dot"
                style={{ background: TIPO_COLOR[ev.tipo] || "#9aa3b2" }}
              />
              {ev.destacado ? <span className="ev-star">★ </span> : null}
              {ev.nombre}
            </span>
            <span className="ag-fila__meta">
              {[ev.venue || ev.ciudad || ev.provincia, ev.pais]
                .filter(Boolean)
                .join(", ")}
              {ev.estadoFechas !== "Confirmadas" ? " · a confirmar" : ""}
            </span>
          </span>
          <span className="ag-fila__flecha" aria-hidden>
            →
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ---------- Helpers ---------- */

// "Hoy", "Mañana" o "Jueves 21 de agosto".
function tituloDia(diaISO, hoy) {
  if (diaISO === hoy) return "Hoy";
  if (diaISO === sumarDias(hoy, 1)) return "Mañana";
  const [a, m, d] = diaISO.split("-").map(Number);
  const nombre = DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
  return `${mayus(nombre)} ${d} de ${MESES_LARGO[m - 1].toLowerCase()}`;
}

// "19 de agosto".
function legible(diaISO) {
  const [, m, d] = diaISO.split("-").map(Number);
  return `${d} de ${MESES_LARGO[m - 1].toLowerCase()}`;
}

// "19", "19–22" o "29 ago–2 sep" para la columna de fecha.
function diaCorto(ev) {
  const di = Number(ev.fechaInicio.slice(8, 10));
  if (!ev.fechaFin || ev.fechaFin === ev.fechaInicio) return String(di);
  const df = Number(ev.fechaFin.slice(8, 10));
  if (ev.fechaFin.slice(0, 7) === ev.fechaInicio.slice(0, 7))
    return `${di}–${df}`;
  return `${di} ${mesCorto(ev.fechaInicio)}–${df} ${mesCorto(ev.fechaFin)}`;
}

function mesCorto(fechaISO) {
  return MESES_LARGO[Number(fechaISO.slice(5, 7)) - 1].slice(0, 3).toLowerCase();
}

function mayus(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
