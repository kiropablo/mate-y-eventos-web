import { SITE } from "./lib/site";

export default function sitemap() {
  const routes = ["", "/episodios", "/sobre", "/sponsors", "/newsletter", "/contacto"];
  const now = new Date();
  return routes.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency: path === "/episodios" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/sponsors" ? 0.9 : 0.7,
  }));
}
