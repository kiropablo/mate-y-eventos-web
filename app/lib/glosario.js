import fs from "fs";
import path from "path";

// Lee el glosario del rubro desde content/glosario/{slug}.md
//
// Mismo sistema que los artículos: cabecera entre --- y el cuerpo en
// Markdown. Un archivo por término.
//
// Regla firme: un término no se publica sin el episodio donde se habló.
// Es lo que separa este glosario de cualquier diccionario genérico — la
// definición sale de una conversación real y se puede ir a escuchar.

const DIR = path.join(process.cwd(), "content", "glosario");

// Deshace el escapado que hace el generador al escribir el archivo.
// El orden importa: primero las comillas, después las barras.
function desescapar(t) {
  return String(t)
    .replace(/^"|"$/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function valorCabecera(crudo) {
  const t = crudo.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t.startsWith("[")) {
    return t
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((s) => desescapar(s.trim()))
      .filter(Boolean);
  }
  return desescapar(t);
}

function parsear(crudo, slug) {
  const m = crudo.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;

  const datos = {};
  m[1].split("\n").forEach((linea) => {
    const corte = linea.indexOf(":");
    if (corte > 0) {
      datos[linea.slice(0, corte).trim()] = valorCabecera(linea.slice(corte + 1));
    }
  });

  return {
    slug,
    termino: datos.termino || "",
    // Otras formas de decirlo. Sirven para la búsqueda de la página.
    alias: Array.isArray(datos.alias) ? datos.alias : [],
    definicionCorta: datos.definicionCorta || "",
    episodio: datos.episodio || "",
    episodioTitulo: datos.episodioTitulo || "",
    minuto: datos.minuto || "",
    eje: datos.eje || "",
    relacionados: Array.isArray(datos.relacionados) ? datos.relacionados : [],
    publicado: datos.publicado === true,
    cuerpo: crudo.slice(m[0].length).trim(),
  };
}

// Todos los términos, ordenados alfabéticamente.
// Por defecto solo los que se pueden publicar: marcados como publicados,
// con término, con definición corta y con episodio.
export function getTerminos({ incluirBorradores = false } = {}) {
  let archivos = [];
  try {
    archivos = fs
      .readdirSync(DIR)
      // Los que empiezan con "_" son notas internas (la plantilla), no
      // términos: no salen ni en la web ni en el panel.
      .filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  } catch {
    // Todavía no existe la carpeta: el glosario está vacío, no roto.
    return [];
  }

  const lista = [];
  for (const archivo of archivos) {
    try {
      const crudo = fs.readFileSync(path.join(DIR, archivo), "utf8");
      const t = parsear(crudo, archivo.replace(/\.md$/, ""));
      if (!t || !t.termino) continue;
      if (incluirBorradores || sePuedePublicar(t)) lista.push(t);
    } catch {
      // Un archivo roto no puede tirar abajo la página entera.
    }
  }

  return lista.sort((a, b) =>
    a.termino.localeCompare(b.termino, "es", { sensitivity: "base" })
  );
}

export function sePuedePublicar(t) {
  return Boolean(
    t.publicado && t.termino && t.definicionCorta && t.episodio
  );
}

export function getTermino(slug, { incluirBorradores = false } = {}) {
  try {
    const crudo = fs.readFileSync(path.join(DIR, `${slug}.md`), "utf8");
    const t = parsear(crudo, slug);
    if (!t || !t.termino) return null;
    if (!incluirBorradores && !sePuedePublicar(t)) return null;
    return t;
  } catch {
    return null;
  }
}

// Los términos que se hablaron en un episodio, para enlazar desde su ficha.
export function terminosDelEpisodio(id) {
  if (!id) return [];
  return getTerminos().filter((t) => t.episodio === id);
}

// Agrupa por letra inicial, sin acentos, para el índice A–Z.
export function porLetra(terminos) {
  const grupos = new Map();
  for (const t of terminos) {
    const l = t.termino
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .charAt(0)
      .toUpperCase();
    const letra = /[A-Z]/.test(l) ? l : "#";
    if (!grupos.has(letra)) grupos.set(letra, []);
    grupos.get(letra).push(t);
  }
  return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b));
}
