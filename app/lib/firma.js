import crypto from "node:crypto";
import { SITE } from "./site";

// La firma del link de confirmación.
//
// Cada mail lleva una dirección propia del evento:
//
//   /agenda/hotelga/confirmar?f=3a91c0f7d2b45e68
//
// Ese "f" es el nombre del evento pasado por una cuenta que solo se puede
// hacer con una clave que vive en Vercel. Sin la clave no se puede calcular,
// así que nadie puede escribir la dirección de otro evento y verificarlo.
//
// No es una contraseña ni identifica a una persona: el link llega al mail del
// organizador y lo único que habilita es marcar ESE evento como confirmado.
// Si lo reenvía a un colega y confirma el colega, para nosotros es lo mismo.

const CLAVE = process.env.AGENDA_FIRMA_SECRET || "";
// 16 caracteres hexadecimales: 64 bits. Adivinarlo a fuerza bruta no es una
// posibilidad práctica, y el link entra cómodo en un mail.
const LARGO = 16;

export function hayClave() {
  return CLAVE.length >= 16;
}

export function firmar(slug) {
  if (!hayClave()) {
    throw new Error(
      "Falta AGENDA_FIRMA_SECRET (o es muy corta): no se pueden firmar los links de confirmación."
    );
  }
  return crypto
    .createHmac("sha256", CLAVE)
    .update(`agenda:${slug}`)
    .digest("hex")
    .slice(0, LARGO);
}

export function firmaValida(slug, firma) {
  if (!hayClave() || !slug || typeof firma !== "string") return false;

  const esperada = firmar(slug);
  // Comparación de tiempo constante: comparar con === filtra información por
  // el tiempo que tarda en fallar.
  if (firma.length !== esperada.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada));
  } catch {
    return false;
  }
}

// La clave de la vista del equipo.
//
// Es una sola para todos y no vence: la idea es pegarla en el grupo una vez y
// que el equipo la tenga. No abre el panel ni deja tocar nada, solo mostrar la
// lista de lo que hay para publicar. Si alguna vez hay que cortarla, se cambia
// AGENDA_FIRMA_SECRET en Vercel y el link viejo deja de servir —ojo que eso
// también invalida los links de confirmación que estén dando vueltas.
export function claveEquipo() {
  if (!hayClave()) {
    throw new Error("Falta AGENDA_FIRMA_SECRET: no se puede armar el link del equipo.");
  }
  return crypto
    .createHmac("sha256", CLAVE)
    .update("equipo:difusion")
    .digest("hex")
    .slice(0, 20);
}

export function claveEquipoValida(clave) {
  if (!hayClave() || typeof clave !== "string") return false;
  const esperada = claveEquipo();
  if (clave.length !== esperada.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(clave), Buffer.from(esperada));
  } catch {
    return false;
  }
}

export function linkDelEquipo() {
  return `${SITE.url}/equipo/${claveEquipo()}`;
}

export function linkDeConfirmacion(slug) {
  return `${SITE.url}/agenda/${slug}/confirmar?f=${firmar(slug)}`;
}
