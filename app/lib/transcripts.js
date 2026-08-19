import fs from "fs";
import path from "path";

// Lee la transcripción de un episodio desde content/transcripts/{videoId}.txt
// y los cortes en secciones desde content/transcripts/secciones/{videoId}.json
//
// Los cortes viven en un archivo APARTE a propósito. La transcripción es la
// fuente citable del episodio: es lo que se dijo, textual. Guardando los
// títulos por separado —como posiciones dentro del texto, no como texto—
// es imposible que una pasada automática cambie una palabra de lo que
// dijeron Pablo y Alexis, aunque quisiera.

const DIR = path.join(process.cwd(), "content", "transcripts");
const DIR_SECCIONES = path.join(DIR, "secciones");

export function getTranscript(id) {
  try {
    const text = fs.readFileSync(path.join(DIR, `${id}.txt`), "utf8").trim();
    return text || null;
  } catch {
    return null;
  }
}

// Los cortes de un episodio: [{ titulo, desde }] con "desde" en caracteres.
export function getSecciones(id) {
  try {
    const datos = JSON.parse(
      fs.readFileSync(path.join(DIR_SECCIONES, `${id}.json`), "utf8")
    );
    if (!Array.isArray(datos)) return [];
    return datos
      .filter((s) => s && s.titulo && Number.isInteger(s.desde) && s.desde >= 0)
      .sort((a, b) => a.desde - b.desde);
  } catch {
    return [];
  }
}

// Arma la transcripción lista para dibujar: una lista de secciones, cada una
// con su título (o sin título, la primera) y sus párrafos.
//
// Aunque no haya cortes, igual parte el texto en párrafos: hoy la
// transcripción entera se dibuja como un solo bloque de más de tres mil
// palabras, que no hay con qué leer.
export function armarTranscripcion(texto, secciones = []) {
  if (!texto) return [];

  // Los cortes que caen fuera del texto se ignoran.
  const cortes = secciones
    .filter((s) => s.desde > 0 && s.desde < texto.length)
    .sort((a, b) => a.desde - b.desde);

  // Cada corte abre un bloque; el primero arranca en cero y no lleva título
  // porque es la entrada del episodio, antes de que empiece el primer tema.
  //
  // Los cortes se corren hasta donde empieza la oración que tocan: si no, el
  // subtítulo queda arriba de una frase empezada por la mitad.
  const movidos = cortes.map((c) => ({
    titulo: c.titulo,
    desde: alBordeDeOracion(texto, c.desde),
  }));

  // Correr los cortes puede hacer que dos caigan en el mismo lugar o que uno
  // quede antes del anterior. Si eso pasara, los tramos se solaparían y el
  // texto se duplicaría o se perdería: nos quedamos con el primero de cada
  // choque.
  const firmes = movidos.filter(
    (c, i, lista) => i === 0 || c.desde > lista[i - 1].desde
  );

  const desdes = [0, ...firmes.map((c) => c.desde)];
  const titulos = ["", ...firmes.map((c) => c.titulo)];

  return desdes
    .map((desde, i) => ({
      titulo: titulos[i],
      desde,
      hasta: desdes[i + 1] ?? texto.length,
    }))
    // Si un corte cae justo al principio, el bloque de entrada queda vacío.
    .filter((b) => b.hasta > b.desde)
    .map((b) => ({
      titulo: b.titulo || "",
      parrafos: enParrafos(texto.slice(b.desde, b.hasta)),
    }))
    .filter((b) => b.parrafos.length > 0);
}

// Corre una posición hacia atrás hasta donde arranca la oración que la
// contiene, para que el subtítulo no quede arriba de una frase por la mitad.
//
// Si hay que retroceder demasiado —una parrafada sin un solo punto— se corta
// en la palabra y listo: mejor un corte prolijo en el lugar correcto que uno
// perfecto doscientas palabras antes, en otro tema.
const MAXIMO_ATRAS = 400;

function alBordeDeOracion(texto, i) {
  if (i <= 0 || i >= texto.length) return i;

  const desde = Math.max(0, i - MAXIMO_ATRAS);
  for (let j = i - 1; j > desde; j--) {
    if (/\s/.test(texto[j]) && /[.!?…]/.test(texto[j - 1])) {
      // Justo después del espacio que sigue al punto.
      let k = j;
      while (k < texto.length && /\s/.test(texto[k])) k++;
      if (k > desde && k < texto.length) return k;
    }
  }
  return alBordeDePalabra(texto, i);
}

// Corre una posición hasta el principio de la palabra que la contiene.
function alBordeDePalabra(texto, i) {
  if (i <= 0 || i >= texto.length) return i;
  let j = i;
  while (j > 0 && !/\s/.test(texto[j - 1])) j--;
  return j;
}

// Parte un tramo de texto corrido en párrafos legibles.
//
// Las transcripciones vienen como una sola línea, sin puntos y aparte: hay
// que inventarlos. Se corta por oraciones y se juntan de a unas pocas, que es
// como quedaría si alguien lo hubiera escrito.
const ORACIONES_POR_PARRAFO = 4;

function enParrafos(tramo) {
  const limpio = String(tramo || "").trim();
  if (!limpio) return [];

  // Corta después de . ? ! seguidos de espacio. El look-behind mantiene el
  // signo pegado a la oración que lo cierra.
  const oraciones = limpio
    .split(/(?<=[.!?…])\s+/)
    .map((o) => o.trim())
    .filter(Boolean);

  if (oraciones.length <= 1) return [limpio];

  const parrafos = [];
  for (let i = 0; i < oraciones.length; i += ORACIONES_POR_PARRAFO) {
    parrafos.push(oraciones.slice(i, i + ORACIONES_POR_PARRAFO).join(" "));
  }
  return parrafos;
}
