// Genera un artículo de análisis por cada episodio, a partir de su transcripción.
//
// Lee   : content/transcripts/{videoId}.txt
// Escribe: content/articulos/{videoId}.md   (como BORRADOR, publicado: false)
//
// Cada artículo incluye un bloque de PREGUNTAS FRECUENTES pensado para AI SEO:
// preguntas reales de la industria, con respuestas que se entienden solas.
// El script lee las preguntas ya usadas en artículos anteriores para no repetirlas.
//
// Usa:
//   - Claude API (ANTHROPIC_API_KEY) para escribir el artículo
//   - YouTube Data API (YOUTUBE_API_KEY) para saber el título de cada episodio
//
// Se ejecuta desde GitHub Actions (ver .github/workflows/articulos.yml).
// Nunca reescribe un artículo que ya existe: si querés regenerar uno,
// borrá el .md correspondiente y volvé a correr la Action.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, "..");
const DIR_TRANSCRIPTS = path.join(RAIZ, "content", "transcripts");
const DIR_ARTICULOS = path.join(RAIZ, "content", "articulos");

fs.mkdirSync(DIR_ARTICULOS, { recursive: true });

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const YT_KEY = process.env.YOUTUBE_API_KEY || "";

// Modelo y tope de artículos por corrida (se pueden cambiar desde la Action).
const MODELO = process.env.MODELO_IA || "claude-sonnet-5";
const MAX_POR_CORRIDA = Number(process.env.MAX_ARTICULOS || 40);

if (!ANTHROPIC_KEY) {
  console.error("Falta la variable ANTHROPIC_API_KEY.");
  process.exit(1);
}

