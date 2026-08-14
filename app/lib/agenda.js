// Lee la agenda de eventos desde Airtable.
//
// Fuente: base "Mate y Eventos — Plan Editorial 2026",
// tabla "Base de Datos — Eventos y Agenda".
// Solo se publican los registros con Estado = "Aprobado".
//
// Necesita AIRTABLE_API_KEY en las variables de entorno (Vercel).
// Si falta la clave o Airtable no responde, devuelve una lista vacía
// y la página muestra su estado "muy pronto" sin romperse.

const BASE_ID = process.env.AIRTABLE_AGENDA_BASE || "app6q7METE3ofZz1S";
const TABLE_ID = process.env.AIRTABLE_AGENDA_TABLE || "tblaLHf2VSyyyeN2s";

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Convierte un registro de Airtable en un objeto cómodo para las páginas.
function mapear(record) {
  const f = record.fields || {};
  const nombre = (f["Nombre"] || "").trim();
  if (!nombre) return null;

  const slug =
    (f["Slug"] || "").trim() ||
    nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const imagen =
    Array.isArray(f["Imagen/Logo"]) && f["Imagen/Logo"][0]
      ? f["Imagen/Logo"][0].url
      : null;

  return {
    id: record.id,
    nombre,
    slug,
    tipo: f["Tipo"] || "",
    interes: f["Interés MyE"] || [],
    destacado: Boolean(f["Destacado"]),
    imagen,
    organizador: (f["Organizador"] || "").trim(),
    edicion: (f["Edición/Frecuencia"] || "").trim(),
    fechaInicio: f["Fecha inicio"] || null,
    fechaFin: f["Fecha fin"] || null,
    estadoFechas: f["Estado de fechas"] || "Por anunciar",
    pais: f["País"] || "",
    provincia: (f["Provincia/Región"] || "").trim(),
    ciudad: (f["Ciudad"] || "").trim(),
    venue: (f["Venue"] || "").trim(),
    descCorta: (f["Descripción corta"] || "").trim(),
    descLarga: (f["Descripción larga"] || "").trim(),
    web: (f["Web oficial"] || "").trim(),
    contactos: lineas(f["Contactos"]),
    redes: lineas(f["Redes"]),
    edicionesAnteriores: lineas(f["Ediciones anteriores"]),
    fuentes: lineas(f["Fuentes"]),
  };
}

// Divide un campo de texto largo en líneas limpias.
function lineas(crudo) {
  if (!crudo) return [];
  return String(crudo)
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);
}

// Trae todos los eventos aprobados, paginando si hace falta.
export async function getEventos() {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) return [];

  const eventos = [];
  let offset = "";

  try {
    do {
      const params = new URLSearchParams({
        pageSize: "100",
        filterByFormula: '{Estado}="Aprobado"',
      });
      if (offset) params.set("offset", offset);

      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${params}`,
        {
          headers: { Authorization: `Bearer ${key}` },
          next: { revalidate: 3600 },
        }
      );
      if (!res.ok) return eventos;

      const data = await res.json();
      (data.records || []).forEach((r) => {
        const ev = mapear(r);
        if (ev) eventos.push(ev);
      });
      offset = data.offset || "";
    } while (offset);
  } catch {
    return eventos;
  }

  // Orden: primero los que tienen fecha (más cercana arriba),
  // después los "por anunciar".
  eventos.sort((a, b) => {
    if (a.fechaInicio && b.fechaInicio)
      return a.fechaInicio < b.fechaInicio ? -1 : 1;
    if (a.fechaInicio) return -1;
    if (b.fechaInicio) return 1;
    return a.nombre.localeCompare(b.nombre);
  });

  return eventos;
}

export async function getEvento(slug) {
  const eventos = await getEventos();
  return eventos.find((e) => e.slug === slug) || null;
}

// ¿El evento ya pasó? (comparado contra hoy)
export function yaPaso(ev) {
  const fin = ev.fechaFin || ev.fechaInicio;
  if (!fin) return false;
  const hoy = new Date().toISOString().slice(0, 10);
  return fin < hoy;
}

// "12 al 14 de mar 2027", "5 de sep 2026" o "Fechas por anunciar".
export function formatRango(ev) {
  if (!ev.fechaInicio) return "Fechas por anunciar";
  const [ai, mi, di] = ev.fechaInicio.split("-").map(Number);
  const ini = `${di} de ${MESES[mi - 1]}`;
  if (!ev.fechaFin || ev.fechaFin === ev.fechaInicio) {
    return `${ini} ${ai}`;
  }
  const [af, mf, df] = ev.fechaFin.split("-").map(Number);
  if (mi === mf && ai === af) return `${di} al ${df} de ${MESES[mi - 1]} ${ai}`;
  const fin = `${df} de ${MESES[mf - 1]}`;
  if (ai === af) return `${ini} al ${fin} ${ai}`;
  return `${ini} ${ai} al ${fin} ${af}`;
}

// Detecta el ID de un video de YouTube dentro de un texto, si lo hay.
export function youtubeId(texto) {
  const m = String(texto).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

// Separa "Etiqueta: resto" de una línea; si no hay etiqueta, va todo al texto.
export function partirLinea(linea) {
  const url = (linea.match(/https?:\/\/\S+/) || [null])[0];
  const corte = linea.indexOf(":");
  // Cuidado con "https:" — la etiqueta solo vale si aparece antes de la URL.
  if (corte > 0 && (!url || corte < linea.indexOf(url))) {
    return {
      etiqueta: linea.slice(0, corte).trim(),
      texto: linea.slice(corte + 1).trim(),
      url,
    };
  }
  return { etiqueta: "", texto: linea.trim(), url };
}
