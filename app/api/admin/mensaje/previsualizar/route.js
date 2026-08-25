import { haySesion } from "../../../../lib/admin";
import { CAMPOS } from "../../../../lib/mensajes";
import { getEventos, yaPaso } from "../../../../lib/agenda";
import { mismaSemana, propiosEsaSemana, MAXIMO_SEMANA } from "../../../../lib/semana";
import { armarInvitacion } from "../../../../lib/mail-invitacion";

// Arma el mail con los textos que están en la pantalla, sin guardar nada.
//
// Se previsualiza con un evento de verdad de la agenda y no con uno inventado:
// lo que se quiere ver es cómo queda con un nombre largo, una sede que no
// entra en el asunto y otros eventos esa misma semana. Con un ejemplo prolijo
// el mail siempre se ve bien, y después sale distinto.

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }

  let valores = {};
  let slug = "";
  try {
    const body = await request.json();
    valores = body?.valores || {};
    slug = String(body?.slug || "");
  } catch {
    return Response.json(
      { ok: false, error: "No se entendió el pedido." },
      { status: 400 }
    );
  }

  const mensaje = {};
  for (const c of CAMPOS) {
    const v = String(valores[c.id] ?? "").trim();
    mensaje[c.id] = v || c.porDefecto;
  }

  const todos = await getEventos();
  const vigentes = todos.filter((e) => !yaPaso(e));
  if (vigentes.length === 0) {
    return Response.json(
      { ok: false, error: "No hay eventos próximos en la agenda para previsualizar." },
      { status: 503 }
    );
  }

  const ev = vigentes.find((e) => e.slug === slug) || vigentes[0];

  const { asunto, texto, html } = armarInvitacion({
    ev,
    semana: mismaSemana(ev, vigentes, { max: MAXIMO_SEMANA + 1 }),
    propios: propiosEsaSemana(ev, vigentes),
    // El link real lleva firma y no se arma acá: esto es una muestra.
    link: `https://www.mateyeventos.com/agenda/${ev.slug}/confirmar?f=muestra`,
    mensaje,
  });

  return Response.json({
    ok: true,
    conQue: ev.nombre,
    slug: ev.slug,
    asunto,
    texto,
    html,
    // Los próximos, que son los que se van a mandar de verdad.
    opciones: vigentes.slice(0, 40).map((e) => ({ slug: e.slug, nombre: e.nombre })),
  });
}
