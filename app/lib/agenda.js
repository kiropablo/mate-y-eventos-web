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

// Color de cada tipo de evento (dots del calendario y la lista).
export const TIPO_COLOR = {
  "Congreso/Conferencia": "#5aa0ff",
  "Expo/Feria": "#93d5f7",
  Festival: "#b78cff",
  "Recital masivo": "#ea478a",
  Corporativo: "#9aa3b2",
  "Capacitación": "#7fe0a7",
  "Deportivo masivo": "#ffb35a",
  "Premios y galas": "#ffd75e",
  "Público/Festivo": "#5ad8c9",
};

export const MESES_LARGO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

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
//
// Por defecto degrada: si Airtable no contesta devuelve lo que haya (o nada)
// y las páginas muestran su estado vacío en vez de romperse.
//
// Con { estricto: true } avisa el error en vez de devolver una lista corta.
// Lo usa el feed de calendario: publicar una lista incompleta ahí no es
// "mostrar menos", es hacer que los calendarios de los suscriptos BORREN
// los eventos que faltan.
export async function getEventos({ estricto = false } = {}) {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) {
    if (estricto) throw new Error("Agenda: falta AIRTABLE_API_KEY");
    return [];
  }

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
      if (!res.ok) {
        if (estricto)
          throw new Error(`Agenda: Airtable respondió ${res.status}`);
        return eventos;
      }

      const data = await res.json();
      (data.records || []).forEach((r) => {
        const ev = mapear(r);
        if (ev) eventos.push(ev);
      });
      offset = data.offset || "";
    } while (offset);
  } catch (error) {
    if (estricto) throw error;
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

// Compara sin distinguir mayúsculas, acentos ni espacios de más. Un
// "Cordoba " cargado a las apuradas en Airtable tiene que seguir entrando
// en el filtro de "Córdoba".
export function pelado(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ¿El evento pasa los filtros elegidos?
//
// Cada filtro es una lista. Vacía quiere decir "todos". Dentro de un mismo
// filtro los valores SUMAN (Córdoba o Santa Fe); entre filtros distintos se
// CRUZAN (Córdoba o Santa Fe, y además solo festivales).
//
// Vive acá porque la usan tres lugares que tienen que dar siempre el mismo
// resultado: la lista, el calendario y el feed .ics.
export function pasaFiltros(ev, { tipos, paises, provincias } = {}) {
  return (
    estaEn(ev.tipo, tipos) &&
    estaEn(ev.pais, paises) &&
    estaEn(ev.provincia, provincias)
  );
}

function estaEn(valor, elegidos) {
  if (!elegidos || elegidos.length === 0) return true;
  const v = pelado(valor);
  return elegidos.some((e) => pelado(e) === v);
}

// Hoy, en hora de Argentina, como "2026-08-19".
//
// Importa el detalle: los servidores de Vercel corren en UTC, así que sin
// esto, a partir de las 21 de acá el sitio ya creería que es mañana y los
// eventos de hoy desaparecerían de "los próximos" tres horas antes.
export function hoyISO() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

// Suma (o resta) días a una fecha "2026-08-19".
export function sumarDias(fechaISO, dias) {
  const [a, m, d] = String(fechaISO).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

// ¿El evento ya pasó? (comparado contra hoy)
export function yaPaso(ev) {
  const fin = ev.fechaFin || ev.fechaInicio;
  if (!fin) return false;
  return fin < hoyISO();
}

// Ya arrancó y todavía no terminó.
export function enCurso(ev, hoy = hoyISO()) {
  if (!ev.fechaInicio) return false;
  const fin = ev.fechaFin || ev.fechaInicio;
  return ev.fechaInicio <= hoy && fin >= hoy;
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
