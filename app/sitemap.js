import { SITE } from "./lib/site";
import { getEpisodes } from "./lib/youtube";

export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();
  const routes = [
    "",
    "/episodios",
    "/sobre",
    "/sponsors",
    "/newsletter",
    "/prensa",
    "/contacto",
  ];
  const base = routes.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: path === "/episodios" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/sponsors" ? 0.9 : 0.7,
  }));

  let eps = [];
  try {
    const episodes = await getEpisodes();
    eps = episodes.map((e) => ({
      url: `${SITE.url}/episodios/${e.id}`,
      lastModified: e.published ? new Date(e.published) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    eps = [];
  }

  return [...base, ...eps];
}
