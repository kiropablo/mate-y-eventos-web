import { revalidatePath, revalidateTag } from "next/cache";
import { avisarIndexNow, urlDeFicha } from "../../../lib/indexnow";

// Refresco manual de la agenda: visitar
//   /api/agenda/revalidar?token=TU_CLAVE
// (la clave se define en la env var REVALIDATE_TOKEN de Vercel).
//
// Sirve para no esperar la hora de refresco automático después de tocar
// algo en Airtable.

const SITIO = "https://www.mateyeventos.com";

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

  // Y le avisamos a los buscadores (IndexNow) qué cambió.
  //
  // Acotado a propósito. Quien llama puede pasar ?slugs=uno,dos,tres y se
  // avisan esas fichas; el robot de la agenda sabe cuáles tocó y es el que
  // debería pasarlas. Sin esa lista se avisan SOLO los hubs, que cambian
  // seguro cada vez que la agenda se movió.
  //
  // Lo que no se hace nunca es mandar las 338 fichas todos los días: es
  // justamente lo que el protocolo pide no hacer, y lo que hace que un sitio
  // deje de ser tenido en cuenta.
  const HOY = new Date().toISOString().slice(0, 7);
  const siguiente = (() => {
    const [a, m] = HOY.split("-").map(Number);
    return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
  })();

  const slugs = (new URL(req.url).searchParams.get("slugs") || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const aAvisar = [
    `${SITIO}/agenda`,
    `${SITIO}/agenda/esta-semana`,
    `${SITIO}/agenda/mes/${HOY}`,
    `${SITIO}/agenda/mes/${siguiente}`,
    ...slugs.map(urlDeFicha),
  ];
  const indexnow = await avisarIndexNow(aAvisar);

  return Response.json({
    ok: true,
    mensaje: "Agenda actualizada. Los cambios de Airtable ya están en la web.",
    refrescado: [...rutas, "/agenda/[slug]", "/api/agenda/[slug]/ics"],
    indexnow,
  });
}
