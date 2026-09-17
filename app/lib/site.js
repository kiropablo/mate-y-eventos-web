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
  // La productora que dirigen los dos. No es Mate y Eventos y no se mezcla
  // con el medio: se declara aparte, como la empresa donde trabajan. Es lo que
  // respalda los 18 años de oficio que dice la biografía.
  // OJO: esto ya NO se usa para ningún link de la página. Queda solo para el
  // "sameAs" del schema, que no es un link que alguien clickea: es la forma de
  // decirle a Google "esta empresa y ese perfil de LinkedIn son la misma". Sin
  // eso, para una máquina son dos entidades distintas. Todo lo que el lector ve
  // va a webAvEventos.
  linkedinAvEventos: "https://www.linkedin.com/company/av-eventos/",
  // A dónde va SIEMPRE cualquier mención visible de "AV Eventos". Con la barra
  // final, que es la dirección que devuelve el servidor: sin ella el navegador
  // hace un salto de más antes de llegar.
  webAvEventos: "https://av-eventos.com/",
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
// "perfil" es el LinkedIn personal de cada uno: es lo que hace verificable la
// autoría, o sea que la persona del schema y una persona real del rubro sean
// la misma para una máquina y no dos coincidencias de nombre.
export const AUTORES = [
  {
    id: "pablo-quiroga",
    nombre: "Pablo Quiroga",
    rol: "Co-conductor · Visión editorial",
    cargo: "Productor de eventos y co-conductor",
    // El que va al "jobTitle" del schema, que es lo que una máquina lee como
    // "a qué se dedica esta persona". Va aparte de "cargo" porque ese se usa
    // dentro de una oración —"{cargo} de Mate y Eventos"— y ahí un título como
    // "Director de AV Eventos" quedaría roto. Acá no hay oración: hay entidad.
    jobTitle: "Productor técnico y director de producción de eventos",
    // La corta: es la que Google muestra abajo del título y la que va al
    // schema, así que se mantiene cerca de los 160 caracteres. La larga, la que
    // se lee en la página, está en "presentacion".
    bio: "Productor con más de 18 años en eventos. Del sonido en vivo y los estadios a dirigir AV Eventos, Growth Engine y Mate y Eventos, donde lleva la visión editorial.",
    // La biografía larga, la que se lee en la página. Va aparte de "bio", que
    // es la corta y sigue siendo la que usan la descripción de Google y el
    // schema: una descripción de mil caracteres la corta el buscador a la
    // mitad de una oración. Se guarda en texto plano —el link a AV Eventos lo
    // pone la página— porque el mismo texto lo puede leer una máquina, y ahí
    // el HTML sobra.
    presentacion:
      "Pablo Quiroga viene del espectáculo en vivo y lleva más de 18 años en la industria. Se formó en sus inicios en Teddy Goldman, pionero del sonido en vivo en Buenos Aires, y trabajó como productor técnico y stage manager en estadios y salas como el Luna Park, además de haber sido manager de artistas. Es técnico electrónico y en sonido: diseñó y construyó la línea de iluminación escenográfica de AV Eventos, y esa formación técnica se traduce en soluciones constructivas propias para escenografías y puestas en escena. En AV, que dirige junto a Alexis Vidal, coordina las producciones técnicas, lidera los equipos y hace el maquetado y la documentación de los proyectos —el paso donde una idea se vuelve construible. Le interesa lo que viene: tecnología, inteligencia artificial, hacia dónde se mueve el oficio. En Mate y Eventos lleva la visión editorial y estratégica, con una convicción: casi todo lo que define si un evento funciona ocurre donde nadie lo ve, y esa parte nunca se cuenta.",
    perfil: "https://www.linkedin.com/in/pablomquiroga/",
    // Qué hace acá adentro, que es distinto de lo que hace en el rubro.
    // No es la lista de tareas: es por qué su criterio vale. Decía "revisa y
    // publica cada artículo del sitio", que describe un trabajo administrativo
    // y no la autoridad que respalda lo que el medio afirma.
    enElMedio:
      "Define qué se cubre y con qué criterio, y ese criterio tiene dieciocho años atrás: los estadios, el Luna Park, la producción técnica donde el error no se corrige después. Cuando el podcast afirma algo sobre cómo se monta un evento, es porque lo montó. Nada sale publicado sin que lo haya leído.",
    recorrido: [
      [
        "Empezó en la técnica",
        "Productor técnico en shows masivos: recitales internacionales en estadios, donde un error no se puede corregir después.",
      ],
      [
        "Pasó a la producción general",
        "De la técnica al armado completo del evento, con la logística, los proveedores y los equipos adentro.",
      ],
      [
        "Hoy, producción y dirección",
        "Producción de eventos en general, y la dirección de AV Eventos, Growth Engine y Mate y Eventos junto a Alexis Vidal.",
      ],
    ],
    obsesion:
      "Profesionalizar la industria y compartir lo que casi nunca se cuenta.",
  },
  {
    id: "alexis-vidal",
    nombre: "Alexis Vidal",
    rol: "Co-conductor · Producción",
    cargo: "Productor de eventos y co-conductor",
    jobTitle: "Director creativo y productor de eventos",
    bio: "Productor y creativo desde 1999, con más de 800 producciones. Dirige AV Eventos, Growth Engine y Mate y Eventos, con una mirada que entra siempre por la luz.",
    presentacion:
      "Alexis Vidal trabaja en eventos desde 1999 y lleva más de 800 producciones. Junto a Pablo Quiroga dirige AV Eventos, donde se ocupa del diseño conceptual y espacial, la visualización 3D y la dirección comercial de la agencia —una de las primeras del país en incorporar el diseño de espacios en 3D al proceso creativo. Su formación es deliberadamente cruzada: escenografía con Tito Urza, escenógrafo del Teatro Colón, y estudios en cine, diseño de interiores, hotelería y gastronomía. De ahí su manera de mirar, que entra siempre por la luz: cómo la luz, la forma y la textura construyen un espacio y conducen a quien lo recorre. Trabaja en eventos corporativos y sociales desde una sola pregunta: qué necesita este evento.",
    perfil: "https://www.linkedin.com/in/alexis-vidal-av/",
    enElMedio:
      "Trae el criterio de más de ochocientas producciones desde 1999. Es el que cuenta cómo se resuelve de verdad y no cómo debería resolverse. Lo estético y lo operativo no se le separan nunca, porque los aprendió juntos: escenografía con el escenógrafo del Teatro Colón, más cine, interiorismo y gastronomía.",
    recorrido: [
      [
        "Productor y creativo",
        "De cabeza práctica y resolutiva: de los que hacen que las cosas pasen cuando el plan se cae.",
      ],
      [
        "La operación real",
        "Su fuerte es el terreno, donde la creatividad y la técnica tienen que convivir todo el tiempo y sin margen.",
      ],
      [
        "Hoy, al frente de tres proyectos",
        "Dirige AV Eventos, Growth Engine y Mate y Eventos junto a Pablo Quiroga.",
      ],
    ],
    obsesion:
      "Que lo que se cuenta sea lo que pasa de verdad, no la versión prolija.",
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
