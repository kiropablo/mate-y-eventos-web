import crypto from "crypto";
import { cookies } from "next/headers";

// Seguridad del panel interno.
// La contraseña vive en Vercel (variable ADMIN_PASSWORD), nunca en el código.
// En la cookie no se guarda la contraseña sino una huella suya.

export const COOKIE = "mye_admin";
export const DURACION = 60 * 60 * 24 * 30; // 30 días

export function huella(texto) {
  return crypto
    .createHash("sha256")
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
