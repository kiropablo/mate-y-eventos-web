import { getEvento } from "../../../../lib/agenda";

// El sello "Verificado" como imagen, para que el organizador lo ponga en su
// web. Se sirve desde nuestro dominio a propósito: cada vez que alguien entra
// a la web del organizador, el sello se pide acá, y el link que lo envuelve
// es un backlink al evento.
//
//   /api/agenda/fit/badge.svg          → versión oscura (por defecto)
//   /api/agenda/fit/badge.svg?tema=claro
//
// Devuelve 404 si el evento no está verificado. Eso es lo que sostiene el
// sello: no alcanza con conocer la URL, hay que estar verificado de verdad.

export const revalidate = 3600;

const TEMAS = {
  oscuro: {
    fondo: "#0B0B11",
    borde: "#2A2A36",
    texto: "#F0F0F6",
    suave: "#9A9AA8",
    acento: "#5AA0FF",
    tilde: "#0B0B11",
  },
  claro: {
    fondo: "#FFFFFF",
    borde: "#DFDFE6",
    texto: "#12121A",
    suave: "#6B6B78",
    acento: "#2F6FD0",
    tilde: "#FFFFFF",
  },
};

export async function GET(req, { params }) {
  const ev = await getEvento(params.slug);

  if (!ev || !ev.verificado) {
    return new Response("Este evento no está verificado en Mate y Eventos.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const pedido = new URL(req.url).searchParams.get("tema");
  const t = TEMAS[pedido] || TEMAS.oscuro;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="268" height="62" viewBox="0 0 268 62" role="img" aria-label="${escapar(ev.nombre)}: evento verificado en Mate y Eventos">
  <title>${escapar(ev.nombre)}: evento verificado en Mate y Eventos</title>
  <rect x="0.75" y="0.75" width="266.5" height="60.5" rx="12" fill="${t.fondo}" stroke="${t.borde}" stroke-width="1.5"/>
  <circle cx="34" cy="31" r="14" fill="${t.acento}"/>
  <path d="M27.5 31.2 L32.2 36 L40.8 26.6" fill="none" stroke="${t.tilde}" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="60" y="26" fill="${t.suave}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="9" font-weight="600" letter-spacing="1.7">EVENTO VERIFICADO EN</text>
  <text x="60" y="45" fill="${t.texto}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="0.3">Mate y Eventos</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Vive incrustado en webs ajenas: dejamos que lo cacheen, pero no tanto
      // como para que un sello dado de baja siga apareciendo por días.
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      // Sin esto, algunos navegadores no lo dibujan desde otro dominio.
      "Access-Control-Allow-Origin": "*",
      "X-Robots-Tag": "noindex",
    },
  });
}

// En XML hay que escapar & < > y las comillas antes de meter texto libre.
function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
