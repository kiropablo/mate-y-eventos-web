import { nombreConAnio, formatRango, mesLargo } from "./agenda";
import { getMensaje, reemplazar, MARCAS_BASE } from "./mensajes";
import { SITE } from "./site";
import {
  esc,
  bloque,
  parrafo,
  tenue,
  boton,
  conLinks,
  firma,
  pagina,
} from "./mail-base";

// El mail que sale cuando el sello ya quedó encendido.
//
// El primer mail pide; este entrega. Sin este, el organizador confirma sus
// datos y no vuelve a saber nada hasta que publicamos en las redes, que puede
// ser una semana después: se queda sin saber si su respuesta llegó.
//
// Acá se cumplen las tres cosas que se le prometieron: el sello, el código
// para su propia web y la difusión. Y recién después de cumplir se pide algo,
// que además no es plata: los otros eventos que organizan.
//
// La lista de esos otros eventos se calcula, no se escribe: sale de comparar
// organizadores con el mismo criterio que usa el reporte de la semana.

// Cómo se enumeran los otros eventos en una oración: "A, B y C".
function enumerar(nombres) {
  if (nombres.length === 0) return "";
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

// El parámetro "mensaje" existe para la previsualización del panel: deja ver
// cómo queda con textos que todavía no se guardaron.
export function armarConfirmacion({ ev, otros = [], mensaje }) {
  const M = mensaje || getMensaje("confirmacion");
  const nombre = nombreConAnio(ev);
  const ficha = `${SITE.url}/agenda/${ev.slug}`;

  // El mes del sello sale de la fecha de verificación. Si no está cargada, el
  // sello se dibuja sin mes: no se inventa uno, porque la fecha es justamente
  // lo que hace que el sello signifique algo.
  const mesSello = ev.fechaVerificacion
    ? mesLargo(String(ev.fechaVerificacion).slice(0, 7))
    : "";

  // Se nombran hasta tres: más que eso deja de ser un comentario al pasar y se
  // vuelve una lista, y este mail no es para eso. Pero si hay más, se dice
  // cuántos: a Messe Frankfurt, que tiene otros quince en la agenda,
  // nombrarle tres y callar el resto le da la idea equivocada de cuánto
  // sabemos de lo que hacen.
  const nombresOtros = otros.slice(0, 3).map((e) => e.nombre);
  const resto = otros.length - nombresOtros.length;
  const hayOtros = nombresOtros.length > 0;

  const marcas = {
    ...MARCAS_BASE(),
    evento: nombre,
    ficha,
    cuando: formatRango(ev),
    mesSello,
    verificado: `${SITE.url}/agenda/verificado`,
    destacado: `${SITE.url}/agenda/destacado`,
    otros:
      resto > 0
        ? `${nombresOtros.join(", ")} y ${resto} más`
        : enumerar(nombresOtros),
  };

  const t = (id) => reemplazar(M[id], marcas);

  // Si no hay fecha de verificación, la primera línea nombraría un mes vacío.
  // Se cae a la versión sin mes en vez de escribir "con la fecha de ".
  const entrada = mesSello
    ? t("entrada")
    : t("entrada")
        .replace(/,?\s*con la fecha de\s*\.?\s*$/i, ".")
        .replace(/\{mesSello\}/g, "");

  const elPedido = hayOtros ? t("otrosEventos") : t("otrosEventosSinLista");

  // ---------------------------------------------------------------- texto
  const texto = [
    t("saludo"),
    "",
    entrada,
    t("porQueLaFecha"),
    "",
    `La ficha: ${ficha}`,
    "",
    t("badge"),
    "",
    t("difusion"),
    "",
    t("cambios"),
    "",
    elPedido,
    "",
    t("visibilidad"),
    "",
    t("cobertura"),
    "",
    t("contactos"),
    "",
    t("destacado"),
    "",
    t("firma"),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // ----------------------------------------------------------------- html
  const cuerpo = [
    bloque(
      `<h1 class="h1 fuerte" style="margin:0 0 18px;font-size:23px;line-height:1.26;color:#14111c;font-weight:bold;">${esc(t("titular"))}</h1>${parrafo(esc(t("saludo")), "0 0 22px")}`,
      "32px 34px 6px"
    ),
    bloque(parrafo(esc(entrada)) + tenue(esc(t("porQueLaFecha")), "0 0 4px")),
    bloque(boton(ficha, t("boton")), "22px 34px 10px"),
    bloque(
      parrafo(conLinks(esc(t("badge")))) +
        parrafo(esc(t("difusion"))) +
        parrafo(esc(t("cambios"))),
      "14px 34px 4px"
    ),
    // La línea que separa lo que cumplimos de lo que pedimos. Va a propósito:
    // sin ella, el pedido parece parte del favor.
    bloque(
      `<div style="border-top:1px solid #e3e1e9;height:1px;line-height:1px;font-size:1px;">&nbsp;</div>`
    ),
    bloque(
      parrafo(esc(elPedido)) + tenue(esc(t("visibilidad")), "0 0 4px"),
      "22px 34px 4px"
    ),
    bloque(
      parrafo(esc(t("cobertura"))) + parrafo(esc(t("contactos"))),
      "16px 34px 4px"
    ),
    bloque(tenue(conLinks(esc(t("destacado")))), "10px 34px 6px"),
    bloque(firma(t("firma")), "8px 34px 30px"),
  ].join("\n\n");

  const html = pagina({
    adelanto: `El sello quedó encendido en la ficha de ${nombre}.`,
    cuerpo,
    pie: esc(reemplazar(M.pie, { ...marcas, agenda: "" })).replace(
      /\(\s*\)/,
      `(<a href="${esc(SITE.url)}/agenda" style="color:#8a8498;">${esc(SITE.url.replace(/^https?:\/\//, ""))}/agenda</a>)`
    ),
  });

  return { asunto: t("asunto"), texto, html };
}
