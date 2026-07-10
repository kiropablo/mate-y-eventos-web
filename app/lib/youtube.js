import { XMLParser } from "fast-xml-parser";
import { LINKS } from "./site";

// Lee y parsea un feed Atom de YouTube (canal o playlist).
async function fetchFeed(url) {
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "MateYEventos/1.0 (+https://mateyeventos.com)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const data = parser.parse(xml);

    let entries = data?.feed?.entry;
    if (!entries) return [];
    if (!Array.isArray(entries)) entries = [entries];

    return entries
      .map((e) => {
        const id = e["yt:videoId"];
        const group = e["media:group"] || {};
        const description =
          typeof group["media:description"] === "string"
            ? group["media:description"]
            : "";
        const title =
          (typeof group["media:title"] === "string" && group["media:title"]) ||
          (typeof e.title === "string" && e.title) ||
          "Episodio";
        return {
          id,
          title,
          published: e.published || "",
          description,
          thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${id}`,
        };
      })
      .filter((e) => e.id)
      .sort((a, b) => new Date(b.published) - new Date(a.published));
  } catch {
    return [];
  }
}

// Trae los items de una playlist con la API oficial de YouTube (confiable).
async function fetchPlaylistViaApi(playlistId, key) {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${key}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items || [];
    return items
      .map((it) => {
        const id =
          it.contentDetails?.videoId || it.snippet?.resourceId?.videoId;
        return {
          id,
          title: it.snippet?.title || "Episodio",
          published:
            it.contentDetails?.videoPublishedAt ||
            it.snippet?.publishedAt ||
            "",
          description: it.snippet?.description || "",
          thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${id}`,
        };
      })
      .filter(
        (e) =>
          e.id &&
          e.title !== "Deleted video" &&
          e.title !== "Private video"
      )
      .sort((a, b) => new Date(b.published) - new Date(a.published));
  } catch {
    return [];
  }
}

// Devuelve los episodios, en orden de confiabilidad:
//  1) API oficial de YouTube (si hay YOUTUBE_API_KEY) — Temporada 2, luego 1.
//  2) Feed RSS de las playlists (puede venir vacío desde datacenters).
//  3) Feed del canal completo (para no quedar nunca sin episodios).
export async function getEpisodes() {
  const ids = LINKS.youtubePlaylistIds || [];
  const key = process.env.YOUTUBE_API_KEY;

  if (key) {
    for (const pid of ids) {
      const eps = await fetchPlaylistViaApi(pid, key);
      if (eps.length > 0) return eps;
    }
  }

  for (const pid of ids) {
    const eps = await fetchFeed(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${pid}`
    );
    if (eps.length > 0) return eps;
  }

  return fetchFeed(LINKS.ytFeed);
}

// Busca un episodio puntual por su ID de video.
export async function getEpisodeById(id) {
  const episodes = await getEpisodes();
  return episodes.find((e) => e.id === id) || null;
}

// Fecha legible en español (ej. "12 mar 2025").
export function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
