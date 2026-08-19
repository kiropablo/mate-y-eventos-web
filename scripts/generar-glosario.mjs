// Saca los términos del rubro que aparecen en cada episodio y los deja
// como borradores del glosario.
//
// Lee   : content/transcripts/{videoId}.txt
// Escribe: content/glosario/{slug}.md   (como BORRADOR, publicado: false)
// Anota : content/glosario/procesados.json  (qué episodios ya se revisaron)
//
// La diferencia con los artículos: un episodio da UN artículo, pero puede
// dar cero, dos o cinco términos. Por eso hace falta el registro de
// episodios procesados — si no, un episodio del que no salió ningún término
// se volvería a mandar a la IA en cada corrida, para siempre.
//
// Nunca pisa un término que ya existe. El primer episodio que lo explica se
// lo queda; los demás pasan de largo.
//
// Se ejecuta desde .github/workflows/glosario.yml.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, "..");
const DIR_TRANSCRIPTS = path.join(RAIZ, "content", "transcripts");
const DIR_GLOSARIO = path.join(RAIZ, "content", "glosario");
const REGISTRO = path.join(DIR_GLOSARIO, "procesados.json");

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const YT_KEY = process.env.YOUTUBE_API_KEY || "";

const MODELO = process.env.MODELO_IA || "claude-sonnet-5";
// Cuántos episodios revisa por corrida. En la carga inicial se sube desde
// la Action para procesar todo el archivo de una.
const MAX_POR_CORRIDA = Number(process.env.MAX_EPISODIOS || 5);
// Tope de términos por episodio. Pocos y buenos: el glosario se llena con
// el tiempo, no de golpe.
const MAX_POR_EPISODIO = Number(process.env.MAX_TERMINOS || 4);

if (!ANTHROPIC_KEY) {
  console.error("Falta ANTHROPIC_API_KEY.");
  process.exit(1);
}

// --------------------------------------------------------------------------
// Criterio editorial del glosario. Si hay que cambiar el estilo o qué entra
// y qué no, se cambia ACÁ y en ningún otro lado.
// --------------------------------------------------------------------------
const INSTRUCCIONES = `Sos el editor de contenidos de Mate y Eventos, un medio audiovisual argentino
especializado en la industria de eventos de Latinoamérica, conducido por Pablo Quiroga y Alexis Vidal.

Tu tarea: leer la transcripción de un episodio y sacar los TÉRMINOS DEL RUBRO que aparecen ahí,
para un glosario de la industria de eventos.

QUÉ ENTRA EN EL GLOSARIO
Palabras o expresiones que alguien de afuera del rubro no entendería, y que en el episodio se usan
o se explican. Por ejemplo: rider, backline, dry hire, RFP, brief, montaje, desmontaje, run of show,
hospitality, riggers, truss, catering de producción, vacas gordas/vacas flacas.

QUÉ NO ENTRA — esto es lo más importante:
- Palabras del castellano común que cualquiera entiende ("presupuesto", "cliente", "equipo",
  "reunión", "experiencia"). Si no es jerga, no va.
- Nombres propios: empresas, marcas, eventos, predios, personas, software.
- Conceptos generales de negocios o de management que no son propios de eventos
  ("liderazgo", "rentabilidad", "marketing").
- Términos que se nombran al pasar y que en el episodio NO se usan de forma que se entienda
  qué significan. Si tenés que inventar la definición, ese término NO va.
- Muletillas, modismos generales y expresiones coloquiales que no son del rubro.

ES CORRECTO DEVOLVER CERO TÉRMINOS. La mayoría de los episodios va a dar uno o dos, y muchos
ninguno. Preferimos un glosario chico y bueno antes que uno inflado. No fuerces.

CÓMO ESCRIBIR CADA TÉRMINO

1. La DEFINICIÓN CORTA (una o dos oraciones):
   - Tiene que entenderse SOLA, sin el resto de la página y sin haber escuchado el episodio.
     Alguien que la lee en un buscador o en un asistente de IA tiene que quedar servido.
   - Empezá diciendo qué ES la cosa, no "se refiere a" ni "es un término que".
   - Español argentino, de alguien del rubro explicándoselo a alguien que recién entra.

2. La EXPLICACIÓN (2 a 4 párrafos):
   - Amplía la definición con lo que efectivamente se dijo en el episodio: para qué sirve en la
     práctica, dónde se complica, qué error se comete seguido, cómo se usa de verdad.
   - Podés usar "## Subtítulo" si ayuda, párrafos sueltos, listas con "-" y **negritas**.
   - Escribís como el medio, no como Pablo ni como Alexis.

HONESTIDAD (crítico)
- NO inventes datos, cifras, normas, nombres ni definiciones que no salgan de la transcripción o
  que no sean conocimiento sólido y general del rubro.
- Si la transcripción usa el término pero no da suficiente para explicarlo bien, NO lo incluyas.
- Nada de relleno motivacional ni de frases tipo "en el dinámico mundo de los eventos".

FORMATO DE RESPUESTA — exactamente así, sin nada antes ni después:

---TERMINO---
termino: Rider
alias: rider técnico, technical rider
eje: Técnico & Producción
definicion: El documento donde el artista detalla todo lo que necesita para poder tocar: sonido, luces, backline, camarines y hasta la comida.
---EXPLICACION---
Acá van los párrafos de la explicación.

Puede tener varios párrafos y subtítulos.
---TERMINO---
termino: Otro término
alias:
eje: Estrategia & Negocio
definicion: ...
---EXPLICACION---
...

Reglas del formato:
- "eje" es uno de estos cuatro, el que mejor encaje: Humano · Estrategia & Negocio ·
  Técnico & Producción · Tendencias & Tecnología
- "alias" son otras formas de decir lo mismo, separadas por coma. Si no hay, dejalo vacío.
- Si no hay ningún término que valga la pena, respondé exactamente: SIN TERMINOS`;

