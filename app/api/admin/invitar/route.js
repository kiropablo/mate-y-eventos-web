import { revalidateTag } from "next/cache";
import { haySesion } from "../../../lib/admin";
import { getEventos, getEventoDelPanel, yaPaso } from "../../../lib/agenda";
import { mismaSemana, propiosEsaSemana, MAXIMO_SEMANA } from "../../../lib/semana";
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
  if (!esEmail(para)) {
    return Response.json(
      { ok: false, error: "Ese email no parece válido." },
      { status: 400 }
    );
  }

  // Una sola lectura, sin caché, y de ahí sale todo: la ficha y la semana.
  // Antes la ficha se leía fresca y la semana del caché de una hora, así que
  // el mail podía listar eventos distintos de los que el panel mostraba —o un
  // evento recién borrado— sin que nada lo delatara.
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
        error: `Ese evento está en "${ev.estado || "sin estado"}". Aprobalo antes de mandar la invitación.`,
      },
      { status: 409 }
    );
  }

  // Si ya se le escribió, no se manda de nuevo salvo que se pida a propósito.
  // Sin esto, cualquier reintento —se cortó internet, el botón se apretó dos
  // veces, la pestaña se recargó— le mandaba el mismo mail dos veces al mismo
  // organizador, que es exactamente lo que no puede pasar en un primer envío.
  if (ev.fechaContacto && !forzar) {
    return Response.json(
      { ok: false, yaContactado: ev.fechaContacto, error: `Ya se le escribió el ${ev.fechaContacto}.` },
      { status: 409 }
    );
  }

  const vigentes = todos.filter((e) => !yaPaso(e));
  // Se piden uno más de los que entran en el mail: con eso el texto sabe si
  // la lista quedó recortada de verdad o si esos son todos los que hay.
  const semana = mismaSemana(ev, vigentes, { max: MAXIMO_SEMANA + 1 });
  const propios = propiosEsaSemana(ev, vigentes);

  const { asunto, texto, html } = armarInvitacion({
    ev,
    semana,
    propios,
    link: linkDeConfirmacion(ev.slug),
    cuantosEventos: vigentes.length,
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
