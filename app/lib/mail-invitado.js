import {
  esc,
  bloque,
  parrafo,
  tenue,
  fila,
  boton,
  firma,
  pieLegal,
  pagina,
} from "./mail-base";
import { SITE } from "./site";
import { valoresDe } from "./campos-invitado";

// El mail que le pide a un invitado que revise su ficha antes de publicarla.
//
// Usa el mismo marco que los otros dos correos del sitio —el arreglo del modo
// oscuro de Apple Mail incluido— porque está compartido a propósito: con una
// copia por mail, el día que haya que tocar ese arreglo se arregla uno y nadie
// se entera.
//
// Lo que este mail NO hace: pedir nada. No hay favor, no hay difusión a cambio,
// no hay nada que vender. Vino a una charla, le armamos una página con su
// nombre, y lo mínimo es que la lea antes de que exista.

export function armarMailInvitado({ inv, link }) {
  const v = valoresDe(inv);
  const nombre = inv.nombre || "";

  const asunto = `${nombre}: te armamos tu ficha, ¿la revisás antes de publicarla?`;

  const cuerpo = [
    parrafo(`Hola ${esc(nombre)}:`),
    parrafo(
      `Salió tu episodio de <strong>${esc(SITE.name)}</strong> y armamos una ficha tuya en el sitio: quién sos, a qué te dedicás y de qué hablaste. Va a tener su propia dirección, así que cuando alguien te busque en Google te va a encontrar ahí.`
    ),
    parrafo(
      `Antes de publicarla queremos que la leas. Es todo tuyo: si algo está mal, lo corregís; si falta algo, lo agregás; y si preferís que algo no esté, lo sacamos.`
    ),
    bloque(
      [
        `<p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#93d5f7;">Así quedaría</p>`,
        fila("Nombre", esc(v.nombre || "—")),
        v.rol ? fila("A qué te dedicás", esc(v.rol)) : "",
        v.bio ? fila("Resumen", esc(v.bio)) : "",
        v.web ? fila("Tu sitio", esc(v.web)) : "",
        v.redes ? fila("Tus redes", esc(v.redes).replace(/\n/g, "<br>")) : "",
      ]
        .filter(Boolean)
        .join("")
    ),
    boton(link, "Revisar mi ficha"),
    tenue(
      `El link es solo tuyo y no vence. Nada se publica hasta que nos contestes.`
    ),
    parrafo(
      `Si te resulta más cómodo, respondé este mail y lo arreglamos por acá.`
    ),
    firma(
      `Gracias por venir.\nPablo Quiroga y Alexis Vidal\n${SITE.name}`
    ),
  ].join("");

  const texto = [
    `Hola ${nombre}:`,
    "",
    `Salió tu episodio de ${SITE.name} y armamos una ficha tuya en el sitio: quién sos, a qué te dedicás y de qué hablaste.`,
    "",
    "Antes de publicarla queremos que la leas. Si algo está mal lo corregís, si falta algo lo agregás, y si preferís que algo no esté, lo sacamos.",
    "",
    "ASÍ QUEDARÍA",
    `Nombre:   ${v.nombre || "—"}`,
    v.rol ? `Te dedicás a: ${v.rol}` : null,
    v.bio ? `Resumen:  ${v.bio}` : null,
    v.web ? `Tu sitio: ${v.web}` : null,
    v.redes ? `Tus redes: ${v.redes.replace(/\n/g, " · ")}` : null,
    "",
    `Revisala acá: ${link}`,
    "",
    "El link es solo tuyo y no vence. Nada se publica hasta que nos contestes.",
    "Si te resulta más cómodo, respondé este mail y lo arreglamos por acá.",
    "",
    "Gracias por venir.",
    "Pablo Quiroga y Alexis Vidal",
    SITE.name,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = pagina({
    adelanto: `Armamos tu ficha en ${SITE.name}. ¿La revisás antes de que se publique?`,
    cuerpo,
    pie: pieLegal(
      `Te escribimos porque estuviste en un episodio de ${esc(SITE.name)}.`,
      SITE.url
    ),
  });

  return { asunto, texto, html };
}
