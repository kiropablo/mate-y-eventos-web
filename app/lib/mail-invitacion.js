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

export function armarInvitacion({ ev, semana = [], link }) {
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
  //   "Hotelga y EL OTRO EVENTO de esa semana"  (asunto)
  //   "esa semana hay OTRO EVENTO en la región" (cuerpo)
  const cuantos = hay === 1 ? "el otro evento" : `los otros ${hay} eventos`;
  const cuantosHay = hay === 1 ? "otro evento" : `otros ${hay} eventos`;
  const evento = hay === 1 ? "evento" : "eventos";

  // El asunto lleva el dato, no la marca: es lo que hace que lo abran. Y el
  // nombre va con el año de ESTA edición en todos lados, igual que en la caja
  // de datos: si el asunto dijera el año viejo y la caja el nuevo, el mail se
  // contradiría solo.
  const asunto = hay
    ? `${nombre} y ${cuantos} de esa semana`
    : `${nombre} está publicado en la agenda de ${SITE.name}`;

  const titular = hay
    ? `La semana del ${arranque} hay ${hay} ${evento} más`
    : `${nombre} ya está en nuestra agenda`;

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
    hay
      ? `Además de ${nombre}, la semana del ${arranque} en nuestra agenda hay ${cuantosHay} en la región:`
      : `${nombre} está publicado en nuestra agenda de eventos de la industria.`,
    "",
    ...filasSemana.map((f) => `- ${f.nombre} — ${f.detalle}`),
    hay ? "" : null,
    hay
      ? `Te lo paso porque a veces una superposición no está en el radar.${recortada ? " Son los primeros que aparecen en la agenda; puede haber alguno más." : ""}`
      : null,
    hay ? "" : null,
    `Soy Pablo Quiroga, de ${SITE.name}: un podcast de la industria de eventos de Latinoamérica y una agenda pública con más de 260 eventos de la región.`,
    "",
    `Así está publicado hoy:`,
    "",
    `  ${nombre}`,
    `  ${cuando}`,
    donde ? `  ${donde}` : null,
    ev.organizador ? `  Organiza: ${ev.organizador}` : null,
    "",
    "La ficha la armamos nosotros con información pública, y antes de darla por buena queremos que la repases vos. Son dos minutos: entrás, marcás lo que está bien y corregís lo que no.",
    "",
    `Repasar la ficha: ${link}`,
    "",
    "Cuando lo confirmes le encendemos el sello Verificado: dice que los datos los confirmó el organizador y no que los copiamos de algún lado. Te pasamos el código por si querés ponerlo en tu web.",
    "",
    difundimos
      ? "Y te damos una mano con la difusión. Nos interesa que los eventos de la industria se conozcan, así que los que están verificados los publicamos en las redes de Mate y Eventos. Cuando hay varios en la misma semana, van juntos en un listado."
      : null,
    difundimos
      ? `Para llegar a tiempo necesitamos la confirmación ${DIAS_PARA_DIFUNDIR} días antes del evento.`
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
    // Tres o más saltos seguidos quedan cuando un bloque opcional no se
    // escribe: se colapsan a un renglón en blanco.
    .replace(/\n{3,}/g, "\n\n");

  // ----------------------------------------------------------------- html
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
    .h1{font-size:22px !important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#eceaf0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">${esc(
    hay
      ? filasSemana.map((f) => f.nombre).join(", ")
      : "Te pedimos dos minutos para repasar los datos."
  )}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eceaf0" style="background:#eceaf0;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" class="marco fondo" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <tr><td bgcolor="#010004" class="pad" style="background:#010004;padding:28px 34px 24px;">
    <div style="font-size:18px;line-height:1.1;font-weight:bold;color:#ffffff;letter-spacing:2px;">MATE&nbsp;Y&nbsp;EVENTOS</div>
    <div style="font-size:13px;line-height:1.5;color:#93d5f7;padding-top:6px;">${esc(SITE.tagline)}</div>
  </td></tr>
  <tr><td bgcolor="#ea478a" style="background:#ea478a;height:4px;line-height:4px;font-size:4px;">&nbsp;</td></tr>

  <tr><td class="pad" style="padding:32px 34px 6px;">
    <h1 class="h1 fuerte" style="margin:0 0 20px;font-size:24px;line-height:1.24;color:#14111c;font-weight:bold;">${esc(titular)}</h1>
    <p class="txt" style="margin:0 0 16px;font-size:16px;line-height:1.62;color:#3a3548;">Hola:</p>
    <p class="txt" style="margin:0 0 18px;font-size:16px;line-height:1.62;color:#3a3548;">${
      hay
        ? `Además de <strong class="fuerte" style="color:#14111c;">${esc(nombre)}</strong>, esa semana en nuestra agenda hay ${esc(cuantosHay)} en la región:`
        : `<strong class="fuerte" style="color:#14111c;">${esc(nombre)}</strong> está publicado en nuestra agenda de eventos de la industria.`
    }</p>
  </td></tr>

  ${
    hay
      ? `<tr><td class="pad" style="padding:0 34px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f7fa" class="caja" style="background:#f7f7fa;border-radius:6px;"><tr><td style="padding:18px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:15px;line-height:1.5;color:#3a3548;">
        ${filasSemana
          .map(
            (f, i) =>
              `<tr><td class="txt" style="padding:0 0 ${i === filasSemana.length - 1 ? "0" : "10px"};color:#3a3548;"><strong class="fuerte" style="color:#14111c;">${esc(f.nombre)}</strong><br><span class="tenue" style="color:#6c667e;font-size:14px;">${esc(f.detalle)}</span></td></tr>`
          )
          .join("")}
      </table>
    </td></tr></table>
  </td></tr>
  <tr><td class="pad" style="padding:16px 34px 0;">
    <p class="tenue" style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#6c667e;">Te lo paso porque a veces una superposición no está en el radar.${recortada ? " Son los primeros que aparecen en la agenda; puede haber alguno más." : ""}</p>
  </td></tr>`
      : ""
  }

  <tr><td class="pad" style="padding:${hay ? "0" : "6px"} 34px 6px;">
    <p class="txt" style="margin:0 0 20px;font-size:16px;line-height:1.62;color:#3a3548;">Soy Pablo Quiroga, de <strong class="fuerte" style="color:#14111c;">${esc(SITE.name)}</strong>: un podcast de la industria de eventos de Latinoamérica y una agenda pública con más de 260 eventos de la región.</p>
  </td></tr>

  <tr><td class="pad" style="padding:0 34px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f7fa" class="caja" style="background:#f7f7fa;border-left:3px solid #ea478a;border-radius:6px;"><tr><td style="padding:20px 22px;">
      <div class="tenue" style="font-size:11px;letter-spacing:1.6px;color:#6c667e;padding-bottom:9px;">ASÍ ESTÁ PUBLICADO HOY</div>
      <div class="fuerte" style="font-size:19px;line-height:1.3;font-weight:bold;color:#14111c;padding-bottom:10px;">${esc(nombre)}</div>
      <div class="txt" style="font-size:15px;line-height:1.6;color:#3a3548;">${esc(cuando)}${donde ? `<br>${esc(donde)}` : ""}${ev.organizador ? `<br>Organiza: ${esc(ev.organizador)}` : ""}</div>
    </td></tr></table>
  </td></tr>

  <tr><td class="pad" style="padding:22px 34px 4px;">
    <p class="txt" style="margin:0 0 6px;font-size:16px;line-height:1.62;color:#3a3548;">La ficha la armamos nosotros con información pública, y antes de darla por buena queremos que la repases vos. Son dos minutos: entrás, marcás lo que está bien y corregís lo que no.</p>
  </td></tr>

  <tr><td align="center" class="pad" style="padding:20px 34px 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="#ea478a" style="background:#ea478a;border-radius:6px;">
        <a href="${esc(link)}" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">Repasar la ficha</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td class="pad" style="padding:24px 34px 4px;">
    <p class="txt" style="margin:0 0 16px;font-size:16px;line-height:1.62;color:#3a3548;">Cuando lo confirmes le encendemos el sello <strong class="fuerte" style="color:#14111c;">Verificado</strong>: dice que los datos los confirmó el organizador y no que los copiamos de algún lado. Te pasamos el código por si querés ponerlo en tu web.</p>
    ${
      difundimos
        ? `<p class="txt" style="margin:0 0 14px;font-size:16px;line-height:1.62;color:#3a3548;"><strong class="fuerte" style="color:#14111c;">Y te damos una mano con la difusión.</strong> Nos interesa que los eventos de la industria se conozcan, así que los que están verificados los publicamos en las redes de ${esc(SITE.name)}. Cuando hay varios en la misma semana, van juntos en un listado.</p>
    <p class="tenue" style="margin:0 0 20px;font-size:14.5px;line-height:1.6;color:#6c667e;">Para llegar a tiempo necesitamos la confirmación ${DIAS_PARA_DIFUNDIR} días antes del evento.</p>`
        : ""
    }
  </td></tr>

  <tr><td class="pad" style="padding:14px 34px 30px;">
    <p class="txt" style="margin:0 0 22px;font-size:16px;line-height:1.62;color:#3a3548;">Cualquier cosa, respondeme acá.</p>
    <p class="txt" style="margin:0;font-size:16px;line-height:1.62;color:#3a3548;">
      Un abrazo,<br>
      <strong class="fuerte" style="color:#14111c;">Pablo Quiroga</strong><br>
      <span class="tenue" style="font-size:14px;color:#6c667e;">Co-creador de ${esc(SITE.name)}, junto a Alexis Vidal</span><br>
      <a href="${esc(SITE.url)}" style="font-size:14px;color:#c22e70;text-decoration:none;">mateyeventos.com</a>
    </p>
  </td></tr>

  <tr><td bgcolor="#f7f7fa" class="caja pad" style="background:#f7f7fa;border-top:1px solid #e3e1e9;padding:18px 34px 22px;">
    <p class="tenue" style="margin:0;font-size:12.5px;line-height:1.6;color:#8a8498;">Te escribimos porque ${esc(nombre)} figura en nuestra <a href="${esc(SITE.url)}/agenda" style="color:#8a8498;">agenda pública de eventos</a>. Si preferís que lo saquemos, o que no te escribamos más, respondé este mail con la palabra <strong>baja</strong> y listo.</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;

  return { asunto, texto, html };
}
