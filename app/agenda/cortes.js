import {
  pelado,
  hoyISO,
  yaPaso,
  mesLargo,
  MESES_LARGO,
  getEventosConEstado,
} from "../lib/agenda";
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

// Qué porción de los eventos de su país puede tener una provincia antes de que
// su landing deje de ser una página distinta.
//
// São Paulo tenía 17 de los 22 eventos de Brasil: las 17 filas idénticas
// carácter por carácter, el 86% del texto igual. Eso no es un corte, es la
// misma lista con otro título, y las dos compiten por lo mismo. En cambio la
// Ciudad de Buenos Aires tiene 136 de 231 (59%) y sí es una página propia:
// "eventos en CABA" es una búsqueda real y quedan 95 eventos afuera.
const TOPE_PROVINCIA = 0.7;
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

// A partir de cuántos eventos el número entra en el título y en el H1.
//
// Que el título diga "256 eventos en Argentina" en vez de "Eventos en
// Argentina" es lo único que hace distinto un competidor que sí aparece en las
// búsquedas genéricas: la página promete una cantidad concreta y la cumple.
// El número ya estaba en la descripción; en el título, que es lo que se ve
// primero, no estaba.
//
// Pero por debajo de este piso el número juega en contra: "4 eventos en
// España" le está avisando a la persona que la página es flaca antes de que
// entre. Ahí se mantiene el título de siempre. Hoy quedan afuera España (4),
// Chile (6), Estados Unidos (7) y enero de 2027 (6).
const PISO_PARA_MOSTRAR = 8;

