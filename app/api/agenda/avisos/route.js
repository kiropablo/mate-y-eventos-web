import { getEventosConEstado, formatRango, nombreConAnio } from "../../../lib/agenda";
import { avisosPendientes, marcarAvisados } from "../../../lib/avisos";
import { mandarCorreo } from "../../../lib/correo";
import { SITE } from "../../../lib/site";

// Manda los avisos de fecha que quedaron pendientes.
//
// La llama la Action de la agenda una vez por día, con el mismo token que ya
// usa para refrescar. Vive acá y no en el robot porque el envío de correo es
// del sitio: RESEND_API_KEY está en Vercel, no en los secretos de GitHub.
//
// No hace falta detectar "el día que se confirmó la fecha": alcanza con
// preguntar, cada día, si algún evento que alguien está esperando ya tiene
// fecha. Sin estado que mantener y sin nada que se pueda desincronizar.

export const dynamic = "force-dynamic";

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  const esperado = process.env.REVALIDATE_TOKEN;
  if (!esperado || token !== esperado) {
    return Response.json({ error: "Token inválido" }, { status: 401 });
  }

  const pendientes = await avisosPendientes();
  if (!pendientes.length) {
    return Response.json({ ok: true, avisados: 0, mensaje: "No hay nadie esperando." });
  }

  // Estricto: si la lectura de la agenda viene corta, un evento que SÍ tiene
  // fecha podría faltar en la lista y esta corrida no avisaría. Eso no rompe
  // nada —se reintenta mañana— pero peor sería lo contrario, así que mejor
  // cortar y decirlo.
  const { eventos, completa } = await getEventosConEstado();
  if (!completa) {
    console.warn("[avisos] la agenda vino incompleta: no se manda nada esta corrida");
    return Response.json(
      { ok: false, motivo: "agenda-incompleta", esperando: pendientes.length },
      { status: 503 }
    );
  }
  const porId = new Map(eventos.map((e) => [e.id, e]));

  // Se agrupa por evento: si tres personas esperan el mismo, es un texto solo.
  const listos = new Map();
  for (const a of pendientes) {
    const ev = porId.get(a.evento);
    if (!ev || !ev.fechaInicio) continue;
    if (!listos.has(ev.id)) listos.set(ev.id, { ev, avisos: [] });
    listos.get(ev.id).avisos.push(a);
  }

  if (!listos.size) {
    return Response.json({
      ok: true,
      avisados: 0,
      esperando: pendientes.length,
      mensaje: "Nadie está esperando un evento que ya tenga fecha.",
    });
  }

  const marcar = [];
  let fallados = 0;

  for (const { ev, avisos } of listos.values()) {
    const nombre = nombreConAnio(ev);
    const cuando = formatRango(ev);
    const donde = [ev.venue, ev.ciudad, ev.pais].filter(Boolean).join(" · ");
    const ficha = `${SITE.url}/agenda/${ev.slug}`;

    for (const a of avisos) {
      const r = await mandarCorreo({
        para: a.email,
        asunto: `Ya hay fecha: ${nombre}`,
        texto: [
          `Nos pediste que te avisáramos cuando se confirmara la fecha de ${nombre}. Ya está:`,
          "",
          `  ${cuando}`,
          // null y no "": el filtro de abajo saca los null. Con "" se llevaba
          // puestos todos los renglones en blanco y el correo salía apretado.
          donde ? `  ${donde}` : null,
          "",
          `La ficha, con el organizador, el sitio oficial y los contactos:`,
          ficha,
          "",
          `Este es el único correo que te mandamos por este evento. No te sumamos a`,
          `ninguna lista: si querés recibir la agenda todas las semanas, es acá y`,
          `lo elegís vos: ${SITE.url}/newsletter`,
          "",
          `— ${SITE.name}`,
        ]
          .filter((l) => l !== null)
          .join("\n"),
      });

      // Se marca solo si el correo salió. Marcar antes dejaría a alguien
      // como avisado sin haber recibido nada, y eso no se puede detectar
      // después. Un correo repetido molesta; una promesa incumplida, no.
      if (r?.ok === true) marcar.push(a.id);
      else fallados++;
    }
  }

  const marcados = await marcarAvisados(marcar);
  console.log(
    `[avisos] avisados ${marcar.length} de ${pendientes.length} que esperaban` +
      (fallados ? `, ${fallados} correos no salieron` : "")
  );

  return Response.json({
    ok: true,
    avisados: marcar.length,
    marcados,
    fallados,
    esperando: pendientes.length - marcar.length,
  });
}
