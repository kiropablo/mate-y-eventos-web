import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import { getEventos } from "../../lib/agenda";
import { SITE, STATS } from "../../lib/site";

export const metadata = {
  alternates: { canonical: "/agenda/destacado" },
  title: "Destacado en Agenda",
  description:
    "Cómo funciona el espacio destacado de la agenda de eventos de Mate y Eventos: qué incluye, qué no, cuánto sale y cuántos lugares hay por mes.",
  openGraph: {
    type: "website",
    title: "Destacado en Agenda · Mate y Eventos",
    description:
      "Tu evento arriba de todo en la agenda de la industria, todo el mes. Seis lugares.",
    url: `${SITE.url}/agenda/destacado`,
    siteName: SITE.name,
    locale: "es_AR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Destacado en Agenda · Mate y Eventos",
    description: "Seis lugares por mes, arriba de todo en la agenda.",
    images: ["/og-default.jpg"],
  },
};

export const revalidate = 3600;

// El precio vive acá y en ningún otro lado: la tarjeta de /sponsors y el
// schema lo leen de estas constantes, así que cambiarlo es tocar un número.
export const PRECIO_MES = 100;
export const PRECIO_DOS_MESES = 170;
export const LUGARES = 6;

// Lo que se entrega. Está escrito como compromiso, no como folleto: cada línea
// es algo que se puede verificar el día 30.
const INCLUYE = [
  {
    q: "Arriba de todo en la agenda, el mes entero",
    a: "En la tira de destacados de /agenda, que es la primera pantalla. También en el corte del mes y en «Esta semana» cuando el evento cae en esa semana.",
  },
  {
    q: "La ficha completa",
    a: "Logo, descripción larga, links al sitio y a las redes, contactos y el botón para que tu público se agende la fecha en un clic. La ficha tiene URL propia e indexable.",
  },
  {
    q: "Una mención en el newsletter de ese mes",
    a: "El mail que sale a la comunidad, con el link a la ficha.",
  },
  {
    q: "Un posteo en las redes de Mate y Eventos",
    a: "Instagram, TikTok y LinkedIn, en el formato que mejor le vaya al evento.",
  },
  {
    q: "El reporte al cierre",
    a: "Cuántas impresiones y cuántos clics tuvo tu ficha en Google durante el mes, sacados de Search Console. No es una estimación: son los números que reporta Google.",
  },
];

// Esto es la mitad importante de la propuesta. Si el destacado se llevara por
// delante lo editorial, en seis meses no habría nada que vender.
const NO_INCLUYE = [
  {
    q: "El sello Verificado no se compra",
    a: "Se enciende cuando el organizador confirma los datos de su ficha, uno por uno. Un evento destacado que no confirmó sus datos no lleva sello, y uno que nunca pagó nada puede llevarlo.",
  },
  {
    q: "Los imperdibles del mes tampoco",
    a: "Esa selección es editorial: elegimos unos pocos eventos y contamos por qué. Contratar el destacado no mete a nadie ahí.",
  },
  {
    q: "El espacio en el podcast va aparte",
    a: "Menciones al aire, segmentos y contenido co-creado son otra cosa. Están en la página para marcas.",
  },
  {
    q: "El espacio se declara siempre",
    a: "La tarjeta dice «espacio contratado» y arriba de la tira avisamos que algunos eventos lo contrataron. El link a tu sitio sale marcado como link pago, que es lo que corresponde: no declararlo sería publicidad disfrazada de recomendación, y además Google lo penaliza.",
  },
];

