import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import SuscribirCalendario from "./SuscribirCalendario";
import { getEventos, yaPaso } from "../../lib/agenda";
import { SITE } from "../../lib/site";

export const metadata = {
  alternates: { canonical: "/agenda/calendario" },
  title: "La agenda en tu calendario",
  description:
    "Suscribite a la agenda de eventos de la industria y recibí cada evento nuevo directo en tu Google Calendar, Apple Calendario u Outlook. Podés filtrar por tipo, país y provincia.",
  openGraph: {
    type: "website",
    title: "La agenda en tu calendario · Mate y Eventos",
    description:
      "Suscribite una vez y los eventos nuevos de la industria aparecen solos en tu calendario. Filtrable por tipo, país y provincia.",
    url: `${SITE.url}/agenda/calendario`,
    siteName: SITE.name,
    locale: "es_AR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "La agenda en tu calendario · Mate y Eventos",
    description:
      "Suscribite una vez y los eventos nuevos de la industria aparecen solos en tu calendario.",
    images: ["/og-default.jpg"],
  },
};

export const revalidate = 3600;

const PASOS = [
  {
    titulo: "Google Calendar",
    texto:
      "Tocá el botón de Google Calendar y confirmá “Agregar”. Desde la computadora también podés ir a Otros calendarios → + → Desde URL y pegar la dirección.",
  },
  {
    titulo: "iPhone, iPad o Mac",
    texto:
      "Tocá el botón de Apple Calendario y aceptá la suscripción. En la Mac también sirve Archivo → Nueva suscripción de calendario y pegar la dirección.",
  },
  {
    titulo: "Outlook",
    texto:
      "En Outlook web: Agregar calendario → Suscribirse desde la web y pegá la dirección. En Outlook de escritorio, Agregar calendario → Desde Internet.",
  },
];

export default async function Calendario() {
  const eventos = await getEventos();
  const vigentes = eventos.filter((e) => e.fechaInicio && !yaPaso(e));

  // Al cliente solo le mandamos lo que el armador necesita para filtrar.
  const resumen = vigentes.map((e) => ({
    tipo: e.tipo,
    pais: e.pais,
    provincia: e.provincia,
  }));
  const tipos = unicos(resumen.map((e) => e.tipo));
  const paises = unicos(resumen.map((e) => e.pais));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/agenda/calendario`,
        name: `La agenda en tu calendario · ${SITE.name}`,
        url: `${SITE.url}/agenda/calendario`,
        description:
          "Suscripción al calendario de eventos de la industria de eventos en Argentina y Latinoamérica, en formato iCalendar.",
        isPartOf: { "@id": `${SITE.url}/#website` },
      },
      {
        "@type": "HowTo",
        name: "Cómo suscribirse a la agenda de Mate y Eventos",
        description:
          "Agregar la agenda de eventos de la industria a Google Calendar, Apple Calendario u Outlook para que los eventos nuevos aparezcan solos.",
        totalTime: "PT2M",
        step: PASOS.map((p, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: p.titulo,
          text: p.texto,
          url: `${SITE.url}/agenda/calendario`,
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
            name: "Calendario",
            item: `${SITE.url}/agenda/calendario`,
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
            <Link href="/agenda">Agenda</Link> / Calendario
          </div>
          <h1>
            La agenda,{" "}
            <br />
            dentro de tu calendario.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Suscribite una vez y listo: cada evento que sumamos a la agenda
            aparece solo en tu calendario, con fecha, lugar y el link a la
            ficha. No hay que volver a entrar acá.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          {vigentes.length === 0 ? (
            <div className="hold reveal">
              <span className="tag">Muy pronto</span>
              <p>
                Estamos cargando los primeros eventos de la agenda. En cuanto
                haya fechas confirmadas, vas a poder suscribirte desde acá.
              </p>
            </div>
          ) : (
            <SuscribirCalendario
              eventos={resumen}
              tipos={tipos}
              paises={paises}
            />
          )}

          <div className="sus-pasos reveal">
            {PASOS.map((p) => (
              <article className="sus-paso" key={p.titulo}>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </article>
            ))}
          </div>

          <p className="sus-nota reveal">
            El calendario se refresca solo cada 12 horas, según lo que decida
            tu aplicación. Los eventos con fecha estimada entran como “a
            confirmar” y ninguno te deja marcado como ocupado.
          </p>

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

function unicos(lista) {
  return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
