// Cuenta el estado del proyecto y lo escribe solo en el CLAUDE.md.
//
// Por qué existe: la sección "ESTADO Y PENDIENTES" tenía números a mano y
// envejecían sin avisar. El 28/8/2026 decía "2 eventos verificados" cuando
// eran 10, y "41 transcripciones con subtítulos" cuando eran 37 —ese número
// contaba archivos, no archivos con contenido—. Y decía "Al 28/8/2026" al
// lado, que es lo peor: un número viejo con fecha de hoy pegada.
//
// Es la regla 10 del propio CLAUDE.md: si un número se puede contar del
// contenido, se cuenta. Acá se cuenta.
//
// Se ejecuta desde .github/workflows/estado.yml, y también a mano:
//   node scripts/contar-estado.mjs           (escribe)
//   node scripts/contar-estado.mjs --ver     (solo muestra, no toca nada)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, "..");
const CLAUDE_MD = path.join(RAIZ, "CLAUDE.md");

const INICIO = "<!-- CONTADO:INICIO -->";
const FIN = "<!-- CONTADO:FIN -->";

const BASE_ID = "app6q7METE3ofZz1S";
const TABLE_ID = "tblaLHf2VSyyyeN2s";

// --------------------------------------------------------------------------
// Lo que se cuenta del repo

// La cabecera de un .md de content/. No se usa una librería: el formato lo
// escribe este mismo repo y son cuatro campos.
function cabecera(archivo) {
  const s = fs.readFileSync(archivo, "utf8");
  const m = s.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const datos = {};
  for (const linea of m[1].split("\n")) {
    const c = linea.indexOf(":");
    if (c < 0) continue;
    datos[linea.slice(0, c).trim()] = linea
      .slice(c + 1)
      .trim()
      .replace(/^"|"$/g, "");
  }
  return datos;
}

function contarCarpeta(carpeta) {
  const dir = path.join(RAIZ, "content", carpeta);
  if (!fs.existsSync(dir)) return { total: 0, publicados: 0, borradores: 0 };
  const archivos = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  const publicados = archivos.filter(
    (f) => cabecera(path.join(dir, f)).publicado === "true"
  ).length;
  return {
    total: archivos.length,
    publicados,
    borradores: archivos.length - publicados,
  };
}

function contarTranscripciones() {
  const dir = path.join(RAIZ, "content", "transcripts");
  const dirSec = path.join(dir, "secciones");
  const ids = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".txt") && f !== "README.txt")
    .map((f) => f.replace(/\.txt$/, ""));

  // Con subtítulos = el archivo existe Y tiene cortes adentro. Contar
  // archivos era el error viejo: cinco estaban en "[]".
  let conSubtitulos = 0;
  for (const id of ids) {
    try {
      const d = JSON.parse(
        fs.readFileSync(path.join(dirSec, `${id}.json`), "utf8")
      );
      if (Array.isArray(d) && d.length > 0) conSubtitulos++;
    } catch {
      // sin archivo o ilegible: no cuenta
    }
  }

  let sinCortes = 0;
  try {
    sinCortes = Object.keys(
      JSON.parse(fs.readFileSync(path.join(dirSec, "sin-cortes.json"), "utf8"))
    ).length;
  } catch {
    sinCortes = 0;
  }

  return { total: ids.length, conSubtitulos, sinCortes };
}

// --------------------------------------------------------------------------
// Lo que se cuenta de Airtable
//
// Si no hay clave, no se inventa: se devuelve null y las líneas de la agenda
// quedan como estaban. Un número que no se pudo contar no puede aparecer como
// si se hubiera contado.

