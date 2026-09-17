import { haySesion } from "../../../lib/admin";
import {
  getInvitadosAirtable,
  guardarEnAirtable,
} from "../../../lib/invitados-airtable";

// "Ya lo miré": apaga el cartel de revisión pendiente.
//
// No publica la ficha ni aplica nada: eso se hace en el editor, a mano, mirando
// lo que el invitado pidió. Esto solo dice "esta respuesta ya la leí", igual
// que el botón equivalente del circuito de organizadores.
//
// Lo que el invitado escribió NO se borra. Queda en Airtable para siempre: es
// la constancia de que lo que se publicó con su nombre pasó por él.

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }

  let id = "";
  try {
    id = String((await request.json())?.registroId || "");
  } catch {
    id = "";
  }
  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) {
    return Response.json(
      { ok: false, error: "Falta el registro del invitado." },
      { status: 400 }
    );
  }

  // Se comprueba que el registro exista antes de escribirle: un id inventado
  // crearía un error de Airtable difícil de leer en vez de un mensaje claro.
  const registros = await getInvitadosAirtable();
  if (!registros.some((r) => r.id === id)) {
    return Response.json(
      { ok: false, error: "Ese registro no está en Airtable." },
      { status: 404 }
    );
  }

  const guardado = await guardarEnAirtable(id, { "Revisión pendiente": false });
  if (!guardado) {
    return Response.json({ ok: false, error: "No se pudo guardar." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
