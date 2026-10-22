import { getEventos, yaPaso, pasaFiltros } from "../../../lib/agenda";
import { armarCalendario } from "../../../lib/ics";
import { SITE } from "../../../lib/site";

// Feed de calendario de toda la agenda, para suscribirse una vez y que los
// eventos nuevos aparezcan solos. Distinto del .ics de un evento suelto:
// este no se descarga, se suscribe.
//
// Filtros opcionales por querystring: ?tipo=  ?pais=  ?provincia=
// Se pueden repetir para sumar varios valores, igual que en /agenda:
//   /api/agenda/ics?pais=Argentina&pais=Brasil&tipo=Festival

export const revalidate = 3600;

const REGISTRADOR = "https://datos.mateyeventos.com/api/registrar";

// Quién está pidiendo el calendario. Lo que importa no es la marca sino la
// diferencia entre "un calendario suscrito" y "un navegador mirando": lo
// primero es alguien que va a recibir la agenda todas las semanas sin hacer
// nada; lo segundo es una visita más.
function quienPide(ua = "") {
  const u = ua.toLowerCase();
  if (!u) return "desconocido";
  if (u.includes("google-calendar") || u.includes("googlecalendar") || u.includes("feedfetcher")) return "google";
  if (u.includes("calendaragent") || u.includes("dataaccessd") || u.includes("ical") || u.includes("macoutlook")) return "apple";
  if (u.includes("outlook") || u.includes("microsoft")) return "outlook";
  if (u.includes("thunderbird") || u.includes("lightning")) return "thunderbird";
  // Un navegador que abre la URL no es una suscripción: es alguien mirando.
  if (u.includes("mozilla") || u.includes("chrome") || u.includes("safari")) return "navegador";
  return "otro";
}

// Anota que alguien consultó el calendario. Nunca espera la respuesta y nunca
// rompe el feed: si el panel está caído, la suscripción sigue funcionando
// igual. Es la misma regla que el contador de visitas.
function anotar({ cliente, filtros, sid, pais }) {
  try {
    fetch(REGISTRADOR, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({
        tipo: "calendario",
        ruta: "/api/agenda/ics",
        cliente,
        sid,
        filtros,
        pais,
      }),
    }).catch(() => {});
  } catch {
    // Medir jamás rompe el calendario de nadie.
  }
}

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const tipos = valores(q, "tipo");
  const paises = valores(q, "pais");
  const provincias = valores(q, "provincia");

  const cliente = quienPide(req.headers.get("user-agent") || "");
  anotar({
    cliente,
    // Qué pidió: sirve para saber qué recorte le interesa a la gente. Va
    // ordenado para que dos suscripciones iguales con los filtros en otro
    // orden cuenten como el mismo recorte.
    filtros: [...tipos, ...paises, ...provincias].sort().join("|").slice(0, 160) || "(todo)",
    // El identificador de la suscripción, si la URL lo trae. Las que se
    // armaron antes de que esto existiera no lo tienen y se cuentan aparte.
    sid: (q.get("s") || "").trim().slice(0, 32) || null,
    pais: req.headers.get("x-vercel-ip-country") || null,
  });

  // Estricto a propósito. Si Airtable falla a mitad de la paginación y
  // devolviéramos la lista corta, los calendarios de los suscriptos
  // interpretarían que esos eventos se cancelaron y los borrarían. Es
  // preferible fallar y que cada uno conserve la última copia buena.
  let todos;
  try {
    todos = await getEventos({ estricto: true });
  } catch {
    return new Response(
      "La agenda no está disponible en este momento. Probá de nuevo más tarde.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          // Nunca cachear una respuesta degradada.
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // Solo lo que todavía no terminó: nadie quiere que le llenen el calendario
  // con ediciones viejas. Los que no tienen fecha no entran.
  const eventos = todos.filter(
    (e) =>
      e.fechaInicio &&
      !yaPaso(e) &&
      pasaFiltros(e, { tipos, paises, provincias })
  );

  const filtros = [...tipos, ...provincias, ...paises].join(" · ");
  const nombre = filtros
    ? `Agenda Mate y Eventos — ${filtros}`
    : "Agenda Mate y Eventos";

  const cuerpo = armarCalendario({
    eventos,
    nombre,
    descripcion: `Congresos, expos, festivales y grandes producciones de la industria de eventos en Argentina y Latinoamérica. Actualizado por ${SITE.name}: ${SITE.url}/agenda`,
  });

  return new Response(cuerpo, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // "inline" y no "attachment": con attachment el navegador baja un
      // archivo suelto en vez de dejar que el calendario se suscriba.
      "Content-Disposition": 'inline; filename="agenda-mate-y-eventos.ics"',
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      // Accesible para los calendarios, fuera de los resultados de búsqueda.
      "X-Robots-Tag": "noindex",
    },
  });
}

// Todos los valores de un parámetro que puede venir repetido, ya limpios.
// ?pais=Argentina&pais=Brasil  ->  ["Argentina", "Brasil"]
function valores(q, nombre) {
  return q
    .getAll(nombre)
    .map((v) => v.trim())
    .filter(Boolean);
}
