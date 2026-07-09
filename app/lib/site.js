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
  url: "https://mateyeventos.com",
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
};

// Navegación principal.
export const NAV = [
  { href: "/episodios", label: "Episodios" },
  { href: "/sobre", label: "Sobre" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/sponsors", label: "Para marcas" },
  { href: "/contacto", label: "Contacto" },
];

// Cuatro ejes temáticos del podcast (del brief).
export const EJES = [
  {
    n: "01",
    titulo: "Humano",
    texto:
      "Los eventos son experiencias hechas por personas para personas: liderazgo, equipos, presión, decisiones y todo lo que no se ve.",
  },
  {
    n: "02",
    titulo: "Estrategia & Negocio",
    texto:
      "Detrás de cada gran evento hay una estrategia: propuesta de valor, rentabilidad, posicionamiento y cómo vender una idea.",
  },
  {
    n: "03",
    titulo: "Técnico & Producción",
    texto:
      "El sistema invisible que hace posible cada experiencia: logística, timing, coordinación, proveedores y resolución real.",
  },
  {
    n: "04",
    titulo: "Tendencias & Tecnología",
    texto:
      "Hacia dónde va la industria: innovación, IA aplicada, formatos híbridos y experiencias inmersivas con criterio.",
  },
];
