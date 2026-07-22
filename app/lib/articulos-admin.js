import fs from "fs";
import path from "path";

// Lector pensado solo para el panel interno.
// A diferencia de lib/articulos.js, trae también los borradores y devuelve
// el texto tal cual está en el archivo, listo para editar.

const DIR = path.join(process.cwd(), "content", "articulos");

function limpiar(valor) {
  return String(valor)
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\\"/g, '"');
}

export function listarParaPanel() {
  let archivos = [];
  try {
    archivos = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }

  const items = [];

  for (const archivo of archivos) {
    try {
      const crudo = fs.readFileSync(path.join(DIR, archivo), "utf8");
      const m = crudo.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
      if (!m) continue;

      const datos = {};
      m[1].split("\n").forEach((linea) => {
        const corte = linea.indexOf(":");
        if (corte > 0) {
          datos[linea.slice(0, corte).trim()] = limpiar(linea.slice(corte + 1));
        }
      });

      items.push({
        id: archivo.replace(/\.md$/, ""),
        titulo: datos.titulo || "(sin título)",
        bajada: datos.bajada || "",
        fecha: datos.fecha || "",
        eje: datos.eje || "",
        episodioTitulo: datos.episodioTitulo || "",
        publicado: datos.publicado === "true",
        cuerpo: crudo.slice(m[0].length).trim(),
      });
    } catch {
      // Un archivo roto no puede tirar abajo el panel entero.
    }
  }

  // Primero los borradores (que son los que hay que revisar),
  // y dentro de cada grupo, del más nuevo al más viejo.
  return items.sort((a, b) => {
    if (a.publicado !== b.publicado) return a.publicado ? 1 : -1;
    return String(b.fecha).localeCompare(String(a.fecha));
  });
}
