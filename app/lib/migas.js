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
export function migas(pasos) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: pasos.map(([name, url], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      ...(url ? { item: `${SITE.url}${url}` } : {}),
    })),
  };
}
