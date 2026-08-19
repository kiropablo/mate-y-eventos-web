// Le pone subtítulos a las transcripciones, sin tocar una sola palabra.
//
// Lee   : content/transcripts/{videoId}.txt
// Escribe: content/transcripts/secciones/{videoId}.json
//
// Por qué en un archivo aparte: la transcripción es la fuente citable del
// episodio, es lo que se dijo textual. Acá NO se guarda texto: se guardan
// posiciones dentro del texto. Aunque el modelo quisiera cambiar una palabra,
// no tiene dónde escribirla.
//
// Y por si eso no alcanzara, antes de guardar se rearma la transcripción
// completa a partir de los cortes y se compara contra la original. Si no
// coincide carácter por carácter, el episodio se descarta.
//
// Se ejecuta desde .github/workflows/secciones.yml.

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
// La misma función que usa la web para dibujar la transcripción. Se importa
// en vez de copiarse: si se verificara con una copia, el día que una de las
// dos cambie la verificación dejaría de verificar lo que se ve en pantalla.
import { armarTranscripcion } from "../app/lib/transcripts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, "..");
const DIR = path.join(RAIZ, "content", "transcripts");
const DIR_SECCIONES = path.join(DIR, "secciones");

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const YT_KEY = process.env.YOUTUBE_API_KEY || "";
const MODELO = process.env.MODELO_IA || "claude-sonnet-5";
const MAX_POR_CORRIDA = Number(process.env.MAX_EPISODIOS || 5);

const INSTRUCCIONES = `Sos el editor de contenidos de Mate y Eventos, un medio audiovisual argentino
especializado en la industria de eventos de Latinoamérica.

Tu tarea: leer la transcripción de un episodio y decir DÓNDE cambia de tema, para poder ponerle
subtítulos. La transcripción viene como un solo bloque de texto corrido, sin cortes.

MUY IMPORTANTE: no reescribís nada. No corregís, no resumís, no mejorás. Solo marcás en qué punto
del texto arranca cada tema y le ponés un título a ese tramo.

CUÁNTOS: entre 3 y 6 secciones. Un episodio de veinte minutos no tiene diez temas distintos.

DÓNDE CORTAR
- Donde la conversación efectivamente pasa a otra cosa, no cada tantas palabras.
- El primer tramo (la presentación, la música, el "bienvenidos a otro episodio") NO lleva corte:
  la primera sección empieza cuando arranca el primer tema de verdad.

LOS TÍTULOS
- Describen lo que se habla en ESE tramo, con las palabras del rubro.
- Cortos: entre 3 y 8 palabras. Español argentino.
- Nada de "Introducción", "Desarrollo", "Primera parte", "Conclusión": eso no le dice nada a nadie.
- Nada de signos de pregunta ni de exclamación.
- Bien: "Qué lleva un rider técnico" · "El contra-rider y el mercado local" · "Cuando el cliente
  pide algo imposible"
- Mal: "Introducción al tema" · "Los entrevistados conversan" · "Reflexiones finales"

FORMATO DE RESPUESTA — exactamente así, sin nada antes ni después:

TITULO: Qué lleva un rider técnico
ARRANCA: entonces el rider tiene tres partes que son
TITULO: El contra-rider y el mercado local
ARRANCA: ahora bien cuando vos recibís ese rider

Reglas del formato:
- ARRANCA es un fragmento COPIADO TEXTUAL de la transcripción, de entre 6 y 12 palabras, que marca
  el punto exacto donde arranca esa sección. Tiene que estar en el texto tal cual, con las mismas
  palabras y en el mismo orden. Copialo, no lo escribas de memoria.
- Los fragmentos van en el mismo orden en que aparecen en la transcripción.
- Elegí fragmentos que aparezcan UNA sola vez en todo el texto.`;

// --------------------------------------------------------------------------

function normalizar(t) {
  return String(t).replace(/\s+/g, " ").trim();
}

async function titulosDeVideos(ids) {
  const mapa = {};
  if (!YT_KEY) return mapa;
  for (let i = 0; i < ids.length; i += 50) {
    try {
      const url =
        `https://www.googleapis.com/youtube/v3/videos` +
        `?part=snippet&id=${ids.slice(i, i + 50).join(",")}&key=${YT_KEY}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      (data.items || []).forEach((it) => {
        if (it.id && it.snippet) mapa[it.id] = it.snippet.title || "";
      });
    } catch {
      // Sin título igual se segmenta.
    }
  }
  return mapa;
}

async function pedirSecciones(titulo, transcripcion) {
  const entrada =
    `TÍTULO DEL EPISODIO: ${titulo || "(sin título)"}\n\n` +
    `TRANSCRIPCIÓN:\n${transcripcion}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 1500,
      system: INSTRUCCIONES,
      messages: [{ role: "user", content: entrada }],
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`Claude HTTP ${res.status}: ${detalle.slice(0, 200)}`);
  }

  const data = await res.json();
  const texto = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!texto) throw new Error("respuesta vacía");
  return texto;
}

