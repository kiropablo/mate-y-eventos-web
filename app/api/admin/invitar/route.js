import { revalidateTag } from "next/cache";
import { haySesion } from "../../../lib/admin";
import { getEventos, getEvento, yaPaso } from "../../../lib/agenda";
import { mismaSemana } from "../../../lib/semana";
import { linkDeConfirmacion, hayClave } from "../../../lib/firma";
import { armarInvitacion } from "../../../lib/mail-invitacion";
import { mandarCorreo, hayCorreo } from "../../../lib/correo";

// Manda el mail de invitación al organizador, con el link firmado adentro.
//
// El link se arma acá y no en el navegador porque la clave de firma vive en el
// servidor: si el panel pudiera calcularla, cualquiera que abriera el panel
// podría firmar los links de todos los eventos.

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
  if (!hayClave()) {
    return Response.json(
      { ok: false, error: "Falta AGENDA_FIRMA_SECRET en Vercel." },
      { status: 500 }
    );
  }

  let slug = "";
  let para = "";
  try {
    const body = await request.json();
    slug = String(body?.slug || "");
    para = String(body?.para || "").trim();
  } catch {
    slug = "";
  }

  if (!slug) {
    return Response.json({ ok: false, error: "Falta el evento." }, { status: 400 });
  }
  if (!esEmail(para)) {
    return Response.json(
      { ok: false, error: "Ese email no parece válido." },
      { status: 400 }
    );
  }

  const ev = await getEvento(slug);
  if (!ev) {
    return Response.json({ ok: false, error: "No existe ese evento." }, { status: 404 });
  }

  // El reporte de la semana sale de la misma agenda, ya sin los eventos del
  // propio organizador.
  const todos = await getEventos();
  const semana = mismaSemana(ev, todos.filter((e) => !yaPaso(e)));

  const { asunto, texto, html } = armarInvitacion({
    ev,
    semana,
    link: linkDeConfirmacion(ev.slug),
  });

  const enviado = await mandarCorreo({ para, asunto, texto, html });
  if (!enviado.ok) {
    return Response.json(
      { ok: false, error: `No se pudo enviar (${enviado.motivo}).` },
      { status: 502 }
    );
  }

  // Queda anotado a quién y cuándo, para no escribirle dos veces. Si esto
  // falla, el mail ya salió igual: se avisa pero no se da por fallado.
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
              "Fecha de contacto": hoy,
              "Email del organizador": ev.emailOrganizador || para,
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

  return Response.json({ ok: true, anotado, asunto });
}
