// Una dirección que se puede poner en un href sin miedo.
//
// POR QUÉ EXISTE. Las direcciones del sitio no las escribimos nosotros: la web
// de un evento la carga un robot que scrapea webs ajenas, la de un invitado la
// escribe el propio invitado en un formulario, y la de una sugerencia la manda
// cualquiera desde internet.
//
// Y React 18 NO bloquea un href que arranque con "javascript:". Si eso llega a
// un href, el link ejecuta código en nuestro dominio cuando alguien lo clickea.
// Es la misma familia de problema que el `</script>` del JSON-LD (regla 19):
// dato ajeno que termina en un lugar donde se ejecuta.
//
// CÓMO FUNCIONA. No es una lista negra —esas siempre se evaden— sino una lista
// blanca: se parsea con el parser del navegador y solo pasan http y https.
// Todo lo demás vuelve vacío, y quien llama decide qué hacer con eso.
//
// Se devuelve la forma NORMALIZADA del parser (u.href) y no el texto crudo:
// así los "<", ">" y comillas salen ya codificados, y las evasiones con
// mayúsculas, espacios, saltos de línea o bytes nulos en medio del protocolo
// ("java\nscript:") quedan resueltas por el parser, no por una expresión
// regular nuestra que mañana alguien tiene que mantener.
//
// OJO CON UNA COSA. "feria.com.ar" sin protocolo devuelve vacío, porque no es
// una URL. Eso es correcto para un href, pero NO sirve para guardar o mostrar
// el campo como texto: ahí el valor tiene que quedar tal cual lo cargaron, o
// desaparece justo del panel donde se corrige (regla 8, la fuga silenciosa).
// Por eso esto filtra al USAR la dirección, no al guardarla.

export function urlHttp(crudo) {
  const t = String(crudo || "").trim();
  if (!t) return "";
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}

// ¿Esto se puede linkear? Para cuando solo hace falta saber sí o no.
export function esUrlHttp(crudo) {
  return urlHttp(crudo) !== "";
}

// Un valor de UNA SOLA LÍNEA, sin caracteres de control.
//
// Los nombres, los títulos y las direcciones son de una línea. Cuando un campo
// así conserva saltos de línea, el texto deja de ser un valor y pasa a ser
// varios renglones, y eso importa en todos los lugares donde después se arma
// una lista o un prompt con un valor por renglón: quien escribe el campo puede
// agregar renglones que parecen otra cosa.
//
// Pasó de verdad: el nombre de un evento sugerido desde el formulario público
// se pega —uno por línea— adentro del prompt del robot de la agenda. Con el
// salto de línea intacto, dos renglones de un mismo nombre parecen dos nombres,
// o peor, una instrucción nueva.
export function unaLinea(crudo, max = 200) {
  return String(crudo ?? "")
    // Saltos, tabulaciones y todo lo que no se ve pero ocupa: a un espacio.
    .replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
