import { getEvento } from "../../../../lib/agenda";
import { armarCalendario } from "../../../../lib/ics";

export const revalidate = 3600;

// Devuelve un archivo .ics para agregar UN evento a Google Calendar,
// Apple Calendario u Outlook con un toque.
//
// Para suscribirse a toda la agenda (y que los eventos nuevos aparezcan
// solos) está /api/agenda/ics.

export async function GET(_req, { params }) {
  const ev = await getEvento(params.slug);
  if (!ev || !ev.fechaInicio) {
    return new Response("Evento sin fecha confirmada", { status: 404 });
  }

  // Sin "nombre": esto es una descarga suelta, no una suscripción. Así el
  // evento entra en el calendario que el usuario ya usa.
  const cuerpo = armarCalendario({ eventos: [ev] });

  return new Response(cuerpo, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ev.slug}.ics"`,
      "X-Robots-Tag": "noindex",
    },
  });
}
