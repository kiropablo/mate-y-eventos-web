import { haySesion } from "../../../lib/admin";
import { getInvitado } from "../../../lib/invitados";
import { firmarInvitado, hayClave } from "../../../lib/firma";
import { armarMailInvitado } from "../../../lib/mail-invitado";
import { mandarCorreo } from "../../../lib/correo";
import {
  getInvitadosAirtable,
  registroDeFicha,
  guardarEnAirtable,
} from "../../../lib/invitados-airtable";
import { SITE } from "../../../lib/site";

// "Pedirle que revise su ficha": manda el mail con el link firmado.
//
// El mail sale primero y la fecha se anota DESPUÉS de que salió, nunca antes.
// Al revés, un envío fallado dejaría la ficha marcada como "ya le escribimos" y
// el invitado esperando para siempre un correo que nunca llegó, sin forma de
// darse cuenta. Es la misma regla que el aviso de fecha de la agenda.

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }
  if (!hayClave()) {
    return Response.json(
      {
        ok: false,
        error: "Falta AGENDA_FIRMA_SECRET en Vercel: sin esa clave no se puede armar el link.",
      },
      { status: 500 }
    );
  }

  let slug = "";
  let paraForzado = "";
  let igual = false;
  try {
    const body = await request.json();
    slug = String(body?.slug || "");
    // Se puede cambiar el destinatario antes de mandar, igual que con los
    // organizadores: el que está cargado en Airtable no siempre es el que hay
    // que usar.
    paraForzado = String(body?.para || "").trim();
    igual = body?.igual === true;
  } catch {
    slug = "";
  }
  if (!slug) {
    return Response.json({ ok: false, error: "Falta la ficha." }, { status: 400 });
  }

  const inv = getInvitado(slug, { incluirBorradores: true });
  if (!inv) {
    return Response.json({ ok: false, error: "No existe esa ficha." }, { status: 404 });
  }

  const registros = await getInvitadosAirtable();
  const registro = registroDeFicha(registros, inv);
  const para = paraForzado || registro?.email || "";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(para)) {
    return Response.json(
      {
        ok: false,
        error: registro
          ? `No tenemos el mail de ${inv.nombre}. Cargalo en Airtable, en «Invitados MyE», o escribilo acá antes de mandar.`
          : `La ficha de ${inv.nombre} no está unida a ningún registro de Airtable, así que no sabemos a quién escribirle. Escribí el mail acá abajo y se manda igual.`,
      },
      { status: 400 }
    );
  }

  // Si ya se le escribió, se avisa y se deja decidir en vez de mandar de nuevo
  // sin que nadie se entere.
  if (registro?.pedidoEl && !igual) {
    return Response.json(
      { ok: false, yaPedido: registro.pedidoEl, error: "" },
      { status: 409 }
    );
  }

  const link = `${SITE.url}/invitados/${inv.slug}/confirmar?f=${firmarInvitado(inv.slug)}`;
  const { asunto, texto, html } = armarMailInvitado({ inv, link });

  try {
    await mandarCorreo({ para, asunto, texto, html });
  } catch (e) {
    return Response.json(
      { ok: false, error: `No salió el mail: ${e?.message || "error de envío"}` },
      { status: 502 }
    );
  }

  // Salió. Recién ahora se anota, y si esto falla el mail ya está mandado: se
  // avisa, pero no se dice que falló el envío.
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  let anotado = true;
  if (registro) {
    anotado = await guardarEnAirtable(registro.id, {
      "Le pedimos que revise el": hoy,
      // Se deja escrita la ficha a la que corresponde, así la próxima vez el
      // vínculo es explícito y no depende de que los nombres coincidan.
      ...(registro.ficha ? {} : { Ficha: inv.slug }),
    });
  } else {
    anotado = false;
  }

  return Response.json({
    ok: true,
    para,
    fecha: hoy,
    anotado,
    aviso: anotado
      ? ""
      : "El mail salió, pero no se pudo anotar en Airtable. Si volvés a apretar, se le manda de nuevo.",
  });
}
