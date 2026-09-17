// Arma la ficha de cada persona que pasó por un episodio.
//
// Lee   : content/transcripts/{videoId}.txt
// Escribe: content/invitados/{slug}.md          (como BORRADOR, publicado: false)
// Anota : content/invitados/procesados.json     (qué episodios ya se revisaron)
//
// Por qué hace falta el registro de procesados: la mitad de los episodios no
// tienen invitado. Sin registro, esos se volverían a mandar a la IA en cada
// corrida para siempre, igual que pasaba con el glosario.
//
// ---------------------------------------------------------------------------
// LA REGLA QUE ORDENA TODO ESTE ARCHIVO
// ---------------------------------------------------------------------------
// Acá se publica una página sobre una PERSONA REAL, con su nombre. Equivocarse
// no es un dato mal cargado: es decir algo falso de alguien que confió en venir
// a una charla. Entonces:
//
//   · El nombre sale del TÍTULO del video cuando está ("T02E28 | Tema | Fernanda
//     Díaz, artista"). Ese dato lo escribió una persona y es el más confiable
//     que tenemos.
//   · Si el título no lo trae, lo saca de la presentación hablada, y deja
//     anotada LA FRASE EXACTA en "fuente" para que se pueda comprobar de un
//     vistazo antes de aprobar.
//   · Si no lo encuentra con confianza, NO crea la ficha. El episodio queda
//     marcado como revisado y el log dice por qué.
//   · Nunca completa apellido, cargo, empresa ni trayectoria que no se hayan
//     dicho. Un apellido adivinado es una persona distinta.
//   · Nunca escribe mail ni teléfono, ni aunque se digan al aire.
//
// Y nada se publica solo: todo entra como borrador y lo aprueba una persona
// desde /admin, igual que los artículos y el glosario.
//
// Se ejecuta desde .github/workflows/invitados.yml.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, "..");
const DIR_TRANSCRIPTS = path.join(RAIZ, "content", "transcripts");
const DIR_INVITADOS = path.join(RAIZ, "content", "invitados");
const REGISTRO = path.join(DIR_INVITADOS, "procesados.json");

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const YT_KEY = process.env.YOUTUBE_API_KEY || "";
const MODELO = process.env.MODELO_IA || "claude-sonnet-5";
const MAX_POR_CORRIDA = Number(process.env.MAX_EPISODIOS || 5);

if (!ANTHROPIC_KEY) {
  console.error("Falta ANTHROPIC_API_KEY.");
  process.exit(1);
}

// --------------------------------------------------------------------------
// Criterio editorial de las fichas. Si hay que cambiar el estilo o qué entra
// y qué no, se cambia ACÁ y en ningún otro lado.
// --------------------------------------------------------------------------
const INSTRUCCIONES = `Sos el editor de Mate y Eventos, un medio audiovisual argentino sobre la
industria de eventos en Latinoamérica. Te paso la transcripción de un episodio
y tenés que armar la ficha de la persona INVITADA, si la hubo.

QUÉ ES UN INVITADO
Alguien de afuera que vino a la conversación. Los dos conductores —Pablo
Quiroga y Alexis Vidal— NO son invitados: si en el episodio hablan solo ellos
dos, no hay invitado y lo decís.

LO QUE NO PODÉS HACER, NUNCA
- No inventes el apellido. Si al aire dijeron solo "Michel", el nombre es
  "Michel". Un apellido agregado convierte a la ficha en otra persona.
- No inventes cargo, empresa, estudios, premios ni años de trayectoria. Si no
  se dijo en la conversación, no existe para esta ficha.
- No escribas mail ni teléfono aunque se hayan dicho al aire.
- No busques ni supongas redes sociales. Ese campo lo completa una persona.
- Si no estás seguro de quién es el invitado, decí que no lo encontraste. Es
  una respuesta correcta y preferible.

QUÉ ESCRIBÍS
- nombre: como lo nombraron al aire. Sin títulos ("Lic.", "Sr.").
- rol: a qué se dedica, en pocas palabras y tal como lo presentaron.
  Ejemplos: "Mentalista", "Artista y diseñadora", "Percusionista de La Bomba de Tiempo".
- bio: UNA oración de hasta 160 caracteres. Es la que ve Google. Que diga quién
  es y de qué habló, no que sea un elogio.
- cuerpo: dos o tres párrafos, en español rioplatense, voz del medio (no de
  Pablo ni de Alexis). Qué trajo a la conversación y qué dejó dicho que le
  sirva a alguien que trabaja en eventos. Sin relleno motivacional y sin
  adjetivos de prensa ("brillante", "imperdible"). Se puede citar una frase
  suya entre comillas si vale la pena.
- fuente: LA FRASE EXACTA de la transcripción donde se lo presenta o se dice su
  nombre y a qué se dedica. Copiada tal cual, sin retocar. Esto no se publica:
  lo lee quien aprueba, para comprobar que no inventaste nada.

Devolvé JSON y nada más, sin texto alrededor y sin backticks:
{"hayInvitado": true|false,
 "porQueNo": "si hayInvitado es false, en una línea",
 "nombre": "", "rol": "", "bio": "", "cuerpo": "", "fuente": ""}`;

