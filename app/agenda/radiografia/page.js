import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import { getEventosConEstado } from "../../lib/agenda";
import { radiografia } from "../../lib/radiografia";
import { migas } from "../../lib/migas";
import { SITE, fechaCorta } from "../../lib/site";

// Los números de la agenda, publicados.
//
// Es el único contenido del sitio que convierte a Mate y Eventos en fuente
// primaria en vez de en una opinión más: cuando alguien pregunte cuántas expos
// hay en Argentina este año, la respuesta va a salir de algún lado, y el dato
// lo tiene esta base y no otra.
//
// La página se rehace sola con cada lectura de la agenda. No hay una versión
// congelada de los números: lo que se congela es la fecha de corte, que se
// publica siempre al lado.

export const metadata = {
  alternates: { canonical: "/agenda/radiografia" },
  title: "Radiografía de la agenda de eventos de Argentina y LATAM",
  description:
    "Cuántos eventos hay por mes, qué tipos concentran, dónde se hacen y cuánto duran: los números de la agenda de la industria de eventos, con fecha de corte y datos descargables.",
  openGraph: {
    type: "article",
    title: "Radiografía de la agenda de eventos · Mate y Eventos",
    description:
      "Los números de la industria de eventos de Argentina y Latinoamérica, calculados sobre nuestra propia base.",
    url: `${SITE.url}/agenda/radiografia`,
    siteName: SITE.name,
    locale: "es_AR",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Radiografía de la agenda de eventos · Mate y Eventos",
    description: "Los números de la industria, con fecha de corte y método.",
    images: ["/og-default.jpg"],
  },
};

// Una hora, como el resto de la agenda. Los números se mueven todos los días.
export const revalidate = 3600;

const pct = (parte, total) => (total ? Math.round((parte / total) * 100) : 0);