// --------------------------------------------------------------------------
// Instrucciones editoriales. Acá vive la voz de Mate y Eventos.
// Si querés cambiar el estilo de los artículos, se cambia ACÁ y nada más.
// --------------------------------------------------------------------------
const INSTRUCCIONES = `Sos el editor de contenidos de Mate y Eventos, un medio audiovisual argentino
especializado en la industria de eventos de Latinoamérica, conducido por Pablo Quiroga y Alexis Vidal.

Tu tarea: a partir de la transcripción de un episodio del podcast, escribir un ARTÍCULO DE ANÁLISIS
para el sitio web, más un bloque de preguntas frecuentes.

REGLA MÁS IMPORTANTE: el artículo NO es un resumen del episodio.
Es una pieza que AMPLÍA. Toma los 3 o 4 conceptos más fuertes de la conversación y los desarrolla
con contexto, marco conceptual y aplicación práctica. Alguien que ya escuchó el episodio tiene que
querer leerlo igual, porque encuentra algo que en el audio no estaba ordenado así.

VOZ Y TONO
- Español argentino (voseo), profesional pero cercano y conversacional.
- Directo, claro, sin tecnicismos innecesarios y sin relleno motivacional.
- Escribís como el medio, no como si fueras Pablo o Alexis. Podés citarlos o referenciar lo que
  plantean en el episodio, pero con moderación: como mucho dos menciones en todo el texto.
- Nada de "en este episodio hablamos de..." repetido. Nada de frases vacías tipo
  "en el dinámico mundo de los eventos".

HONESTIDAD (crítico)
- NO inventes datos, cifras, porcentajes, fechas, nombres de empresas, marcas, eventos ni personas
  que no estén en la transcripción.
- Si un concepto necesita contexto general de la industria, podés aportarlo, pero solo si es
  conocimiento sólido y general. Ante la duda, no lo pongas.
- Si la transcripción es pobre o el audio quedó mal transcripto, escribí igual pero más corto,
  y no rellenes con invenciones.

ESTRUCTURA DEL CUERPO
- Extensión objetivo: entre 1100 y 1300 palabras.
- 3 o 4 secciones con subtítulo (##). Los subtítulos son afirmaciones concretas, no etiquetas
  genéricas: "El presupuesto se define antes del concepto, no después" y no "Presupuesto".
- Párrafos cortos (2 a 4 oraciones).
- Incluí EXACTAMENTE UN bloque práctico usando esta marca especial, ubicado en el lugar donde más
  sirva (normalmente cerca del final):

:::checklist Título breve del bloque
- Punto accionable uno
- Punto accionable dos
- Punto accionable tres
- Punto accionable cuatro
:::

  Los puntos del checklist son accionables y específicos del tema, no consejos genéricos.
  Entre 4 y 6 puntos.
- Cerrá con un párrafo que deje una idea, no con un resumen de lo que ya dijiste.
- No pongas un título H1 en el cuerpo (el título va aparte).
- No uses negritas decorativas cada dos líneas. Como mucho, tres usos de negrita en todo el texto.

PREGUNTAS FRECUENTES (muy importante: esto se usa para que los buscadores y los asistentes de IA
citen a Mate y Eventos como fuente)
- Escribí entre 5 y 7 preguntas con su respuesta.
- Las preguntas son las que una persona real escribiría en Google o le preguntaría a un asistente
  de IA. Naturales y completas, ejemplos del tipo:
  "¿Cómo conseguir trabajo en la industria de eventos sin experiencia previa?",
  "¿Cuánto tiempo antes hay que empezar a producir un evento corporativo?",
  "¿Qué diferencia hay entre un productor y un coordinador de eventos?".
- Mezclá dos tipos: preguntas amplias de la industria que este episodio permite responder con
  autoridad, y preguntas más específicas que se desprenden del tema del artículo.
- CADA RESPUESTA SE TIENE QUE ENTENDER SOLA, sin haber leído el artículo. Nada de
  "como vimos antes" ni "en este episodio". Primera oración: la respuesta directa y concreta.
  Después, el matiz o el ejemplo.
- Largo de cada respuesta: entre 50 y 90 palabras.
- No repitas preguntas que ya estén en la lista de PREGUNTAS YA USADAS que te paso, ni versiones
  apenas reformuladas de esas. Si el tema se superpone, buscá un ángulo distinto.

EJES TEMÁTICOS (elegí el que mejor encaje, uno solo, texto exacto):
"Humano" · "Estrategia & Negocio" · "Técnico & Producción" · "Tendencias & Tecnología"

FORMATO DE SALIDA (respetalo exactamente, sin agregar nada antes ni después,
sin bloques de código, sin comentarios)

TITULO: título del artículo, 45 a 70 caracteres, concreto y con gancho, que NO repita el título del episodio
BAJADA: una o dos oraciones con la promesa del artículo, 140 a 220 caracteres
META: descripción para Google, 140 a 158 caracteres, con la palabra clave principal
EJE: uno de los cuatro ejes
ETIQUETAS: tres a cinco etiquetas cortas en minúscula separadas por comas

---CUERPO---
(el artículo completo en Markdown, con los ## y el bloque :::checklist)

---PREGUNTAS---
P: ¿primera pregunta?
R: primera respuesta

P: ¿segunda pregunta?
R: segunda respuesta`;

// --------------------------------------------------------------------------
// Utilidades
// --------------------------------------------------------------------------

