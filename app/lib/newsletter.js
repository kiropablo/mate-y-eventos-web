import { getArticulos } from "./articulos";
import { getTerminos } from "./glosario";
import { getEventosConEstado, yaPaso, formatRango, nombreConAnio } from "./agenda";
import { terminosMencionados } from "./enlaces";
import { SITE } from "./site";

// El borrador del newsletter de la semana.
//
// Por qué es un borrador y no un envío automático: mandar campañas por la API
// de beehiiv, y también su RSS-to-Send, piden el plan Max (US$96 por mes).
// Con Launch y con Scale se puede leer y dar de alta suscriptores —que es lo
// que hace /api/subscribe— pero no enviar. Así que se automatiza la parte
// cara en tiempo, que es juntar y ordenar, y el envío lo hace una persona
// desde beehiiv. Revisado el 27/8/2026; si algún día se paga Max, lo único
// que cambia es quién aprieta el botón.
//
// Nada de acá se escribe a mano: los artículos salen de content/articulos,
// los términos de content/glosario y los eventos de Airtable. Si una semana
// no hay artículos nuevos, el borrador lo dice; no se rellena con viejos.

// El newsletter sale los miércoles, como el episodio.
const DIA_DE_ENVIO = 3; // 0 domingo … 3 miércoles

// Cuántos eventos entran en el bloque de la agenda. Más que esto deja de ser
// un adelanto y se vuelve un listado, y el listado ya está en el sitio.
const MAXIMO_EVENTOS = 6;

// Hasta cuántos días adelante se miran los eventos. Una semana y monedas: lo
// que alguien todavía llega a agendar.
const DIAS_ADELANTE = 10;

// Cuántos términos del glosario entran. Hay semanas de publicar de a tandas:
// el 21/8/2026 se aprobaron 18 de una sentada, y un newsletter con 19
// definiciones no lo lee nadie. Entran los que más usa el propio sitio (ver
// abajo cómo se eligen) y se dice cuántos quedaron afuera, con el link al
// glosario. Un corte que no se declara es lo mismo que un dato escondido.
const MAXIMO_TERMINOS = 4;

