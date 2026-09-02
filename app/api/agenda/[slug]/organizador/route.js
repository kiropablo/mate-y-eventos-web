import { getEventoFresco } from "../../../../lib/agenda";
import { mandarCorreo, correoInterno } from "../../../../lib/correo";
import { SITE } from "../../../../lib/site";

// "Soy el organizador de este evento": el pedido entrante de verificación.
//
// Por qué existe: el circuito del sello arranca con una invitación que manda
// Pablo, de a una, y por eso hay 10 eventos verificados sobre 338. Pero el
// organizador de cada evento YA está entrando a su propia ficha —busca el
// nombre de su evento en Google y la ficha aparece entre los primeros—, y
// hasta ahora la página no le decía que podía reclamarla.
//
// ESTO NO VERIFICA NADA. Escribe un pedido y avisa; el sello lo sigue
// encendiendo una persona después de repasar la ficha con el organizador por
// el link firmado de siempre. Es la regla 11: lo editorial no se regala, y un
// sello que se enciende llenando un formulario no vale nada.
//
// Lo único que toca en Airtable es el email del organizador cuando está
// vacío, que es exactamente para lo que ese campo existe y es lo que
// destraba el botón "Invitar" del panel. Lo demás va a las notas internas.

export const dynamic = "force-dynamic";

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";

// Tope por evento y por día: esta ruta es pública y escribe en Airtable.
// Es el mismo cuidado que la ruta de confirmación.
const TOPE_POR_DIA = 3;
const pedidos = new Map();

function limpiar(t, largo) {
  return String(t || "").replace(/\s+/g, " ").trim().slice(0, largo);
}

function pasaElTope(slug) {
  const hoy = new Date().toISOString().slice(0, 10);
  const clave = `${slug}:${hoy}`;
  const n = (pedidos.get(clave) || 0) + 1;
  pedidos.set(clave, n);
  return n <= TOPE_POR_DIA;
}

export async function POST(req, { params }) {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) return Response.json({ error: "Sin configurar." }, { status: 500 });

  const slug = String(params?.slug || "");

  let datos;
  try {
    datos = await req.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  // Honeypot: si un bot llenó el campo escondido, contestamos que sí y
  // descartamos. Mismo truco que el formulario de sugerir.
  if (datos.tel) return Response.json({ ok: true });

  const nombre = limpiar(datos.nombre, 120);
  const email = limpiar(datos.email, 160);
  const mensaje = limpiar(datos.mensaje, 600);

  if (!nombre || !/.+@.+\..+/.test(email)) {
    return Response.json(
      { error: "Necesitamos tu nombre y un correo donde escribirte." },
      { status: 400 }
    );
  }

  if (!pasaElTope(slug)) {
    return Response.json(
      { error: "Ya recibimos varios pedidos de este evento hoy. Escribinos por correo." },
      { status: 429 }
    );
  }

  // Se lee fresco: si el evento se archivó hace un minuto, no queremos
  // escribirle encima.
  const ev = await getEventoFresco(slug);
  if (!ev) {
    return Response.json({ error: "No encontramos ese evento." }, { status: 404 });
  }

  const hoy = new Date().toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const nota =
    `[${hoy}] ${nombre} <${email}> dice ser el organizador y pide la verificación.` +
    (mensaje ? ` Mensaje: ${mensaje}` : "");

  // Las notas internas se leen DIRECTO de Airtable, no del evento.
  //
  // A propósito: el objeto del evento se serializa entero en el HTML de la
  // ficha pública, así que las notas internas no están mapeadas ahí y no
  // tienen que estarlo. Ya se publicaron por error una vez (ExpoCehap y Expo
  // Wedding) y hubo que sacarlas a mano.
  //
  // Y se APILAN: pisar lo que había borraría el rastro de los pedidos
  // anteriores y las anotaciones del equipo. Si la lectura falla, no se
  // escribe la nota: perder el historial es peor que perder este renglón.
  let notasPrevias = null;
  try {
    const uno = await fetch(
      `https://api.airtable.com/v0/${BASE}/${TABLA}/${ev.id}`,
      { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" }
    );
    if (uno.ok) {
      notasPrevias = (await uno.json())?.fields?.["Notas internas"] || "";
    }
  } catch (e) {
    console.warn(`[organizador] no se pudieron leer las notas: ${e.message}`);
  }

  const fields = {};
  if (notasPrevias !== null) {
    fields["Notas internas"] = [notasPrevias, nota].filter(Boolean).join("\n");
  }
  // El email solo se completa si estaba vacío. Si ya hay uno cargado —que lo
  // puso el equipo o una verificación anterior— no lo pisa un formulario
  // público: eso sería dejar que un tercero redirija a dónde le escribimos.
  if (!ev.emailOrganizador) fields["Email del organizador"] = email;

  // Puede quedar vacío: notas que no se pudieron leer y un email ya cargado.
  // En ese caso no se toca Airtable y el pedido viaja solo por correo, que es
  // lo que de verdad hace que Pablo se entere.
  const res = Object.keys(fields).length === 0
    ? { ok: true }
    : await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ id: ev.id, fields }], typecast: true }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.warn(`[organizador] Airtable ${res.status}: ${detalle.slice(0, 200)}`);
    return Response.json({ error: "No se pudo guardar." }, { status: 502 });
  }

  // El aviso va después de guardar y nunca voltea la respuesta: si el correo
  // no sale, el pedido igual quedó anotado en la ficha.
  const interno = correoInterno();
  if (interno) {
    await mandarCorreo({
      para: interno,
      responderA: email,
      asunto: `Pide verificación: ${ev.nombre}`,
      texto: [
        `${nombre} <${email}> dice ser el organizador de "${ev.nombre}" y pide la verificación.`,
        mensaje ? `\nMensaje:\n${mensaje}` : "",
        `\nFicha: ${SITE.url}/agenda/${ev.slug}`,
        `Panel: ${SITE.url}/admin (pestaña Organizadores) → mandale la invitación.`,
        ev.emailOrganizador && ev.emailOrganizador !== email
          ? `\nOjo: la ficha ya tenía cargado ${ev.emailOrganizador}. El email nuevo NO se pisó.`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  return Response.json({ ok: true });
}