// --------------------------------------------------------------------------

const hoy = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
});

function aSlug(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Escapa para meter un texto adentro de comillas en la cabecera del .md.
// El orden importa: primero las barras, después las comillas.
const comillas = (t) =>
  `"${String(t ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ").trim()}"`;

const lista = (arr) => `[${(arr || []).map(comillas).join(", ")}]`;

// El invitado que viene escrito en el título, si el título usa el formato
// "T02E28 | Tema | Nombre, lo que hace". Es la fuente más confiable que hay:
// lo escribió una persona al subir el video.
function invitadoDelTitulo(titulo) {
  const limpio = String(titulo || "").trim();
  const m = limpio.match(/^\s*(T\s*\d+\s*[-–—.]?\s*E\s*\d+)\s*[|\-–—:]?\s*/i);
  const resto = m ? limpio.slice(m[0].length) : limpio;
  const partes = resto.split("|").map((p) => p.trim()).filter(Boolean);
  if (partes.length > 1) return partes.slice(1).join(" · ");
  const cierre = partes[0]?.match(/\s[-–—]\s*[Cc]on\s+(\S.*)$/);
  return cierre ? cierre[1].trim() : "";
}

// "Fernanda Díaz, artista y diseñadora" → nombre y rol por separado.
function partirInvitado(texto) {
  const t = String(texto || "").trim();
  const coma = t.indexOf(",");
  if (coma > 0) {
    return { nombre: t.slice(0, coma).trim(), rol: t.slice(coma + 1).trim() };
  }
  return { nombre: t, rol: "" };
}

function leerRegistro() {
  try {
    const d = JSON.parse(fs.readFileSync(REGISTRO, "utf8"));
    return new Set(Array.isArray(d?.episodios) ? d.episodios : []);
  } catch {
    return new Set();
  }
}

function guardarRegistro(set) {
  fs.mkdirSync(DIR_INVITADOS, { recursive: true });
  fs.writeFileSync(
    REGISTRO,
    `${JSON.stringify({ episodios: [...set].sort() }, null, 2)}\n`,
    "utf8"
  );
}

// Las fichas que ya existen, con su slug y en qué episodios están. Hace falta
// para dos cosas: no duplicar a alguien que ya tiene ficha, y agregarle el
// episodio nuevo al que vuelve.
function fichasExistentes() {
  const mapa = new Map();
  let archivos = [];
  try {
    archivos = fs.readdirSync(DIR_INVITADOS).filter((f) => f.endsWith(".md"));
  } catch {
    return mapa;
  }
  for (const f of archivos) {
    const crudo = fs.readFileSync(path.join(DIR_INVITADOS, f), "utf8");
    const nombre = crudo.match(/^nombre:\s*"?(.*?)"?\s*$/m)?.[1] || "";
    const eps = crudo.match(/^episodios:\s*\[(.*?)\]\s*$/m)?.[1] || "";
    mapa.set(f.replace(/\.md$/, ""), {
      archivo: f,
      nombre,
      episodios: eps
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, ""))
        .filter(Boolean),
    });
  }
  return mapa;
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
        if (it.id && it.snippet) mapa[it.id] = it.snippet.title || "";
      });
    } catch {
      // Sin título se sigue igual: el nombre lo busca la IA en la charla.
    }
  }
  return mapa;
}

async function pedirFicha(titulo, transcripcion, pistaDelTitulo) {
  const entrada =
    (pistaDelTitulo
      ? `EL TÍTULO DEL VIDEO YA NOMBRA AL INVITADO: "${pistaDelTitulo}".\n` +
        `Usá ese nombre tal cual. No lo completes ni lo corrijas.\n\n`
      : "") +
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
      max_tokens: 4000,
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
    .trim()
    .replace(/^```(?:json)?\s*|\s*```$/g, "");

  return JSON.parse(texto);
}

// Le suma un episodio a una ficha que ya existe, sin tocar nada más. Lo que
// haya editado una persona —las redes, el texto, el rol— se respeta: acá solo
// se agrega en qué otro episodio habló.
function sumarEpisodio(slug, ficha, videoId) {
  if (ficha.episodios.includes(videoId)) return false;
  const ruta = path.join(DIR_INVITADOS, ficha.archivo);
  const crudo = fs.readFileSync(ruta, "utf8");
  const nuevos = [...ficha.episodios, videoId];
  const salida = crudo.replace(
    /^episodios:\s*\[.*?\]\s*$/m,
    `episodios: ${lista(nuevos)}`
  );
  if (salida === crudo) return false;
  fs.writeFileSync(ruta, salida, "utf8");
  return true;
}

