// Avisa si subiste un episodio y te olvidaste de agregarlo a la playlist.
//
// Por qué existe: es la regla número 1 del CLAUDE.md, la primera de las
// "aprendidas a los golpes", y aun así volvió a pasar. El 17/9/2026 T02E27 y
// T02E28 estaban en YouTube y en Spotify hacía días, y no aparecían en la web:
// no estaban en la playlist de Temporada 2. La web y todos los scripts leen las
// PLAYLISTS, no el canal. Un video que no está en ninguna no existe para el
// sitio, no se le baja transcripción, no se le escribe artículo y no da ningún
// error. Simplemente no pasa nada.
//
// Este script convierte ese silencio en un issue de GitHub, que llega por mail.
//
// Lo que mira: los videos del canal cuyo título tiene código de episodio
// (T##E##). Ese código es lo que separa un episodio de un clip: el canal está
// lleno de recortes verticales —"Lo genérico no suma | Michel"— que NO van a
// la playlist y no tienen por qué. Sin ese filtro, el aviso llegaría todos los
// días con quince clips y en una semana nadie lo leería más.
//
// Se ejecuta desde .github/workflows/transcripts.yml, antes de bajar nada.

const YT_KEY = process.env.YOUTUBE_API_KEY;
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY || "";
const AVISAR_A = process.env.AVISAR_A || REPO.split("/")[0] || "";
const CANAL = process.env.YT_CANAL || "UCNvnqboj3KOXtjEwjOuH4cw";
const PLAYLISTS = (
  process.env.YT_PLAYLISTS ||
  "PL1OwlqOnmols_5yelkJeZOyvGA33fB787,PL1OwlqOnmoluVg-uiZcydhmojYqvPcmtc"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Cuántos videos del canal se miran hacia atrás. Alcanza de sobra para un
// chequeo diario, y evita paginar el canal entero todos los días.
const CUANTOS = Number(process.env.CUANTOS || 50);

// El código de episodio, en las formas en que aparece según la temporada.
const CODIGO = /\bT\s*\d+\s*[-–—.]?\s*E\s*\d+\b/i;

if (!YT_KEY) {
  console.log("Sin YOUTUBE_API_KEY: no se puede comparar. No se avisa nada.");
  process.exit(0);
}

async function json(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube respondió ${res.status}`);
  return res.json();
}

// Los videos de una playlist. Devuelve un Set de ids.
async function idsDePlaylist(id) {
  const ids = new Set();
  let pagina = "";
  do {
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=contentDetails&maxResults=50&playlistId=${id}&key=${YT_KEY}` +
      (pagina ? `&pageToken=${pagina}` : "");
    const d = await json(url);
    (d.items || []).forEach((it) => {
      const v = it.contentDetails?.videoId;
      if (v) ids.add(v);
    });
    pagina = d.nextPageToken || "";
  } while (pagina);
  return ids;
}

// Los últimos videos del canal, con su título y su fecha.
async function ultimosDelCanal() {
  const canal = await json(
    `https://www.googleapis.com/youtube/v3/channels` +
      `?part=contentDetails&id=${CANAL}&key=${YT_KEY}`
  );
  const subidas = canal.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!subidas) throw new Error("el canal no devolvió su lista de subidas");

  const videos = [];
  let pagina = "";
  do {
    const d = await json(
      `https://www.googleapis.com/youtube/v3/playlistItems` +
        `?part=snippet&maxResults=50&playlistId=${subidas}&key=${YT_KEY}` +
        (pagina ? `&pageToken=${pagina}` : "")
    );
    (d.items || []).forEach((it) => {
      const s = it.snippet;
      if (!s?.resourceId?.videoId) return;
      videos.push({
        id: s.resourceId.videoId,
        titulo: s.title || "",
        fecha: (s.publishedAt || "").slice(0, 10),
      });
    });
    pagina = videos.length < CUANTOS ? d.nextPageToken || "" : "";
  } while (pagina);
  return videos.slice(0, CUANTOS);
}

