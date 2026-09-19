// A quién NOMBRA un artículo, de los invitados que ya tienen ficha.
//
// Es la misma idea de `enlaces.js` —que hace esto mismo con el glosario— pero
// sobre personas, y con dos diferencias que importan:
//
// 1. Acá el enlace va DENTRO del texto, no en un bloque al pie. Un término del
//    glosario es una palabra que se define aparte; el nombre de una persona se
//    lee en la oración, y ahí es donde alguien quiere hacer click. El lector de
//    Markdown del sitio aprendió a dibujar links para esto.
//
// 2. El criterio es más estricto, porque el costo de errarle es más caro. Una
//    palabra mal enlazada en el glosario manda a una definición que no venía al
//    caso; un nombre mal enlazado le atribuye a una persona real algo que no
//    dijo. Por eso:
//
//    - **Nombres de una sola palabra, nunca.** Es la regla 12 aplicada al pie
//      de la letra: "Michel" aparece 10 veces en los artículos y casi ninguna
//      es el mentalista. Un nombre de pila suelto no identifica a nadie.
//    - Solo fichas PUBLICADAS. Enlazar a un borrador es mandar a un 404.
//    - Nunca se enlaza a alguien dentro de su propia ficha.
//    - Solo la PRIMERA vez que aparece en el texto. La segunda no agrega nada y
//      convierte el artículo en un campo de links.
//
// Lo que se enlaza se puede comprobar con Ctrl+F, igual que el glosario: si el
// schema declara que el artículo menciona a alguien, ese nombre está escrito en
// la página y además es un link que se ve.

// Las vocales acentuadas y la eñe: la transcripción no siempre las pone, y
// "Sofia Martin" y "Sofía Martín" son la misma persona.
const EQUIVALENTES = {
  a: "aáàäâã",
  e: "eéèëê",
  i: "iíìïî",
  o: "oóòöôõ",
  u: "uúùüû",
  n: "nñ",
  c: "cç",
};

function sinAcentos(t) {
  return String(t || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// El nombre que se busca en el texto no es siempre el título de la ficha:
// "Luciano Larocca (la Bomba de Tiempo)" se llama Luciano Larocca, y el
// paréntesis es la aclaración de dónde toca. Se busca el nombre.
export function nombreBuscable(nombre) {
  return String(nombre || "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Un nombre sirve para buscar si tiene al menos dos palabras. Es la regla 12:
// el criterio tiene que ser comprobable, y un nombre de pila suelto no lo es.
export function sirveParaBuscar(nombre) {
  const limpio = nombreBuscable(nombre);
  return limpio.split(/\s+/).filter((p) => p.length > 1).length >= 2;
}

function escapar(c) {
  return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Arma el patrón a partir del nombre: cada vocal acepta su versión acentuada y
// cada espacio acepta un salto de línea. Los bordes son "que no haya otra letra
// ni número pegado", para que "Ariela Giacco" no enganche dentro de otra
// palabra.
function patronDe(nombre) {
  const cuerpo = sinAcentos(nombreBuscable(nombre))
    .split("")
    .map((c) => {
      if (c === " ") return "\\s+";
      const equiv = EQUIVALENTES[c];
      return equiv ? `[${equiv}${equiv.toUpperCase()}]` : escapar(c);
    })
    .join("");
  return new RegExp(`(?<![\\p{L}\\p{N}])${cuerpo}(?![\\p{L}\\p{N}])`, "giu");
}

// Dónde aparece cada invitado en este texto. Devuelve el primer lugar de cada
// uno, ya sin superposiciones y ordenado por posición.
function hallazgos(texto, invitados, { excluirSlug = "" } = {}) {
  const t = String(texto || "");
  if (!t) return [];

  const encontrados = [];
  for (const inv of invitados) {
    if (!inv?.slug || inv.slug === excluirSlug) continue;
    if (!sirveParaBuscar(inv.nombre)) continue;
    const m = patronDe(inv.nombre).exec(t);
    if (m) {
      encontrados.push({
        slug: inv.slug,
        nombre: inv.nombre,
        // El texto TAL COMO está escrito en el artículo, no el de la ficha: el
        // link tiene que decir lo que el lector ya estaba leyendo.
        comoEstaEscrito: m[0],
        desde: m.index,
        hasta: m.index + m[0].length,
      });
    }
  }

  // Si dos nombres pisan el mismo pedazo de texto gana el más largo: entre
  // "Nico Mejián" y "Nicolás Edmejián" el que de verdad está escrito es el que
  // ocupa más letras.
  encontrados.sort((a, b) => a.desde - b.desde || b.hasta - a.hasta);
  const limpios = [];
  let fin = -1;
  for (const h of encontrados) {
    if (h.desde >= fin) {
      limpios.push(h);
      fin = h.hasta;
    }
  }
  return limpios;
}

// Los invitados que nombra un texto. Es lo que se declara en el schema.
export function personasMencionadas(texto, invitados, opciones = {}) {
  return hallazgos(texto, invitados, opciones).map(({ slug, nombre }) => ({
    slug,
    nombre,
  }));
}

// El mismo texto, con cada nombre convertido en link de Markdown.
//
// Se escribe sobre el texto ORIGINAL de atrás para adelante: así las posiciones
// que ya calculamos siguen valiendo mientras vamos insertando. Al revés, el
// primer link correría todo lo demás y el segundo caería en el lugar
// equivocado.
export function conEnlacesAInvitados(texto, invitados, opciones = {}) {
  const t = String(texto || "");
  const encontrados = hallazgos(t, invitados, opciones);
  if (!encontrados.length) return t;

  let salida = t;
  for (let i = encontrados.length - 1; i >= 0; i--) {
    const h = encontrados[i];
    salida =
      salida.slice(0, h.desde) +
      `[${h.comoEstaEscrito}](/invitados/${h.slug})` +
      salida.slice(h.hasta);
  }
  return salida;
}

// Y al revés: en qué artículos se nombra a esta persona. Alimenta el bloque
// "Dónde se lo nombra" de la ficha, que sale de esta misma lista y con el mismo
// corte que el schema (regla 13).
export function articulosQueNombran(invitado, articulos) {
  if (!invitado?.nombre || !sirveParaBuscar(invitado.nombre)) return [];
  const patron = patronDe(invitado.nombre);
  return articulos.filter((a) => {
    patron.lastIndex = 0;
    return patron.test(String(a?.cuerpo || ""));
  });
}