function escribirFicha(slug, d, videoId, tituloEpisodio) {
  const cabecera = [
    "---",
    `nombre: ${comillas(d.nombre)}`,
    `rol: ${comillas(d.rol || "")}`,
    `bio: ${comillas(d.bio || "")}`,
    `episodios: ${lista([videoId])}`,
    `episodioTitulo: ${comillas(tituloEpisodio || "")}`,
    // Estos dos los completa una persona desde el panel: no están en ninguna
    // fuente y adivinarlos sería inventar.
    `web: ""`,
    `redes: []`,
    // La foto la sube una persona desde el panel: no hay ninguna fuente de
    // donde sacarla, y agarrar una de internet sería publicar la imagen de
    // alguien sin permiso.
    `foto: false`,
    `fuente: ${comillas(d.fuente || "")}`,
    `generado: ${comillas(hoy)}`,
    `publicado: false`,
    `revisado: ""`,
    "---",
    "",
    String(d.cuerpo || "").trim(),
    "",
  ].join("\n");

  fs.mkdirSync(DIR_INVITADOS, { recursive: true });
  fs.writeFileSync(path.join(DIR_INVITADOS, `${slug}.md`), cabecera, "utf8");
}

// --------------------------------------------------------------------------

const transcripciones = fs
  .readdirSync(DIR_TRANSCRIPTS)
  .filter((f) => f.endsWith(".txt") && f !== "README.txt")
  .map((f) => f.replace(/\.txt$/, ""));

const yaRevisados = leerRegistro();
const pendientes = transcripciones.filter((id) => !yaRevisados.has(id));

console.log(
  `Transcripciones: ${transcripciones.length} · ya revisadas: ` +
    `${transcripciones.length - pendientes.length} · pendientes: ${pendientes.length}`
);

if (pendientes.length === 0) {
  console.log("No hay nada nuevo para revisar.");
  process.exit(0);
}

const tanda = pendientes.slice(0, MAX_POR_CORRIDA);
if (tanda.length < pendientes.length) {
  console.log(`Se revisan ${tanda.length} en esta corrida (tope: ${MAX_POR_CORRIDA}).`);
}

const titulos = await titulosDeVideos(tanda);
const existentes = fichasExistentes();
const yaUsados = new Set(existentes.keys());

let nuevas = 0;
let sumadas = 0;
let sinInvitado = 0;
let errores = 0;

for (const videoId of tanda) {
  const titulo = titulos[videoId] || "";
  try {
    const transcripcion = fs.readFileSync(
      path.join(DIR_TRANSCRIPTS, `${videoId}.txt`),
      "utf8"
    );

    const delTitulo = invitadoDelTitulo(titulo);
    const pista = delTitulo ? partirInvitado(delTitulo).nombre : "";

    const d = await pedirFicha(titulo, transcripcion, pista);

    if (!d?.hayInvitado || !String(d.nombre || "").trim()) {
      sinInvitado++;
      console.log(`    · ${videoId} — sin invitado (${d?.porQueNo || "no se encontró"})`);
      yaRevisados.add(videoId);
      continue;
    }

    // Si el título traía el nombre, ese manda. Lo escribió una persona.
    if (pista) d.nombre = pista;
    if (delTitulo && !d.rol) d.rol = partirInvitado(delTitulo).rol;

    const slug = aSlug(d.nombre);
    if (!slug) {
      errores++;
      console.log(`    ✗ ${videoId} — el nombre no da una dirección usable: "${d.nombre}"`);
      continue;
    }

    if (yaUsados.has(slug)) {
      // Ya tiene ficha: es alguien que volvió. Se le agrega el episodio y no se
      // pisa nada de lo que ya estaba escrito ni de lo que editó una persona.
      const suma = sumarEpisodio(slug, existentes.get(slug), videoId);
      if (suma) sumadas++;
      console.log(
        `    ↻ ${videoId} — ${d.nombre} ya tenía ficha${suma ? ", se le sumó este episodio" : " y ya lo tenía"}`
      );
    } else {
      escribirFicha(slug, d, videoId, titulo);
      yaUsados.add(slug);
      existentes.set(slug, {
        archivo: `${slug}.md`,
        nombre: d.nombre,
        episodios: [videoId],
      });
      nuevas++;
      console.log(`    ✓ ${videoId} — ${d.nombre}${d.rol ? ` (${d.rol})` : ""} → /invitados/${slug}`);
    }

    yaRevisados.add(videoId);
  } catch (e) {
    errores++;
    console.log(`    ✗ ${videoId} (${e.message})`);
  }
}

guardarRegistro(yaRevisados);

console.log(
  `Listo. Fichas nuevas: ${nuevas} · episodios sumados a fichas existentes: ` +
    `${sumadas} · episodios sin invitado: ${sinInvitado} · con error: ${errores}`
);

// Si TODO falló, la corrida tiene que ponerse en rojo. Salir en verde con cero
// resultados es lo que hizo que hoy nadie se enterara de que la API estaba sin
// crédito: el error estaba en el log y la Action decía que todo bien.
if (errores > 0 && nuevas === 0 && sumadas === 0) {
  console.error("Todas las llamadas fallaron. Revisá el log de arriba.");
  process.exit(1);
}
