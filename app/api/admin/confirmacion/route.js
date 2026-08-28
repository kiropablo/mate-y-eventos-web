import { revalidateTag } from "next/cache";
import { haySesion } from "../../../lib/admin";
import { getEventos, getEventoDelPanel, yaPaso } from "../../../lib/agenda";
import { delMismoOrganizador } from "../../../lib/semana";
import { armarConfirmacion } from "../../../lib/mail-confirmacion";
import { mandarCorreo, hayCorreo } from "../../../lib/correo";

// El segundo mail: "listo, tu ficha quedó verificada".
//
// Sale a mano desde el panel y no solo al encender el sello, a propósito: el
// sello a veces se tilda mientras se habla por teléfono con el organizador, y
// ahí un mail automático llega antes de que la conversación termine.

export const dynamic = "force-dynamic";

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";
const esEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }
  if (!hayCorreo()) {
    return Response.json(
      { ok: false, error: "Falta RESEND_API_KEY en Vercel." },
      { status: 500 }
    );
  }

  let id = "";
  let slug = "";
  let para = "";
  let forzar = false;
  try {
    const body = await request.json();
    id = String(body?.id || "");
    slug = String(body?.slug || "");
    para = String(body?.para || "").trim();
    forzar = Boolean(body?.forzar);
  } catch {
    id = "";
    slug = "";
  }

  if (!id && !slug) {
    return Response.json({ ok: false, error: "Falta el evento." }, { status: 400 });
  }

  // Una sola lectura sin caché, igual que en la invitación: la ficha y los
  // otros eventos del mismo organizador tienen que salir del mismo momento.
  const todos = await getEventos({ fresco: true });
  // Por el id del registro: el slug se repite entre un archivado y su gemelo
  // publicado, y acá se le manda un mail a una persona real.
  const ev = await getEventoDelPanel({ id, slug });
  if (!ev) {
    return Response.json({ ok: false, error: "No existe ese evento." }, { status: 404 });
  }
  // Y tiene que estar publicado. El mail le dice al organizador que revise su
  // ficha "tal como está publicada": sobre un borrador o un archivado esa
  // frase es falsa, porque la ficha no existe para nadie más que nosotros.
  if (ev.estado !== "Aprobado") {
    return Response.json(
      {
        ok: false,
        error: `Ese evento está en "${ev.estado || "sin estado"}". Aprobalo antes de mandar la confirmación.`,
      },
      { status: 409 }
    );
  }

  // El mail dice "el sello quedó encendido". Si no lo está, sería mentira.
  if (!ev.verificado) {
    return Response.json(
      { ok: false, error: "Ese evento todavía no tiene el sello." },
      { status: 409 }
    );
  }
  if (ev.revisionPendiente) {
    return Response.json(
      {
        ok: false,
        error: "Ese evento está esperando tu OK. Revisalo antes de confirmarle nada.",
      },
      { status: 409 }
    );
  }
  if (ev.fechaConfirmacion && !forzar) {
    return Response.json(
      {
        ok: false,
        yaConfirmado: ev.fechaConfirmacion,
        error: `Ya se le mandó la confirmación el ${ev.fechaConfirmacion}.`,
      },
      { status: 409 }
    );
  }

  const destino = esEmail(para) ? para : ev.emailOrganizador;
  if (!esEmail(destino)) {
    return Response.json(
      { ok: false, error: "No hay un mail válido para mandárselo." },
      { status: 400 }
    );
  }

  // Los otros eventos suyos que siguen por delante: es el pedido del mail.
  const otros = delMismoOrganizador(
    ev,
    todos.filter((e) => !yaPaso(e))
  );

  const { asunto, texto, html } = armarConfirmacion({ ev, otros });

  const enviado = await mandarCorreo({ para: destino, asunto, texto, html });
  if (!enviado.ok) {
    return Response.json(
      { ok: false, error: `No se pudo enviar (${enviado.motivo}).` },
      { status: 502 }
    );
  }

  // Queda anotado para no escribirle dos veces. Si esto falla, el mail ya
  // salió: se avisa, pero no se da por fallado.
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  let anotado = true;
  try {
    const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            id: ev.id,
            fields: {
              "Fecha de confirmación": hoy,
              "Email del organizador": ev.emailOrganizador || destino,
            },
          },
        ],
        typecast: true,
      }),
    });
    anotado = res.ok;
    if (res.ok) revalidateTag("agenda");
  } catch {
    anotado = false;
  }

  return Response.json({ ok: true, anotado, asunto, otros: otros.length });
}
