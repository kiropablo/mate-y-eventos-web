import { XMLParser } from "fast-xml-parser";
import { LINKS } from "./site";

// Lee el feed del canal de YouTube y devuelve los episodios.
// Se cachea con revalidación (ver `revalidate` en la página), así se
// actualiza solo sin necesidad de reconstruir el sitio.
export async function getEpisodes() {
  try {
    const feedUrl = LINKS.youtubePlaylistId
      ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${LINKS.youtubePlaylistId}`
      : LINKS.ytFeed;
    const res = await fetch(feedUrl, {
      next: { revalidate: 3600 }, // re-lee el feed cada 1 hora
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