// --------------------------------------------------------------------------
// Utilidades
// --------------------------------------------------------------------------

function yaml(texto) {
  return String(texto == null ? "" : texto)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

// Los alias viajan en una lista separada por comas, así que una coma o una
// comilla adentro romperían el formato. Como son etiquetas cortas, no pierden
// nada al limpiarlas.
function limpiarAlias(texto) {
  return String(texto).replace(/["',]/g, " ").replace(/\s+/g, " ").trim();
}

// El slug es a la vez el nombre del archivo y la dirección de la página.
// Tiene que quedar dentro de [a-z0-9-] y entre 2 y 60 caracteres: es lo que
// valida /api/admin/glosario, así que un slug fuera de rango sería un término
// que Pablo no podría guardar nunca desde el panel.
function aSlug(texto) {
  const s = String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    // El corte a 60 puede dejar un guion colgando al final.
    .replace(/-+$/g, "");
  return s.length >= 2 ? s : "";
}

// Los términos que ya están escritos, para no repetirlos.
function terminosExistentes() {
  const lista = [];
  let archivos = [];
  try {
    archivos = fs.readdirSync(DIR_GLOSARIO).filter((f) => f.endsWith(".md"));
  } catch {
    return lista;
  }
  for (const archivo of archivos) {
    try {
      const texto = fs.readFileSync(path.join(DIR_GLOSARIO, archivo), "utf8");
      const m = texto.match(/^termino:\s*(.+)$/m);
      const a = texto.match(/^alias:\s*\[(.*)\]$/m);
      if (m) {
        lista.push({
          slug: archivo.replace(/\.md$/, ""),
          termino: m[1].trim().replace(/^"|"$/g, ""),
          alias: a
            ? a[1]
                .split(",")
                .map((s) => s.trim().replace(/^"|"$/g, ""))
                .filter(Boolean)
            : [],
        });
      }
    } catch {
      // Un archivo roto no frena la corrida.
    }
  }
  return lista;
}

function leerRegistro() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRO, "utf8"));
  } catch {
    return {};
  }
}

function guardarRegistro(reg) {
  fs.mkdirSync(DIR_GLOSARIO, { recursive: true });
  fs.writeFileSync(REGISTRO, JSON.stringify(reg, null, 1) + "\n", "utf8");
}

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
        if (it.id && it.snippet) mapa[it.id] = { titulo: it.snippet.title || "" };
      });
    } catch {
      // Sin título el término se genera igual.
    }
  }
  return mapa;
}

