import { haySesion } from "../../../lib/admin";
import { getInvitado } from "../../../lib/invitados";
import {
  getInvitadosAirtable,
  guardarEnAirtable,
} from "../../../lib/invitados-airtable";

// Une una ficha del repositorio con su registro de Airtable: escribe el slug de
// la ficha en el campo "Ficha" del registro.
//
// Esto lo hace una persona con un click y no el robot solo, a propósito. El
// robot puede proponer que "Michel" es el registro de "Miguel Ángel Clavello"
// porque el campo Empresa/Cargo dice "Michel Mentalista", pero decidir que dos
// nombres distintos son la misma persona es adivinar el nombre real de alguien
// a partir de un parecido. Eso lo sabe Pablo, no una comparación de textos.
//
// Una vez unida, el vínculo es explícito y deja de depender de que los nombres
// coincidan: de ahí en adelante el panel encuentra el registro por el slug.

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }

  let slug = "";
  let registroId = "";
  try {
    const body = await request.json();
    slug = String(body?.slug || "");
    registroId = String(body?.registroId || "");
  } catch {
    slug = "";
  }
  if (!slug) {
    return Response.json({ ok: false, error: "Falta la ficha." }, { status: 400 });
  }
  if (!/^rec[A-Za-z0-9]{14}$/.test(registroId)) {
    return Response.json(
      { ok: false, error: "Falta el registro de Airtable." },
      { status: 400 }
    );
  }

  const inv = getInvitado(slug, { incluirBorradores: true });
  if (!inv) {
    return Response.json({ ok: false, error: "No existe esa ficha." }, { status: 404 });
  }

  const registros = await getInvitadosAirtable();
  const registro = registros.find((r) => r.id === registroId);
  if (!registro) {
    return Response.json(
      { ok: false, error: "Ese registro no está en Airtable." },
      { status: 404 }
    );
  }

  // Un registro no puede quedar atado a dos fichas: la segunda le pisaría el
  // contacto a la primera y ninguna de las dos avisaría.
  const yaAtado = registros.find(
    (r) => r.ficha === slug && r.id !== registroId
  );
  if (yaAtado) {
    return Response.json(
      {
        ok: false,
        error: `La ficha ya está unida a «${yaAtado.nombre}». Sacale el slug a ese registro en Airtable antes de unirla a otro.`,
      },
      { status: 409 }
    );
  }
  if (registro.ficha && registro.ficha !== slug) {
    return Response.json(
      {
        ok: false,
        error: `Ese registro ya está unido a la ficha «${registro.ficha}».`,
      },
      { status: 409 }
    );
  }

  const guardado = await guardarEnAirtable(registroId, { Ficha: slug });
  if (!guardado) {
    return Response.json({ ok: false, error: "No se pudo guardar." }, { status: 502 });
  }

  // Se devuelve lo que trae el registro, para que el panel pueda ofrecer
  // pasarlo a la ficha sin recargar la página.
  return Response.json({
    ok: true,
    registro: {
      id: registro.id,
      email: registro.email,
      telefono: registro.telefono,
      empresa: registro.empresa,
      nombreCompleto: registro.nombre,
      web: registro.web,
      redes: registro.redes,
      pedidoEl: registro.pedidoEl,
      validadoEl: registro.validadoEl,
      revisionPendiente: registro.revisionPendiente,
      correcciones: registro.correcciones,
    },
  });
}
