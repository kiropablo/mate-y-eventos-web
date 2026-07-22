// Avisa que hay borradores nuevos para revisar.
//
// Abre un issue en GitHub con la lista y se lo asigna a Pablo.
// GitHub manda el mail solo: no hace falta ningún servicio de correo
// ni ninguna clave nueva.
//
// Se ejecuta desde .github/workflows/articulos.yml, después de guardar
// los artículos. Si no hay nada nuevo, no hace nada.

import fs from "fs";
import { execSync } from "child_process";

const TOKEN = process.env.GITHUB_TOKEN;
// GITHUB_REPOSITORY lo pone GitHub Actions solo: "usuario/repositorio".
const REPO = process.env.GITHUB_REPOSITORY || "";
const PANEL = process.env.PANEL_URL || "https://www.mateyeventos.com/admin";
// A quién se le asigna el issue. Por defecto, el dueño del repositorio.
const AVISAR_A = process.env.AVISAR_A || REPO.split("/")[0] || "";

if (!TOKEN || !REPO) {
  console.log("Sin datos de GitHub: no se manda aviso.");
  process.exit(0);
}

// Qué archivos de artículos entraron en el último commit.
let archivos = [];
try {
  archivos = execSync('git show --pretty="" --name-only HEAD', {
    encoding: "utf8",
  })
    .split("\n")
    .map((linea) => linea.trim())
    .filter((f) => f.startsWith("content/articulos/") && f.endsWith(".md"));
} catch {
  archivos = [];
}

if (archivos.length === 0) {
  console.log("No hay artículos nuevos en el último commit: no se manda aviso.");
  process.exit(0);
}

// Sacamos el título de cada uno y nos quedamos solo con los borradores.
const campo = (texto, clave) => {
  const m = texto.match(new RegExp(`^${clave}:\\s*(.+)$`, "m"));
  return m ? m[1].trim().replace(/^"|"$/g, "").replace(/\\"/g, '"') : "";
};

const borradores = [];
for (const ruta of archivos) {
  try {
    const texto = fs.readFileSync(ruta, "utf8");
    if (campo(texto, "publicado") !== "false") continue;
    borradores.push({
      id: ruta.split("/").pop().replace(/\.md$/, ""),
      titulo: campo(texto, "titulo") || "(sin título)",
      bajada: campo(texto, "bajada"),
      eje: campo(texto, "eje"),
      episodio: campo(texto, "episodioTitulo"),
      preguntas: (texto.match(/^###\s+/gm) || []).length,
    });
  } catch {
    // Si un archivo no se puede leer, seguimos con los demás.
  }
}

if (borradores.length === 0) {
  console.log("No hay borradores nuevos: no se manda aviso.");
  process.exit(0);
}

const hoy = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
}).format(new Date());

const titulo =
  borradores.length === 1
    ? `1 artículo nuevo para revisar (${hoy})`
    : `${borradores.length} artículos nuevos para revisar (${hoy})`;

const cuerpo = [
  `Se escribieron **${borradores.length}** ${
    borradores.length === 1 ? "borrador nuevo" : "borradores nuevos"
  }. Ninguno está online todavía.`,
  "",
  `👉 **[Abrir el panel para revisarlos](${PANEL})**`,
  "",
  "---",
  "",
  ...borradores.map((b) =>
    [
      `### ${b.titulo}`,
      b.bajada ? `${b.bajada}` : "",
      "",
      `*${b.eje || "Sin eje"} · ${b.preguntas} preguntas${
        b.episodio ? ` · Episodio: ${b.episodio}` : ""
      }*`,
      "",
      `[Ver el archivo](https://github.com/${REPO}/blob/main/content/articulos/${b.id}.md)`,
      "",
    ].join("\n")
  ),
  "---",
  "",
  "Cuando termines de revisarlos, cerrá este issue.",
].join("\n");

const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: titulo,
    body: cuerpo,
    ...(AVISAR_A ? { assignees: [AVISAR_A] } : {}),
  }),
});

if (!res.ok) {
  const detalle = await res.text();
  console.log(`No se pudo abrir el issue (${res.status}): ${detalle.slice(0, 200)}`);
  process.exit(0); // no rompemos la Action por un aviso
}

const issue = await res.json();
console.log(`Aviso enviado: issue #${issue.number} con ${borradores.length} borradores.`);
