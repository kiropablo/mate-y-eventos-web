import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import AgendaLista from "./AgendaLista";
import {
  getEventosConEstado,
  yaPaso,
  formatRango,
  hoyISO,
  sumarDias,
  enCurso,
} from "../lib/agenda";
import { SITE } from "../lib/site";
import { todosLosCortes, textosDe } from "./cortes";

export const metadata = {
  alternates: { canonical: "/agenda" },
  title: "Agenda de eventos de Argentina y Latinoamérica",
  description:
    "Agenda de la industria: congresos, expos, festivales, recitales y grandes eventos de Argentina y Latinoamérica, con fechas, contactos y referencias de ediciones anteriores.",
  openGraph: {
    type: "website",
    title: "Agenda de eventos de Argentina y Latinoamérica · Mate y Eventos",
    description:
      "Congresos, expos, festivales y grandes producciones de Argentina y la región: fechas, contactos y referencias, en un solo lugar.",
    url: `${SITE.url}/agenda`,
    siteName: SITE.name,
    locale: "es_AR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agenda de eventos de Argentina y Latinoamérica · Mate y Eventos",
    description:
      "Congresos, expos, festivales y grandes producciones de Argentina y la región, con fechas y contactos.",
    images: ["/og-default.jpg"],
  },
};

export const revalidate = 3600;

export default async function Agenda() {
  const { eventos, completa } = await getEventosConEstado();

  const proximos = eventos.filter((e) => !yaPaso(e));
  const pasados = eventos.filter((e) => yaPaso(e)).reverse();

  // Cuántos hay esta semana, para el acceso rápido de arriba.
  const hoy = hoyISO();
  const hasta = sumarDias(hoy, 6);
  const estaSemana = eventos.filter(
    (e) =>
      enCurso(e, hoy) ||
      (e.fechaInicio && e.fechaInicio >= hoy && e.fechaInicio <= hasta)
  ).length;

  // Los cortes con página propia, para que se puedan encontrar desde acá y
  // no solo por buscador.
  const cortes = todosLosCortes(eventos);
  const porTipo = (t) => cortes.filter((c) => c.tipo === t);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Agenda de eventos · ${SITE.name}`,
    url: `${SITE.url}/agenda`,
    description:
      "Agenda de congresos, expos, festivales y grandes eventos de la industria en Argentina y Latinoamérica.",
    isPartOf: { "@id": `${SITE.url}/#organization` },
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
            <span className="n">—</span>Agenda
          </div>
          <h1>
            Agenda de eventos de{" "}
            <br />
            Argentina y Latinoamérica
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            <strong>Los eventos donde hay que estar.</strong> Congresos, expos,
            festivales y grandes producciones: fechas, contactos y referencias
            de ediciones anteriores, en un solo lugar.
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
              {estaSemana > 0 && (
                <Link className="ag-semana reveal" href="/agenda/esta-semana">
                  <span className="ag-semana__tag">Esta semana</span>
                  <span className="ag-semana__txt">
                    {estaSemana} {estaSemana === 1 ? "evento" : "eventos"} en
                    los próximos siete días
                  </span>
                  <span className="ag-semana__flecha" aria-hidden>
                    →
                  </span>
                </Link>
              )}
              <AgendaLista
                proximos={proximos.map(resumen)}
                pasados={pasados.map(resumen)}
              />
              {/* La radiografía va acá y no al pie: es lo único del sitio que
                  publica datos propios, y el que está mirando la agenda es
                  exactamente el que los quiere. */}
              <Link className="ag-semana reveal" href="/agenda/radiografia">
                <span className="ag-semana__tag">Los números</span>
                <span className="ag-semana__txt">
                  Cuántos eventos hay por mes, qué tipos concentran y cuánto
                  dura cada cosa
                </span>
                <span className="ag-semana__flecha" aria-hidden>
                  →
                </span>
              </Link>

              {cortes.length > 0 && (
                <section className="ag-cortes reveal">
                  <h2 className="ag-mes">Explorá la agenda</h2>
                  {[
                    ["Por país", porTipo("pais")],
                    ["Por tipo de evento", porTipo("tipo")],
                    ["Por provincia", porTipo("provincia")],
                    ["Por mes", porTipo("mes")],
                  ].map(([titulo, lista]) =>
                    lista.length > 0 ? (
                      <div className="ag-cortes__grupo" key={titulo}>
                        <h3 className="ag-cortes__tit">{titulo}</h3>
                        <div className="imp-archivo">
                          {lista.map((c) => (
                            <Link className="chip" href={c.url} key={c.url}>
                              {textosDe(c).etiqueta}{" "}
                              <span className="ag-cortes__n">
                                {c.eventos.length}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </section>
              )}

              {/* El sello de frescura solo sale si la lectura de la agenda
                  salió entera. Si Airtable cortó a mitad de camino, la lista
                  es más corta que la real: decir "actualizada al {hoy}"
                  encima de una lista incompleta sería afirmar frescura sobre
                  algo que se rompió, y eso queda cacheado una hora. */}
              {completa ? (
                <p className="ag-frescura reveal">
                  {eventos.length} eventos · actualizada al{" "}
                  <time dateTime={hoy}>{fechaLarga(hoy)}</time>. La agenda se
                  revisa todos los días de forma automática.
                </p>
              ) : (
                <p className="ag-frescura reveal">
                  Estamos teniendo un problema para traer la agenda completa:
                  puede que falten eventos. Volvé a probar en un rato.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

// "19 de agosto de 2026"
function fechaLarga(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, d)));
}

// Solo mandamos al cliente los datos que la lista y el calendario necesitan.
function resumen(ev) {
  return {
    slug: ev.slug,
    nombre: ev.nombre,
    tipo: ev.tipo,
    destacado: ev.destacado,
    destacadoPago: ev.destacadoPago,
    verificado: ev.verificado,
    fechas: formatRango(ev),
    fechaInicio: ev.fechaInicio,
    fechaFin: ev.fechaFin,
    estadoFechas: ev.estadoFechas,
    pais: ev.pais,
    provincia: ev.provincia,
    ciudad: ev.ciudad,
    descCorta: ev.descCorta,
    imagen: ev.imagen || null,
  };
}
