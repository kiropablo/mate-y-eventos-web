import { formatRango, nombreConAnio } from "./agenda";
import { DIAS_PARA_DIFUNDIR, llegamosADifundir, lunesDe, MAXIMO_SEMANA } from "./semana";
import { SITE } from "./site";
import { esc, bloque, parrafo, tenue, fila, boton, firma, pagina } from "./mail-base";
import { getMensaje, reemplazar, MARCAS_BASE } from "./mensajes";

// El mail que le llega al organizador.
//
// El orden no es casual: arranca con el dato que le sirve —qué otros eventos
// caen su misma semana— y recién después dice quiénes somos. Antes de pedirle
// nada ya le dimos algo, y eso justifica el mail aunque no conteste.
//
// Se arma acá y no en la ruta porque el texto plano y el HTML tienen que
// decir exactamente lo mismo: si se escribieran por separado, tarde o
// temprano uno de los dos queda viejo.

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

function armarAsunto(nombre, cuando, ev, plantilla) {
  if (!ev.fechaInicio) {
    return `${nombre} está publicado en nuestra agenda — ¿están bien los datos?`;
  }
  // La plantilla la edita Pablo desde /admin. Si sacó el lugar, se usa tal
  // cual; si lo dejó, se prueba con sede y después con ciudad, y si el asunto
  // queda ilegible de largo se manda sin lugar.
  const conLugar = (lugar) =>
    reemplazar(plantilla, { evento: nombre, cuando, lugar }).replace(
      /\s+en\s*$|\s+en\s+—/,
      (t) => (t.includes("—") ? " —" : "")
    );
  if (!/\{lugar\}/.test(plantilla)) return conLugar("");
  // Los vacíos se sacan ANTES de probar. Si no, una sede vacía cortaba la
  // vuelta en la primera pasada y la ciudad no se probaba nunca: eventos con
  // ciudad cargada y sin sede salían con un asunto sin lugar, pudiendo tenerlo.
  for (const lugar of [ev.venue, ev.ciudad].filter(Boolean)) {
    const asunto = conLugar(lugar);
    if (asunto.length <= LARGO_ASUNTO) return asunto;
  }
  return conLugar("");
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

export function armarInvitacion({ ev, semana = [], propios = [], link, mensaje }) {
  const nombre = nombreConAnio(ev);
  // Los textos editables. Si nunca se tocaron, son los de fábrica. El panel
  // pasa los de la pantalla —todavía sin guardar— para poder previsualizar.
  const M = mensaje || getMensaje();
  const marcas = { ...MARCAS_BASE(), evento: nombre };
  const t = (id, extra) => reemplazar(M[id], { ...marcas, ...extra });
  const cuando = formatRango(ev) || "Fechas por anunciar";
  const donde = [ev.venue, ev.ciudad].filter(Boolean).join(", ");
  // La semana se agrupa de lunes a domingo, así que se la nombra por su
  // lunes. Si se usara la fecha del evento, un evento que arranca domingo
  // titularía "la semana del 20" arriba de una lista que empieza el 14.
  const arranque = diaYMes(lunesDe(ev.fechaInicio) || ev.fechaInicio);
  const difundimos = llegamosADifundir(ev);

  // La lista llega SIN recortar, con uno más de los que se muestran. Es la
  // única forma de distinguir "esa semana hay cinco" de "hay nueve y muestro
  // cinco": contar los que se muestran da cinco en los dos casos, y así el
  // mail decía "puede haber alguno más" sin que hubiera ninguno más. De 95
  // envíos posibles, 30 caen justo en cinco.
  const recortada = semana.length > MAXIMO_SEMANA;
  const visibles = semana.slice(0, MAXIMO_SEMANA);
  const hay = visibles.length;

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
  const asunto = armarAsunto(nombre, cuando, ev, M.asunto);

  const titular = t("titular");

  const filasSemana = visibles.map((o) => ({
    nombre: o.nombre,
    detalle: [formatRango(o), o.ciudad || o.pais].filter(Boolean).join(" · "),
  }));

  // ---------------------------------------------------------------- texto
  const texto = [
    t("saludo"),
    "",
    t("entrada"),
    "",
    `  ${nombre}`,
    `  Fechas: ${cuando}`,
    donde ? `  Sede: ${donde}` : null,
    ev.organizador ? `  Organiza: ${ev.organizador}` : null,
    ev.web ? `  Sitio: ${ev.web.replace(/^https?:\/\//, "").replace(/\/$/, "")}` : null,
    "",
    t("aclaracion"),
    "",
    `${t("boton")}: ${link}`,
    "",
    t("queGana"),
    "",
    "—",
    "",
    t("quienesSomos"),
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
    t("cierre"),
    "",
    t("firma"),
    SITE.url,
    "",
    "—",
    t("pie"),
  ]
    .filter((l) => l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  // ----------------------------------------------------------------- html
  // ----------------------------------------------------------------- html
  // El envoltorio (cabecera, modo oscuro de Apple, pie) vive en mail-base.js,
  // compartido con los otros mails que salen del panel.
  const html = pagina({
    adelanto: "Así lo publicamos en la agenda. Si algo está mal, se corrige en dos minutos.",
    cuerpo: `
  ${bloque(
    `<h1 class="h1 fuerte" style="margin:0 0 18px;font-size:23px;line-height:1.26;color:#14111c;font-weight:bold;">${esc(titular)}</h1>${parrafo(esc(t("saludo")), "0 0 22px")}`,
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
        <a href="${esc(link)}" style="display:inline-block;padding:15px 34px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${esc(t("boton"))}</a>
      </td>
    </tr></table>
    ${tenue(esc(t("queGana")), "12px 0 0")}
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
    parrafo(esc(t("cierre")), "0 0 22px") +
      // La firma se escribe libre, un renglón por línea. La primera va en
      // grande y las de abajo en gris, como estaba: si mañana hay tres
      // renglones o uno, se dibuja igual sin tocar el código.
      `<p class="txt" style="margin:0;font-size:16px;line-height:1.62;color:#3a3548;">
      ${t("firma")
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
    </p>`,
    "8px 34px 30px"
  )}`,
    pie: esc(reemplazar(M.pie, { ...marcas, agenda: "" }))
      // El paréntesis vacío que dejó la marca {agenda} se llena con el link.
      .replace(
        /\(\s*\)/,
        `(<a href="${esc(SITE.url)}/agenda" style="color:#8a8498;">${esc(SITE.url.replace(/^https?:\/\//, ""))}/agenda</a>)`
      )
      // Lo que va entre comillas se pone en negrita, como estaba antes: es la
      // palabra que tiene que responder para que no le escribamos más, y en un
      // párrafo gris chiquito entre comillas se pierde.
      .replace(/&quot;([^&]{1,24})&quot;/, "<strong>$1</strong>"),
  });

  return { asunto, texto, html };
}
