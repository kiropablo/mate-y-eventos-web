// Baja las transcripciones de los episodios (una sola vez cada una) y las
// guarda en content/transcripts/{videoId}.txt
//
// Usa:
//   - YouTube Data API (YOUTUBE_API_KEY) para listar los videos de las playlists
//   - Supadata (SUPADATA_API_KEY) para obtener la transcripción de cada video
//
// Se ejecuta desde GitHub Actions (ver .github/workflows/transcripts.yml).
// Si agregás/cambiás playlists, actualizá PLAYLISTS abajo.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PLAYLISTS = [
  "PL1OwlqOnmols_5yelkJeZOyvGA33fB787", // Temporada 2
  "PL1OwlqOnmoluVg-uiZcydhmojYqvPcmtc", // Temporada 1
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "content", "transcripts");
fs.mkdirSync(OUT, { recursive: true });

const YT_KEY = process.env.YOUTUBE_API_KEY;
const SUPA_KEY = process.env.SUPADATA_API_KEY;
if (!YT_KEY || !SUPA_KEY) {
  console.error("Faltan las variables YOUTUBE_API_KEY y/o SUPADATA_API_KEY.");
  process.exit(1);
}

async function playlistVideoIds(pid) {
  const ids = [];
  let pageToken = "";
  do {
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=contentDetails&maxResults=50&playlistId=${pid}&key=${YT_KEY}` +
      (pageToken ? `&pageToken=${pageToken}` : "");
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  (playlist ${pid}: HTTP ${res.status})`);
      break;
    }
    const data = await res.json();
    (data.items || []).forEach((it) => {
      const vid = it.contentDetails && it.contentDetails.videoId;
      if (vid) ids.push(vid);
    });
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return ids;
}

async function fetchTranscript(id) {
  const url = `https://api.supadata.ai/v1/youtube/transcript?videoId=${id}&lang=es&text=true`;
  const res = await fetch(url, { headers: { "x-api-key": SUPA_KEY } });
  if (!res.ok) throw new Error(`Supadata HTTP ${res.status}`);
  const data = await res.json();
  if (typeof data.content === "string") return data.content;
  if (Array.isArray(data.content))
    return data.content.map((s) => s.text).join(" ");
  if (typeof data.transcript === "string") return data.transcript;
  return "";
}

const ids = [];
for (const pid of PLAYLISTS) {
  const list = await playlistVideoIds(pid);
  list.forEach((id) => {
    if (!ids.includes(id)) ids.push(id);
  });
}
console.log(`Videos encontrados en las playlists: ${ids.length}`);

let added = 0,
  skipped = 0,
  failed = 0;
for (const id of ids) {
  const file = path.join(OUT, `${id}.txt`);
  if (fs.existsSync(file)) {
    skipped++;
    continue;
  }
  try {
    const text = (await fetchTranscript(id)).trim();
    if (text) {
      fs.writeFileSync(file, text + "\n", "utf8");
      added++;
      console.log(`  ✓ ${id}`);
    } else {
      failed++;
      console.log(`  – ${id} (sin transcripción disponible)`);
    }
  } catch (e) {
    failed++;
    console.log(`  ✗ ${id} (${e.message})`);
  }
  await new Promise((r) => setTimeout(r, 400));
}
console.log(
  `Listo. Nuevas: ${added} · ya existían: ${skipped} · sin/errores: ${failed}`
);
