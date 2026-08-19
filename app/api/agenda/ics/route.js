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

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const tipos = valores(q, "tipo");
  const paises = valores(q, "pais");
  const provincias = valores(q, "provincia");

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
