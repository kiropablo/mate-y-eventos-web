// Serializa el JSON-LD para meterlo adentro de un <script>.
//
// POR QUÉ EXISTE ESTO
//
// `JSON.stringify` no escapa el signo "<". Y el JSON-LD no se pinta como texto
// normal —React escaparía— sino con `dangerouslySetInnerHTML`, que es la única
// forma de meter un <script> con contenido. O sea: lo que devuelve stringify
// entra al HTML tal cual.
//
// Entonces, si un dato trae el cierre de un script, el navegador cierra el
// bloque ahí y lo que sigue lo lee como HTML. Comprobado en esta máquina: sale
// literal, sin tocar.
//
// Y los datos del sitio no son de confianza: los eventos los carga un robot que
// scrapea webs ajenas, y los artículos los escribe un modelo a partir de esas
// mismas fuentes. Cualquiera puede mandar una sugerencia por el formulario
// público con el texto preparado, y basta con que la ficha se apruebe.
//
// QUÉ HACE
//
// Convierte "<" y ">" a su forma escapada, que es JSON perfectamente válido:
// Google, Bing y las IA leen EXACTAMENTE el mismo dato. Cambia cómo se escribe,
// no qué dice. También "&" (por si el bloque pasa por un parser de HTML) y los
// dos separadores de línea de Unicode (U+2028 y U+2029), que rompen el
// JavaScript aunque sean legales adentro de un string JSON.
//
// El orden de los reemplazos es seguro: ninguno introduce un carácter que los
// siguientes vuelvan a tocar (la barra invertida y la "u" no están en la lista).
//
// OJO al editar: los dos últimos van escritos como secuencia de escape y NO
// como el carácter en crudo. En crudo son saltos de línea para el propio
// JavaScript y rompen este archivo. Ya pasó una vez mientras se escribía.

export function jsonLdSeguro(objeto) {
  return JSON.stringify(objeto)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
