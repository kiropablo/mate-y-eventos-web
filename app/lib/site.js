// Configuración central del sitio.
// Todos los datos "del mundo real" viven acá, en un solo lugar,
// para no repetirlos en cada página y poder actualizarlos fácil.

export const SITE = {
  name: "Mate y Eventos",
  tagline: "El medio de la industria de eventos en Latinoamérica",
  frase:
    "El podcast que aporta valor a todos aquellos que amamos el mundo de los eventos, siempre con un mate de por medio.",
  descripcion:
    "Mate y Eventos es un medio audiovisual argentino especializado en la industria de eventos de Latinoamérica. Cada semana, conversaciones sobre producción, estrategia, tendencias, tecnología y el lado humano de la industria.",
  descripcionSeo:
    "Podcast argentino sobre la industria de eventos en LATAM. Producción, estrategia, tecnología y el lado humano del rubro. Nuevo episodio cada miércoles.",
  url: "https://www.mateyeventos.com",
  datosUrl: "https://datos.mateyeventos.com",
  email: "mateyeventos@gmail.com",
  autores: ["Pablo Quiroga", "Alexis Vidal"],
};

// Enlaces a plataformas (reales).
export const LINKS = {
  youtube: "https://youtube.com/@mateyeventos",
  spotify: "https://open.spotify.com/show/2KTmfUITGWVnnWyGsZyAJg",
  apple:
    "https://podcasts.apple.com/ar/podcast/mate-y-eventos/id1839929940",
  instagram: "https://instagram.com/mateyeventosok",
  tiktok: "https://www.tiktok.com/@mate.y.eventos",
  linkedin: "https://www.linkedin.com/company/mate-y-eventos/",
  linkedinNewsletter:
    "https://www.linkedin.com/newsletters/mate-y-eventos-7379142939676917760",
  rss: "https://anchor.fm/s/1085a73c4/podcast/rss",
  youtubeChannelId: "UCNvnqboj3KOXtjEwjOuH4cw",
  ytFeed:
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCNvnqboj3KOXtjEwjOuH4cw",
  // Orden de prioridad: muestra la 1ra playlist que responda.
  // Temporada 2 primero; si no, Temporada 1; si no, el canal (fallback).
  youtubePlaylistIds: [
    "PL1OwlqOnmols_5yelkJeZOyvGA33fB787", // Temporada 2 (prioridad)
    "PL1OwlqOnmoluVg-uiZcydhmojYqvPcmtc", // Temporada 1 (fallback)
  ],
  pressDrive:
    "https://drive.google.com/drive/folders/1tMclvGZe9qtGz9xjnWGcNbHfZAmQFiia?usp=sharing",
  pressPhotos:
    "https://drive.google.com/drive/folders/1N80cWb66co3PDHsFQCoxW1oKV_A1AlJ3?usp=sharing",
};

// Navegación principal.
export const NAV = [
  { href: "/episodios", label: "Episodios" },
  { href: "/articulos", label: "Artículos" },
  { href: "/agenda", label: "Agenda" },
  { href: "/glosario", label: "Glosario" },
  { href: "/sobre", label: "Quiénes somos" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/sponsors", label: "Para marcas" },
  { href: "/prensa", label: "Prensa" },
  { href: "/contacto", label: "Contacto" },
];

// Cuatro ejes temáticos del podcast (del brief).
// Quiénes firman.
//
// Hasta ahora los artículos los firmaba la Organización y las únicas personas
// del sitio eran dos nombres sueltos adentro de "founder": sin cargo, sin
// descripción y sin identidad propia. Para una máquina, las biografías de
// /sobre no existían. En temas donde la experiencia decide —cuánto cobrar por
// un evento, cómo elegir un proveedor— la autoría verificable es de lo que más
// pesa a la hora de elegir a quién citar.
//
// El campo "perfil" queda vacío a propósito: es el link al LinkedIn personal
// de cada uno y no se inventa. Cuando estén, se completan acá y el schema los
// declara solo como sameAs.
export const AUTORES = [
  {
    id: "pablo-quiroga",
    nombre: "Pablo Quiroga",
    rol: "Co-conductor · Visión editorial",
    cargo: "Productor de eventos y co-conductor",
    bio: "Productor con más de 18 años en la industria de eventos. Empezó como productor técnico en shows masivos y hoy trabaja en el sector corporativo. En Mate y Eventos lleva la visión editorial y estratégica.",
    perfil: "",
  },
  {
    id: "alexis-vidal",
    nombre: "Alexis Vidal",
    rol: "Co-conductor · Producción",
    cargo: "Productor de eventos y co-conductor",
    bio: "Productor y creativo, especializado en la operación real de los eventos, donde la creatividad y la técnica conviven todo el tiempo. En Mate y Eventos lleva la producción.",
    perfil: "",
  },
];

// Una fecha ISO en castellano: "21 de agosto de 2026". Se usa donde se
// publica un dato con su corte, que es en todos lados donde se publica un dato.
export function fechaCorta(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, d)));
}

// Los cuatro ejes editoriales.
//
// "frase" es cómo se nombra el eje cuando va adentro de una oración o de un
// título: bajar "Humano" a minúscula da "artículos de humano en eventos", que
// no lo escribiría nadie y no lo busca nadie. La frase está escrita como se
// busca, que es para lo que sirve la landing.
export const EJES = [
  {
    n: "01",
    titulo: "Humano",
    frase: "liderazgo y equipos en eventos",
    texto:
      "Los eventos son experiencias hechas por personas para personas: liderazgo, equipos, presión, decisiones y todo lo que no se ve.",
  },
  {
    n: "02",
    titulo: "Estrategia & Negocio",
    frase: "estrategia y negocio de eventos",
    texto:
      "Detrás de cada gran evento hay una estrategia: propuesta de valor, rentabilidad, posicionamiento y cómo vender una idea.",
  },
  {
    n: "03",
    titulo: "Técnico & Producción",
    frase: "producción técnica de eventos",
    texto:
      "El sistema invisible que hace posible cada experiencia: logística, timing, coordinación, proveedores y resolución real.",
  },
  {
    n: "04",
    titulo: "Tendencias & Tecnología",
    frase: "tecnología y tendencias en eventos",
    texto:
      "Hacia dónde va la industria: innovación, IA aplicada, formatos híbridos y experiencias inmersivas con criterio.",
  },
];
// Métricas de alcance (home y /sponsors).
//
// Las vistas de YouTube salen en vivo de la API del canal; el número de acá
// es solo el respaldo por si la API no contesta.
//
// El crecimiento y los países siguen cargados a mano porque no hay de dónde
// sacarlos gratis. Por eso llevan fecha de corte a la vista: un dato viejo
// con cartel de "actualizado" es peor que un dato viejo con su fecha.
// Los números que se muestran en la home y en /sponsors.
//
// Están CONGELADOS a propósito: antes las vistas salían en vivo de la API de
// YouTube y se movían solas. Se pasó a número fijo por decisión de Pablo, en
// agosto de 2026, hasta nuevo aviso.
//
// El valor de abajo es el que la API devolvía el día que se congeló, no uno
// viejo: congelar hacia atrás habría sido mostrar menos de lo que el canal
// tiene. Para actualizarlos, se cambian acá y se cambia la fecha.
export const STATS = {
  vistasYouTube: 46287,
  crecimientoMensual: 5,
  paises: 17,
  // Cuándo se actualizaron a mano. Es la fecha que se publica al pie.
  actualizado: "2026-08-21",
};
