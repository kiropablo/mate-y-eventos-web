import { getEventos, yaPaso } from "../../../lib/agenda";
import { armarCalendario } from "../../../lib/ics";
import { SITE } from "../../../lib/site";

// Feed de calendario de toda la agenda, para suscribirse una vez y que los
// eventos nuevos aparezcan solos. Distinto del .ics de un evento suelto:
// este no se descarga, se suscribe.
//
// Filtros opcionales por querystring: ?tipo=  ?pais=  ?provincia=
// Ejemplo: /api/agenda/ics?pais=Argentina&provincia=Córdoba

export const revalidate = 3600;

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const tipo = (q.get("tipo") || "").trim();
  const pais = (q.get("pais") || "").trim();
  const provincia = (q.get("provincia") || "").trim();

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
      igual(e.tipo, tipo) &&
      igual(e.pais, pais) &&
      igual(e.provincia, provincia)
  );

  const filtros = [tipo, provincia, pais].filter(Boolean).join(" · ");
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

// Comparación tolerante: si no se pidió filtro pasa todo, y un espacio o un
// acento de más en Airtable no tiene por qué romper nada.
function igual(valor, filtro) {
  if (!filtro) return true;
  return pelado(valor) === pelado(filtro);
}

function pelado(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
