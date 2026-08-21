import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import ArmarSnippet from "./ArmarSnippet";
import { getEventos, formatRango } from "../../lib/agenda";
import { SITE } from "../../lib/site";

export const metadata = {
  alternates: { canonical: "/agenda/verificado" },
  title: "El sello Verificado",
  description:
    "Qué significa el sello «Verificado» en la agenda de Mate y Eventos, qué chequeamos antes de darlo y cómo lo pone un organizador en su propio sitio.",
  openGraph: {
    type: "website",
    title: "El sello Verificado · Mate y Eventos",
    description:
      "Qué chequeamos antes de dar el sello, y cómo un organizador lo pone en su sitio.",
    url: `${SITE.url}/agenda/verificado`,
    siteName: SITE.name,
    locale: "es_AR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "El sello Verificado · Mate y Eventos",
    description: "Qué chequeamos antes de darlo y cómo se usa.",
    images: ["/og-default.jpg"],
  },
};

export const revalidate = 3600;

// Lo que efectivamente se chequea. Está acá y no en un texto suelto porque
// es lo que sostiene el sello: si se regala, no vale nada.
const CHEQUEOS = [
  {
    q: "Que las fechas sean las que el organizador confirma",
    a: "No las que dice una nota vieja ni las que estimamos nosotros. Si están sin anunciar, la ficha lo dice.",
  },
  {
    q: "Que la sede y la ciudad sean las de esta edición",
    a: "Los eventos cambian de predio más seguido de lo que parece, y las notas de años anteriores siguen circulando.",
  },
  {
    q: "Que el sitio oficial y los contactos lleguen a alguien",
    a: "Nada de mails que rebotan ni links a dominios vencidos.",
  },
  {
    q: "Que el organizador sea el que figura",
    a: "El predio donde se hace y quien lo produce no son lo mismo, aunque muchas veces se confundan.",
  },
];

export default async function Verificado() {
  const eventos = await getEventos();
  const verificados = eventos
    .filter((e) => e.verificado)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const paraSnippet = verificados.map((e) => ({
    slug: e.slug,
    nombre: e.nombre,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/agenda/verificado`,
        name: `El sello Verificado · ${SITE.name}`,
        url: `${SITE.url}/agenda/verificado`,
        description:
          "Qué significa el sello Verificado en la agenda de eventos de Mate y Eventos y qué se chequea antes de darlo.",
        isPartOf: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "FAQPage",
        mainEntity: CHEQUEOS.map((c) => ({
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
            name: "Verificado",
            item: `${SITE.url}/agenda/verificado`,
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
            <Link href="/agenda">Agenda</Link> / Verificado
          </div>
          <h1>
            Qué significa{" "}
            <br />
            el sello Verificado.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Que hablamos con quien organiza el evento y confirmó, uno por uno,
            los datos que publicamos. No es un premio ni un ranking: es que la
            información es la buena.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <div className="sello-muestra reveal">
            <span className="sello sello--estatico">
              <span className="sello__tilde" aria-hidden>
                ✓
              </span>
              <span>Datos verificados por el organizador · agosto de 2026</span>
            </span>
            <p className="sem-nota" style={{ marginTop: "14px" }}>
              Así se ve en la ficha del evento, con el mes en que se confirmó.
              La fecha está a propósito: un dato verificado hace dos años no es
              lo mismo que uno de este mes.
            </p>
          </div>

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Qué chequeamos</h2>
            <dl className="ver-lista">
              {CHEQUEOS.map((c) => (
                <div className="ver-item" key={c.q}>
                  <dt>{c.q}</dt>
                  <dd>{c.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Cómo se consigue</h2>
            <p className="sem-nota">
              No se pide y no se paga: lo proponemos nosotros. Vamos evento por
              evento, escribimos al organizador, repasamos juntos la ficha y,
              cuando confirma que está todo bien, encendemos el sello y le
              pasamos el código para ponerlo en su web.
            </p>
            <p className="sem-nota">
              Si organizás un evento que está en la agenda y querés adelantarte,
              escribinos a{" "}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a> y lo revisamos.
              Si tu evento todavía no está,{" "}
              <Link href="/agenda/sugerir">sugerilo primero</Link>.
            </p>
          </section>

          {verificados.length > 0 ? (
            <>
              <ArmarSnippet eventos={paraSnippet} />

              <section className="sem-bloque reveal">
                <h2 className="ag-mes">
                  Los eventos verificados ({verificados.length})
                </h2>
                <div className="ag-tabla">
                  {verificados.map((ev) => (
                    <Link
                      href={`/agenda/${ev.slug}`}
                      key={ev.slug}
                      className="ag-fila"
                    >
                      <span className="ag-fila__fecha">✓</span>
                      <span className="ag-fila__cuerpo">
                        <span className="ag-fila__nombre">{ev.nombre}</span>
                        <span className="ag-fila__meta">
                          {formatRango(ev)}
                          {[ev.ciudad || ev.provincia, ev.pais]
                            .filter(Boolean)
                            .join(", ")
                            ? ` · ${[ev.ciudad || ev.provincia, ev.pais].filter(Boolean).join(", ")}`
                            : ""}
                        </span>
                      </span>
                      <span className="ag-fila__flecha" aria-hidden>
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="hold reveal">
              <span className="tag">Arrancando</span>
              <p>
                Todavía no hay eventos verificados: estamos empezando a
                contactar organizadores, uno por uno. Los primeros van a
                aparecer acá.
              </p>
            </div>
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
