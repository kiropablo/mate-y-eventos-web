import { getArticulo, articuloEnTexto } from "../../../../lib/articulos";
import { SITE } from "../../../../lib/site";

// Descarga el artículo como archivo de texto, listo para guardar o compartir.

export const revalidate = 3600;

// Convierte el título en un nombre de archivo prolijo.
function nombreArchivo(titulo) {
  const base = String(titulo)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `mate-y-eventos-${base || "articulo"}.txt`;
}

export async function GET(request, { params }) {
  const art = getArticulo(params.id);

  if (!art) {
    return new Response("Artículo no encontrado.", { status: 404 });
  }

  const texto = articuloEnTexto(art, `${SITE.url}/articulos/${art.id}`);

  return new Response(texto, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo(art.titulo)}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
