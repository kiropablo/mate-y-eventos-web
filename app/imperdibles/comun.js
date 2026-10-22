import { SITE } from "../lib/site";
import { mesLargo } from "../lib/agenda";

// Lo que comparten la página de la última edición y la de cada mes del
// archivo, para que las dos digan exactamente lo mismo.

export function metaEdicion(edicion, { canonical }) {
  const cuantos = edicion.eventos.length;
  const nombres = edicion.eventos
    .slice(0, 3)
    .map((e) => e.nombre)
    .join(", ");
  const titulo = `Los imperdibles de ${mesLargo(edicion.mes)}`;
  const desc = `${cuantos} ${cuantos === 1 ? "evento elegido" : "eventos elegidos"} de la agenda de la industria para ${mesLargo(edicion.mes)}${nombres ? `: ${nombres}` : ""}. Con el motivo de cada elección.`;

  return {
    alternates: { canonical },
    title: titulo,
    description: desc,
    openGraph: {
      type: "article",
      title: `${titulo} · ${SITE.name}`,
      description: desc,
      url: `${SITE.url}${canonical}`,
      siteName: SITE.name,
      locale: "es_AR",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${titulo} · ${SITE.name}`,
      description: desc,
      images: ["/og-default.jpg"],
    },
  };
}

export function schemaEdicion(edicion, { canonical }) {
  const url = `${SITE.url}${canonical}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `Los imperdibles de ${mesLargo(edicion.mes)} · ${SITE.name}`,
        description: `Selección editorial de eventos de la industria para ${mesLargo(edicion.mes)}, con el motivo de cada elección.`,
        isPartOf: { "@id": `${SITE.url}/#website` },
      },
      {
        "@type": "ItemList",
        name: `Los imperdibles de ${mesLargo(edicion.mes)}`,
        numberOfItems: edicion.eventos.length,
        // Sin orden de importancia: van por fecha, no es un ranking.
        itemListOrder: "https://schema.org/ItemListUnordered",
        itemListElement: edicion.eventos.map((ev, i) => ({
          "@type": "ListItem",
          position: i + 1,
          // Sin fecha de inicio NO es un Event.
          //
          // startDate es obligatorio para Google: un Event sin esa fecha no
          // es un evento incompleto, es un dato inválido. Acá se emitía igual
          // y el 20/10/2026 Search Console avisó por el campo endDate que
          // falta; mirando la página, el problema era más grande: 4 de los 5
          // Events de /imperdibles salían sin startDate.
          //
          // La selección del mes incluye a propósito eventos que todavía no
          // anunciaron fecha, y eso está bien en la página: el lector los ve
          // igual. Lo que no corresponde es afirmarle a Google que son
          // eventos agendables. Van como Thing, que es lo que son hasta que
          // haya fecha: algo que existe y tiene una ficha propia.
          //
          // Es el mismo criterio de agenda/[slug], que directamente no emite
          // el Event cuando no sabe cuándo ni dónde.
          item: ev.fechaInicio
            ? {
                "@type": "Event",
                name: ev.nombre,
                startDate: ev.fechaInicio,
                // Un evento de un solo día igual tiene fecha de cierre: es la
                // misma que la de inicio.
                endDate: ev.fechaFin || ev.fechaInicio,
                eventStatus: "https://schema.org/EventScheduled",
                eventAttendanceMode:
                  "https://schema.org/OfflineEventAttendanceMode",
                ...(ev.porQueImperdible || ev.descCorta
                  ? { description: ev.porQueImperdible || ev.descCorta }
                  : {}),
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
              }
            : {
                "@type": "Thing",
                name: ev.nombre,
                ...(ev.porQueImperdible || ev.descCorta
                  ? { description: ev.porQueImperdible || ev.descCorta }
                  : {}),
                url: `${SITE.url}/agenda/${ev.slug}`,
              },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Imperdibles",
            item: `${SITE.url}/imperdibles`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: mesLargo(edicion.mes),
            item: url,
          },
        ],
      },
    ],
  };
}
