import { revalidateTag } from "next/cache";
import { haySesion } from "../../../lib/admin";
import { getEvento, formatRango } from "../../../lib/agenda";
import { mandarCorreo } from "../../../lib/correo";
import { LINKS, SITE } from "../../../lib/site";

// "Ya lo publicamos en las redes."
//
// Lo tilda una persona desde el panel, después de subir la historia. Marca el
// evento como difundido y le avisa al organizador, si dejó su mail al
// confirmar. El aviso es la contraparte de lo que le ofrecimos: cerrar el
// círculo es lo que hace que la próxima vez conteste.

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

  let slug = "";
  try {
    slug = String((await request.json())?.slug || "");
  } catch {
    slug = "";
  }
  if (!slug) {
    return Response.json({ ok: false, error: "Falta el evento." }, { status: 400 });
  }

  const ev = await getEvento(slug);
  if (!ev) {
    return Response.json({ ok: false, error: "No existe ese evento." }, { status: 404 });
  }

  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [
        { id: ev.id, fields: { Difundido: true, "Fecha de difusión": hoy } },
      ],
      typecast: true,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.warn(`[difundido] Airtable ${res.status}: ${detalle.slice(0, 200)}`);
    return Response.json({ ok: false, error: "No se pudo guardar." }, { status: 502 });
  }

  try {
    revalidateTag("agenda");
  } catch {
    // Se actualiza sola en la próxima revalidación.
  }

  // Si no dejó mail, queda marcado igual: el aviso es un extra, no la acción.
  let aviso = "sin-mail";
  if (ev.emailOrganizador) {
    const r = await mandarCorreo({
      para: ev.emailOrganizador,
      asunto: `Publicamos ${ev.nombre} en nuestras redes`,
      texto: [
        `Hola:`,
        "",
        `Como te habíamos dicho, ${ev.nombre} ya está publicado en las redes de ${SITE.name}.`,
        LINKS.instagram ? `Podés verlo acá: ${LINKS.instagram}` : "",
        "",
        `La ficha con el sello Verificado quedó en ${SITE.url}/agenda/${ev.slug}`,
        formatRango(ev) ? `Fechas: ${formatRango(ev)}` : "",
        "",
        `Si querés, podés poner el sello en tu propio sitio: el código está en ${SITE.url}/agenda/verificado`,
        "",
        `Gracias por confirmarnos los datos. Que salga todo bien.`,
        "",
        `Pablo Quiroga`,
        `${SITE.name}`,
      ]
        .filter((l) => l !== "")
        .join("\n"),
    });
    aviso = r.ok ? "enviado" : `falló (${r.motivo})`;
  }

  return Response.json({ ok: true, aviso });
}
