import crypto from "crypto";
import { cookies } from "next/headers";

// Seguridad del panel interno.
// La contraseña vive en Vercel (variable ADMIN_PASSWORD), nunca en el código.
// En la cookie no se guarda la contraseña sino una huella suya.

export const COOKIE = "mye_admin";
export const DURACION = 60 * 60 * 24 * 30; // 30 días

// La huella lleva un secreto del servidor, no solo la contraseña.
//
// POR QUÉ. Antes era sha256("mate-y-eventos::" + contraseña), y ese prefijo
// está escrito en este archivo, que vive en un repositorio PÚBLICO. O sea que
// el valor de la cookie era derivable de la contraseña con un dato que
// cualquiera podía leer: quien consiguiera la cookie —una máquina prestada, un
// navegador compartido— podía probar contraseñas contra ella OFFLINE, sin
// límite, sin red y sin que el tope de intentos del login se enterara.
//
// Con el secreto adentro, la cookie deja de ser derivable: para probar una
// contraseña hay que tener también algo que solo está en Vercel.
//
// SE USA AGENDA_FIRMA_SECRET y no una variable nueva para no sumarte otra cosa
// que cargar. El efecto lateral, que conviene saber: si algún día se rota esa
// clave, además de invalidar los links de confirmación de los organizadores
// cierra la sesión del panel. Las dos cosas se arreglan solas entrando de
// nuevo; ninguna pierde datos.
//
// Y SI FALTA LA VARIABLE, NO SE CAE A LA VERSIÓN DÉBIL. Devuelve null y nadie
// entra, con un aviso en los registros. Caer en silencio a la huella vieja
// sería dejar la puerta como estaba creyendo que se arregló, que es la regla 8.
function secreto() {
  const s = process.env.AGENDA_FIRMA_SECRET;
  if (!s) {
    console.warn(
      "[admin] falta AGENDA_FIRMA_SECRET: sin esa clave no se puede validar la sesión del panel."
    );
    return null;
  }
  return s;
}

export function huella(texto) {
  const s = secreto();
  if (!s) return null;
  return crypto
    .createHmac("sha256", s)
    .update(`mate-y-eventos::${texto || ""}`)
    .digest("hex");
}

// Huella de la contraseña configurada. Si no hay contraseña, devuelve null.
export function huellaEsperada() {
  const clave = process.env.ADMIN_PASSWORD;
  if (!clave) return null;
  return huella(clave);
}

// ¿La visita tiene sesión abierta?
export function haySesion() {
  const esperada = huellaEsperada();
  if (!esperada) return false;

  const valor = cookies().get(COOKIE)?.value;
  if (typeof valor !== "string" || valor.length !== esperada.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(valor), Buffer.from(esperada));
  } catch {
    return false;
  }
}
