import { formatRango, nombreConAnio } from "./agenda";
import { DIAS_PARA_DIFUNDIR, llegamosADifundir, lunesDe, MAXIMO_SEMANA } from "./semana";
import { SITE } from "./site";

// El mail que le llega al organizador.
//
// El orden no es casual: arranca con el dato que le sirve —qué otros eventos
// caen su misma semana— y recién después dice quiénes somos. Antes de pedirle
// nada ya le dimos algo, y eso justifica el mail aunque no conteste.
//
// Se arma acá y no en la ruta porque el texto plano y el HTML tienen que
// decir exactamente lo mismo: si se escribieran por separado, tarde o
// temprano uno de los dos queda viejo.

const esc = (t) =>
  String(t ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function diaYMes(fechaISO) {
  if (!fechaISO) return "";
  const [, m, d] = fechaISO.slice(0, 10).split("-").map(Number);
  return `${d} de ${MES[m - 1]}`;
}

// El asunto: sus datos adentro para que un error se vea sin abrir el mail.
// Se prueba con la sede, después con la ciudad, y si ninguna entra va sin
// lugar. Un asunto que se corta a la mitad no sirve para nada.
const LARGO_ASUNTO = 78;

function armarAsunto(nombre, cuando, ev) {
  if (!ev.fechaInicio) {
    return `${nombre} está publicado en nuestra agenda — ¿están bien los datos?`;
  }
  for (const lugar of [ev.venue, ev.ciudad, ""]) {
    const asunto = `${nombre}: ${cuando}${lugar ? ` en ${lugar}` : ""} — ¿está bien?`;
    if (asunto.length <= LARGO_ASUNTO || !lugar) return asunto;
  }
  return `${nombre}: ${cuando} — ¿está bien?`;
}

// "No cuento Intersec, que la organizan ustedes."
function frasePropios(propios) {
  const nombres = propios.map((p) => p.nombre);
  const lista =
    nombres.length === 1
      ? nombres[0]
      : `${nombres.slice(0, -1).join(", ")} ni ${nombres[nombres.length - 1]}`;
  return `No cuento ${lista}, que ${nombres.length === 1 ? "lo organizan" : "los organizan"} ustedes.`;
}

export function armarInvitacion({ ev, semana = [], propios = [], link }) {
  const nombre = nombreConAnio(ev);
  const cuando = formatRango(ev) || "Fechas por anunciar";
  const donde = [ev.venue, ev.ciudad].filter(Boolean).join(", ");
  // La semana se agrupa de lunes a domingo, así que se la nombra por su
  // lunes. Si se usara la fecha del evento, un evento que arranca domingo
  // titularía "la semana del 20" arriba de una lista que empieza el 14.
  const arranque = diaYMes(lunesDe(ev.fechaInicio) || ev.fechaInicio);
  const difundimos = llegamosADifundir(ev);
  const hay = semana.length;

  // Uno o varios: el plural va acá y no repetido en cada frase, que es como
  // salía "los otros 1 eventos".
  // Dos formas porque las dos frases piden distinto artículo:
  //   "Hotelga y EL OTRO EVENTO de esa semana"  (no se usa hoy)
  //   "esa semana hay OTRO EVENTO en la región" (cuerpo)
  const cuantosHay = hay === 1 ? "otro evento" : `otros ${hay} eventos`;

  // El asunto lleva SUS datos, no los nuestros ni los de terceros: así puede
  // detectar un error sin abrir el mail. Si la fecha está mal, la ve en la
  // bandeja de entrada.
  //
  // La sede solo entra si el asunto no se vuelve ilegible: se prueba con
  // sede, después con ciudad, y si ninguna entra va sin lugar.
  const asunto = armarAsunto(nombre, cuando, ev);

  const titular = `Publicamos ${ev.nombre} en nuestra agenda. ¿Están bien estos datos?`;

  // Si la lista vino recortada, se avisa: decir "los otros 5" cuando hay
  // nueve es afirmar algo falso sobre su propia semana.
  const recortada = hay >= MAXIMO_SEMANA;

  const filasSemana = semana.map((o) => ({
    nombre: o.nombre,
    detalle: [formatRango(o), o.ciudad || o.pais].filter(Boolean).join(" · "),
  }));

  // ---------------------------------------------------------------- texto
  const texto = [
    "Hola:",
    "",
    `Publicamos ${ev.nombre} en nuestra agenda de eventos de la industria. Así quedó:`,
    "",
    `  ${nombre}`,
    `  Fechas: ${cuando}`,
    donde ? `  Sede: ${donde}` : null,
    ev.organizador ? `  Organiza: ${ev.organizador}` : null,
    ev.web ? `  Sitio: ${ev.web.replace(/^https?:\/\//, "").replace(/\/$/, "")}` : null,
    "",
    "Los datos los armamos con información pública, así que puede haber algo desactualizado. Antes de dejarlo así queremos que lo mires vos.",
    "",
    `Repasar los datos: ${link}`,
    "",
    "Son dos minutos: marcás lo que está bien, corregís lo que no. Si está todo correcto, le encendemos el sello Verificado, que dice que los datos los confirmó el organizador y no que los copiamos de algún lado.",
    "",
    "—",
    "",
    `Soy Pablo Quiroga, de ${SITE.name}: un podcast de la industria de eventos de Latinoamérica y una agenda pública con más de 260 eventos de la región.`,
    hay ? "" : null,
    hay
      ? `De paso, un dato que capaz te sirve. Esa misma semana, además de ${ev.nombre}, hay ${cuantosHay} en la agenda:`
      : null,
    hay ? "" : null,
    ...filasSemana.map((f) => `- ${f.nombre} — ${f.detalle}`),
    hay && recortada ? "" : null,
    hay && recortada
      ? "Son los primeros que aparecen en la agenda; puede haber alguno más."
      : null,
    propios.length ? "" : null,
    propios.length ? `${frasePropios(propios)}` : null,
    difundimos ? "" : null,
    difundimos
      ? `Y si confirmás los datos, te damos una mano con la difusión: nos interesa que los eventos de la industria se conozcan, así que los verificados los publicamos en las redes de ${SITE.name}. Cuando hay varios en la misma semana, van juntos en un listado.`
      : null,
    difundimos
      ? `Para llegar a tiempo necesitamos la confirmación ${DIAS_PARA_DIFUNDIR} días antes.`
      : null,
    "",
    "Cualquier cosa, respondeme acá.",
    "",
    "Un abrazo,",
    "Pablo Quiroga",
    `Co-creador de ${SITE.name}, junto a Alexis Vidal`,
    SITE.url,
    "",
    "—",
    `Te escribimos porque ${nombre} figura en nuestra agenda pública de eventos (${SITE.url}/agenda). Si preferís que lo saquemos, o que no te escribamos más, respondé este mail con la palabra "baja" y listo.`,
  ]
    .filter((l) => l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  // ----------------------------------------------------------------- html
  const bloque = (contenido, extra = "") =>
    `<tr><td class="pad" style="padding:${extra || "0 34px"};">${contenido}</td></tr>`;
  const parrafo = (t, m = "0 0 16px") =>
    `<p class="txt" style="margin:${m};font-size:16px;line-height:1.62;color:#3a3548;">${t}</p>`;
  const tenue = (t, m = "0 0 20px") =>
    `<p class="tenue" style="margin:${m};font-size:14.5px;line-height:1.6;color:#6c667e;">${t}</p>`;

  const fila = (rotulo, valor) =>
    `<tr><td class="tenue" style="padding:2px 14px 2px 0;color:#6c667e;white-space:nowrap;">${rotulo}</td><td class="txt" style="padding:2px 0;color:#3a3548;">${esc(valor)}</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<style>
  :root { color-scheme: light only; supported-color-schemes: light only; }
  [data-ogsc] .txt, [data-ogsb] .txt { color:#3a3548 !important; }
  [data-ogsc] .fuerte, [data-ogsb] .fuerte { color:#14111c !important; }
  [data-ogsc] .tenue, [data-ogsb] .tenue { color:#6c667e !important; }
  [data-ogsc] .fondo, [data-ogsb] .fondo { background:#ffffff !important; }
  [data-ogsc] .caja, [data-ogsb] .caja { background:#f7f7fa !important; }
  @media only screen and (max-width:620px){
    .marco{width:100% !important}
    .pad{padding-left:22px !important;padding-right:22px !important}
    .h1{font-size:21px !important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#eceaf0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">Así lo publicamos en la agenda. Si algo está mal, se corrige en dos minutos.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eceaf0" style="background:#eceaf0;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" class="marco fondo" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <tr><td bgcolor="#010004" class="pad" style="background:#010004;padding:28px 34px 24px;">
    <div style="font-size:18px;line-height:1.1;font-weight:bold;color:#ffffff;letter-spacing:2px;">MATE&nbsp;Y&nbsp;EVENTOS</div>
    <div style="font-size:13px;line-height:1.5;color:#93d5f7;padding-top:6px;">${esc(SITE.tagline)}</div>
  </td></tr>
  <tr><td bgcolor="#ea478a" style="background:#ea478a;height:4px;line-height:4px;font-size:4px;">&nbsp;</td></tr>

  ${bloque(
    `<h1 class="h1 fuerte" style="margin:0 0 18px;font-size:23px;line-height:1.26;color:#14111c;font-weight:bold;">${esc(titular)}</h1>${parrafo("Hola:", "0 0 22px")}`,
    "32px 34px 6px"
  )}

  ${bloque(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f7fa" class="caja" style="background:#f7f7fa;border-left:3px solid #ea478a;border-radius:6px;"><tr><td style="padding:22px 24px;">
      <div class="tenue" style="font-size:11px;letter-spacing:1.6px;color:#6c667e;padding-bottom:10px;">ASÍ ESTÁ PUBLICADO HOY</div>
      <div class="fuerte" style="font-size:21px;line-height:1.3;font-weight:bold;color:#14111c;padding-bottom:14px;">${esc(nombre)}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:15px;line-height:1.6;color:#3a3548;">
        ${fila("Fechas", cuando)}
        ${donde ? fila("Sede", donde) : ""}
        ${ev.organizador ? fila("Organiza", ev.organizador) : ""}
        ${ev.web ? fila("Sitio", ev.web.replace(/^https?:\/\//, "").replace(/\/$/, "")) : ""}
      </table>
    </td></tr></table>`)}

  ${bloque(
    parrafo(
      "Los datos los armamos con información pública, así que puede haber algo desactualizado. Antes de dejarlo así queremos que lo mires vos.",
      "0 0 6px"
    ),
    "22px 34px 4px"
  )}

  <tr><td align="center" class="pad" style="padding:20px 34px 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="#ea478a" style="background:#ea478a;border-radius:6px;">
        <a href="${esc(link)}" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">Repasar los datos</a>
      </td>
    </tr></table>
    ${tenue("Son dos minutos: marcás lo que está bien, corregís lo que no.", "12px 0 0")}
  </td></tr>

  ${bloque(
    parrafo(
      `Si está todo correcto, le encendemos el sello <strong class="fuerte" style="color:#14111c;">Verificado</strong>: dice que los datos los confirmó el organizador y no que los copiamos de algún lado.`,
      "0 0 22px"
    ),
    "18px 34px 4px"
  )}

  ${bloque(`<div style="border-top:1px solid #e3e1e9;height:1px;line-height:1px;font-size:1px;">&nbsp;</div>`)}

  ${bloque(
    parrafo(
      `Soy Pablo Quiroga, de <strong class="fuerte" style="color:#14111c;">${esc(SITE.name)}</strong>: un podcast de la industria de eventos de Latinoamérica y una agenda pública con más de 260 eventos de la región.`,
      "0 0 18px"
    ) +
      (hay
        ? parrafo(
            `De paso, un dato que capaz te sirve. Esa misma semana, además de ${esc(ev.nombre)}, hay ${esc(cuantosHay)} en la agenda:`,
            "0 0 14px"
          )
        : ""),
    "22px 34px 4px"
  )}

  ${
    hay
      ? bloque(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f7fa" class="caja" style="background:#f7f7fa;border-radius:6px;"><tr><td style="padding:16px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14.5px;line-height:1.5;color:#3a3548;">
        ${filasSemana
          .map(
            (f, i) =>
              `<tr><td class="txt" style="padding:0 0 ${i === filasSemana.length - 1 ? "0" : "9px"};color:#3a3548;"><strong class="fuerte" style="color:#14111c;">${esc(f.nombre)}</strong><br><span class="tenue" style="color:#6c667e;font-size:13.5px;">${esc(f.detalle)}</span></td></tr>`
          )
          .join("")}
      </table>
    </td></tr></table>`)
      : ""
  }

  ${bloque(
    (recortada
      ? tenue("Son los primeros que aparecen en la agenda; puede haber alguno más.", "0 0 12px")
      : "") +
      (propios.length ? tenue(esc(frasePropios(propios))) : "") +
      (difundimos
        ? parrafo(
            `<strong class="fuerte" style="color:#14111c;">Y si confirmás los datos, te damos una mano con la difusión.</strong> Nos interesa que los eventos de la industria se conozcan, así que los verificados los publicamos en las redes de ${esc(SITE.name)}. Cuando hay varios en la misma semana, van juntos en un listado.`,
            "0 0 14px"
          ) + tenue(`Para llegar a tiempo necesitamos la confirmación ${DIAS_PARA_DIFUNDIR} días antes.`)
        : ""),
    "14px 34px 4px"
  )}

  ${bloque(
    parrafo("Cualquier cosa, respondeme acá.", "0 0 22px") +
      `<p class="txt" style="margin:0;font-size:16px;line-height:1.62;color:#3a3548;">
      Un abrazo,<br>
      <strong class="fuerte" style="color:#14111c;">Pablo Quiroga</strong><br>
      <span class="tenue" style="font-size:14px;color:#6c667e;">Co-creador de ${esc(SITE.name)}, junto a Alexis Vidal</span><br>
      <a href="${esc(SITE.url)}" style="font-size:14px;color:#c22e70;text-decoration:none;">mateyeventos.com</a>
    </p>`,
    "8px 34px 30px"
  )}

  <tr><td bgcolor="#f7f7fa" class="caja pad" style="background:#f7f7fa;border-top:1px solid #e3e1e9;padding:18px 34px 22px;">
    <p class="tenue" style="margin:0;font-size:12.5px;line-height:1.6;color:#8a8498;">Te escribimos porque ${esc(nombre)} figura en nuestra <a href="${esc(SITE.url)}/agenda" style="color:#8a8498;">agenda pública de eventos</a>. Si preferís que lo saquemos, o que no te escribamos más, respondé este mail con la palabra <strong>baja</strong> y listo.</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  return { asunto, texto, html };
}