async function contarAgenda() {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) return null;

  const eventos = [];
  let offset = "";
  try {
    do {
      const params = new URLSearchParams({ pageSize: "100" });
      if (offset) params.set("offset", offset);
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${params}`,
        { headers: { Authorization: `Bearer ${key}` } }
      );
      if (!res.ok) throw new Error(`Airtable respondió ${res.status}`);
      const data = await res.json();
      eventos.push(...(data.records || []));
      offset = data.offset || "";
    } while (offset);
  } catch (e) {
    console.error(`[estado] no se pudo leer la agenda: ${e.message}`);
    return null;
  }

  const campo = (r, n) => r.fields?.[n];
  const aprobados = eventos.filter((r) => campo(r, "Estado") === "Aprobado");

  return {
    total: eventos.length,
    aprobados: aprobados.length,
    sinAprobar: eventos.length - aprobados.length,
    verificados: aprobados.filter((r) => campo(r, "Verificado por el organizador"))
      .length,
    sinFecha: aprobados.filter((r) => !campo(r, "Fecha inicio")).length,
    sinProvincia: aprobados.filter(
      (r) => campo(r, "País") === "Argentina" && !campo(r, "Provincia/Región")
    ).length,
  };
}

// --------------------------------------------------------------------------
// Lo que ya mide el panel (datos.mateyeventos.com)
//
// El panel es otro proyecto, con su propia base en Neon, y ahi adentro estan
// las dos cosas que en este repo estaban escritas a mano: las visitas de
// YouTube y los numeros de Search Console. Su API es publica, asi que se leen
// de ahi en vez de copiarlas cada tanto.
//
// Durante un tiempo este archivo afirmo que Search Console no tenia API
// conectada. Era falso: el 54 clics / 4.396 impresiones que estaba anotado a
// mano coincide exacto con lo que la base tiene para esa semana. O sea que el
// dato ya salia de aca y igual envejecio, que es el caso de la regla 10.
//
// Si el panel no contesta no se inventa nada: esas lineas no se escriben.
const PANEL = "https://datos.mateyeventos.com/api/data";

async function leerPanel() {
  try {
    const res = await fetch(PANEL, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`el panel respondió ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`[estado] no se pudo leer el panel: ${e.message}`);
    return null;
  }
}

// Un número del panel, o null si vino cualquier otra cosa.
//
// Por qué se revisa: lo que sale de acá se escribe adentro del CLAUDE.md, que
// es el archivo que Claude Code carga como instrucciones del proyecto, y el
// bloque se commitea solo a main. Y `.toLocaleString()` sobre un texto
// devuelve el texto tal cual, así que sin este control cualquier cadena que
// contestara el panel entraba entera y nadie la miraba en el camino. El panel
// es otro proyecto, con su propia base y su propio deploy: no es una fuente
// en la que este archivo pueda confiar a ojos cerrados.
//
// Se convierte con Number() en vez de exigir que ya venga número porque hoy
// el panel pasa los BIGINT de Neon a número, pero eso es una decisión de ESE
// repo (`pg.types.setTypeParser` en su `lib/db.mjs`): el día que cambie, un
// "58079" tiene que seguir contando 58079 y no romper la línea. Lo que se
// escribe es siempre el número convertido, nunca el texto que llegó.
const TOPE = 1e9;

function numeroDelPanel(v) {
  if (typeof v !== "number" && typeof v !== "string") return null;
  if (typeof v === "string" && v.trim() === "") return null;
  const n = Number(v);
  // El tope es un control de sensatez, no un límite real: nada de lo que
  // medimos llega a mil millones, y un número más grande que eso es el
  // síntoma de un dato roto, no un récord.
  if (!Number.isFinite(n) || n < 0 || n > TOPE) return null;
  return n;
}

// La ultima semana COMPLETA que tenga datos. Search Console publica con
// dos o tres dias de atraso, asi que tomar "los ultimos 7 dias" da siempre
// una semana coja y el numero sale mas chico de lo que fue.
function semanaSEO(panel) {
  const dias = panel?.seo?.dias;
  if (!Array.isArray(dias) || dias.length < 7) return null;
  const ult = dias.slice(-7);

  let clicks = 0;
  let impresiones = 0;
  for (const d of ult) {
    // Un día sin dato suma 0, como venía siendo. Un día con algo que no es
    // número invalida la semana entera: sumarlo daría un total que no es el
    // que fue, y acá un número equivocado es peor que ningún número.
    const c = !d || typeof d !== "object" ? null : numeroDelPanel(d.clicks ?? 0);
    const i =
      !d || typeof d !== "object" ? null : numeroDelPanel(d.impresiones ?? 0);
    if (c === null || i === null) {
      // Sin el valor adentro: los registros de las Actions son públicos y no
      // se publica algo que escribió otro (regla 20).
      console.error(
        "[estado] el panel devolvió un día de Search Console sin números de verdad: esa línea no se escribe"
      );
      return null;
    }
    clicks += c;
    impresiones += i;
  }

  return { desde: ult[0].dia, hasta: ult[6].dia, clicks, impresiones };
}

// Los dos números de YouTube, o null si alguno vino mal. Van juntos a
// propósito: la línea los nombra a los dos y media línea no se escribe.
function numerosYouTube(panel) {
  const actual = panel?.youtube?.actual;
  if (!actual || typeof actual !== "object") return null; // eso ya se avisa aparte

  const vistas = numeroDelPanel(actual.vistas);
  const seguidores = numeroDelPanel(actual.seguidores);
  // Cero visitas no existe con los episodios que ya están arriba: si llega
  // un 0 es un dato roto, no un dato. Antes lo salteaba el `if (vistas)`.
  if (vistas === null || seguidores === null || vistas === 0) {
    console.error(
      `[estado] el panel no devolvió números de YouTube usables: esa línea no se escribe (llegaron ${typeof actual.vistas} y ${typeof actual.seguidores})`
    );
    return null;
  }
  return { vistas, seguidores };
}

