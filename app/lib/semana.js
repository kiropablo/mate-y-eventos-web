import { hoyISO, sumarDias, pelado } from "./agenda";

// Los otros eventos de la misma semana que uno dado.
//
// Es lo primero que ve el organizador en el mail: antes de pedirle nada, se
// le pasa un dato que le sirve. Una superposición que no tenía en el radar
// vale más que cualquier párrafo explicando quiénes somos.
//
// La semana es de lunes a domingo, tomada por la fecha de inicio. Se eligió
// así y no "los que estén activos esos días" porque hay eventos que duran dos
// meses: CASACOR arranca en agosto y termina en octubre, y aparecería en la
// lista de todas las semanas del bimestre sin ser una superposición real.

// Cuántos se muestran. Más que esto deja de ser un dato y pasa a ser una lista.
export const MAXIMO_SEMANA = 5;
const MAXIMO = MAXIMO_SEMANA;

// El lunes de la semana que contiene esa fecha.
export function lunesDe(fechaISO) {
  if (!fechaISO) return null;
  const [a, m, d] = fechaISO.slice(0, 10).split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  // getUTCDay(): 0 es domingo. Se corre al lunes anterior.
  const dia = fecha.getUTCDay();
  const atras = dia === 0 ? 6 : dia - 1;
  return sumarDias(fecha.toISOString().slice(0, 10), -atras);
}

// ¿Los dos eventos arrancan en la misma semana?
function mismaSemanaQue(a, b) {
  const la = lunesDe(a);
  const lb = lunesDe(b);
  return Boolean(la && lb && la === lb);
}

// Dos eventos son "del mismo organizador" si el nombre coincide una vez
// peladas mayúsculas y acentos. Alcanza: no hace falta que sea exacto, hace
// falta que no se le mande a Messe Frankfurt un aviso sobre su propio evento.
// Palabras que cuelgan del nombre de una empresa y no la identifican.
const FORMAS_JURIDICAS = new Set([
  "sa", "s", "a", "srl", "r", "l", "sas", "sac", "ltda", "ltd", "inc", "llc",
  "sociedad", "anonima",
]);

// Artículos y nexos: no aportan a la identidad de nadie.
const NEXOS = new Set(["de", "del", "la", "el", "los", "las", "y", "e"]);

// Palabras que describen QUÉ es una entidad, no CUÁL es. Una entidad hecha
// solo de estas no distingue a nadie: "Cultura" o "Gobierno de la Provincia"
// coinciden con media base. Si no queda ni una palabra propia, no se compara.
const GENERICAS = new Set([
  "gobierno", "municipalidad", "municipio", "provincia", "ciudad", "nacion",
  "ministerio", "secretaria", "subsecretaria", "direccion", "ente", "agencia",
  "asociacion", "camara", "federacion", "confederacion", "fundacion",
  "instituto", "consejo", "colegio", "union", "centro", "comision",
  "turismo", "cultura", "deporte", "deportes", "produccion", "industria",
  "comercio", "grupo", "productora", "eventos", "argentina", "argentino",
  "argentinas", "argentinos", "brasil", "chile", "uruguay", "mexico",
  "colombia", "peru", "latinoamerica", "latinoamericana", "internacional",
  "nacional", "sudamericana", "regional",
]);

// Nombres de país que cuelgan al final de una filial: "Messe Frankfurt
// Argentina" y "Messe Frankfurt" son la misma empresa.
const FILIALES = new Set([
  "argentina", "argentino", "brasil", "brazil", "chile", "uruguay", "paraguay",
  "mexico", "colombia", "peru", "latam", "latinoamerica", "sudamerica",
]);

