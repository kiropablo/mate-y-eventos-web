import { pelado, hoyISO, yaPaso, mesLargo, MESES_LARGO } from "../lib/agenda";
import { SITE } from "../lib/site";

// Las landings de la agenda: una página propia por país, por tipo, por
// provincia y por mes.
//
// Existen porque el filtro de /agenda vive en el navegador: es cómodo para
// quien ya está en la página, pero no deja nada indexable. Alguien que busca
// "ferias en Córdoba 2026" no tiene hoy dónde caer. Cada corte se arma solo
// con los mismos datos, sin trabajo de carga extra.
//
// Van bajo /agenda/pais/…, /agenda/tipo/… y demás, y no bajo /agenda/… a
// secas, para no chocar nunca con el slug de un evento: un evento que se
// llamara "Festival" dejaría inaccesible su propia ficha.

// Menos de esto no justifica una página propia: una landing con dos eventos
// es una página flaca, y las páginas flacas restan en vez de sumar.
const MINIMO = 3;
const MINIMO_PROVINCIA = 6;
// Cuántos meses hacia adelante. Más allá la agenda se vuelve muy rala.
const MESES_ADELANTE = 6;

export function aSlug(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// La definición de cada corte, en un solo lugar.
const CORTES = {
  pais: {
    campo: (e) => e.pais,
    minimo: MINIMO,
    titulo: (v) => `Eventos en ${v} — agenda de la industria`,
    h1: (v) => `Eventos de la industria en ${v}`,
    meta: (v, n) =>
      `Los ${n} congresos, expos, festivales y grandes eventos de la industria en ${v} que están en la agenda de ${SITE.name}, con fechas, sedes y organizadores.`,
  },
  tipo: {
    campo: (e) => e.tipo,
    minimo: MINIMO,
    titulo: (v) => `${v} en Argentina y Latinoamérica — agenda`,
    h1: (v) => `${v}: la agenda completa`,
    meta: (v, n) =>
      `${n} eventos del tipo ${v.toLowerCase()} en Argentina y Latinoamérica, con fechas, sedes, organizadores y contactos.`,
  },
  provincia: {
    campo: (e) => e.provincia,
    minimo: MINIMO_PROVINCIA,
    titulo: (v) => `Eventos en ${v} — agenda de la industria`,
    h1: (v) => `Eventos de la industria en ${v}`,
    meta: (v, n) =>
      `Los ${n} eventos de la industria que se hacen en ${v}: congresos, expos, festivales y grandes producciones, con fechas y sedes.`,
  },
};

// Todos los cortes de un tipo que tienen suficientes eventos.
export function cortesDe(tipo, eventos) {
  const def = CORTES[tipo];
  if (!def) return [];

  const grupos = new Map();
  for (const e of eventos) {
    const valor = String(def.campo(e) || "").trim();
    if (!valor) continue;
    // Se agrupa por el valor pelado para que un acento o una mayúscula de más
    // no partan la landing en dos.
    const clave = pelado(valor);
    if (!grupos.has(clave)) grupos.set(clave, { valor, eventos: [] });
    grupos.get(clave).eventos.push(e);
  }

  return [...grupos.values()]
    .filter((g) => g.eventos.length >= def.minimo)
    .map((g) => ({
      tipo,
      valor: g.valor,
      slug: aSlug(g.valor),
      url: `/agenda/${tipo}/${aSlug(g.valor)}`,
      eventos: ordenar(g.eventos),
    }))
    .filter((c) => c.slug)
    .sort((a, b) => b.eventos.length - a.eventos.length);
}

// Los meses que vienen, con los eventos que están activos en cada uno.
export function cortesDeMes(eventos) {
  const hoy = hoyISO();
  const salida = [];

  for (let i = 0; i < MESES_ADELANTE; i++) {
    const [a, m] = hoy.split("-").map(Number);
    const fecha = new Date(Date.UTC(a, m - 1 + i, 1));
    const mes = fecha.toISOString().slice(0, 7);
    const finDeMes = new Date(
      Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0)
    )
      .toISOString()
      .slice(0, 10);

    // Activos en el mes: los que arrancan, y también los que ya venían.
    const del = eventos.filter(
      (e) =>
        e.fechaInicio &&
        e.fechaInicio <= finDeMes &&
        (e.fechaFin || e.fechaInicio) >= `${mes}-01`
    );

    if (del.length >= MINIMO) {
      salida.push({
        tipo: "mes",
        valor: mes,
        slug: mes,
        url: `/agenda/mes/${mes}`,
        eventos: ordenar(del),
      });
    }
  }
  return salida;
}

