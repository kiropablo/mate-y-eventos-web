// Conexión con beehiiv (del lado del servidor, para no exponer la clave).
// Las credenciales viven en variables de entorno de Vercel — NUNCA en el código:
//   BEEHIIV_API_KEY         → la API Key de beehiiv (Settings → Integrations)
//   BEEHIIV_PUBLICATION_ID  → el Publication ID (empieza con "pub_")
// Mientras no estén configuradas, la ruta responde "not_configured" y el
// formulario muestra un mensaje amable.

// Tope de altas por día para TODO el sitio.
//
// Cada alta aceptada dispara el correo de bienvenida de beehiiv
// (send_welcome_email más abajo), así que sin freno este formulario es una
// máquina de mandarle correos a direcciones ajenas con nuestro remitente: se
// pone la dirección de un tercero en un bucle y listo. El tope es global y no
// por IP porque rotar IPs es gratis y rotar el día no.
//
// Honestidad sobre lo que esto vale: el contador vive en la memoria del
// proceso, y en Vercel cada instancia tiene la suya y arranca vacía. Frena al
// bot de una sola conexión, no al decidido, que haciendo más pedidos hace
// nacer más instancias. El freno de verdad, si algún día hace falta, es una
// regla del firewall de Vercel sobre esta ruta.
const TOPE_POR_DIA = 40;
let cuenta = { dia: "", n: 0 };

function pasaElTope() {
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  if (cuenta.dia !== hoy) cuenta = { dia: hoy, n: 0 };
  cuenta.n += 1;
  return cuenta.n <= TOPE_POR_DIA;
}

export async function POST(request) {
  let email;
  let trampa;
  try {
    const body = await request.json();
    email = (body?.email || "").trim();
    trampa = body?.tel;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  // Trampa para robots, igual que en los otros formularios públicos: "tel" es
  // un campo que una persona no ve, así que si vino lleno lo llenó un bot.
  // Se contesta ok y no se llama a beehiiv: que crea que funcionó y no vuelva
  // a probar con otra variante.
  if (trampa) {
    return Response.json({ ok: true });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  const apiKey = process.env.BEEHIIV_API_KEY;

  if (!pubId || !apiKey) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  // El tope se cuenta recién acá, cuando el próximo paso es el correo de
  // verdad: un pedido mal armado —o uno que llega mientras faltan las claves—
  // no manda nada, y no le tiene que gastar el cupo del día a alguien que sí
  // se quiere suscribir.
  if (!pasaElTope()) {
    console.warn(`[subscribe] tope diario alcanzado (${TOPE_POR_DIA})`);
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: "mateyeventos.com",
          referring_site: "https://mateyeventos.com",
        }),
      }
    );

    if (!res.ok) {
      return Response.json({ error: "provider_error" }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
