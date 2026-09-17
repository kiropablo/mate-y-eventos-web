import fs from "fs";
import path from "path";

// Lector de las fichas de invitados pensado solo para el panel interno.
// A diferencia de lib/invitados.js, trae también los borradores y devuelve el
// texto tal cual está en el archivo, listo para editar.

const DIR = path.join(process.cwd(), "content", "invitados");

// Deshace el mismo escapado que aplica el generador al escribir el archivo.
// El orden importa: primero las comillas, después las barras.
function limpiar(valor) {
  return String(valor)
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function comoLista(valor) {
  const t = String(valor || "").trim();
  if (!t.startsWith("[")) return t ? [limpiar(t)] : [];
  return t
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((s) => limpiar(s))
    .filter(Boolean);
}

export function listarInvitadosParaPanel() {
  let archivos = [];
  try {
    archivos = fs
      .readdirSync(DIR)
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
          datos[linea.slice(0, corte).trim()] = linea.slice(corte + 1);
        }
      });

      const nombre = limpiar(datos.nombre || "");
      if (!nombre) continue;

      const episodios = comoLista(datos.episodios);

      items.push({
        id: archivo.replace(/\.md$/, ""),
        nombre,
        rol: limpiar(datos.rol || ""),
        bio: limpiar(datos.bio || ""),
        web: limpiar(datos.web || ""),
        // Se editan como texto, un link por línea: es más fácil de pegar que
        // una lista con corchetes y comillas.
        redes: comoLista(datos.redes).join("\n"),
        episodios,
        episodioTitulo: limpiar(datos.episodioTitulo || ""),
        // La frase de la transcripción de donde el robot sacó el nombre y el
        // rol. Es LO PRIMERO que hay que mirar antes de aprobar: si eso no dice
        // lo que dice la ficha, el robot se equivocó de persona. No se publica.
        fuente: limpiar(datos.fuente || ""),
        generado: limpiar(datos.generado || ""),
        publicado: limpiar(datos.publicado || "") === "true",
        // Sin episodio la ficha no sale publicada aunque esté marcada: sería la
        // biografía suelta de alguien, sin nada que se pueda ir a escuchar.
        listoParaPublicar: Boolean(nombre && episodios.length > 0),
        cuerpo: crudo.slice(m[0].length).trim(),
      });
    } catch {
      // Un archivo roto no puede tirar abajo el panel entero.
    }
  }

  // Primero los borradores, que son los que hay que revisar.
  return items.sort((a, b) => {
    if (a.publicado !== b.publicado) return a.publicado ? 1 : -1;
    return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
  });
}
