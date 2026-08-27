import { SITE } from "./lib/site";
import { getEpisodes } from "./lib/youtube";
import { getArticulos } from "./lib/articulos";
import { cortesDeEje } from "./lib/ejes";
import { getEventos, edicionesImperdibles } from "./lib/agenda";
import { getTerminos } from "./lib/glosario";
import { todosLosCortes } from "./agenda/cortes";

export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();
  const routes = [
    "",
    "/episodios",
    "/articulos",
    "/agenda",
    "/agenda/esta-semana",
    "/agenda/calendario",
    "/agenda/verificado",
    "/agenda/destacado",
    "/agenda/sugerir",
    "/imperdibles",
    "/glosario",
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
      // Esta semana cambia todos los días por definición.
      path === "/agenda/esta-semana"
        ? "daily"
        : path === "/episodios" || path === "/articulos" || path === "/agenda"
          ? "weekly"
          : "monthly",
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

  // Las landings por eje editorial, mismo criterio que las de la agenda.
  let ejes = [];
  try {
    ejes = cortesDeEje().map((c) => ({
      url: `${SITE.url}${c.url}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    ejes = [];
  }

  let evs = [];
  try {
    const eventos = await getEventos();
    evs = eventos.map((e) => ({
      url: `${SITE.url}/agenda/${e.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    evs = [];
  }

  // Una URL por edición mensual de los imperdibles. Se arman solas: cada mes
  // que tenga eventos elegidos pasa a ser una página con su propia dirección.
  let imps = [];
  try {
    const eventos = await getEventos();
    // La primera es la que se publica en /imperdibles, que ya está más arriba
    // en este mismo sitemap: mandar las dos es ofrecerle a Google una copia.
    imps = edicionesImperdibles(eventos).slice(1).map((e) => ({
      url: `${SITE.url}/imperdibles/${e.mes}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    imps = [];
  }

  // Una URL por término del glosario.
  let glo = [];
  try {
    glo = getTerminos().map((t) => ({
      url: `${SITE.url}/glosario/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    glo = [];
  }

  // Las landings de la agenda: una URL por país, tipo, provincia y mes.
  // Se arman solas con los datos, así que el sitemap las sigue sin que nadie
  // tenga que acordarse de agregarlas.
  let cortes = [];
  try {
    const eventos = await getEventos();
    cortes = todosLosCortes(eventos).map((c) => ({
      url: `${SITE.url}${c.url}`,
      lastModified: now,
      // Los cortes por mes envejecen; los de país y tipo no.
      changeFrequency: c.tipo === "mes" ? "daily" : "weekly",
      priority: 0.7,
    }));
  } catch {
    cortes = [];
  }

  return [...base, ...eps, ...arts, ...ejes, ...evs, ...imps, ...glo, ...cortes];
}
