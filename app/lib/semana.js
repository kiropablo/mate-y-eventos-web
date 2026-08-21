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
function mismoOrganizador(a, b) {
  // Para comparar identidad se saca TODO lo que no sea letra o número, sin
  // dejar espacio en el medio. En la base conviven "La Rural S.A." y
  // "La  Rural SA": si los puntos se reemplazaran por espacios quedaría
  // "la rural s a" contra "la rural sa", que no coinciden.
  const limpiar = (t) => pelado(t || "").replace(/[^a-z0-9]/g, "");
  const oa = limpiar(a.organizador);
  const ob = limpiar(b.organizador);
  return Boolean(oa && ob && oa === ob);
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