// Convierte la respuesta en cortes con su posición real dentro del texto.
//
// Acá se cae todo lo que no encaja: un fragmento que el modelo escribió de
// memoria en vez de copiar, uno que aparece dos veces, o uno que quedaría
// antes del anterior. Preferimos menos cortes que cortes en el lugar
// equivocado.
export function ubicarCortes(respuesta, transcripcion) {
  const plano = normalizar(transcripcion).toLowerCase();

  // Índice de cada carácter del texto normalizado dentro del original, para
  // poder traducir una posición de vuelta.
  const mapa = [];
  let previoEspacio = true;
  for (let i = 0; i < transcripcion.length; i++) {
    const c = transcripcion[i];
    if (/\s/.test(c)) {
      if (!previoEspacio) mapa.push(i);
      previoEspacio = true;
    } else {
      mapa.push(i);
      previoEspacio = false;
    }
  }

  const cortes = [];
  let desdeMin = 0;

  const bloques = respuesta.split(/^TITULO:/m).slice(1);
  for (const bloque of bloques) {
    const lineas = bloque.split("\n");
    const titulo = (lineas.shift() || "").trim();
    const m = bloque.match(/^ARRANCA:[^\S\r\n]*(.*)$/m);
    if (!titulo || !m) continue;

    const ancla = normalizar(m[1]).toLowerCase();
    if (ancla.split(" ").length < 4) continue;

    const donde = plano.indexOf(ancla, desdeMin);
    if (donde === -1) continue;
    // Si aparece más de una vez, no sabemos a cuál se refería.
    if (plano.indexOf(ancla, donde + 1) !== -1) continue;

    const real = mapa[donde];
    if (real === undefined) continue;

    cortes.push({ titulo, desde: real });
    desdeMin = donde + ancla.length;
  }

  return cortes;
}

// La red de seguridad.
//
// Arma la página tal como la va a ver cualquiera que entre al episodio, le
// saca los subtítulos y junta lo que queda. Si eso no es palabra por palabra
// la transcripción original, el episodio se descarta.
export function rearmaIgual(transcripcion, cortes) {
  const bloques = armarTranscripcion(transcripcion, cortes);
  const enPantalla = bloques.flatMap((b) => b.parrafos).join(" ");
  return normalizar(enPantalla) === normalizar(transcripcion);
}

// Cuántos de los cortes propuestos sobrevivieron al armado. Si al correrlos
// al principio de su oración dos cayeron en el mismo lugar, uno se pierde: el
// aviso tiene que contar los que se ven, no los que se pidieron.
export function titulosQueQuedan(transcripcion, cortes) {
  return armarTranscripcion(transcripcion, cortes)
    .map((b) => b.titulo)
    .filter(Boolean);
}

// --------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(DIR_SECCIONES, { recursive: true });

  const transcripciones = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".txt") && f !== "README.txt")
    .map((f) => f.replace(/\.txt$/, ""));

  const pendientes = transcripciones.filter(
    (id) => !fs.existsSync(path.join(DIR_SECCIONES, `${id}.json`))
  );

  console.log(
    `Transcripciones: ${transcripciones.length} · ya segmentadas: ` +
      `${transcripciones.length - pendientes.length} · pendientes: ${pendientes.length}`
  );

  if (pendientes.length === 0) {
    console.log("No hay nada nuevo para segmentar.");
    return;
  }

  const tanda = pendientes.slice(0, MAX_POR_CORRIDA);
  if (tanda.length < pendientes.length) {
    console.log(`Se segmentan ${tanda.length} en esta corrida (tope: ${MAX_POR_CORRIDA}).`);
  }

  const titulos = await titulosDeVideos(tanda);
  let hechos = 0,
    fallados = 0;

  for (const id of tanda) {
    try {
      const transcripcion = fs
        .readFileSync(path.join(DIR, `${id}.txt`), "utf8")
        .trim();

      if (transcripcion.split(/\s+/).length < 500) {
        console.log(`  – ${id} (muy corta para segmentar, se saltea)`);
        fs.writeFileSync(path.join(DIR_SECCIONES, `${id}.json`), "[]\n", "utf8");
        continue;
      }

      const respuesta = await pedirSecciones(titulos[id], transcripcion);
      const cortes = ubicarCortes(respuesta, transcripcion);

      if (cortes.length < 2) {
        console.log(`  · ${id} — no salieron cortes usables (${cortes.length})`);
        fs.writeFileSync(path.join(DIR_SECCIONES, `${id}.json`), "[]\n", "utf8");
        continue;
      }

      if (!rearmaIgual(transcripcion, cortes)) {
        throw new Error("la transcripción no se rearma igual: se descarta");
      }

      fs.writeFileSync(
        path.join(DIR_SECCIONES, `${id}.json`),
        JSON.stringify(cortes, null, 1) + "\n",
        "utf8"
      );
      hechos++;
      const visibles = titulosQueQuedan(transcripcion, cortes);
      console.log(`  ✓ ${id} — ${visibles.length} secciones`);
      visibles.forEach((t) => console.log(`      · ${t}`));
    } catch (e) {
      fallados++;
      console.log(`  ✗ ${id} (${e.message})`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`Listo. Segmentados: ${hechos} · con error: ${fallados}`);
}

// Solo cuando se corre desde la Action, no cuando lo importa el test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!ANTHROPIC_KEY) {
    console.error("Falta ANTHROPIC_API_KEY.");
    process.exit(1);
  }
  await main();
}
