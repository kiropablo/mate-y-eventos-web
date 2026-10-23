import { getEvento } from "../../../../lib/agenda";
import { armarCalendario } from "../../../../lib/ics";
import { detectarBot } from "../../../../lib/bots";
import { quienPide, anotar } from "../../../../lib/medir-calendario";

export const revalidate = 3600;

// Devuelve un archivo .ics para agregar UN evento a Google Calendar,
// Apple Calendario u Outlook con un toque.
//
// Para suscribirse a toda la agenda (y que los eventos nuevos aparezcan
// solos) está /api/agenda/ics.

// EL `req` NO SOBRA: ES LO QUE GARANTIZA QUE ESTO SE SIGA EJECUTANDO.
//
// La duda al medir una ruta era si la respuesta se servía desde la caché,
// porque una función que no corre no anota nada y el contador habría dado un
// número chico y creíble en vez de dar cero —que es la peor de las dos—.
// Medido en producción el 23/10/2026, antes de tocar nada: cinco pedidos
// seguidos dieron `x-vercel-cache: MISS`, contra PRERENDER y después HIT en
// /agenda/hotelga. O sea que esta ruta ya corría en cada clic y el dato no
// existía por un motivo más simple: nadie había puesto el aviso.
//
// Igual se lee una cabecera, y no solo porque haga falta el user-agent: un
// route handler que NO toca el pedido es candidato a que Next lo guarde, y el
// día que eso pase la medición se apagaría sola sin que nada falle. Leyendo el
// pedido queda dinámica por contrato. Es lo mismo que hace /api/agenda/ics.
//
// Lo que cuesta es una invocación por clic, no una lectura de Airtable: la
// lista sigue saliendo de la copia de una hora que arma getEventosConEstado
// con `next: { revalidate, tags }`.

export async function GET(req, { params }) {
  const ev = await getEvento(params.slug);
  if (!ev || !ev.fechaInicio) {
    return new Response("Evento sin fecha confirmada", { status: 404 });
  }

  const ua = req.headers.get("user-agent") || "";

  // SE ANOTA DESPUÉS DE ENCONTRAR EL EVENTO, Y CON `ev.slug`, NO CON EL DE LA
  // DIRECCIÓN. El panel es público y publica lo que recibe (regla 25): si el
  // aviso saliera antes de la búsqueda, cualquiera podría pedir
  // /api/agenda/<lo-que-quiera>/ics y dejar ese texto listado en /api/data.
  // Pasada la búsqueda, el valor ya no viene de afuera: es un slug publicado.
  //
  // Y el número tiene que significar "se bajó un .ics", no "alguien apretó y
  // se llevó un 404": el 404 no se cuenta.
  //
  // Los rastreadores tampoco. El botón es un link y Googlebot lo sigue; si sus
  // pasadas entraran acá, el número arrancaría inflado y la línea de base, que
  // es para lo único que sirve esto, no serviría. El middleware no los ve
  // porque su matcher excluye /api/, así que no hay doble conteo.
  if (!detectarBot(ua)) {
    anotar({
      ruta: `/api/agenda/${ev.slug}/ics`,
      cliente: quienPide(ua),
      // Sin sid y sin filtros a propósito: esto es una descarga suelta, no una
      // suscripción, y no hay recorte de la agenda que elegir. El panel cuenta
      // suscripciones por sid, así que estas filas no se le mezclan adentro.
    });
  }

  // Sin "nombre": esto es una descarga suelta, no una suscripción. Así el
  // evento entra en el calendario que el usuario ya usa.
  const cuerpo = armarCalendario({ eventos: [ev] });

  return new Response(cuerpo, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ev.slug}.ics"`,
      "X-Robots-Tag": "noindex",
    },
  });
}
