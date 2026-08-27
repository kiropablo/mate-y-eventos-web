import { SITE } from "./site";

// El marco compartido de los mails que salen del panel.
//
// Está acá y no repetido en cada mail por una razón concreta: el arreglo del
// modo oscuro de Apple Mail son cuatro líneas del <head>, y sin eso el mail
// llega ilegible. Si cada mail tuviera su copia, el día que haya que tocarlo
// se va a arreglar uno y el otro no, y nadie se va a enterar hasta que un
// organizador conteste que no se entiende nada.
//
// Lo que va acá es el envoltorio y los ladrillos. Lo que dice cada mail vive
// en su propio archivo, y los textos editables en content/mensajes/.

export const esc = (t) =>
  String(t ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Convierte en enlace las direcciones que quedaron sueltas en el texto.
//
// Los textos editables se escriben en plano, porque también salen en la
// versión sin formato del mail. En la versión con formato una dirección
// escrita a mano queda como texto muerto: el que la quiere abrir tiene que
// copiarla. Se aplica DESPUÉS de escapar, así que lo que entra ya es seguro.
//
// El signo final se deja afuera del enlace a propósito: "…/verificado: elegís"
// lleva dos puntos que no son parte de la dirección.
export const conLinks = (html) =>
  String(html || "").replace(
    /(https?:\/\/[^\s<]+?)([.,:;)]?)(?=\s|$)/g,
    (entero, url, signo) =>
      `<a href="${url}" style="color:#c22e70;">${url}</a>${signo}`
  );

// Una fila del mail. Todo el cuerpo se arma con estas, porque en un mail no
// se puede usar un <div> y confiar: hay clientes que todavía necesitan tablas.
export const bloque = (contenido, extra = "") =>
  `<tr><td class="pad" style="padding:${extra || "0 34px"};">${contenido}</td></tr>`;

export const parrafo = (t, m = "0 0 16px") =>
  `<p class="txt" style="margin:${m};font-size:16px;line-height:1.62;color:#3a3548;">${t}</p>`;

export const tenue = (t, m = "0 0 20px") =>
  `<p class="tenue" style="margin:${m};font-size:14.5px;line-height:1.6;color:#6c667e;">${t}</p>`;

export const fila = (rotulo, valor) =>
  `<tr><td class="tenue" style="padding:2px 14px 2px 0;color:#6c667e;white-space:nowrap;">${rotulo}</td><td class="txt" style="padding:2px 0;color:#3a3548;">${esc(valor)}</td></tr>`;

// El botón. Va en tabla y no como <a> con padding porque Outlook ignora el
// padding de los enlaces y el botón queda como un link suelto.
export const boton = (href, texto) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="#ea478a" style="background:#ea478a;border-radius:6px;">
        <a href="${esc(href)}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${esc(texto)}</a>
      </td>
    </tr></table>`;

// La firma libre: un renglón por línea. La primera va normal, la segunda en
// negrita —que es el nombre— y las de abajo en gris. Se dibuja igual con uno,
// dos o cuatro renglones, sin tocar el código.
export const firma = (texto) =>
  `<p class="txt" style="margin:0;font-size:16px;line-height:1.62;color:#3a3548;">
      ${String(texto || "")
        .split("\n")
        .map((l, i) =>
          i === 1
            ? `<strong class="fuerte" style="color:#14111c;">${esc(l)}</strong>`
            : i === 0
              ? esc(l)
              : `<span class="tenue" style="font-size:14px;color:#6c667e;">${esc(l)}</span>`
        )
        .join("<br>\n      ")}<br>
      <a href="${esc(SITE.url)}" style="font-size:14px;color:#c22e70;text-decoration:none;">mateyeventos.com</a>
    </p>`;

// El envoltorio entero: cabecera oscura con la marca, el cuerpo que le pasen,
// y el pie gris con la baja.
//
// El "adelanto" es el texto que muestran Gmail y Apple al lado del asunto en
// la bandeja. Va en un div escondido: si no se pone, muestran las primeras
// palabras del mail, que suelen ser "Hola:".
export function pagina({ adelanto, cuerpo, pie }) {
  return `<!DOCTYPE html>
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
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">${esc(adelanto)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eceaf0" style="background:#eceaf0;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" class="marco fondo" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <tr><td bgcolor="#010004" class="pad" style="background:#010004;padding:28px 34px 24px;">
    <div style="font-size:18px;line-height:1.1;font-weight:bold;color:#ffffff;letter-spacing:2px;">MATE&nbsp;Y&nbsp;EVENTOS</div>
    <div style="font-size:13px;line-height:1.5;color:#93d5f7;padding-top:6px;">${esc(SITE.tagline)}</div>
  </td></tr>
  <tr><td bgcolor="#ea478a" style="background:#ea478a;height:4px;line-height:4px;font-size:4px;">&nbsp;</td></tr>
${cuerpo}

  <tr><td bgcolor="#f7f7fa" class="caja pad" style="background:#f7f7fa;border-top:1px solid #e3e1e9;padding:18px 34px 22px;">
    <p class="tenue" style="margin:0;font-size:12.5px;line-height:1.6;color:#8a8498;">${pie}</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}