function fechaCorta(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  return `${d}/${m}/${a}`;
}

// --------------------------------------------------------------------------

function hoyBuenosAires() {
  return new Date().toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function armarBloque({ trans, arts, glo, agenda, panel }) {
  const l = [];
  l.push(`Contado solo el ${hoyBuenosAires()}. No editar a mano: lo reescribe`);
  l.push(`\`scripts/contar-estado.mjs\` y se pierde.`);
  l.push("");
  l.push(
    `- **${trans.total} transcripciones**, ${trans.conSubtitulos} con subtítulos` +
      (trans.sinCortes
        ? ` (${trans.sinCortes} no se pudieron cortar; ver \`content/transcripts/secciones/sin-cortes.json\`).`
        : ".")
  );
  l.push(
    arts.borradores
      ? `- **${arts.total} artículos**: ${arts.publicados} publicados y ${arts.borradores} en borrador.`
      : `- **${arts.total} artículos**, todos publicados.`
  );
  l.push(
    `- **${glo.publicados} términos de glosario publicados** de ${glo.total} generados` +
      (glo.borradores ? `: quedan ${glo.borradores} en borrador.` : ".")
  );

  if (agenda) {
    l.push(
      `- **${agenda.aprobados} eventos aprobados** en la agenda y ${agenda.sinAprobar} sin aprobar (borradores IA y archivados).`
    );
    l.push(
      `- **${agenda.verificados} eventos verificados** por su organizador.`
    );
    l.push(
      `- De los aprobados: ${agenda.sinFecha} sin fecha anunciada y ${agenda.sinProvincia} argentinos sin provincia. **No son datos que falten cargar**: son eventos cuya fecha o sede todavía no se anunció, y completarlos sería inventar.`
    );
  } else {
    l.push(
      `- _La agenda no se pudo contar en esta corrida (sin \`AIRTABLE_API_KEY\` o Airtable no contestó)._`
    );
  }

  const seo = semanaSEO(panel);
  if (seo) {
    l.push(
      `- Search Console, semana del ${fechaCorta(seo.desde)} al ${fechaCorta(seo.hasta)}: **${seo.clicks} clics y ${seo.impresiones.toLocaleString("es-AR")} impresiones**. El grueso sigue entrando por fichas de agenda.`
    );
  }
  const yt = numerosYouTube(panel);
  if (yt) {
    l.push(
      `- YouTube: **${yt.vistas.toLocaleString("es-AR")} visitas** y ${yt.seguidores} suscriptores. Ojo: \`STATS.vistasYouTube\` en \`app/lib/site.js\` es un número aparte, escrito a mano, y es el que se publica en la web.`
    );
  }
  if (!seo && !yt) {
    // Mismo camino para "el panel no contestó" y para "el panel contestó
    // cualquier cosa": en los dos casos no hay número y no se inventa uno. El
    // porqué de cada corrida queda en los registros de la Action.
    l.push(
      `- _El panel (datos.mateyeventos.com) no dio números usables en esta corrida: faltan los de Search Console y YouTube._`
    );
  }

  return l.join("\n");
}

async function main() {
  const soloVer = process.argv.includes("--ver");

  const datos = {
    trans: contarTranscripciones(),
    arts: contarCarpeta("articulos"),
    glo: contarCarpeta("glosario"),
    agenda: await contarAgenda(),
    panel: await leerPanel(),
  };

  const bloque = armarBloque(datos);

  if (soloVer) {
    console.log(bloque);
    return;
  }

  const md = fs.readFileSync(CLAUDE_MD, "utf8");
  const i = md.indexOf(INICIO);
  const j = md.indexOf(FIN);
  if (i < 0 || j < 0 || j < i) {
    console.error(
      `Faltan las marcas ${INICIO} / ${FIN} en CLAUDE.md. No se toca nada.`
    );
    process.exit(1);
  }

  const nuevo =
    md.slice(0, i + INICIO.length) + "\n" + bloque + "\n" + md.slice(j);

  if (nuevo === md) {
    console.log("El estado no cambió.");
    return;
  }

  fs.writeFileSync(CLAUDE_MD, nuevo, "utf8");
  console.log("CLAUDE.md actualizado:\n");
  console.log(bloque);
}

await main();
