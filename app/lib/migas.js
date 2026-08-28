import { SITE } from "./site";

// El BreadcrumbList de una página de detalle.
//
// Es lo que le permite a un buscador entender la jerarquía del sitio y mostrar
// "mateyeventos.com › Agenda › Hotelga" en vez de la URL cruda. No lo tenía
// ninguna de las tres plantillas de detalle —episodios, artículos y fichas de
// evento—, que son justamente las tres que tienen miles de páginas.
//
// Se pasa la ruta como pares [nombre, url]. El último es la página en la que
// se está: lleva su nombre pero, por recomendación de schema.org, no hace
// falta repetir su propia URL.
// El @context va acá adentro y no en cada página.
//
// Sin él, un parser de JSON-LD —el de Google incluido— no resuelve
// "BreadcrumbList" contra schema.org: lo toma como un término relativo a la
// URL de la página y el nodo queda vacío, con un tipo inventado del estilo
// https://www.mateyeventos.com/articulos/brief-de-un-evento#BreadcrumbList.
// El JSON parsea igual y a simple vista se ve perfecto, que es lo que hizo
// que pasara desapercibido en 84 páginas: los 42 artículos y los 42
// episodios. La ficha de agenda no estaba afectada porque se lo agregaba a
// mano, y esa asimetría era justamente la pista.
//
// Cada objeto de un array de JSON-LD necesita el suyo: no se hereda del
// vecino.
export function migas(pasos) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: pasos.map(([name, url], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      ...(url ? { item: `${SITE.url}${url}` } : {}),
    })),
  };
}
