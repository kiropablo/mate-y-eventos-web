import { revalidatePath, revalidateTag } from "next/cache";

// Refresco manual de la agenda: visitar
//   /api/agenda/revalidar?token=TU_CLAVE
// (la clave se define en la env var REVALIDATE_TOKEN de Vercel).
//
// Sirve para no esperar la hora de refresco automático después de tocar
// algo en Airtable.

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  const esperado = process.env.REVALIDATE_TOKEN;

  if (!esperado || token !== esperado) {
    return Response.json({ error: "Token inválido" }, { status: 401 });
  }

  // La etiqueta tira abajo la copia guardada de Airtable, que es la que
  // comparten TODOS los que leen la agenda: las páginas, las fichas y los
  // archivos de calendario. Sin esto, refrescar la página no alcanzaba:
  // los .ics seguían sirviendo los datos viejos.
  revalidateTag("agenda");

  const rutas = [
    "/agenda",
    "/agenda/esta-semana",
    "/agenda/calendario",
    "/api/agenda/ics",
    "/sitemap.xml",
  ];
  rutas.forEach((r) => revalidatePath(r));
  revalidatePath("/agenda/[slug]", "page");
  revalidatePath("/api/agenda/[slug]/ics", "route");

  return Response.json({
    ok: true,
    mensaje: "Agenda actualizada. Los cambios de Airtable ya están en la web.",
    refrescado: [...rutas, "/agenda/[slug]", "/api/agenda/[slug]/ics"],
  });
}
