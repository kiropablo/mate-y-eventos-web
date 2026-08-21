import { revalidateTag } from "next/cache";
import { getEventoFresco, formatRango } from "../../../../lib/agenda";
import { firmaValida } from "../../../../lib/firma";
import { mandarCorreo, correoInterno } from "../../../../lib/correo";
import { SITE } from "../../../../lib/site";
import { resumirRespuesta, CAMPOS } from "../../../../lib/campos-ficha";

// El organizador confirma su ficha desde el link firmado que le llegó por mail.
//
// Escribe en Airtable y avisa. Nada de esto crea ni borra un evento: solo
// marca que el organizador dio el visto bueno, o guarda lo que pidió corregir.

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";

const recortar = (v, max) => String(v ?? "").trim().slice(0, max);
const esEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

// Cuántas respuestas se aceptan por evento y por día.
const MAXIMO_POR_DIA = 2;
// Cuánto se guarda de historial de correcciones. Al llenarse se descarta lo
// más VIEJO, no lo más nuevo: si se cortara al revés, el día que se llena
// dejaríamos de anotar las correcciones que sí importan.
const MAXIMO_CORRECCIONES = 20000;

export async function POST(req, { params }) {
  const slug = String(params?.slug || "");
  const { searchParams } = new URL(req.url);

  // Sin firma válida no se toca nada: es lo que impide que alguien verifique
  // un evento ajeno escribiendo la dirección a mano.
  if (!firmaValida(slug, searchParams.get("f"))) {
    return Response.json({ error: "Link inválido o vencido." }, { status: 403 });
  }

  const key = process.env.AIRTABLE_API_KEY;
  if (!key) {
    return Response.json({ error: "Sin configurar." }, { status: 500 });
  }

  let datos;
  try {
    datos = await req.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  // Sin caché a propósito: el tope de abajo cuenta las respuestas de hoy
  // leyendo el campo de correcciones. Con una copia guardada, la segunda
  // llamada no vería la primera y el tope no serviría para nada.
  const ev = await getEventoFresco(slug);
  if (!ev) {
    return Response.json({ error: "No encontramos el evento." }, { status: 404 });
  }

  const email = recortar(datos?.email, 160);
  const revisiones = datos?.revisiones;

  if (!revisiones || typeof revisiones !== "object") {
    return Response.json({ error: "Faltan las respuestas." }, { status: 400 });
  }

  // Solo se aceptan los campos que la ficha realmente muestra: así nadie
  // manda claves inventadas que después alguien lee como si fueran datos.
  const limpias = {};
  for (const c of CAMPOS) {
    const r = revisiones[c.clave];
    if (!r || typeof r !== "object") continue;
    const correccion = recortar(r.correccion, 1000);
    if (r.ok === true) limpias[c.clave] = { ok: true };
    else if (correccion) limpias[c.clave] = { ok: false, correccion };
  }

  if (Object.keys(limpias).length === 0) {
    return Response.json(
      { error: "Marcá al menos un dato antes de enviar." },
      { status: 400 }
    );
  }
  if (email && !esEmail(email)) {
    return Response.json({ error: "Ese email no parece válido." }, { status: 400 });
  }

  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  // Tope por evento y por día.
  //
  // El link firmado no vence ni se agota: quien lo tenga puede volver a
  // mandarlo. Y cada envío escribe en Airtable y dispara un mail. Sin tope,
  // alguien con el link puede llenarnos la casilla, quemarnos la cuota de
  // correo y hacer que Airtable nos corte la agenda entera, que sale de la
  // misma base. Dos respuestas por día alcanzan para cualquier uso normal.
  const yaHoy = (ev.correcciones.match(new RegExp(`\\[${hoy}\\]`, "g")) || [])
    .length;
  if (yaHoy >= MAXIMO_POR_DIA) {
    return Response.json(
      {
        error:
          "Ya recibimos tu respuesta hoy. Si te falta algo, respondé el mail que te mandamos.",
      },
      { status: 429 }
    );
  }

  const pidioCambios = Object.values(limpias).some((r) => !r.ok);
  const resumen = resumirRespuesta(ev, limpias, hoy);

  // El sello NO se enciende acá. La respuesta del organizador queda como
  // pendiente de revisión: una persona la mira, aplica lo que haya que
  // aplicar y recién ahí verifica. Si el sello se encendiera solo, diría
  // "el organizador apretó un botón", no "los datos están bien".
  const previas = ev.correcciones ? `${ev.correcciones}\n\n` : "";
  const historial = `${previas}${resumen}`;
  const fields = {
    "Revisión pendiente": true,
    "Correcciones del organizador":
      historial.length > MAXIMO_CORRECCIONES
        ? `…\n\n${historial.slice(-MAXIMO_CORRECCIONES)}`
        : historial,
  };
  if (email) fields["Email del organizador"] = email;
  if (pidioCambios) {
    fields["Revisar"] = true;
    // Si el organizador avisa que un dato está mal, el sello no puede seguir
    // encendido: dice que él confirmó los datos, y acaba de decir que no.
    // Vuelve a encenderse cuando lo revisamos y le damos el OK.
    if (ev.verificado) {
      fields["Verificado por el organizador"] = false;
      fields["Fecha de verificación"] = null;
    }
  }

  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [{ id: ev.id, fields }],
      typecast: true,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.warn(`[confirmar] Airtable ${res.status}: ${detalle.slice(0, 200)}`);
    return Response.json({ error: "No se pudo guardar." }, { status: 502 });
  }

  // La ficha tiene que mostrar el sello ya mismo, no dentro de una hora.
  try {
    revalidateTag("agenda");
  } catch {
    // Si falla, la ficha se actualiza sola en la próxima revalidación.
  }

  // El aviso va después de guardar y nunca voltea la respuesta: para el
  // organizador el trámite ya terminó bien.
  const ficha = `${SITE.url}/agenda/${ev.slug}`;
  await mandarCorreo({
    para: correoInterno(),
    asunto: pidioCambios
      ? `✏️ ${ev.nombre} respondió con correcciones`
      : `✅ ${ev.nombre} confirmó su ficha`,
    texto: [
      pidioCambios
        ? `${ev.nombre} repasó su ficha y marcó cosas para corregir.`
        : `${ev.nombre} repasó su ficha y está todo bien.`,
      "",
      `Evento:   ${ev.nombre}`,
      `Fechas:   ${formatRango(ev) || "sin fecha"}`,
      `Ficha:    ${ficha}`,
      email ? `Contacto: ${email}` : "Contacto: no dejó mail",
      "",
      resumen,
      "",
      `Falta tu OK: entrá al panel, pestaña Organizadores, y dale "Dar el OK" cuando esté.`,
      `${SITE.url}/admin`,
    ]
      .filter((l) => l !== null)
      .join("\n"),
    responderA: email || undefined,
  });

  return Response.json({ ok: true, pendiente: true });
}