function aFecha(iso) {
  return new Date(`${iso}T12:00:00Z`);
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

// El miércoles de esta semana, o el de hoy si hoy es miércoles.
//
// Se calcula en horario de Buenos Aires: con UTC, un martes a las 22 acá ya
// es miércoles allá y el corte se movería un día.
export function miercolesDe(hoy = new Date()) {
  const enBA = new Date(
    hoy.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );
  const dia = enBA.getDay();
  const atras = (dia - DIA_DE_ENVIO + 7) % 7;
  enBA.setDate(enBA.getDate() - atras);
  return iso(enBA);
}

// El miércoles anterior: el corte desde el que se mira qué hay nuevo.
export function miercolesAnterior(hoy = new Date()) {
  const d = aFecha(miercolesDe(hoy));
  d.setDate(d.getDate() - 7);
  return iso(d);
}

// El asunto.
//
// Sale del título del artículo más nuevo, recortado en su primera parte —los
// títulos del sitio usan dos puntos para separar gancho y explicación— más
// cuántos eventos se vienen. Si no hay artículo, el asunto habla de la
// agenda, que es lo que sí hay.
function armarAsunto(articulos, eventos) {
  const n = eventos.length;
  const cola =
    n === 0 ? "" : n === 1 ? ", y un evento que se viene" : `, y ${n} eventos que se vienen`;

  if (!articulos.length) {
    if (!n) return `Lo que pasa esta semana en la industria de eventos`;
    return n === 1
      ? "Un evento que se viene esta semana"
      : `${n} eventos que se vienen esta semana`;
  }
  const gancho = String(articulos[0].titulo).split(":")[0].trim();
  return `${gancho}${cola}`;
}

export async function borradorNewsletter({ hoy = new Date() } = {}) {
  const desde = miercolesAnterior(hoy);
  const hasta = miercolesDe(hoy);

  // Artículos publicados en la semana que va de un miércoles al otro.
  // Se ordenan del más nuevo al más viejo, que es como los devuelve la
  // librería, y el primero es el que da el asunto.
  const articulos = getArticulos()
    .filter((a) => a.fecha && a.fecha > desde && a.fecha <= hasta)
    .map((a) => ({
      titulo: a.titulo,
      bajada: a.bajada,
      url: `${SITE.url}/articulos/${a.id}`,
      eje: a.eje,
      fecha: a.fecha,
    }));

  // Términos que se publicaron en la misma ventana. El campo "revisado" es
  // cuándo una persona lo aprobó, que es la fecha en que salió a la web.
  const crudos = getTerminos().filter(
    (t) => t.revisado && t.revisado > desde && t.revisado <= hasta
  );

  // Cuál de estas palabras usa de verdad el medio.
  //
  // getTerminos() los devuelve alfabéticos, y cortar ahí los cuatro primeros
  // no es un criterio: es el orden en que venían. Con el corte en cuatro,
  // ningún término de la T a la Z entraría nunca, ninguna semana. La semana
  // del 21/8 eso dejaba afuera a "Timing", que según el propio enlaces.js es
  // la palabra más nombrada del sitio —13 de los 42 artículos— y metía dos
  // veces la misma: "Cabina de streaming" y "Cabina técnica".
  //
  // Se pesa con el mismo criterio comprobable que usa el resto del sitio: la
  // palabra está escrita en el artículo. Primero los que nombra algo de este
  // número, después los que más artículos publicados nombran, y el abecedario
  // queda solo como desempate para que el resultado sea siempre el mismo.
  //
  // Ordenar por fecha de revisión no serviría: es por día, y una tanda de
  // dieciocho aprobados el mismo día empata entera.
  const peso = new Map(crudos.map((t) => [t.slug, { enElNumero: 0, enTodos: 0 }]));
  for (const a of getArticulos()) {
    const deEstaSemana = a.fecha && a.fecha > desde && a.fecha <= hasta;
    for (const t of terminosMencionados(a, crudos)) {
      const p = peso.get(t.slug);
      if (!p) continue;
      p.enTodos += 1;
      if (deEstaSemana) p.enElNumero += 1;
    }
  }

  const terminos = [...crudos]
    .sort((a, b) => {
      const pa = peso.get(a.slug);
      const pb = peso.get(b.slug);
      return (
        (pb.enElNumero > 0) - (pa.enElNumero > 0) ||
        pb.enTodos - pa.enTodos ||
        a.termino.localeCompare(b.termino, "es")
      );
    })
    .slice(0, MAXIMO_TERMINOS)
    .map((t) => ({
      termino: t.termino,
      definicionCorta: t.definicionCorta,
      url: `${SITE.url}/glosario/${t.slug}`,
    }));
  const terminosDeMas = crudos.length - terminos.length;

  // La agenda. Si la lectura de Airtable sale corta, el bloque no se arma:
  // un newsletter que anuncia "3 eventos" cuando en realidad hay nueve es
  // peor que uno sin bloque de agenda.
  const { eventos: todos, completa } = await getEventosConEstado();
  const limite = iso(
    (() => {
      const d = aFecha(hasta);
      d.setDate(d.getDate() + DIAS_ADELANTE);
      return d;
    })()
  );

  const eventos = completa
    ? todos
        .filter((e) => !yaPaso(e) && e.fechaInicio && e.fechaInicio <= limite)
        .sort((a, b) => String(a.fechaInicio).localeCompare(String(b.fechaInicio)))
        .slice(0, MAXIMO_EVENTOS)
        .map((e) => ({
          nombre: nombreConAnio(e),
          cuando: formatRango(e),
          donde: [e.ciudad, e.provincia, e.pais].filter(Boolean).join(", "),
          url: `${SITE.url}/agenda/${e.slug}`,
          verificado: !!e.verificado,
        }))
    : [];

  return {
    desde,
    hasta,
    asunto: armarAsunto(articulos, eventos),
    articulos,
    terminos,
    terminosDeMas,
    eventos,
    // Si la agenda no se pudo leer entera, la pantalla lo dice en vez de
    // mostrar un bloque incompleto sin avisar.
    agendaCompleta: completa,
    // "Vacío" solo si de verdad se pudo mirar todo. Si Airtable no contestó,
    // eventos viene en [] por el try/catch de agenda.js, y contar ese vacío
    // como "no hay" es afirmar sobre datos que no se leyeron: la pantalla
    // decía "no hay eventos en los próximos días" con veinte en la agenda.
    // Es la regla 8 del CLAUDE.md — una fuga silenciosa— asomando por acá.
    vacio: completa && !articulos.length && !terminos.length && !eventos.length,
  };
}

// El mismo borrador, en el HTML que se pega en el editor de beehiiv.
//
// Es HTML pobre a propósito —encabezados, párrafos y enlaces— porque el
// editor de beehiiv reconstruye el suyo al pegar y cualquier estilo propio se
// pierde o, peor, entra a medias. Lo que tiene que sobrevivir es la
// estructura y los links.
export function borradorHTML(b) {
  // Escapa también las comillas: se usa dentro de href="…" y el slug sale de
  // Airtable tal cual. Hoy no es explotable —a ese campo solo llegan el robot
  // y el panel, los dos con el slug ya saneado— pero un escapador que no
  // escapa comillas es una trampa cargada para el próximo que lo reuse.
  const esc = (t) =>
    String(t == null ? "" : t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const partes = [];

  if (b.articulos.length) {
    partes.push("<h2>Para leer</h2>");
    for (const a of b.articulos) {
      partes.push(
        `<p><strong><a href="${esc(a.url)}">${esc(a.titulo)}</a></strong><br>${esc(a.bajada)}</p>`
      );
    }
  }

  if (b.eventos.length) {
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

  if (b.terminos.length) {
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
export function borradorTexto(b) {
  const partes = [];
  if (b.articulos.length) {
    partes.push("PARA LEER", "");
    for (const a of b.articulos) {
      partes.push(a.titulo, a.bajada, a.url, "");
    }
  }
  if (b.eventos.length) {
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
  if (b.terminos.length) {
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
