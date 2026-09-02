import { revalidateTag } from "next/cache";
import { haySesion } from "../../../lib/admin";
import { getEventoDelPanel } from "../../../lib/agenda";
import { avisarIndexNow, urlDeFicha } from "../../../lib/indexnow";

// "Le doy el OK": el sello se enciende acá, con una persona del otro lado.
//
// El organizador responde el link y su respuesta queda pendiente. Nosotros
// aplicamos en Airtable lo que haya que corregir y recién entonces
// verificamos. Si el sello se encendiera solo al recibir la respuesta, diría
// "alguien apretó un botón", que no es lo que promete la página del sello.

export const dynamic = "force-dynamic";

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }

  const key = process.env.AIRTABLE_API_KEY;
  if (!key) {
    return Response.json({ ok: false, error: "Sin configurar." }, { status: 500 });
  }

  let id = "";
  let slug = "";
  let aprueba = true;
  // "quitar" apaga el sello. Existe para que un click de más se arregle en el
  // panel y no obligue a entrar a Airtable, que es de lo que se trata todo esto.
  let quitar = false;
  try {
    const body = await request.json();
    id = String(body?.id || "");
    slug = String(body?.slug || "");
    aprueba = body?.aprueba !== false;
    quitar = body?.quitar === true;
  } catch {
    id = "";
    slug = "";
  }
  if (!id && !slug) {
    return Response.json({ ok: false, error: "Falta el evento." }, { status: 400 });
  }

  const ev = await getEventoDelPanel({ id, slug });
  if (!ev) {
    return Response.json({ ok: false, error: "No existe ese evento." }, { status: 404 });
  }

  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  // Aprobar enciende el sello. Descartar solo saca el pendiente: lo que
  // escribió el organizador queda igual, que para eso lo escribió.
  const fields = quitar
    ? {
        "Verificado por el organizador": false,
        "Fecha de verificación": null,
      }
    : aprueba
      ? {
          "Verificado por el organizador": true,
          "Fecha de verificación": hoy,
          "Revisión pendiente": false,
        }
      : { "Revisión pendiente": false };

  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ id: ev.id, fields }], typecast: true }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.warn(`[verificar] Airtable ${res.status}: ${detalle.slice(0, 200)}`);
    return Response.json({ ok: false, error: "No se pudo guardar." }, { status: 502 });
  }

  // Le avisamos a los buscadores que esta ficha cambió. No se espera la
  // respuesta ni se corta nada si falla: es un aviso, no una operación.
  avisarIndexNow([urlDeFicha(ev.slug)]);

  try {
    revalidateTag("agenda");
  } catch {
    // Se actualiza sola en la próxima revalidación.
  }

  return Response.json({ ok: true, verificado: aprueba });
}
