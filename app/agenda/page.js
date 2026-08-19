import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import AgendaLista from "./AgendaLista";
import {
  getEventos,
  yaPaso,
  formatRango,
  hoyISO,
  sumarDias,
  enCurso,
} from "../lib/agenda";
import { SITE } from "../lib/site";

export const metadata = {
  alternates: { canonical: "/agenda" },
  title: "Agenda de eventos",
  description:
    "Agenda de la industria: congresos, expos, festivales, recitales y grandes eventos de Argentina y Latinoamérica, con fechas, contactos y referencias de ediciones anteriores.",
  openGraph: {
    type: "website",
    title: "Agenda de eventos de la industria · Mate y Eventos",
    description:
      "Congresos, expos, festivales y grandes producciones de Argentina y la región: fechas, contactos y referencias, en un solo lugar.",
    url: `${SITE.url}/agenda`,
    siteName: SITE.name,
    locale: "es_AR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agenda de eventos de la industria · Mate y Eventos",
    description:
      "Congresos, expos, festivales y grandes producciones de Argentina y la región, con fechas y contactos.",
    images: ["/og-default.jpg"],
  },
};

export const revalidate = 3600;

export default async function Agenda() {
  const eventos = await getEventos();

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
            Los eventos donde
            <br />
            hay que estar.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Congresos, expos, festivales y grandes producciones de Argentina y
            la región: fechas, contactos y referencias de ediciones anteriores,
            en un solo lugar.
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
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

// Solo mandamos al cliente los datos que la lista y el calendario necesitan.
function resumen(ev) {
  return {
    slug: ev.slug,
    nombre: ev.nombre,
    tipo: ev.tipo,
    destacado: ev.destacado,
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