// Escapa un texto para meterlo entre comillas en el frontmatter YAML.
function yaml(texto) {
  return String(texto == null ? "" : texto)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

// Junta todas las preguntas ya usadas en artículos anteriores,
// para pedirle a la IA que no las repita.
function preguntasYaUsadas() {
  const lista = [];
  for (const archivo of fs.readdirSync(DIR_ARTICULOS)) {
    if (!archivo.endsWith(".md")) continue;
    const texto = fs.readFileSync(path.join(DIR_ARTICULOS, archivo), "utf8");
    for (const linea of texto.split("\n")) {
      if (linea.startsWith("### ")) lista.push(linea.slice(4).trim());
    }
  }
  return lista;
}

// Trae los títulos de los videos desde la API de YouTube (de a 50).
async function titulosDeVideos(ids) {
  const mapa = {};
  if (!YT_KEY) return mapa;
  for (let i = 0; i < ids.length; i += 50) {
    const lote = ids.slice(i, i + 50);
    try {
      const url =
        `https://www.googleapis.com/youtube/v3/videos` +
        `?part=snippet&id=${lote.join(",")}&key=${YT_KEY}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      (data.items || []).forEach((it) => {
        if (it.id && it.snippet) {
          mapa[it.id] = {
            titulo: it.snippet.title || "",
            fecha: (it.snippet.publishedAt || "").slice(0, 10),
          };
        }
      });
    } catch {
      // Si falla, seguimos sin títulos: el artículo se genera igual.
    }
  }
  return mapa;
}

// Llama a la API de Claude y devuelve el texto de la respuesta.
async function pedirArticulo(tituloEpisodio, transcripcion, usadas) {
  const bloqueUsadas = usadas.length
    ? `PREGUNTAS YA USADAS EN OTROS ARTÍCULOS (no las repitas):\n` +
      usadas.map((p) => `- ${p}`).join("\n") +
      `\n\n`
    : "";

  const entrada =
    bloqueUsadas +
    `TÍTULO DEL EPISODIO: ${tituloEpisodio || "(sin título)"}\n\n` +
    `TRANSCRIPCIÓN DEL EPISODIO:\n${transcripcion}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 8000,
      system: INSTRUCCIONES,
      messages: [{ role: "user", content: entrada }],
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`Claude HTTP ${res.status}: ${detalle.slice(0, 200)}`);
  }

  const data = await res.json();

  if (data.stop_reason === "max_tokens") {
    throw new Error("la respuesta quedó cortada (subir max_tokens)");
  }

  const texto = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!texto) throw new Error("respuesta vacía");
  return texto;
}

// Separa la respuesta en sus tres partes: cabecera, cuerpo y preguntas.
function parsearRespuesta(texto) {
  const [cabeceraYresto, ...restoCuerpo] = texto.split("---CUERPO---");
  if (!restoCuerpo.length) throw new Error("no vino el separador ---CUERPO---");

  const [cuerpoCrudo, ...restoPreg] = restoCuerpo.join("---CUERPO---").split(
    "---PREGUNTAS---"
  );
  if (!restoPreg.length) throw new Error("no vino el separador ---PREGUNTAS---");

  const campo = (nombre) => {
    const m = cabeceraYresto.match(new RegExp(`^${nombre}:\\s*(.+)$`, "im"));
    return m ? m[1].trim() : "";
  };

  // Preguntas: pares "P: ..." / "R: ..."
  const preguntas = [];
  let actual = null;
  for (const linea of restoPreg.join("\n").split("\n")) {
    const p = linea.match(/^\s*P:\s*(.+)$/i);
    const r = linea.match(/^\s*R:\s*(.+)$/i);
    if (p) {
      if (actual && actual.pregunta && actual.respuesta) preguntas.push(actual);
      actual = { pregunta: p[1].trim(), respuesta: "" };
    } else if (r && actual) {
      actual.respuesta = r[1].trim();
    } else if (actual && actual.respuesta && linea.trim()) {
      actual.respuesta += " " + linea.trim();
    }
  }
  if (actual && actual.pregunta && actual.respuesta) preguntas.push(actual);

  return {
    titulo: campo("TITULO"),
    bajada: campo("BAJADA"),
    metaDescripcion: campo("META"),
    eje: campo("EJE"),
    etiquetas: campo("ETIQUETAS")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    cuerpo: cuerpoCrudo.trim(),
    preguntas,
  };
}