// Las entidades que aparecen en un campo de organizador.
//
// El campo es texto libre y en 73 de las 268 fichas hay varias entidades
// juntas: "CAFARA (Cámara de Ferreterías) + Messe Frankfurt Argentina",
// "ARPEL, con producción de Messe Frankfurt Argentina". Comparar el string
// entero contra otro string entero no sirve para nada: Messe Frankfurt
// organiza dieciséis eventos de la agenda y el campo está escrito de diez
// formas distintas.
function entidadesDe(texto) {
  const crudo = String(texto || "");
  if (!crudo.trim()) return [];

  const partes = [];

  // Lo que va entre paréntesis suele ser la sigla o el nombre largo de la
  // misma entidad: "Asociación … (ADRHA)". Vale como entidad aparte, porque
  // otra ficha puede nombrarla solo por la sigla.
  for (const m of crudo.matchAll(/\(([^)]+)\)/g)) partes.push(m[1]);

  partes.push(
    ...crudo
      .replace(/\([^)]*\)/g, " ")
      // Los separadores reales entre entidades, incluidas las frases que usa
      // la base: "y", "con producción de", "en colaboración con", "junto a".
      .split(
        /\s*[+/;,]\s*|\s+(?:y|e|con|junto\s+a|para)\s+(?:produccion\s+de\s+|colaboracion\s+con\s+)?|\s+bajo\s+(?:el\s+)?\w+\s+de\s+/gi
      )
  );

  // Cuando el separador que cortó fue la coma, el conector queda colgando
  // adelante de la parte: "ARPEL, con producción de Messe Frankfurt" deja
  // "con produccion de messe frankfurt". Se lo saca acá.
  const ARRASTRE =
    /^(?:y|e|con|en|junto\s+a|para|bajo)\s+(?:el|la|los|las)?\s*(?:produccion|coproduccion|colaboracion|organizacion)?\s*(?:de|del|con)?\s*(?:el|la|los|las)?\s+/;

  // "Con el apoyo de X" no dice que X organice: dice que acompaña. Si se lo
  // cuenta como organizador, a TecWeek —que solo tiene el apoyo del Gobierno
  // de la Ciudad— se le atribuye el Buenos Aires Jazz, que sí es del Gobierno.
  const APOYO = /^(?:con\s+|bajo\s+)?(?:el\s+|la\s+)?(?:apoyo|auspicio|acompanamiento|patrocinio|adhesion)\b/;

  return partes
    .map((parte) =>
      pelado(parte)
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((parte) => parte && !APOYO.test(parte))
    .map((parte) => {
      const palabras = parte
        .replace(ARRASTRE, "")
        .split(" ")
        .filter((w) => w && !FORMAS_JURIDICAS.has(w));

      // El país del final se saca solo si abajo queda un nombre de verdad:
      // "Messe Frankfurt Argentina" → "Messe Frankfurt", pero "Expo Argentina"
      // se deja entero para que no coincida con "Expo Brasil".
      if (palabras.length > 2 && FILIALES.has(palabras[palabras.length - 1])) {
        palabras.pop();
      }
      return palabras;
    })
    .filter((palabras) => {
      if (!palabras.length) return false;
      // Al menos una palabra propia, que no sea nexo ni categoría.
      return palabras.some((w) => !NEXOS.has(w) && !GENERICAS.has(w));
    });
}

// ¿Los dos eventos los organiza la misma gente?
//
// Alcanza con que compartan UNA entidad: si Messe Frankfurt organiza los dos,
// da igual con quién más lo haga en cada caso.
//
// La comparación es por igualdad exacta de la entidad, no por prefijo. El
// prefijo parecía más generoso y era peor: "Gobierno de la Provincia" es
// prefijo de todos los gobiernos provinciales del país, y terminábamos
// diciéndole a Vendimia que la Copa Davis en Neuquén la organizan ellos.
function mismoOrganizador(a, b) {
  const unas = entidadesDe(a.organizador).map((p) => p.join(" "));
  const otras = new Set(entidadesDe(b.organizador).map((p) => p.join(" ")));
  return unas.some((u) => otras.has(u));
}


export function mismaSemana(evento, eventos, { max = MAXIMO } = {}) {
  if (!evento || !evento.fechaInicio) return [];
  const hoy = hoyISO();

  return eventos
    .filter(
      (e) =>
        e.slug !== evento.slug &&
        e.fechaInicio &&
        // Uno que ya pasó no le sirve a nadie.
        (e.fechaFin || e.fechaInicio) >= hoy &&
        mismaSemanaQue(e.fechaInicio, evento.fechaInicio) &&
        // El propio: mandarle a un organizador un aviso de superposición con
        // un evento suyo es decirle que no conocemos el rubro.
        !mismoOrganizador(e, evento)
    )
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    .slice(0, max);
}

// Los eventos de la MISMA semana que organiza la misma gente.
//
// mismaSemana los descarta, pero conviene nombrarlos igual: decirle a Messe
// Frankfurt "no cuento Intersec, que la organizan ustedes" muestra que
// sabemos de qué hablamos. Callarlos y que él note el hueco, no.
export function propiosEsaSemana(evento, eventos) {
  if (!evento || !evento.fechaInicio) return [];
  const hoy = hoyISO();
  return eventos
    .filter(
      (e) =>
        e.slug !== evento.slug &&
        e.fechaInicio &&
        (e.fechaFin || e.fechaInicio) >= hoy &&
        mismaSemanaQue(e.fechaInicio, evento.fechaInicio) &&
        mismoOrganizador(e, evento)
    )
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
}

// Cuántos días faltan para que arranque el evento.
export function diasHasta(fechaISO, desde = hoyISO()) {
  if (!fechaISO || !desde) return null;
  return Math.round((enUTC(fechaISO) - enUTC(desde)) / 86400000);
}

// Una fecha ISO a milisegundos, siempre a medianoche UTC. Se arma a mano y no
// con new Date(texto) porque ahí el huso del servidor puede correr un día.
function enUTC(fechaISO) {
  const [a, m, d] = fechaISO.slice(0, 10).split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

// Con cuántos días de anticipación hace falta la confirmación para que
// lleguemos a difundir el evento con tiempo.
//
// No es letra chica para escaparle a un reclamo: el mail directamente no
// ofrece la ayuda con las redes cuando ya no da el tiempo. Prometer algo que
// no se va a poder cumplir es peor que no ofrecerlo.
export const DIAS_PARA_DIFUNDIR = 5;

export function llegamosADifundir(evento, desde = hoyISO()) {
  const dias = diasHasta(evento?.fechaInicio, desde);
  return dias !== null && dias >= DIAS_PARA_DIFUNDIR;
}
