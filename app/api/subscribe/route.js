// Conexión con beehiiv (del lado del servidor, para no exponer la clave).
// Las credenciales viven en variables de entorno de Vercel — NUNCA en el código:
//   BEEHIIV_API_KEY         → la API Key de beehiiv (Settings → Integrations)
//   BEEHIIV_PUBLICATION_ID  → el Publication ID (empieza con "pub_")
// Mientras no estén configuradas, la ruta responde "not_configured" y el
// formulario muestra un mensaje amable.

export async function POST(request) {
  let email;
  try {
    const body = await request.json();
    email = (body?.email || "").trim();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  const apiKey = process.env.BEEHIIV_API_KEY;

  if (!pubId || !apiKey) {
    return Response.json({ error: "not_configured" }, { status: 503 });
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
