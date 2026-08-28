import { SITE } from "./site";

// Arma el borrador del newsletter en HTML y en texto pelado.
//
// Vive separado de newsletter.js a propósito: ese archivo lee del disco y de
// Airtable, así que no puede entrar al navegador. Estas dos funciones no leen
// nada —reciben el borrador ya armado— y por eso las puede usar también la
// pantalla, que es lo que permite que los interruptores de cada bloque
// rearmen el texto en vivo sin volver al servidor.
//
// El HTML es pobre a propósito —encabezados, párrafos y enlaces— porque el
// editor de beehiiv reconstruye el suyo al pegar y cualquier estilo propio se
// pierde o, peor, entra a medias. Lo que tiene que sobrevivir es la
// estructura y los links.

// Escapa también las comillas: se usa dentro de href="…" y el slug sale de
// Airtable tal cual. Hoy no es explotable —a ese campo solo llegan el robot y
// el panel, los dos con el slug ya saneado— pero un escapador que no escapa
// comillas es una trampa cargada para el próximo que lo reuse.
const esc = (t) =>
  String(t == null ? "" : t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Qué bloques entran. Sin nada, entran todos: así el que llame a esto sin
// interruptores —un script, una prueba— sigue obteniendo el número completo.
export const BLOQUES = [
  { id: "episodio", titulo: "El episodio de la semana" },
  { id: "articulos", titulo: "Para leer" },
  { id: "eventos", titulo: "La agenda de los próximos días" },
  { id: "terminos", titulo: "Nuevo en el glosario" },
];

// Cuánto tiene cada bloque. Lo usan la pantalla (para no ofrecer un
// interruptor de algo vacío) y los armadores.
export function cuanto(b, id) {
  if (id === "episodio") return b.episodio ? 1 : 0;
  if (id === "articulos") return b.articulos?.length || 0;
  if (id === "eventos") return b.eventos?.length || 0;
  if (id === "terminos") return b.terminos?.length || 0;
  return 0;
}

function entra(b, activos, id) {
  if (cuanto(b, id) === 0) return false;
  return activos ? activos[id] !== false : true;
}

export function borradorHTML(b, activos) {
  const partes = [];

  if (entra(b, activos, "episodio")) {
    const e = b.episodio;
    partes.push("<h2>El episodio de la semana</h2>");
    // La miniatura va envuelta en el link al episodio: en un mail, una imagen
    // que no se puede tocar es media imagen. Si beehiiv la descarta al pegar,
    // la dirección queda igual abajo en la versión de texto para ponerla a
    // mano.
    partes.push(
      `<p><a href="${esc(e.url)}"><img src="${esc(e.miniatura)}" alt="${esc(e.titulo)}" width="480"></a></p>`
    );
    partes.push(
      `<p><strong><a href="${esc(e.url)}">${esc(e.titulo)}</a></strong></p>`
    );
    if (e.resumen) partes.push(`<p>${esc(e.resumen)}</p>`);
    const links = [`<a href="${esc(e.youtube)}">Verlo en YouTube</a>`];
    if (e.articuloUrl) {
      links.push(`<a href="${esc(e.articuloUrl)}">Leer el artículo</a>`);
    }
    partes.push(`<p>${links.join(" · ")}</p>`);
  }

  if (entra(b, activos, "articulos")) {
    partes.push("<h2>Para leer</h2>");
    for (const a of b.articulos) {
      partes.push(
        `<p><strong><a href="${esc(a.url)}">${esc(a.titulo)}</a></strong><br>${esc(a.bajada)}</p>`
      );
    }
  }

  if (entra(b, activos, "eventos")) {
    partes.push("<h2>La agenda de los próximos días</h2>");
    for (const e of b.eventos) {
      const sello = e.verificado ? " · datos confirmados por el organizador" : "";
      partes.push(
        `<p><strong><a href="${esc(e.url)}">${esc(e.nombre)}</a></strong><br>${esc(e.cuando)}${
          e.donde ? ` · ${esc(e.donde)}` : ""
        }${esc(sello)}</p>`
      );
    }
    partes.push(
      `<p><a href="${esc(SITE.url)}/agenda">Ver la agenda completa</a></p>`
    );
  }

  if (entra(b, activos, "terminos")) {
    partes.push("<h2>Nuevo en el glosario</h2>");
    for (const t of b.terminos) {
      partes.push(
        `<p><strong><a href="${esc(t.url)}">${esc(t.termino)}</a></strong>: ${esc(t.definicionCorta)}</p>`
      );
    }
    if (b.terminosDeMas > 0) {
      partes.push(
        `<p><a href="${esc(SITE.url)}/glosario">Y ${b.terminosDeMas} ${
          b.terminosDeMas === 1 ? "palabra más" : "palabras más"
        } en el glosario</a></p>`
      );
    }
  }

  return partes.join("\n");
}

// Y en texto pelado, para quien prefiera pegarlo así.
export function borradorTexto(b, activos) {
  const partes = [];

  if (entra(b, activos, "episodio")) {
    const e = b.episodio;
    partes.push("EL EPISODIO DE LA SEMANA", "");
    partes.push(e.titulo);
    if (e.resumen) partes.push(e.resumen);
    partes.push(e.url, `Miniatura: ${e.miniatura}`, "");
  }

  if (entra(b, activos, "articulos")) {
    partes.push("PARA LEER", "");
    for (const a of b.articulos) {
      partes.push(a.titulo, a.bajada, a.url, "");
    }
  }

  if (entra(b, activos, "eventos")) {
    partes.push("LA AGENDA DE LOS PRÓXIMOS DÍAS", "");
    for (const e of b.eventos) {
      partes.push(
        e.nombre,
        [e.cuando, e.donde].filter(Boolean).join(" · "),
        e.url,
        ""
      );
    }
    partes.push(`Ver la agenda completa: ${SITE.url}/agenda`, "");
  }

  if (entra(b, activos, "terminos")) {
    partes.push("NUEVO EN EL GLOSARIO", "");
    for (const t of b.terminos) {
      partes.push(`${t.termino}: ${t.definicionCorta}`, t.url, "");
    }
    if (b.terminosDeMas > 0) {
      partes.push(
        `Y ${b.terminosDeMas} ${b.terminosDeMas === 1 ? "palabra más" : "palabras más"}: ${SITE.url}/glosario`,
        ""
      );
    }
  }

  return partes.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
