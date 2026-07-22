import { cookies } from "next/headers";
import { COOKIE, DURACION, huella, huellaEsperada } from "../../../lib/admin";

export const dynamic = "force-dynamic";

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

  let clave = "";
  try {
    const body = await request.json();
    clave = body?.password || "";
  } catch {
    clave = "";
  }

  if (huella(clave) !== esperada) {
    return Response.json(
      { ok: false, error: "Contraseña incorrecta." },
      { status: 401 }
    );
  }

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