// Arma el archivo .md final con su frontmatter.
function armarMarkdown(art, id, meta) {
  const palabras = String(art.cuerpo || "").split(/\s+/).filter(Boolean).length;
  const lectura = Math.max(3, Math.round(palabras / 200));

  const frontmatter = [
    "---",
    `titulo: "${yaml(art.titulo)}"`,
    `bajada: "${yaml(art.bajada)}"`,
    `metaDescripcion: "${yaml(art.metaDescripcion)}"`,
    `episodio: "${id}"`,
    `episodioTitulo: "${yaml(meta.titulo || "")}"`,
    `fecha: "${meta.fecha || new Date().toISOString().slice(0, 10)}"`,
    `eje: "${yaml(art.eje)}"`,
    `etiquetas: [${art.etiquetas.map((t) => `"${yaml(t)}"`).join(", ")}]`,
    `lectura: ${lectura}`,
    `generado: "${new Date().toISOString().slice(0, 10)}"`,
    "publicado: false",
    "---",
    "",
  ].join("\n");

  const faq = art.preguntas.length
    ? "\n\n## Preguntas frecuentes\n\n" +
      art.preguntas
        .map((q) => `### ${q.pregunta}\n\n${q.respuesta}`)
        .join("\n\n")
    : "";

  return frontmatter + art.cuerpo.trim() + faq + "\n";
}

// --------------------------------------------------------------------------
// Programa principal
// --------------------------------------------------------------------------

const transcripciones = fs
  .readdirSync(DIR_TRANSCRIPTS)
  .filter((f) => f.endsWith(".txt") && f !== "README.txt")
  .map((f) => f.replace(/\.txt$/, ""));

const pendientes = transcripciones.filter(
  (id) => !fs.existsSync(path.join(DIR_ARTICULOS, `${id}.md`))
);

console.log(
  `Transcripciones: ${transcripciones.length} · ya tienen artículo: ` +
    `${transcripciones.length - pendientes.length} · pendientes: ${pendientes.length}`
);

if (pendientes.length === 0) {
  console.log("No hay nada nuevo para escribir.");
  process.exit(0);
}

const tanda = pendientes.slice(0, MAX_POR_CORRIDA);
if (tanda.length < pendientes.length) {
  console.log(
    `Se procesan ${tanda.length} en esta corrida (tope: ${MAX_POR_CORRIDA}). ` +
      `El resto sale en la próxima.`
  );
}

const metadatos = await titulosDeVideos(tanda);
const usadas = preguntasYaUsadas();
console.log(`Preguntas ya usadas en artículos anteriores: ${usadas.length}`);

let hechos = 0,
  fallados = 0;

for (const id of tanda) {
  const meta = metadatos[id] || {};
  try {
    const transcripcion = fs
      .readFileSync(path.join(DIR_TRANSCRIPTS, `${id}.txt`), "utf8")
      .trim();

    if (transcripcion.split(/\s+/).length < 300) {
      console.log(`  – ${id} (transcripción muy corta, se saltea)`);
      continue;
    }

    const respuesta = await pedirArticulo(meta.titulo, transcripcion, usadas);
    const art = parsearRespuesta(respuesta);

    if (!art.titulo || !art.cuerpo) throw new Error("faltan título o cuerpo");

    fs.writeFileSync(
      path.join(DIR_ARTICULOS, `${id}.md`),
      armarMarkdown(art, id, meta),
      "utf8"
    );

    // Las preguntas de este artículo pasan a la lista de usadas,
    // así los siguientes de la misma corrida tampoco las repiten.
    art.preguntas.forEach((q) => usadas.push(q.pregunta));

    hechos++;
    console.log(`  ✓ ${id} — ${art.titulo} (${art.preguntas.length} preguntas)`);
  } catch (e) {
    fallados++;
    console.log(`  ✗ ${id} (${e.message})`);
  }

  await new Promise((r) => setTimeout(r, 1500));
}

console.log(`Listo. Artículos nuevos: ${hechos} · con error: ${fallados}`);