export default async function Radiografia() {
  const { eventos, completa } = await getEventosConEstado();

  // Sin lectura completa no se publican estadísticas.
  //
  // Es la regla más importante de esta página. Un porcentaje calculado sobre
  // una lista que vino cortada no es un número aproximado: es un número falso,
  // y encima con cara de dato duro. Antes que eso, no hay página.
  if (!completa || eventos.length === 0) {
    return (
      <>
        <div className="wrap">
          <SiteNav />
        </div>
        <section className="page-top" data-accent="celeste">
          <div className="wrap">
            <h1>Radiografía de la agenda</h1>
            <p className="lead reveal">
              No pudimos leer la agenda entera en este momento, así que no
              publicamos los números: una estadística calculada sobre una lista
              incompleta es un dato falso con cara de dato duro. Probá de nuevo
              en un rato.
            </p>
            <div style={{ marginTop: "32px" }}>
              <Link className="btn" href="/agenda">
                Ir a la agenda
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const r = radiografia(eventos);
  const corte = fechaCorta(r.hoy);
  const bi = r.bimestre;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "@id": `${SITE.url}/agenda/radiografia#datos`,
        name: "Agenda de eventos de la industria de Argentina y Latinoamérica",
        description: `Los ${r.total} eventos de la industria de eventos de Argentina y Latinoamérica cargados en la agenda de ${SITE.name} al ${corte}, clasificados por mes, tipo, país, provincia y duración.`,
        url: `${SITE.url}/agenda/radiografia`,
        license: "https://creativecommons.org/licenses/by/4.0/",
        creator: { "@id": `${SITE.url}/#organization` },
        publisher: { "@id": `${SITE.url}/#organization` },
        isAccessibleForFree: true,
        inLanguage: "es-AR",
        dateModified: r.hoy,
        temporalCoverage: `${r.hoy}/..`,
        spatialCoverage: [
          { "@type": "Country", name: "Argentina" },
          { "@type": "Place", name: "Latinoamérica" },
        ],
        variableMeasured: [
          "Eventos por mes",
          "Eventos por tipo",
          "Eventos por país",
          "Eventos por provincia",
          "Duración en días",
        ],
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "text/csv",
          contentUrl: `${SITE.url}/agenda/radiografia/datos.csv`,
        },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/agenda/radiografia`,
        url: `${SITE.url}/agenda/radiografia`,
        name: `Radiografía de la agenda de eventos · ${SITE.name}`,
        isPartOf: { "@id": `${SITE.url}/#website` },
        mainEntity: { "@id": `${SITE.url}/agenda/radiografia#datos` },
        datePublished: r.hoy,
        dateModified: r.hoy,
      },
      migas([
        ["Agenda", "/agenda"],
        ["Radiografía", null],
      ]),
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

      <section className="page-top" data-accent="celeste">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>
            <Link href="/agenda">Agenda</Link> / Radiografía
          </div>
          <h1>
            Radiografía de la agenda{" "}
            <br />
            de eventos
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Cuántos eventos hay por mes, qué tipos concentran, dónde se hacen y
            cuánto duran. Los números salen de nuestra propia agenda, evento por
            evento, y se rehacen con cada lectura.
          </p>
          <p className="sem-nota" style={{ marginTop: "18px" }}>
            <strong>{r.total} eventos por delante</strong> · datos al {corte}
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="celeste">
        <div className="wrap">
          {bi && bi.n > 0 ? (
            <section className="sem-bloque reveal">
              <h2 className="ag-mes">El calendario no está repartido parejo</h2>
              <p className="body">
                <strong>
                  {bi.desde.nombre} y {bi.hasta.nombre} concentran {bi.n}{" "}
                  eventos
                </strong>
                : el {pct(bi.n, r.enLosDoceMeses)}% de todo lo que hay anunciado
                para los próximos doce meses, en dos meses. Es el dato que más
                le sirve a alguien que está eligiendo cuándo hacer el suyo.
              </p>
            </section>
          ) : null}

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Eventos por mes</h2>
            <p className="sem-nota" style={{ marginBottom: "18px" }}>
              Los {r.enLosDoceMeses} eventos con fecha anunciada, repartidos en
              los doce meses que vienen. Los {r.sinFecha} que todavía no
              anunciaron fecha no están en ningún mes.
            </p>
            <div className="radio-barras">
              {r.porMes.map((m) => (
                <div className="radio-barra" key={m.mes}>
                  <span className="radio-barra__mes">{m.nombre}</span>
                  <span className="radio-barra__pista">
                    <span
                      className="radio-barra__valor"
                      style={{ width: `${Math.round((m.n / r.pico) * 100)}%` }}
                    />
                  </span>
                  <span className="radio-barra__n">{m.n}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Qué tipo de eventos son</h2>
            <div className="ag-tabla">
              {r.porTipo.map((t) => (
                <div className="ag-fila" key={t.valor}>
                  <span className="ag-fila__fecha">{t.n}</span>
                  <span className="ag-fila__cuerpo">
                    <span className="ag-fila__nombre">{t.valor}</span>
                    <span className="ag-fila__meta">
                      {pct(t.n, r.total)}% de los {r.total}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Dónde se hacen</h2>
            <div className="ag-tabla">
              {r.porPais.map((p) => (
                <div className="ag-fila" key={p.valor}>
                  <span className="ag-fila__fecha">{p.n}</span>
                  <span className="ag-fila__cuerpo">
                    <span className="ag-fila__nombre">{p.valor}</span>
                    <span className="ag-fila__meta">
                      {pct(p.n, r.total)}% de los {r.total}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            {r.porProvincia.length > 0 ? (
              <>
                <p className="sem-nota" style={{ margin: "24px 0 12px" }}>
                  Y dentro de Argentina, sobre los {r.argentinos} que se hacen
                  acá:
                </p>
                <div className="ag-chips">
                  {r.porProvincia.slice(0, 10).map((p) => (
                    <span className="chip" key={p.valor}>
                      {p.valor} · {p.n}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </section>

          {r.porDuracion.length > 0 ? (
            <section className="sem-bloque reveal">
              <h2 className="ag-mes">Cuánto dura cada cosa</h2>
              <p className="sem-nota" style={{ marginBottom: "18px" }}>
                Mediana de días, contando el primero y el último. Solo se miden
                los que tienen las dos fechas cargadas y duran menos de un mes:
                arriba de eso ya no es un evento sino una temporada, y correría
                el promedio de todos los demás.
              </p>
              <div className="ag-tabla">
                {r.porDuracion.map((d) => (
                  <div className="ag-fila" key={d.tipo}>
                    <span className="ag-fila__fecha">{d.mediana}</span>
                    <span className="ag-fila__cuerpo">
                      <span className="ag-fila__nombre">{d.tipo}</span>
                      <span className="ag-fila__meta">
                        {d.mediana === 1 ? "día" : "días"} · medido sobre {d.n}{" "}
                        eventos
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Cómo está hecho esto</h2>
            <p className="sem-nota">
              Los números salen de la agenda de {SITE.name}: {r.total} eventos
              por delante al {corte}, cargados y revisados uno por uno. De esos,{" "}
              <strong>{r.conFecha} tienen fecha anunciada</strong> por la
              organización —{r.confirmadas} de ellas confirmadas y el resto
              estimadas por la propia organización— y{" "}
              <strong>{r.sinFecha} todavía no anunciaron la suya</strong>. Ese
              último número también es un dato: a esta altura del año, un{" "}
              {pct(r.sinFecha, r.total)}% del calendario de la industria
              todavía no está publicado.
            </p>
            <p className="sem-nota">
              Detrás de esos {r.total} eventos hay hasta{" "}
              {r.organizadores} organizaciones distintas. Decimos «hasta»
              porque se cuentan por el nombre tal como está cargado: una misma
              empresa escrita de dos formas cuenta dos veces, así que el número
              real es algo menor. Aun así muestra lo atomizada que está la
              industria: casi un organizador por evento.
            </p>
            <p className="sem-nota">
              Qué NO está acá: eventos que ya pasaron, los que están cargados
              pero todavía sin aprobar, y todo lo que no llegó a nuestra agenda.
              No es un censo de la industria, es lo que tenemos cargado y
              verificable. Si falta algo,{" "}
              <Link href="/agenda/sugerir">se puede sugerir</Link>.
            </p>
            <p className="sem-nota">
              {r.verificados > 0
                ? `De los ${r.total}, ${r.verificados} tienen sus datos confirmados directamente por el organizador. Es poco todavía: el circuito para pedirlo arrancó hace días y lo estamos haciendo evento por evento.`
                : "El circuito para que cada organizador confirme los datos de su propio evento recién arranca."}{" "}
              <Link href="/agenda/verificado">Cómo funciona el sello</Link>.
            </p>
          </section>

          <section className="sem-bloque reveal">
            <h2 className="ag-mes">Los datos, para bajar</h2>
            <p className="sem-nota" style={{ marginBottom: "18px" }}>
              Todas las cifras de esta página en una tabla, con la fecha de
              corte adentro. Se puede usar y citar libremente nombrando la
              fuente.
            </p>
            <a className="btn" href="/agenda/radiografia/datos.csv" download>
              Bajar los datos (CSV)
            </a>
          </section>

          <div style={{ marginTop: "40px" }}>
            <Link className="btn btn--ghost" href="/agenda">
              ← Ver la agenda completa
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
