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
// Qué carpeta mira. Cada Action avisa solo de lo suyo: si no, la de Glosario
// termina abriendo un issue con los artículos que la de Artículos ya avisó
// diez minutos antes, porque las dos leen el último commit del repo.
//   articulos · glosario · secciones · (vacío = todas)
const SOLO = (process.env.SOLO || "").trim();

const CARPETAS = {
  articulos: "content/articulos/",
  glosario: "content/glosario/",
  secciones: "content/transcripts/secciones/",
};
const MIRA = SOLO && CARPETAS[SOLO] ? [CARPETAS[SOLO]] : Object.values(CARPETAS);

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
    .filter(
      (f) =>
        (f.endsWith(".md") || f.endsWith(".json")) &&
        MIRA.some((c) => f.startsWith(c))
    );
} catch {
  archivos = [];
}

if (archivos.length === 0) {
  console.log("Nada nuevo en el último commit: no se manda aviso.");
  process.exit(0);
}

// Sacamos el título de cada uno y nos quedamos solo con los borradores.
const campo = (texto, clave) => {
  const m = texto.match(new RegExp(`^${clave}:[^\\S\\r\\n]*(.+)$`, "m"));
  return m ? m[1].trim().replace(/^"|"$/g, "").replace(/\\"/g, '"') : "";
};

const borradores = [];
const terminos = [];
const segmentados = [];
for (const ruta of archivos) {
  try {
    const texto = fs.readFileSync(ruta, "utf8");

    // Las secciones de las transcripciones son un caso aparte: no son
    // borradores. Como son solo posiciones dentro del texto, no pueden
    // cambiar una palabra de lo que se dijo, así que van derecho online.
    // El aviso es para que los leas, no para que los aprobés.
    if (ruta.startsWith("content/transcripts/secciones/")) {
      const cortes = JSON.parse(texto);
      if (!Array.isArray(cortes) || cortes.length === 0) continue;
      segmentados.push({
        id: ruta.split("/").pop().replace(/\.json$/, ""),
        titulos: cortes.map((c) => c.titulo).filter(Boolean),
      });
      continue;
    }

    if (campo(texto, "publicado") !== "false") continue;
    const id = ruta.split("/").pop().replace(/\.md$/, "");

    if (ruta.startsWith("content/glosario/")) {
      terminos.push({
        id,
        termino: campo(texto, "termino") || "(sin término)",
        definicion: campo(texto, "definicionCorta"),
        eje: campo(texto, "eje"),
        episodio: campo(texto, "episodioTitulo"),
      });
      continue;
    }

    borradores.push({
      id,
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

if (borradores.length === 0 && terminos.length === 0 && segmentados.length === 0) {
  console.log("No hay borradores nuevos: no se manda aviso.");
  process.exit(0);
}

const hoy = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
}).format(new Date());

// El título dice las dos cosas cuando vienen juntas.
const partes = [];
if (borradores.length)
  partes.push(
    `${borradores.length} ${borradores.length === 1 ? "artículo" : "artículos"}`
  );
if (terminos.length)
  partes.push(
    `${terminos.length} ${terminos.length === 1 ? "término" : "términos"}`
  );
if (segmentados.length)
  partes.push(
    `${segmentados.length} ${
      segmentados.length === 1 ? "transcripción" : "transcripciones"
    } con subtítulos`
  );

const titulo = `${partes.join(" y ")} para revisar (${hoy})`;

// El panel sirve para artículos y glosario. Las secciones no pasan por ahí.
const hayPanel = borradores.length > 0 || terminos.length > 0;

const cuerpo = [
  hayPanel
    ? `Hay **${partes.join("** y **")}** esperando tu revisión. Los artículos y los términos no están online todavía.`
    : `Hay **${partes.join("** y **")}** para que les des una mirada.`,
  "",
  ...(hayPanel ? [`👉 **[Abrir el panel para revisarlos](${PANEL})**`, ""] : []),
  ...(borradores.length
    ? [
        "---",
        "",
        "## Artículos",
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
      ]
    : []),
  ...(terminos.length
    ? [
        "---",
        "",
        "## Glosario",
        "",
        "| Término | Definición | Episodio |",
        "| --- | --- | --- |",
        ...terminos.map(
          (t) =>
            `| **[${t.termino}](https://github.com/${REPO}/blob/main/content/glosario/${t.id}.md)** | ${
              (t.definicion || "—").replace(/\|/g, "\\|")
            } | ${(t.episodio || "—").replace(/\|/g, "\\|")} |`
        ),
        "",
      ]
    : []),
  ...(segmentados.length
    ? [
        "---",
        "",
        "## Subtítulos de transcripciones",
        "",
        "Estos **ya están online**. No hace falta que los apruebes: son solo",
        "renglones que marcan dónde cambia el tema, no tocan una palabra de lo",
        "que dijeron en el episodio (el script lo verifica antes de guardar).",
        "Si alguno no te cierra, decímelo y lo cambio.",
        "",
        ...segmentados.map((s) =>
          [
            `**[${s.id}](https://www.mateyeventos.com/episodios/${s.id})**`,
            ...s.titulos.map((t) => `- ${t}`),
            "",
          ].join("\n")
        ),
      ]
    : []),
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
console.log(
  `Aviso enviado: issue #${issue.number} · ${borradores.length} artículos · ` +
    `${terminos.length} términos · ${segmentados.length} transcripciones.`
);
