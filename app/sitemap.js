import { SITE } from "./lib/site";
import { getEpisodes } from "./lib/youtube";
import { getArticulos } from "./lib/articulos";

export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();
  const routes = [
    "",
    "/episodios",
    "/articulos",
    "/sobre",
    "/sponsors",
    "/newsletter",
    "/prensa",
    "/contacto",
  ];
  const base = routes.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency:
      path === "/episodios" || path === "/articulos" ? "weekly" : "monthly",
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

  let arts = [];
  try {
    arts = getArticulos().map((a) => ({
      url: `${SITE.url}/articulos/${a.id}`,
      lastModified: a.fecha ? new Date(a.fecha) : now,
      changeFrequency: "monthly",
      // Los artículos son puerta de entrada desde buscadores y asistentes
      // de IA: les damos prioridad alta.
      priority: 0.8,
    }));
  } catch {
    arts = [];
  }

  return [...base, ...eps, ...arts];
}
