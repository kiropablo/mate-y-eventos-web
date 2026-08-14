import { getEvento } from "../../../../lib/agenda";
import { SITE } from "../../../../lib/site";

export const revalidate = 3600;

// Devuelve un archivo .ics para agregar el evento a Google Calendar,
// Apple Calendario u Outlook con un toque.

export async function GET(_req, { params }) {
  const ev = await getEvento(params.slug);
  if (!ev || !ev.fechaInicio) {
    return new Response("Evento sin fecha confirmada", { status: 404 });
  }

  // En iCalendar los eventos de día completo terminan el día siguiente.
  const inicio = compacta(ev.fechaInicio);
  const fin = compacta(diaSiguiente(ev.fechaFin || ev.fechaInicio));

  const lugar = [ev.venue, ev.ciudad, ev.provincia, ev.pais]
    .filter(Boolean)
    .join(", ");

  const url = `${SITE.url}/agenda/${ev.slug}`;
  const desc = [ev.descCorta, ev.web, `Ficha completa: ${url}`]
    .filter(Boolean)
    .join("\n\n");

  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mate y Eventos//Agenda//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.slug}@mateyeventos.com`,
    `DTSTAMP:${sello()}`,
    `DTSTART;VALUE=DATE:${inicio}`,
    `DTEND;VALUE=DATE:${fin}`,
    `SUMMARY:${escapar(ev.nombre)}`,
    lugar ? `LOCATION:${escapar(lugar)}` : null,
    desc ? `DESCRIPTION:${escapar(desc)}` : null,
    `URL:${url}`,
    ev.estadoFechas === "Estimadas" ? "STATUS:TENTATIVE" : "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return new Response(lineas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ev.slug}.ics"`,
    },
  });
}

function compacta(fechaISO) {
  return fechaISO.replaceAll("-", "");
}

function diaSiguiente(fechaISO) {
  const [a, m, d] = fechaISO.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + 1));
  return f.toISOString().slice(0, 10);
}

function sello() {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// iCalendar exige escapar comas, punto y coma, barras y saltos de línea.
function escapar(texto) {
  return String(texto)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}
