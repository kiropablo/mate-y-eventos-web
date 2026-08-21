import { SITE } from "./site";

// Mandar mails desde el sitio, vía Resend.
//
// Se usa para los dos avisos del circuito de verificación: el que nos llega a
// nosotros cuando un organizador confirma su ficha, y el que le llega a él
// cuando efectivamente difundimos su evento.
//
// Regla de oro: un mail que no sale NUNCA puede voltear la operación que lo
// disparó. Si el organizador confirmó su ficha, eso ya quedó guardado en la
// base; que además falle el aviso es un problema nuestro, no suyo. Por eso
// todo acá devuelve un resultado y no tira error.

const CLAVE = process.env.RESEND_API_KEY || "";

// De dónde salen. El dominio tiene que estar verificado en Resend.
const DESDE = process.env.CORREO_DESDE || `${SITE.name} <agenda@mateyeventos.com>`;
// Adónde contesta el organizador si le da a "responder". Va a la casilla que
// leemos todos los días, no a una que hay que acordarse de mirar.
const RESPONDER_A = process.env.CORREO_RESPONDER_A || SITE.email;
// Adónde llegan los avisos internos.
const INTERNO = process.env.CORREO_INTERNO || SITE.email;

export function hayCorreo() {
  return CLAVE.length > 0;
}

export function correoInterno() {
  return INTERNO;
}

export async function mandarCorreo({ para, asunto, texto, html, responderA }) {
  if (!CLAVE) {
    console.warn(`[correo] Sin RESEND_API_KEY: no se mandó "${asunto}".`);
    return { ok: false, motivo: "sin-clave" };
  }
  if (!para || !asunto || (!texto && !html)) {
    return { ok: false, motivo: "faltan-datos" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLAVE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: DESDE,
        to: Array.isArray(para) ? para : [para],
        subject: asunto,
        ...(texto ? { text: texto } : {}),
        ...(html ? { html } : {}),
        reply_to: responderA || RESPONDER_A,
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      console.warn(`[correo] Resend ${res.status}: ${detalle.slice(0, 200)}`);
      return { ok: false, motivo: `http-${res.status}` };
    }

    const data = await res.json();
    return { ok: true, id: data?.id || null };
  } catch (error) {
    console.warn(`[correo] No se pudo mandar "${asunto}": ${error.message}`);
    return { ok: false, motivo: "error-de-red" };
  }
}
