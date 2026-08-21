import { revalidateTag } from "next/cache";
import { getEvento, formatRango } from "../../../../lib/agenda";
import { firmaValida } from "../../../../lib/firma";
import { mandarCorreo, correoInterno } from "../../../../lib/correo";
import { SITE } from "../../../../lib/site";

// El organizador confirma su ficha desde el link firmado que le llegó por mail.
//
// Escribe en Airtable y avisa. Nada de esto crea ni borra un evento: solo
// marca que el organizador dio el visto bueno, o guarda lo que pidió corregir.

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";

const recortar = (v, max) => String(v ?? "").trim().slice(0, max);
const esEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

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

  const ev = await getEvento(slug);
  if (!ev) {
    return Response.json({ error: "No encontramos el evento." }, { status: 404 });
  }

  const confirma = datos?.confirma === true;
  const email = recortar(datos?.email, 160);
  const correcciones = recortar(datos?.correcciones, 4000);

  if (!confirma && !correcciones) {
    return Response.json(
      { error: "Contanos qué hay que corregir." },
      { status: 400 }
    );
  }
  if (email && !esEmail(email)) {
    return Response.json({ error: "Ese email no parece válido." }, { status: 400 });
  }

  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  // Solo se tocan los campos del circuito. Nombre, fechas y sede no se
  // modifican nunca desde acá: si el organizador pide un cambio, queda escrito
  // en "Correcciones" y lo aplica una persona.
  const fields = {};
  if (confirma) {
    fields["Verificado por el organizador"] = true;
    fields["Fecha de verificación"] = hoy;
  }
  if (email) fields["Email del organizador"] = email;
  if (correcciones) {
    const previas = ev.correcciones ? `${ev.correcciones}\n\n` : "";
    fields["Correcciones del organizador"] =
      `${previas}[${hoy}] ${correcciones}`.slice(0, 100000);
    // Que aparezca en la revisión manual.
    fields["Revisar"] = true;
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
    asunto: confirma
      ? `✅ ${ev.nombre} confirmó su ficha`
      : `✏️ ${ev.nombre} pidió correcciones`,
    texto: [
      confirma
        ? `${ev.nombre} confirmó que los datos de su ficha están bien.`
        : `${ev.nombre} pidió que corrijamos algo antes de verificar.`,
      "",
      `Evento:  ${ev.nombre}`,
      `Fechas:  ${formatRango(ev) || "sin fecha"}`,
      `Ficha:   ${ficha}`,
      email ? `Contacto: ${email}` : "Contacto: no dejó mail",
      "",
      correcciones ? `Lo que pidió corregir:\n${correcciones}` : "",
      "",
      confirma
        ? "Cuando lo publiques en las redes, tildá «Difundido» en el panel y se le avisa solo."
        : "Corregí la ficha en Airtable y volvé a escribirle.",
    ]
      .filter((l) => l !== "")
      .join("\n"),
    responderA: email || undefined,
  });

  return Response.json({ ok: true, confirmado: confirma });
}
