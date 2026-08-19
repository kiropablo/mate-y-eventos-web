// Arma archivos de calendario (.ics) a partir de los eventos de la agenda.
//
// Lo usan dos rutas:
//   /api/agenda/[slug]/ics  → un evento suelto, para descargar.
//   /api/agenda/ics         → toda la agenda, para suscribirse.
//
// El formato es iCalendar (RFC 5545). Google, Apple y Outlook lo leen,
// pero Outlook es el más estricto: si una línea pasa los 75 caracteres
// sin cortar, descarta el evento entero. Por eso todo pasa por plegar().

import { SITE } from "./site";

const LARGO_MAXIMO = 75; // octetos, según el estándar.

// Un evento de la agenda convertido en bloque VEVENT.
// Devuelve [] si el evento no tiene fecha (no se puede poner en un calendario).
//
// transparente: en la suscripción a toda la agenda va en true, para que los
// 153 eventos no dejen al usuario marcado como ocupado medio año. Cuando
// alguien baja UN evento a propósito, en cambio, corresponde que le ocupe
// la agenda: ahí va en false y el calendario aplica su valor por defecto.
export function bloqueEvento(ev, { transparente = false } = {}) {
  if (!ev.fechaInicio) return [];

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

  return [
    "BEGIN:VEVENT",
    // El identificador tiene que ser estable para siempre: si cambia, el
    // calendario del usuario duplica el evento en vez de actualizarlo.
    // Por eso usamos el ID de Airtable, que no cambia nunca, y no el slug,
    // que se mueve si se corrige el nombre del evento.
    `UID:${ev.id || ev.slug}@mateyeventos.com`,
    `DTSTAMP:${sello()}`,
    `DTSTART;VALUE=DATE:${inicio}`,
    `DTEND;VALUE=DATE:${fin}`,
    `SUMMARY:${escapar(ev.nombre)}`,
    lugar ? `LOCATION:${escapar(lugar)}` : null,
    desc ? `DESCRIPTION:${escapar(desc)}` : null,
    `URL:${url}`,
    ev.tipo ? `CATEGORIES:${escapar(ev.tipo)}` : null,
    // Solo "Confirmadas" sale como confirmado. Las estimadas y las que
    // tienen fecha cargada pero todavía no anunciada van como tentativas:
    // el calendario las muestra distinto y no compromete al que se suscribe.
    ev.estadoFechas === "Confirmadas" ? "STATUS:CONFIRMED" : "STATUS:TENTATIVE",
    transparente ? "TRANSP:TRANSPARENT" : null,
    "END:VEVENT",
  ].filter(Boolean);
}

// El archivo completo, listo para devolver como respuesta.
//
// Dos usos con reglas distintas:
//   nombre presente  → es un calendario suscribible: lleva nombre propio y
//                      cada cuánto refrescarse.
//   nombre ausente   → es la descarga de un evento suelto. Sin nombre de
//                      calendario a propósito: si lo lleva, Outlook y Apple
//                      ofrecen crear un calendario nuevo en vez de sumar el
//                      evento al que el usuario ya tiene.
export function armarCalendario({
  eventos,
  nombre = "",
  descripcion = "",
  refresco = "PT12H",
}) {
  const suscripcion = Boolean(nombre);

  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mate y Eventos//Agenda//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    // X-WR-* no están en el estándar pero los respetan todos: son los que
    // hacen que el calendario aparezca con nombre propio y no como una URL.
    suscripcion ? `X-WR-CALNAME:${escapar(nombre)}` : null,
    suscripcion && descripcion ? `X-WR-CALDESC:${escapar(descripcion)}` : null,
    "X-WR-TIMEZONE:America/Argentina/Buenos_Aires",
    // Cada cuánto el calendario del usuario vuelve a buscar novedades.
    suscripcion ? `REFRESH-INTERVAL;VALUE=DURATION:${refresco}` : null,
    suscripcion ? `X-PUBLISHED-TTL:${refresco}` : null,
    ...eventos.flatMap((ev) =>
      bloqueEvento(ev, { transparente: suscripcion })
    ),
    "END:VCALENDAR",
  ].filter(Boolean);

  return lineas.map(plegar).join("\r\n") + "\r\n";
}

/* ---------- Interna ---------- */

// Airtable manda "2026-09-26" mientras el campo sea de tipo fecha sin hora.
// Si alguna vez se le activa la hora llegaría "2026-09-26T00:00:00.000Z" y
// las cuentas darían NaN, tirando abajo el feed entero por un cambio de
// configuración en Airtable. Nos quedamos siempre con el día y listo.
function soloFecha(valor) {
  return String(valor).slice(0, 10);
}

function compacta(fechaISO) {
  return soloFecha(fechaISO).replaceAll("-", "");
}

function diaSiguiente(fechaISO) {
  const [a, m, d] = soloFecha(fechaISO).split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + 1));
  return f.toISOString().slice(0, 10);
}

function sello() {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// iCalendar exige escapar barras, punto y coma, comas y saltos de línea.
// Los dos puntos NO se escapan: separan la etiqueta del valor.
export function escapar(texto) {
  return String(texto)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n")
    // Caracteres de control: rompen el archivo y nunca aportan nada.
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

// Corta las líneas largas como manda el estándar: máximo 75 octetos, y las
// continuaciones arrancan con un espacio. Se mide en bytes (no en letras)
// porque una "ñ" ocupa dos y un emoji hasta cuatro. Recorremos de a
// caracteres completos para no partir uno al medio.
export function plegar(linea) {
  const codificador = new TextEncoder();
  if (codificador.encode(linea).length <= LARGO_MAXIMO) return linea;

  const partes = [];
  let actual = "";
  let bytes = 0;
  let limite = LARGO_MAXIMO;

  for (const caracter of linea) {
    const ancho = codificador.encode(caracter).length;
    if (bytes + ancho > limite) {
      partes.push(actual);
      actual = "";
      bytes = 0;
      limite = LARGO_MAXIMO - 1; // el espacio inicial de la continuación
    }
    actual += caracter;
    bytes += ancho;
  }
  partes.push(actual);

  return partes.join("\r\n ");
}
