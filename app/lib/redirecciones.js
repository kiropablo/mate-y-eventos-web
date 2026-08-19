// La extensión va explícita: a este archivo lo carga next.config.js, que corre
// como módulo de Node puro y no completa la extensión solo, como sí hace el
// empaquetador de Next con el resto del sitio.
import { getArticulos } from "./articulos.js";

// Las redirecciones de los artículos que cambiaron de dirección.
//
// Cuando un artículo se muda —de /articulos/AJpzAobAKOU a
// /articulos/cuanto-cobrar-por-organizar-un-evento— la dirección vieja no
// puede quedar en la nada: hay links compartidos por WhatsApp, resultados de
// Google todavía sin actualizar y gente que la tiene guardada.
//
// Cada artículo lleva en su cabecera la lista de las direcciones que supo
// tener (slugsAnteriores). De ahí sale esta lista, que next.config.js
// convierte en redirecciones permanentes: la dirección vieja lleva a la
// nueva y le pasa el posicionamiento que había ganado.
//
// Se arma leyendo el contenido, no de una lista escrita a mano: una lista a
// mano se desactualiza el día que alguien renombra un archivo y se olvida.
export function redireccionesDeArticulos() {
  const salida = [];
  const vistos = new Set();

  // Con borradores incluidos: un artículo puede estar despublicado
  // temporalmente y su dirección vieja tiene que seguir llevando a algún lado.
  for (const art of getArticulos({ incluirBorradores: true })) {
    for (const viejo of art.slugsAnteriores) {
      // Si el slug viejo es el actual, redirigir sería un bucle.
      if (viejo === art.id) continue;
      // Dos artículos no pueden reclamar la misma dirección vieja.
      if (vistos.has(viejo)) continue;
      vistos.add(viejo);
      salida.push({ de: viejo, a: art.id });
    }
  }

  return salida;
}

// Las redirecciones en el formato que espera Next.
export function reglasDeRedireccion() {
  return redireccionesDeArticulos().flatMap(({ de, a }) => [
    { source: `/articulos/${de}`, destination: `/articulos/${a}`, permanent: true },
    {
      source: `/articulos/${de}/imprimir`,
      destination: `/articulos/${a}/imprimir`,
      permanent: true,
    },
    {
      source: `/api/articulos/${de}/descargar`,
      destination: `/api/articulos/${a}/descargar`,
      permanent: true,
    },
  ]);
}
