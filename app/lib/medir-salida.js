// Anota que alguien se puso a escuchar el podcast.
//
// ESTÁ COMPARTIDO A PROPÓSITO, por el mismo motivo que mail-base.js y
// medir-calendario.js: lo que viaja acá es un contrato con dos listas CERRADAS
// del otro lado. En `api/registrar.js` del panel, `tipo` se valida contra
// {bot, visita, salida, calendario} y `destino` contra {spotify, apple,
// youtube, amazon, rss}; cualquier otra cosa se contesta con un 400 EN
// SILENCIO. Con una copia de esta función por componente, el día que una se
// actualice y la otra no, la vieja sigue mandando y el panel sigue
// descartando sin que nadie se entere.
//
// Si acá hiciera falta un destino nuevo, hay que agregarlo primero a DESTINOS
// en el repo del panel. Son dos despliegues, en ese orden: primero el panel.
//
// OJO CON QUÉ SIGNIFICA "salida" DESDE QUE EXISTE EL BLOQUE DEL PODCAST.
//
// Hasta ahora era literal: alguien tocaba un botón en /escuchar y se iba a
// Spotify, a Apple o al canal de YouTube. El bloque InvitacionAlPodcast anota
// además el PLAY del reproductor embebido, que no se va a ninguna parte: se
// queda mirando el video de YouTube acá adentro. Es la misma plataforma y es
// la conversión que importa medir, pero NO es el mismo gesto, así que el
// número total de "salidas a YouTube" dejó de querer decir lo de antes.
//
// Lo que separa los dos casos es la RUTA, que ya viaja en el mismo paquete:
// `/escuchar` es el clic al canal; `/glosario/…`, `/articulos/…` y
// `/agenda/…` son plays del bloque. Es el mismo truco del prefijo "f-" de los
// sid en EnTuCalendario.js —distinguir por un campo que ya existe en vez de
// pedirle al panel un valor nuevo—, y es la razón de que esto no haya hecho
// falta tocar el panel.

const REGISTRADOR = "https://datos.mateyeventos.com/api/registrar";

export function anotarSalida(destino) {
  // Solo cuenta el sitio publicado: las pruebas locales no son salidas.
  if (!/(^|\.)mateyeventos\.com$/.test(location.hostname)) return;
  try {
    // sendBeacon está pensado justo para esto: sigue viajando aunque la
    // página se esté yendo. No se manda nada que haya escrito nadie de
    // afuera: el panel es público y publica lo que recibe.
    navigator.sendBeacon(
      REGISTRADOR,
      new Blob(
        [
          JSON.stringify({
            tipo: "salida",
            destino,
            ruta: location.pathname,
            referrer: document.referrer || null,
            // De qué short vino. El mismo utm_source que ya usa el contador,
            // así la visita y la salida se cruzan por el mismo campo.
            utm: new URLSearchParams(location.search).get("utm_source"),
          }),
        ],
        { type: "text/plain" },
      ),
    );
  } catch {
    // Medir jamás rompe el link ni el reproductor.
  }
}