// Todos los cortes que existen hoy, para el sitemap y el bloque de /agenda.
export function todosLosCortes(eventos) {
  const vigentes = eventos.filter((e) => !yaPaso(e));
  return [
    ...cortesDe("pais", vigentes),
    ...cortesDe("tipo", vigentes),
    ...cortesDe("provincia", vigentes),
    ...cortesDeMes(vigentes),
  ];
}

// Busca un corte puntual por su tipo y su slug.
export function buscarCorte(tipo, slug, eventos) {
  const vigentes = eventos.filter((e) => !yaPaso(e));
  const lista =
    tipo === "mes" ? cortesDeMes(vigentes) : cortesDe(tipo, vigentes);
  return lista.find((c) => c.slug === String(slug)) || null;
}

// Los textos de cada landing, en un solo lugar para que la página, el
// metadata y el schema digan siempre lo mismo.
export function textosDe(corte) {
  const n = corte.eventos.length;

  if (corte.tipo === "mes") {
    const largo = mesLargo(corte.valor);
    const [, m] = corte.valor.split("-").map(Number);
    return {
      // "agenda completa" a propósito: este corte es el listado exhaustivo
      // del mes. La curaduría con voz propia y pocos elegidos vive en
      // /imperdibles, y las dos se linkean entre sí para que no compitan por
      // la misma búsqueda.
      titulo: `Eventos en ${largo}: agenda completa`,
      h1: `Todos los eventos de ${MESES_LARGO[m - 1].toLowerCase()}`,
      meta: `Los ${n} eventos de la industria que se hacen en ${largo} en Argentina y Latinoamérica, con fechas, sedes y organizadores.`,
      etiqueta: largo,
    };
  }

  const def = CORTES[corte.tipo];
  return {
    titulo: def.titulo(corte.valor),
    h1: def.h1(corte.valor),
    meta: def.meta(corte.valor, n),
    etiqueta: corte.valor,
  };
}

export function metaDeCorte(corte) {
  const t = textosDe(corte);
  return {
    alternates: { canonical: corte.url },
    title: { absolute: `${t.titulo} · ${SITE.name}` },
    description: t.meta,
    openGraph: {
      type: "website",
      title: `${t.titulo} · ${SITE.name}`,
      description: t.meta,
      url: `${SITE.url}${corte.url}`,
      siteName: SITE.name,
      locale: "es_AR",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t.titulo} · ${SITE.name}`,
      description: t.meta,
      images: ["/og-default.jpg"],
    },
  };
}

export function schemaDeCorte(corte) {
  const t = textosDe(corte);
  const url = `${SITE.url}${corte.url}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `${t.titulo} · ${SITE.name}`,
        description: t.meta,
        isPartOf: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "ItemList",
        name: t.titulo,
        numberOfItems: corte.eventos.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: corte.eventos.slice(0, 60).map((ev, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE.url}/agenda/${ev.slug}`,
          name: ev.nombre,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Agenda",
            item: `${SITE.url}/agenda`,
          },
          { "@type": "ListItem", position: 2, name: t.etiqueta, item: url },
        ],
      },
    ],
  };
}

function ordenar(lista) {
  return [...lista].sort((a, b) =>
    (a.fechaInicio || "9").localeCompare(b.fechaInicio || "9")
  );
}
