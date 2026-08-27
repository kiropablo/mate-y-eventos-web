import { getArticulos } from "./articulos";
import { EJES } from "./site";

// Los cortes de artículos por eje editorial.
//
// Mismo patrón que las landings de la agenda, aplicado al otro contenido:
// /articulos era una grilla plana de 41 piezas sin filtro ni páginas por tema,
// y el reparto está muy desbalanceado —21 de Estrategia & Negocio contra 3 de
// Tendencias—. Un corte por eje da páginas que responden a una búsqueda entera
// ("artículos sobre producción de eventos") en vez de a una sola pieza.
//
// El mínimo es bajo a propósito: los cuatro ejes son la estructura editorial
// declarada del proyecto —están en la home, en el schema y en cada artículo—,
// así que una landing con tres piezas sigue siendo una página con sentido y no
// una combinación armada por el código. Lo que no puede haber es una vacía.
const MINIMO = 2;

export function aSlugEje(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Todos los ejes que tienen suficientes artículos, en el orden en que están
// declarados en site.js y no por cantidad: es el orden editorial.
export function cortesDeEje() {
  const articulos = getArticulos();
  return EJES.map((e) => {
    const suyos = articulos.filter((a) => a.eje === e.titulo);
    return {
      titulo: e.titulo,
      frase: e.frase || e.titulo.toLowerCase(),
      slug: aSlugEje(e.titulo),
      url: `/articulos/eje/${aSlugEje(e.titulo)}`,
      texto: e.texto,
      articulos: suyos,
    };
  }).filter((c) => c.articulos.length >= MINIMO);
}

export function buscarEje(slug) {
  return cortesDeEje().find((c) => c.slug === String(slug)) || null;
}
