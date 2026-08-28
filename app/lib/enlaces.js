// Qué términos del glosario nombra de verdad cada artículo, y al revés.
//
// Hasta ahora artículos y glosario se enlazaban por episodio: el artículo
// mostraba los términos que salieron del mismo video. Eso está bien pero es
// una relación de origen, no de contenido: un artículo puede explicar en
// detalle una palabra que se definió en otro episodio, y ese enlace no
// existía en ningún lado.
//
// Acá el criterio es el único que se puede verificar abriendo la página: el
// término está escrito en el texto del artículo. Nada de inferir temas ni de
// suponer parecidos.
//
// Medido sobre el contenido real al 27/8/2026 —42 artículos publicados y 59
// términos—: 31 artículos nombran al menos un término, con mediana 2 y máximo
// 7, y 43 términos aparecen en al menos un artículo. Son 81 menciones en
// total. El más repetido es "Timing", en 13 de los 42: ninguna palabra es tan
// genérica como para que marcarla sea ruido. Los números son de esa fecha; si
// el contenido crece mucho, hay que volver a contarlos antes de citarlos.

// Minúsculas y sin tildes, para que "producción" encuentre a "produccion" y
// "Photo opportunity" a "photo opportunity".
function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Escapa lo que en una expresión regular significaría otra cosa. Hay términos
// con paréntesis y con signos: sin esto, uno solo rompe todo el archivo.
function escapar(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ¿Está esta palabra escrita en este texto?
//
// Con límites de palabra, así que "brief" no aparece dentro de "briefing" ni
// "VJ" dentro de "VJing". Y con el plural castellano opcional, porque el
// artículo dice "los proveedores" y el término se llama "Proveedor".
function apareceEn(textoNormalizado, palabra) {
  const p = normalizar(palabra).trim();
  if (!p) return false;
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapar(p)}(es|s)?($|[^\\p{L}\\p{N}])`, "u");
  return re.test(textoNormalizado);
}

// Las formas en las que un término puede estar escrito en un texto corrido.
//
// El glosario nombra las entradas como entradas de diccionario, no como se
// escriben en una oración: "Coordinador (de evento)", "Caché o cachét",
// "Promotoras y promotores". Buscados así, tal cual, no aparecen nunca: nadie
// escribe "el coordinador (de evento) llegó tarde". Son nueve entradas entre
// publicadas y borradores, y sin esto ninguna se encontraría jamás.
//
// Así que además del nombre completo se busca:
//   - el nombre sin la aclaración entre paréntesis  -> "Coordinador"
//   - cada alternativa cuando el propio nombre trae dos -> "Caché", "cachét"
// El corte de 5 caracteres es para no terminar buscando pedacitos: de un
// término no sale nunca una palabra de tres letras que valga como mención.
function variantes(nombre) {
  const limpio = String(nombre || "").trim();
  if (!limpio) return [];
  const v = new Set([limpio]);

  const sinParentesis = limpio.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  if (sinParentesis) v.add(sinParentesis);

  for (const base of [limpio, sinParentesis]) {
    if (!base) continue;
    for (const parte of base.split(/\s+o\s+|\s+y\s+|\s*,\s*/)) {
      const p = parte.trim();
      if (p.length >= 5) v.add(p);
    }
  }
  return [...v];
}

// Un término cuenta si está escrito su nombre, en cualquiera de sus formas.
//
// Los alias NO se buscan, aunque el glosario los tenga cargados y sirvan para
// que alguien encuentre la ficha. Son otra palabra: si el artículo dice
// "orador", la relación con "Speaker" puede existir, pero deja de poder
// comprobarse abriendo la página, que es lo único que acá se promete. Y a
// veces la relación directamente no existe: el alias de "Brief" es "pedido",
// que engancha el verbo —"había pedido", "fue pedido"—, y así 11 de los 21
// artículos que declaraban Brief no tenían la palabra escrita en ningún lado.
// Sobre 112 menciones, 28 estaban marcadas sobre una palabra que no era la
// del término.
//
// Los nombres compuestos siguen andando igual, porque esos sí son el nombre:
// "Caché o cachét" busca "Caché" y "Promotoras y promotores" busca
// "Promotoras", y las dos están escritas de verdad.
function terminoAparece(textoNormalizado, termino) {
  return variantes(termino.termino).some((f) => apareceEn(textoNormalizado, f));
}

// Palabras que en el glosario significan una cosa y en castellano corriente
// otra. Buscarlas por su forma las pega a artículos que hablan de otro tema:
// "Retorno" acá es el monitor que el artista escucha en el escenario, pero en
// tres artículos de negocio es el retorno de la inversión ("decoración cara
// sin retorno", "su propio retorno esperado"). La palabra está escrita, sí,
// pero no es este término: el schema apunta a una entidad, no a una cadena de
// texto, y declarar que esos artículos hablan de un monitor de audio es
// sencillamente falso.
//
// Para estas, solo cuenta el artículo de su propio episodio, que es donde la
// palabra está usada en este sentido.
//
// Se revisaron los ocho términos más repetidos: Timing, Brief, Render, Handy,
// Tanda, Degustación y Promotoras están bien usados en todos los artículos
// donde aparecen. El único ambiguo hoy es este. Si aparece otro, se suma el
// slug acá. (Si algún día son muchos, conviene que sea un campo de la ficha
// del término en vez de una lista en el código.)
const AMBIGUAS = new Set(["retorno"]);

// Los términos del glosario que este artículo nombra.
//
// Se mira el cuerpo, la bajada y las preguntas frecuentes: las tres cosas son
// texto del artículo que el lector ve. El título no, porque ya lo cubre el
// cuerpo y contarlo aparte no agrega nada.
//
// El orden es alfabético a propósito: el schema tiene que salir igual en cada
// build, si no cada deploy cambia el JSON-LD sin que haya cambiado nada.
export function terminosMencionados(articulo, terminos) {
  if (!articulo || !Array.isArray(terminos)) return [];
  const texto = normalizar(
    [
      articulo.cuerpo,
      articulo.bajada,
      ...(articulo.preguntas || []).map((q) => `${q.pregunta} ${q.respuesta}`),
    ].join(" ")
  );
  return terminos
    .filter((t) => !AMBIGUAS.has(t.slug) || t.episodio === articulo.episodio)
    .filter((t) => terminoAparece(texto, t))
    .sort((a, b) => a.termino.localeCompare(b.termino, "es"));
}

// De lo anterior, los que además salieron del mismo episodio que el artículo.
//
// Esos son de lo que el artículo trata (about); el resto son cosas que nombra
// al pasar (mentions). Es la distinción que hace schema.org y acá tiene una
// definición medible, no una opinión: el término se definió en el episodio
// que este artículo amplía, y el artículo lo usa.
export function terminosDelTema(articulo, mencionados) {
  if (!articulo || !articulo.episodio) return [];
  return (mencionados || []).filter((t) => t.episodio === articulo.episodio);
}

// Al revés: los artículos que nombran este término.
//
// Alimenta las dos cosas de la página del término: el bloque visible "Dónde
// se usa" y el subjectOf del schema. Las dos salen de la misma lista y con el
// mismo corte, a propósito: marcar en el código una relación que el lector no
// puede ver en la página es lo que Google penaliza.
export function articulosQueMencionan(termino, articulos) {
  if (!termino || !Array.isArray(articulos)) return [];
  return articulos
    .filter((a) => terminosMencionados(a, [termino]).length > 0)
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
}

// Los términos que este término nombra en su propia definición.
//
// El bloque "Términos relacionados" de la ficha existe desde siempre en el
// código, pero nunca apareció en ninguna de las 59 fichas: generar-glosario.mjs
// escribe `relacionados: []` fijo en los 89 archivos y nadie lo llenó jamás.
// Era código muerto esperando una carga a mano que no iba a pasar.
//
// Se llena con el mismo criterio que todo lo demás y por la misma razón: el
// otro término está escrito, con todas las letras, en el texto que el lector
// tiene delante. La definición de "Rider técnico" nombra "Backline" y "Tour
// manager", y se puede comprobar con Ctrl+F sin salir de la página.
//
// Es a propósito una relación en un solo sentido: dice "esta definición nombra
// a esa", no "estas dos se parecen". Que "Guion técnico" nombre a "Timing" no
// obliga a que Timing nombre a Guion técnico, y marcar la vuelta sería
// declarar algo que en la ficha de Timing no se ve.
//
// Al 28/8/2026 son 26 relaciones sobre 22 de los 59 términos publicados. Los
// otros 37 no muestran el bloque, que es lo correcto: no hay nada que mostrar.
//
// Si la ficha trae `relacionados` cargados a mano en su cabecera, esos van
// primero: es la puerta para agregar una relación que el texto no nombra pero
// que vale. Hoy no hay ninguna.
export function terminosRelacionados(termino, todos) {
  if (!termino || !Array.isArray(todos)) return [];

  const otros = todos.filter((t) => t.slug !== termino.slug);
  const aMano = (termino.relacionados || [])
    .map((slug) => otros.find((t) => t.slug === slug))
    .filter(Boolean);

  const texto = normalizar([termino.cuerpo, termino.definicionCorta].join(" "));
  const escritos = otros
    .filter((t) => !AMBIGUAS.has(t.slug) || t.episodio === termino.episodio)
    .filter((t) => terminoAparece(texto, t))
    .sort((a, b) => a.termino.localeCompare(b.termino, "es"));

  const vistos = new Set();
  return [...aMano, ...escritos].filter((t) => {
    if (vistos.has(t.slug)) return false;
    vistos.add(t.slug);
    return true;
  });
}
