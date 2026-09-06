import { cookies } from "next/headers";
import { COOKIE, DURACION, huella, huellaEsperada } from "../../../lib/admin";

export const dynamic = "force-dynamic";

// Freno a la prueba de contraseñas.
//
// Antes no había nada: ocho intentos seguidos contestaban en 0,3 segundos cada
// uno, sin demora, sin bloqueo y sin dejar una sola línea escrita. Alguien
// podía probar claves todo el día y nadie se enteraba nunca. Es el único camino
// directo de afuera al control del panel.
//
// LO QUE ESTO ES Y LO QUE NO ES. El contador vive en la memoria del proceso, y
// en Vercel cada instancia tiene la suya y arranca vacía. O sea que frena al
// script tonto y no al decidido, que puede forzar instancias nuevas. NO es la
// defensa: la defensa es que ADMIN_PASSWORD sea larga y al azar. Esto es el
// amortiguador, y sobre todo el AVISO: el console.warn deja rastro en los
// registros de Vercel, que era lo que de verdad no existía.
const TOPE = 5;
const VENTANA = 15 * 60 * 1000;
const fallos = new Map();

function quien(request) {
  const h = request.headers;
  return (
    h.get("x-vercel-forwarded-for") ||
    (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "desconocido"
  );
}

function bloqueado(ip) {
  const ahora = Date.now();
  const previos = (fallos.get(ip) || []).filter((t) => ahora - t < VENTANA);
  if (previos.length) fallos.set(ip, previos);
  else fallos.delete(ip);
  return previos.length >= TOPE;
}

function anotarFallo(ip) {
  const ahora = Date.now();
  const previos = (fallos.get(ip) || []).filter((t) => ahora - t < VENTANA);
  previos.push(ahora);
  fallos.set(ip, previos);

  // Limpieza: sin esto el Map crece sin techo con una instancia de larga vida.
  if (fallos.size > 500) {
    for (const [k, v] of fallos) {
      if (!v.some((t) => ahora - t < VENTANA)) fallos.delete(k);
    }
  }
  return previos.length;
}

export async function POST(request) {
  const esperada = huellaEsperada();

  if (!esperada) {
    return Response.json(
      {
        ok: false,
        error:
          "Falta configurar la variable ADMIN_PASSWORD en Vercel.",
      },
      { status: 500 }
    );
  }

  const ip = quien(request);
  if (bloqueado(ip)) {
    console.warn(`[admin] login bloqueado por demasiados fallos · ${ip}`);
    return Response.json(
      { ok: false, error: "Demasiados intentos. Probá de nuevo en un rato." },
      { status: 429 }
    );
  }

  let clave = "";
  try {
    const body = await request.json();
    clave = body?.password || "";
  } catch {
    clave = "";
  }

  if (huella(clave) !== esperada) {
    const n = anotarFallo(ip);
    // El aviso va SIEMPRE, no solo al llegar al tope: un solo intento fallado
    // desde una IP desconocida ya es algo que conviene poder mirar después.
    console.warn(`[admin] contraseña incorrecta · ${ip} · fallo ${n} de ${TOPE}`);
    return Response.json(
      { ok: false, error: "Contraseña incorrecta." },
      { status: 401 }
    );
  }

  // Entró bien: se le limpia el historial para que un tipeo previo no le
  // cuente en contra más tarde.
  fallos.delete(ip);

  cookies().set(COOKIE, esperada, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION,
  });

  return Response.json({ ok: true });
}

// Cerrar sesión.
export async function DELETE() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
