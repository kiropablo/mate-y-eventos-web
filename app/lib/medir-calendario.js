// La medición de los dos calendarios: el feed suscribible de toda la agenda
// (/api/agenda/ics) y el .ics de un evento suelto (/api/agenda/[slug]/ics).
//
// ESTÁ COMPARTIDO A PROPÓSITO, igual que mail-base.js. Lo que se manda acá es
// un contrato con una lista CERRADA del otro lado: api/registrar.js del panel
// valida `cliente` contra su propia constante CLIENTES y lo que no reconoce lo
// reescribe como "otro", sin avisar y devolviendo 204. Con una copia de esta
// función por ruta, el día que alguien agregue un cliente de calendario en una
// y no en la otra, la que quedó vieja sigue andando y manda un valor que el
// panel pisa en silencio. El dato no se rompe: se vuelve mentira.
//
// Si acá se agrega un valor nuevo, hay que agregarlo también a CLIENTES en el
// repo del panel. Son dos despliegues, en ese orden: primero el panel.

const REGISTRADOR = "https://datos.mateyeventos.com/api/registrar";

// Quién está pidiendo el calendario. Lo que importa no es la marca sino la
// diferencia entre "un calendario suscrito" y "un navegador mirando": lo
// primero es alguien que va a recibir la agenda todas las semanas sin hacer
// nada; lo segundo es una visita más.
export function quienPide(ua = "") {
  const u = ua.toLowerCase();
  if (!u) return "desconocido";
  if (u.includes("google-calendar") || u.includes("googlecalendar") || u.includes("feedfetcher")) return "google";
  if (u.includes("calendaragent") || u.includes("dataaccessd") || u.includes("ical") || u.includes("macoutlook")) return "apple";
  if (u.includes("outlook") || u.includes("microsoft")) return "outlook";
  if (u.includes("thunderbird") || u.includes("lightning")) return "thunderbird";
  // Un navegador que abre la URL no es una suscripción: es alguien mirando.
  if (u.includes("mozilla") || u.includes("chrome") || u.includes("safari")) return "navegador";
  return "otro";
}

// Anota que alguien consultó un calendario. Nunca espera la respuesta y nunca
// rompe el feed: si el panel está caído, la suscripción sigue funcionando
// igual. Es la misma regla que el contador de visitas.
//
// Los campos que el panel guarda para tipo "calendario" son exactamente estos
// cuatro: ruta, y adentro de `extra` el cliente, el sid y los filtros. NO se
// manda el país: el panel solo lee `d.pais` cuando el tipo es "bot" y para
// todo lo demás lo saca de la cabecera de SU pedido, que acá es el de nuestro
// servidor y no el del visitante. Mandarlo era un campo que viajaba para que
// lo tiraran.
export function anotar({ ruta, cliente, sid = null, filtros = null }) {
  try {
    fetch(REGISTRADOR, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({
        tipo: "calendario",
        ruta,
        cliente,
        sid,
        filtros,
      }),
    }).catch(() => {});
  } catch {
    // Medir jamás rompe el calendario de nadie.
  }
}
