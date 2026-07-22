import fs from "fs";
import path from "path";

// Lee los artículos generados por scripts/generar-articulos.mjs
// desde content/articulos/{videoId}.md
//
// Cada archivo tiene una cabecera entre --- con los datos, después el cuerpo
// del artículo en Markdown y, al final, un bloque "## Preguntas frecuentes".
// Acá lo separamos todo en un objeto cómodo de usar en las páginas.

const DIR = path.join(process.cwd(), "content", "articulos");
const TITULO_FAQ = "## Preguntas frecuentes";

// Convierte un valor de la cabecera al tipo que corresponde.
function valorCabecera(crudo) {
  const t = crudo.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t.startsWith("[")) {
    return t
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
  }
  if (/^-?\d+$/.test(t)) return Number(t);
  return t.replace(/^"|"$/g, "").replace(/\\"/g, '"');
}

function parsear(crudo, id) {
  const m = crudo.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;

  const datos = {};
  m[1].split("\n").forEach((linea) => {
    const corte = linea.indexOf(":");
    if (corte > 0) {
      datos[linea.slice(0, corte).trim()] = valorCabecera(linea.slice(corte + 1));
    }
  });

  let texto = crudo.slice(m[0].length).trim();

  // Separamos el bloque de preguntas frecuentes del cuerpo.
  const preguntas = [];
  const corte = texto.indexOf(TITULO_FAQ);
  if (corte !== -1) {
    const bloque = texto.slice(corte + TITULO_FAQ.length);
    texto = texto.slice(0, corte).trim();
    bloque
      .split(/\r?\n###\s+/)
      .slice(1)
      .forEach((tramo) => {
        const lineas = tramo.split("\n");
        const pregunta = (lineas.shift() || "").trim();
        const respuesta = lineas.join(" ").replace(/\s+/g, " ").trim();
        if (pregunta && respuesta) preguntas.push({ pregunta, respuesta });
      });
  }

  return {
    id,
    titulo: datos.titulo || "",
    bajada: datos.bajada || "",
    metaDescripcion: datos.metaDescripcion || datos.bajada || "",
    episodio: datos.episodio || id,
    episodioTitulo: datos.episodioTitulo || "",
    fecha: datos.fecha || "",
    eje: datos.eje || "",
    etiquetas: Array.isArray(datos.etiquetas) ? datos.etiquetas : [],
    lectura: datos.lectura || 6,
    publicado: datos.publicado === true,
    cuerpo: texto,
    preguntas,
  };
}

// Devuelve todos los artículos, del más nuevo al más viejo.
// Por defecto solo los publicados (los borradores no salen en la web).
export function getArticulos({ incluirBorradores = false } = {}) {
  let archivos = [];
  try {
    archivos = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }

  const lista = [];
  for (const archivo of archivos) {
    try {
      const crudo = fs.readFileSync(path.join(DIR, archivo), "utf8");
      const art = parsear(crudo, archivo.replace(/\.md$/, ""));
      if (art && art.titulo && (incluirBorradores || art.publicado)) {
        lista.push(art);
      }
    } catch {
      // Un archivo roto no puede tirar abajo la página entera.
    }
  }

  return lista.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
}

// Devuelve un artículo por el id del episodio (o null si no existe).
export function getArticulo(id, { incluirBorradores = false } = {}) {
  try {
    const crudo = fs.readFileSync(path.join(DIR, `${id}.md`), "utf8");
    const art = parsear(crudo, id);
    if (!art || !art.titulo) return null;
    if (!incluirBorradores && !art.publicado) return null;
    return art;
  } catch {
    return null;
  }
}

// Fecha "2026-07-22" → "22 de julio de 2026"
export function formatFecha(iso) {
  if (!iso) return "";
  try {
    const [a, m, d] = String(iso).split("-").map(Number);
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(a, m - 1, d));
  } catch {
    return "";
  }
}

// Versión en texto plano del artículo, para la descarga en .txt
export function articuloEnTexto(art, url) {
  const partes = [
    art.titulo.toUpperCase(),
    "",
    art.bajada,
    "",
    `Mate y Eventos — ${formatFecha(art.fecha)}`,
    url,
    "",
    "----------------------------------------",
    "",
    art.cuerpo
      .replace(/^:::checklist\s*(.*)$/gm, "$1")
      .replace(/^:::\s*$/gm, "")
      .replace(/^###\s+/gm, "")
      .replace(/^##\s+/gm, "")
      .replace(/\*\*/g, ""),
  ];

  if (art.preguntas.length) {
    partes.push("", "PREGUNTAS FRECUENTES", "");
    art.preguntas.forEach((q) => {
      partes.push(q.pregunta, q.respuesta, "");
    });
  }

  partes.push(
    "----------------------------------------",
    "",
    "Mate y Eventos — El medio de la industria de eventos en Latinoamérica.",
    "https://mateyeventos.com"
  );

  return partes.join("\n");
}
