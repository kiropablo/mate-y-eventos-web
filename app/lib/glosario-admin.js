import fs from "fs";
import path from "path";

// Lector del glosario pensado solo para el panel interno.
// A diferencia de lib/glosario.js, trae también los borradores y devuelve
// el texto tal cual está en el archivo, listo para editar.

const DIR = path.join(process.cwd(), "content", "glosario");

// Deshace el mismo escapado que aplica el generador al escribir el archivo.
// El orden importa: primero las comillas, después las barras.
function limpiar(valor) {
  return String(valor)
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

export function listarGlosarioParaPanel() {
  let archivos = [];
  try {
    archivos = fs
      .readdirSync(DIR)
      // Los que empiezan con "_" son notas internas (la plantilla): no tiene
      // sentido que aparezcan en la lista de cosas para revisar.
      .filter((f) => f.endsWith(".md") && !f.startsWith("_"));
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

      if (!datos.termino) continue;

      items.push({
        id: archivo.replace(/\.md$/, ""),
        termino: datos.termino,
        definicionCorta: datos.definicionCorta || "",
        episodio: datos.episodio || "",
        episodioTitulo: datos.episodioTitulo || "",
        // Tiene que viajar hasta el panel: si no llega, el editor arranca
        // vacío y al guardar le borra el minuto que ya estaba cargado.
        minuto: datos.minuto || "",
        eje: datos.eje || "",
        generado: datos.generado || "",
        publicado: datos.publicado === "true",
        // Sin episodio no se puede publicar, aunque esté marcado. El panel
        // lo avisa en vez de dejar guardar algo que no va a salir igual.
        listoParaPublicar: Boolean(datos.episodio && datos.definicionCorta),
        cuerpo: crudo.slice(m[0].length).trim(),
      });
    } catch {
      // Un archivo roto no puede tirar abajo el panel entero.
    }
  }

  // Primero los borradores, que son los que hay que revisar.
  return items.sort((a, b) => {
    if (a.publicado !== b.publicado) return a.publicado ? 1 : -1;
    return a.termino.localeCompare(b.termino, "es", { sensitivity: "base" });
  });
}
