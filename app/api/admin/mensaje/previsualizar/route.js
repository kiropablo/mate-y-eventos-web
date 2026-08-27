import { haySesion } from "../../../../lib/admin";
import { camposDe, MENSAJES } from "../../../../lib/mensajes";
import { getEventos, yaPaso } from "../../../../lib/agenda";
import {
  mismaSemana,
  propiosEsaSemana,
  delMismoOrganizador,
  MAXIMO_SEMANA,
} from "../../../../lib/semana";
import { armarInvitacion } from "../../../../lib/mail-invitacion";
import { armarConfirmacion } from "../../../../lib/mail-confirmacion";

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
  let cual = "primer-contacto";
  try {
    const body = await request.json();
    valores = body?.valores || {};
    slug = String(body?.slug || "");
    cual = MENSAJES[String(body?.cual || "")] ? String(body.cual) : cual;
  } catch {
    return Response.json(
      { ok: false, error: "No se entendió el pedido." },
      { status: 400 }
    );
  }

  const mensaje = {};
  for (const c of camposDe(cual)) {
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

  // Para la confirmación se prefiere uno que YA tenga el sello: es el único
  // caso en que ese mail sale de verdad, y con uno sin verificar no se vería
  // el mes del sello ni los otros eventos del mismo organizador.
  const candidatos =
    cual === "confirmacion" && vigentes.some((e) => e.verificado)
      ? vigentes.filter((e) => e.verificado)
      : vigentes;
  const ev = candidatos.find((e) => e.slug === slug) || candidatos[0];

  if (cual === "confirmacion") {
    const m = armarConfirmacion({
      ev,
      otros: delMismoOrganizador(ev, vigentes),
      mensaje,
    });
    return Response.json({
      ok: true,
      conQue: ev.nombre,
      slug: ev.slug,
      ...m,
      opciones: candidatos
        .slice(0, 40)
        .map((e) => ({ slug: e.slug, nombre: e.nombre })),
    });
  }

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