async function pedirTerminos(tituloEpisodio, transcripcion, existentes) {
  const bloqueExistentes = existentes.length
    ? `TÉRMINOS QUE YA ESTÁN EN EL GLOSARIO (no los repitas, ni con otro nombre):\n` +
      existentes
        .map((t) => `- ${t.termino}${t.alias.length ? ` (${t.alias.join(", ")})` : ""}`)
        .join("\n") +
      `\n\n`
    : "";

  const entrada =
    bloqueExistentes +
    `MÁXIMO DE TÉRMINOS PARA ESTE EPISODIO: ${MAX_POR_EPISODIO}\n\n` +
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
      max_tokens: 6000,
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

// Separa la respuesta en términos sueltos.
function parsearRespuesta(texto) {
  if (/^SIN\s+TERMINOS/i.test(texto.trim())) return [];

  const bloques = texto.split("---TERMINO---").slice(1);
  const salida = [];

  for (const bloque of bloques) {
    const [cabecera, ...resto] = bloque.split("---EXPLICACION---");
    if (!resto.length) continue;

    const campo = (nombre) => {
      const m = cabecera.match(new RegExp(`^${nombre}:[^\\S\\r\\n]*(.*)$`, "im"));
      return m ? m[1].trim() : "";
    };

    const termino = campo("termino");
    const definicion = campo("definicion");
    if (!termino || !definicion) continue;

    salida.push({
      termino,
      alias: campo("alias")
        .split(",")
        .map((s) => limpiarAlias(s))
        .filter(Boolean),
      eje: campo("eje"),
      definicion,
      cuerpo: resto.join("---EXPLICACION---").trim(),
    });
  }

  return salida;
}

function armarMarkdown(t, idEpisodio, meta) {
  const frontmatter = [
    "---",
    `termino: "${yaml(t.termino)}"`,
    `alias: [${t.alias.map((a) => `"${yaml(a)}"`).join(", ")}]`,
    `definicionCorta: "${yaml(t.definicion)}"`,
    `episodio: "${idEpisodio}"`,
    `episodioTitulo: "${yaml(meta.titulo || "")}"`,
    // Las transcripciones no traen marcas de tiempo, así que el minuto queda
    // vacío para que lo complete Pablo si quiere.
    `minuto: ""`,
    `eje: "${yaml(t.eje)}"`,
    `relacionados: []`,
    `generado: "${new Date().toISOString().slice(0, 10)}"`,
    "publicado: false",
    "---",
    "",
  ].join("\n");

  return frontmatter + String(t.cuerpo || "").trim() + "\n";
}

// --------------------------------------------------------------------------
// Programa principal
// --------------------------------------------------------------------------

fs.mkdirSync(DIR_GLOSARIO, { recursive: true });

const transcripciones = fs
  .readdirSync(DIR_TRANSCRIPTS)
  .filter((f) => f.endsWith(".txt") && f !== "README.txt")
  .map((f) => f.replace(/\.txt$/, ""));

const registro = leerRegistro();
const pendientes = transcripciones.filter((id) => !registro[id]);

console.log(
  `Transcripciones: ${transcripciones.length} · ya revisadas: ` +
    `${transcripciones.length - pendientes.length} · pendientes: ${pendientes.length}`
);

if (pendientes.length === 0) {
  console.log("No hay episodios nuevos para revisar.");
  process.exit(0);
}

const tanda = pendientes.slice(0, MAX_POR_CORRIDA);
if (tanda.length < pendientes.length) {
  console.log(
    `Se revisan ${tanda.length} en esta corrida (tope: ${MAX_POR_CORRIDA}). ` +
      `El resto sale en la próxima.`
  );
}

const metadatos = await titulosDeVideos(tanda);
const existentes = terminosExistentes();
console.log(`Términos que ya están en el glosario: ${existentes.length}`);

let nuevos = 0,
  episodiosOk = 0,
  fallados = 0;

for (const id of tanda) {
  const meta = metadatos[id] || {};
  try {
    const transcripcion = fs
      .readFileSync(path.join(DIR_TRANSCRIPTS, `${id}.txt`), "utf8")
      .trim();

    if (transcripcion.split(/\s+/).length < 300) {
      console.log(`  – ${id} (transcripción muy corta, se saltea)`);
      registro[id] = new Date().toISOString().slice(0, 10);
      guardarRegistro(registro);
      continue;
    }

    const respuesta = await pedirTerminos(meta.titulo, transcripcion, existentes);
    const terminos = parsearRespuesta(respuesta).slice(0, MAX_POR_EPISODIO);

    if (terminos.length === 0) {
      console.log(`  · ${id} — sin términos nuevos`);
    }

    for (const t of terminos) {
      const slug = aSlug(t.termino);
      if (!slug) continue;

      const destino = path.join(DIR_GLOSARIO, `${slug}.md`);
      if (fs.existsSync(destino)) {
        console.log(`    – "${t.termino}" ya existe, se saltea`);
        continue;
      }

      fs.writeFileSync(destino, armarMarkdown(t, id, meta), "utf8");

      // Pasa a la lista de existentes para que los episodios que siguen en
      // esta misma corrida tampoco lo repitan.
      existentes.push({ slug, termino: t.termino, alias: t.alias });
      nuevos++;
      console.log(`    ✓ ${t.termino} → ${slug}.md`);
    }

    // El episodio queda marcado como revisado aunque no haya dado términos:
    // si no, se volvería a mandar a la IA en cada corrida.
    //
    // Se guarda a disco acá adentro, episodio por episodio, y no al final:
    // si la corrida se corta a la mitad (timeout de la Action, runner que se
    // cae), lo ya revisado queda revisado. Si no, la próxima corrida vuelve a
    // pagarle a la IA todo desde cero.
    registro[id] = new Date().toISOString().slice(0, 10);
    guardarRegistro(registro);
    episodiosOk++;
  } catch (e) {
    fallados++;
    console.log(`  ✗ ${id} (${e.message})`);
  }

  await new Promise((r) => setTimeout(r, 1500));
}

console.log(
  `Listo. Episodios revisados: ${episodiosOk} · términos nuevos: ${nuevos} · con error: ${fallados}`
);