export default async function Destacado() {
  // Si la lectura de la base sale corta o falla, la cuenta da cero y la página
  // saldría diciendo "la agenda tiene 0 eventos" en la primera línea de una
  // propuesta comercial. Cuando no hay número confiable, no se pone número.
  const eventos = await getEventos();
  const publicados = eventos.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/agenda/destacado`,
        name: `Destacado en Agenda · ${SITE.name}`,
        url: `${SITE.url}/agenda/destacado`,
        description:
          "Cómo funciona el espacio destacado de la agenda de eventos de Mate y Eventos: qué incluye, qué no, cuánto sale y cuántos lugares hay por mes.",
        isPartOf: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "Service",
        name: "Destacado en Agenda",
        serviceType: "Espacio publicitario en agenda de eventos",
        provider: { "@id": `${SITE.url}/#organization` },
        areaServed: "Latinoamérica",
        description:
          "Un evento arriba de todo en la agenda de la industria de eventos durante un mes, con la ficha completa, una mención en el newsletter, un posteo en redes y el reporte de impresiones y clics al cierre.",
        offers: {
          "@type": "Offer",
          price: String(PRECIO_MES),
          priceCurrency: "USD",
          availability: "https://schema.org/LimitedAvailability",
          url: `${SITE.url}/agenda/destacado`,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [...INCLUYE, ...NO_INCLUYE].map((c) => ({
          "@type": "Question",
          name: c.q,
          acceptedAnswer: { "@type": "Answer", text: c.a },
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
            name: "Destacado",
            item: `${SITE.url}/agenda/destacado`,
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

      <section className="page-top" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>
            <Link href="/agenda">Agenda</Link> / Destacado
          </div>
          <h1>
            Tu evento arriba de todo,{" "}
            <br />
            todo el mes.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            {publicados > 0
              ? `La agenda tiene ${publicados} eventos de la industria y es lo más visitado del sitio.`
              : "La agenda reúne los eventos de la industria en la región y es lo más visitado del sitio."}{" "}
            Arriba de todo hay {LUGARES} lugares por mes. Uno puede ser tuyo.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          <section className="sem-bloque reveal">
            <h2 className="ag-mes">El precio</h2>
            <div className="hold" style={{ marginBottom: "18px" }}>
              <span className="tag">USD {PRECIO_MES} por mes</span>
              <p>
                Un evento, un mes, {LUGARES} lugares en total. Si además querés
                el mes anterior —que es cuando más te buscan por nombre— los dos
                salen USD {PRECIO_DOS_MESES}.
              </p>
            </div>
            <p className="sem-nota">
              Los primeros {LUGARES} que contraten mantienen este precio durante
              todo 2027, aunque para entonces la agenda tenga el doble de
              tráfico. Es la misma lógica que el programa de sponsors
              fundadores: el que acompaña al principio no paga después lo que
              ayudó a construir.
            </p>
          </section>

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Qué incluye</h2>
            <dl className="ver-lista">
              {INCLUYE.map((c) => (
                <div className="ver-item" key={c.q}>
                  <dt>{c.q}</dt>
                  <dd>{c.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Qué no incluye, a propósito</h2>
            <p className="sem-nota" style={{ marginBottom: "18px" }}>
              Lo editorial no se vende. Si se vendiera, en seis meses no habría
              nada que comprar: el espacio vale justamente porque lo que está al
              lado no se paga.
            </p>
            <dl className="ver-lista">
              {NO_INCLUYE.map((c) => (
                <div className="ver-item" key={c.q}>
                  <dt>{c.q}</dt>
                  <dd>{c.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Los números, medidos</h2>
            <p className="sem-nota">
              No estimamos audiencias. Esto es lo que reporta Google Search
              Console para las fichas de la agenda en la semana del 16 al 22 de
              agosto de 2026:{" "}
              <strong>4.003 impresiones y 51 clics</strong>, con fichas que
              aparecen entre el segundo y el sexto lugar cuando alguien busca el
              evento por su nombre. Es el 91% del tráfico de búsqueda del sitio.
            </p>
            <p className="sem-nota">
              Del otro lado del proyecto: {STATS.vistasYouTube.toLocaleString("es-AR")}{" "}
              visitas en YouTube y un capítulo nuevo por semana. Los números del
              sitio están{" "}
              <a
                href="https://datos.mateyeventos.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                abiertos en un panel público
              </a>
              , actualizados solos: no hace falta que nos creas.
            </p>
            <p className="sem-nota">
              Somos un medio joven y chico. Lo decimos porque el número que
              importa acá no es el total del sitio: es que alguien que busca tu
              evento por su nombre te encuentre primero.
            </p>
          </section>

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Cómo se contrata</h2>
            <p className="sem-nota">
              Escribinos a <a href={`mailto:${SITE.email}`}>{SITE.email}</a> con
              el nombre del evento y el mes que querés. Si el evento todavía no
              está en la agenda,{" "}
              <Link href="/agenda/sugerir">cargalo primero</Link>: es gratis y
              no hace falta contratar nada para estar.
            </p>
          </section>

          <div style={{ marginTop: "40px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a className="btn" href={`mailto:${SITE.email}?subject=${encodeURIComponent("Destacado en Agenda")}`}>
              Quiero un lugar
            </a>
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