// La definición de cada corte, en un solo lugar.
const CORTES = {
  pais: {
    campo: (e) => e.pais,
    minimo: MINIMO,
    titulo: (v, n) =>
      n >= PISO_PARA_MOSTRAR
        ? `${n} eventos en ${v} — agenda de la industria`
        : `Eventos en ${v} — agenda de la industria`,
    h1: (v, n) =>
      n >= PISO_PARA_MOSTRAR
        ? `Los ${n} eventos de la industria en ${v}`
        : `Eventos de la industria en ${v}`,
    meta: (v, n) =>
      `Los ${n} congresos, expos, festivales y grandes eventos de la industria en ${v} que están en la agenda de ${SITE.name}, con fechas, sedes y organizadores.`,
  },
  tipo: {
    campo: (e) => e.tipo,
    minimo: MINIMO,
    // Acá el número no va adelante: el valor es una categoría con barra
    // —"Expo/Feria", "Congreso/Conferencia"— y "102 Expo/Feria en Argentina"
    // no es castellano. Va después de los dos puntos, que sí lo es.
    titulo: (v, n) =>
      n >= PISO_PARA_MOSTRAR
        ? `${v}: ${n} eventos en Argentina y Latinoamérica`
        : `${v} en Argentina y Latinoamérica — agenda`,
    h1: (v, n) =>
      n >= PISO_PARA_MOSTRAR ? `${v}: ${n} eventos en la agenda` : `${v}: la agenda completa`,
    meta: (v, n) =>
      `${n} eventos del tipo ${v.toLowerCase()} en Argentina y Latinoamérica, con fechas, sedes, organizadores y contactos.`,
  },
  provincia: {
    campo: (e) => e.provincia,
    minimo: MINIMO_PROVINCIA,
    titulo: (v, n) =>
      n >= PISO_PARA_MOSTRAR
        ? `${n} eventos en ${v} — agenda de la industria`
        : `Eventos en ${v} — agenda de la industria`,
    h1: (v, n) =>
      n >= PISO_PARA_MOSTRAR
        ? `Los ${n} eventos de la industria en ${v}`
        : `Eventos de la industria en ${v}`,
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

  let grupitos = [...grupos.values()].filter(
    (g) => g.eventos.length >= def.minimo
  );

  if (tipo === "provincia") {
    // Cuántos eventos tiene cada país, para medir contra eso.
    const porPais = new Map();
    for (const e of eventos) {
      const clave = pelado(String(e.pais || ""));
      if (clave) porPais.set(clave, (porPais.get(clave) || 0) + 1);
    }
    grupitos = grupitos.filter((g) => {
      // El país de la provincia es el de la mayoría de sus eventos, y no el
      // del primero: una provincia mal cargada podría tener eventos de dos.
      const cuenta = new Map();
      for (const e of g.eventos) {
        const clave = pelado(String(e.pais || ""));
        if (clave) cuenta.set(clave, (cuenta.get(clave) || 0) + 1);
      }
      const [suPais] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0] || [];
      const total = porPais.get(suPais) || 0;
      return !(total > 0 && g.eventos.length / total >= TOPE_PROVINCIA);
    });
  }

  return grupitos
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
// Los cruces: un tipo de evento dentro de un lugar.
//
// "Ferias en Argentina" y "Congresos en Ciudad de Buenos Aires" son búsquedas
// que existen y que hoy no contesta ninguna página: /agenda/tipo/expo-feria
// mezcla los siete países y /agenda/pais/argentina mezcla los ocho tipos.
//
// El inventario está contado, no supuesto. Al 2/9/2026, cruzando los 338
// eventos aprobados, solo 30 combinaciones llegan al mínimo. Es una mejora
// acotada y de una sola vez: no hay 200 páginas escondidas acá, y quien
// prometa lo contrario no contó la base.
const MINIMO_CRUCE = 6;

// Si el cruce se lleva casi todos los eventos de alguno de sus dos padres, no
// es una página distinta: es una copia con otro título. "Capacitación en
// Argentina" con 10 de los 10 eventos de capacitación es la misma lista que
// /agenda/tipo/capacitacion. Mismo criterio que TOPE_PROVINCIA.
const TOPE_CRUCE = 0.85;

export function cortesCruzados(eventos) {
  const salida = [];

  // Cuántos eventos hay en cada lugar, para medir el cruce contra ese padre.
  const totalPorLugar = { pais: new Map(), provincia: new Map() };
  for (const e of eventos) {
    for (const donde of ["pais", "provincia"]) {
      const clave = pelado(String(e[donde] || ""));
      if (clave) {
        totalPorLugar[donde].set(clave, (totalPorLugar[donde].get(clave) || 0) + 1);
      }
    }
  }

  for (const ct of cortesDe("tipo", eventos)) {
    for (const donde of ["pais", "provincia"]) {
      const grupos = new Map();
      for (const e of ct.eventos) {
        const valor = String(e[donde] || "").trim();
        if (!valor) continue;
        const clave = pelado(valor);
        if (!grupos.has(clave)) grupos.set(clave, { valor, eventos: [] });
        grupos.get(clave).eventos.push(e);
      }

      for (const g of grupos.values()) {
        if (g.eventos.length < MINIMO_CRUCE) continue;
        // Contra el padre "tipo" y contra el padre "lugar": basta con parecerse
        // demasiado a uno de los dos para no merecer página propia.
        const delTipo = g.eventos.length / ct.eventos.length;
        const totalLugar = totalPorLugar[donde].get(pelado(g.valor)) || 0;
        const delLugar = totalLugar > 0 ? g.eventos.length / totalLugar : 0;
        if (delTipo >= TOPE_CRUCE || delLugar >= TOPE_CRUCE) continue;

        const slugLugar = aSlug(g.valor);
        if (!slugLugar) continue;
        salida.push({
          tipo: "cruce",
          // Los dos valores viajan enteros porque los textos y las migas los
          // necesitan por separado: "Expo/Feria" y "Argentina", no un string
          // pegado que después haya que volver a partir.
          valor: `${ct.valor} en ${g.valor}`,
          valorTipo: ct.valor,
          valorLugar: g.valor,
          donde,
          slugTipo: ct.slug,
          slug: slugLugar,
          url: `/agenda/tipo/${ct.slug}/${donde}/${slugLugar}`,
          // El padre, para las migas de pan y para el link de vuelta.
          urlTipo: ct.url,
          eventos: ordenar(g.eventos),
        });
      }
    }
  }

  return salida.sort((a, b) => b.eventos.length - a.eventos.length);
}

// Un cruce puntual, por sus tres partes.
export function buscarCruce(slugTipo, donde, slugLugar, eventos) {
  const vigentes = eventos.filter((e) => !yaPaso(e));
  return (
    cortesCruzados(vigentes).find(
      (c) =>
        c.slugTipo === String(slugTipo) &&
        c.donde === String(donde) &&
        c.slug === String(slugLugar)
    ) || null
  );
}

// Lo mismo, leyendo la agenda y sin confundir "no existe" con "no pude leer".
// Misma razón que corteDeLanding y que getEvento.
export async function cruceDeLanding(slugTipo, donde, slugLugar) {
  const { eventos, completa } = await getEventosConEstado();
  const corte = buscarCruce(slugTipo, donde, slugLugar, eventos);
  if (!corte && !completa) {
    throw new Error(
      `Agenda: la lectura vino incompleta, así que no se puede afirmar que el cruce ${slugTipo}/${donde}/${slugLugar} no existe.`
    );
  }
  return { corte, eventos };
}

export function todosLosCortes(eventos) {
  const vigentes = eventos.filter((e) => !yaPaso(e));
  return [
    ...cortesDe("pais", vigentes),
    ...cortesDe("tipo", vigentes),
    ...cortesDe("provincia", vigentes),
    ...cortesDeMes(vigentes),
    ...cortesCruzados(vigentes),
  ];
}

// Busca un corte puntual por su tipo y su slug.
export function buscarCorte(tipo, slug, eventos) {
  const vigentes = eventos.filter((e) => !yaPaso(e));
  const lista =
    tipo === "mes" ? cortesDeMes(vigentes) : cortesDe(tipo, vigentes);
  return lista.find((c) => c.slug === String(slug)) || null;
}

// Lo mismo, pero leyendo la agenda y sin confundir "esta landing no existe"
// con "no pude leer la agenda".
//
// Es el mismo cuidado que getEvento y por el mismo motivo: una landing sale
// de agrupar los eventos, así que una lectura corta puede dejar un corte por
// debajo del mínimo y hacerlo desaparecer. Si eso termina en notFound(), el
// 404 queda cacheado una hora sobre una página que sí existe.
//
// Devuelve también la lista, que las cuatro páginas necesitan igual para
// armar los cortes hermanos: así se lee una sola vez.
export async function corteDeLanding(tipo, slug) {
  const { eventos, completa } = await getEventosConEstado();
  const corte = buscarCorte(tipo, slug, eventos);
  if (!corte && !completa) {
    throw new Error(
      `Agenda: la lectura vino incompleta, así que no se puede afirmar que la landing ${tipo}/${slug} no existe.`
    );
  }
  return { corte, eventos };
}

// Los textos de cada landing, en un solo lugar para que la página, el
// metadata y el schema digan siempre lo mismo.
export function textosDe(corte) {
  const n = corte.eventos.length;

  // El cruce: un tipo dentro de un lugar. El nombre del tipo va adelante
  // porque es lo que la persona escribe primero —"ferias en Argentina", no
  // "Argentina ferias"— y porque distingue la página de sus dos padres.
  if (corte.tipo === "cruce") {
    const donde = corte.valorLugar;
    const que = corte.valorTipo;
    return {
      titulo:
        n >= PISO_PARA_MOSTRAR
          ? `${que} en ${donde}: ${n} eventos en la agenda`
          : `${que} en ${donde} — agenda de la industria`,
      // El nombre del tipo NO se pasa a minúscula: es "Expo/Feria", con la
      // barra y las mayúsculas, y "los 65 eventos de expo/feria" se lee mal.
      h1:
        n >= PISO_PARA_MOSTRAR
          ? `${que} en ${donde}: los ${n} eventos de la agenda`
          : `${que} en ${donde}`,
      meta: `Los ${n} eventos del tipo ${que.toLowerCase()} que se hacen en ${donde}, con fechas, sedes, organizadores y el link al sitio oficial de cada uno.`,
      etiqueta: `${que} en ${donde}`,
    };
  }

  if (corte.tipo === "mes") {
    const largo = mesLargo(corte.valor);
    const [, m] = corte.valor.split("-").map(Number);
    return {
      // "agenda completa" a propósito: este corte es el listado exhaustivo
      // del mes. La curaduría con voz propia y pocos elegidos vive en
      // /imperdibles, y las dos se linkean entre sí para que no compitan por
      // la misma búsqueda.
      titulo:
        n >= PISO_PARA_MOSTRAR
          ? `${n} eventos en ${largo}: agenda completa`
          : `Eventos en ${largo}: agenda completa`,
      h1:
        n >= PISO_PARA_MOSTRAR
          ? `Los ${n} eventos de ${MESES_LARGO[m - 1].toLowerCase()}`
          : `Todos los eventos de ${MESES_LARGO[m - 1].toLowerCase()}`,
      meta: `Los ${n} eventos de la industria que se hacen en ${largo} en Argentina y Latinoamérica, con fechas, sedes y organizadores.`,
      etiqueta: largo,
    };
  }

  const def = CORTES[corte.tipo];
  return {
    titulo: def.titulo(corte.valor, n),
    h1: def.h1(corte.valor, n),
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
        isPartOf: { "@id": `${SITE.url}/#website` },
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
