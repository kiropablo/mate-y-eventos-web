import { revalidatePath } from "next/cache";

// Refresco manual de la agenda: visitar
//   /api/agenda/revalidar?token=TU_CLAVE
// (la clave se define en la env var REVALIDATE_TOKEN de Vercel).

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  const esperado = process.env.REVALIDATE_TOKEN;

  if (!esperado || token !== esperado) {
    return Response.json({ error: "Token inválido" }, { status: 401 });
  }

  revalidatePath("/agenda");
  revalidatePath("/agenda/[slug]", "page");

  return Response.json({
    ok: true,
    mensaje: "Agenda actualizada. Los cambios de Airtable ya están en la web.",
  });
}