let huerfanos = [];
try {
  const enPlaylists = new Set();
  for (const p of PLAYLISTS) {
    for (const id of await idsDePlaylist(p)) enPlaylists.add(id);
  }
  if (enPlaylists.size === 0) {
    // Sin esto, una lectura fallada de las playlists haría que TODOS los
    // episodios del canal parezcan huérfanos y el issue llegue con cuarenta.
    console.log("Las playlists vinieron vacías: no se avisa nada.");
    process.exit(0);
  }

  const canal = await ultimosDelCanal();
  huerfanos = canal.filter(
    (v) => CODIGO.test(v.titulo) && !enPlaylists.has(v.id)
  );

  console.log(
    `Canal: ${canal.length} videos mirados · en playlists: ${enPlaylists.size} · ` +
      `episodios fuera de playlist: ${huerfanos.length}`
  );
} catch (e) {
  // Que esto falle no puede voltear la cadena de contenido: es un chequeo.
  console.log(`No se pudo comparar (${e.message}). No se avisa nada.`);
  process.exit(0);
}

if (huerfanos.length === 0) {
  console.log("Todos los episodios del canal están en su playlist.");
  process.exit(0);
}

for (const v of huerfanos) {
  console.log(`  ⚠ ${v.fecha}  ${v.id}  ${v.titulo}`);
}

if (!TOKEN || !REPO) {
  console.log("Sin datos de GitHub: no se manda el aviso.");
  process.exit(0);
}

// Un issue abierto por lo mismo ya alcanza: si esto avisara todos los días
// mientras el video sigue afuera, en una semana serían siete issues iguales y
// el octavo no lo leería nadie.
const abiertos = await fetch(
  `https://api.github.com/repos/${REPO}/issues?state=open&labels=playlist&per_page=5`,
  {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  }
).then((r) => (r.ok ? r.json() : []));

if (Array.isArray(abiertos) && abiertos.length > 0) {
  console.log(
    `Ya hay un issue abierto por esto (#${abiertos[0].number}). No se manda otro.`
  );
  process.exit(0);
}

const plural = huerfanos.length === 1;
const titulo = plural
  ? `⚠ ${huerfanos[0].titulo.slice(0, 60)} no está en la playlist`
  : `⚠ ${huerfanos.length} episodios no están en su playlist`;

const cuerpo = [
  plural
    ? "Hay **un episodio en el canal que no está en ninguna playlist**."
    : `Hay **${huerfanos.length} episodios en el canal que no están en ninguna playlist**.`,
  "",
  "La web y todos los scripts leen las **playlists**, no el canal. Mientras",
  plural ? "esté" : "estén",
  "afuera:",
  "",
  "- no aparece en /episodios",
  "- no se le baja la transcripción",
  "- no se le escribe el artículo ni se le sacan términos del glosario",
  "- no se le arma la ficha del invitado",
  "",
  "Y no da ningún error: simplemente no pasa nada. Por eso este aviso.",
  "",
  "| Episodio | Subido | Video |",
  "| --- | --- | --- |",
  ...huerfanos.map(
    (v) =>
      `| ${v.titulo.replace(/\|/g, "\\|")} | ${v.fecha} | [${v.id}](https://www.youtube.com/watch?v=${v.id}) |`
  ),
  "",
  "---",
  "",
  "**Cómo se arregla:** agregalos a la playlist de su temporada en YouTube.",
  "Después, en la pestaña Actions de este repositorio, corré **Transcripciones**:",
  "sola encadena Artículos, Glosario, Invitados y Secciones. No hace falta",
  "esperar a las 9 de la mañana.",
  "",
  "Cuando estén adentro, cerrá este issue.",
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
    labels: ["playlist"],
    ...(AVISAR_A ? { assignees: [AVISAR_A] } : {}),
  }),
});

if (!res.ok) {
  console.log(`No se pudo abrir el issue (${res.status}).`);
  process.exit(0);
}

const issue = await res.json();
console.log(`Aviso enviado: issue #${issue.number}.`);
