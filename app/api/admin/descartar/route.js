import { revalidateTag } from "next/cache";
import { haySesion } from "../../../lib/admin";
import { getEventoDelPanel } from "../../../lib/agenda";

// "Sacar de la agenda": el evento deja de publicarse, pero NO se borra.
//
// Pone Estado en "Archivado", que es el cajón que ya usa la base para lo que
// sale de circulación (duplicados, ediciones viejas). Como el sitio lee solo
// los que están en "Aprobado", con eso desaparece de la agenda, de las
// landings y del sitemap en la próxima revalidación.
//
// No se borra el registro a propósito. Un evento cargado tiene fuentes,
// contactos, correcciones del organizador y a veces el sello: si se borrara,
// el robot de la agenda lo volvería a encontrar en la próxima pasada y lo
// cargaría de cero, sin nada de eso. Archivado, en cambio, queda como
// constancia de que ya lo miramos y lo dejamos afuera.
//
// El estado anterior queda anotado en Notas internas para poder devolverlo a
// donde estaba. Hoy desde el panel solo se archivan los que están en
// "Aprobado", pero cuando la pestaña muestre también los borradores, restaurar
// a "Aprobado" publicaría un borrador que nadie revisó.

export const dynamic = "force-dynamic";

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";

function explicar(estado) {
  if (estado === 401)
    return "Airtable rechazó la llave (401). Hay que revisar AIRTABLE_API_KEY en Vercel.";
  if (estado === 403)
    return "Airtable aceptó la llave pero no la deja escribir (403).";
  if (estado === 429)
    return "Airtable cortó por exceso de pedidos (429). Esperá un minuto y probá de nuevo.";
  return `Airtable contestó ${estado}.`;
}

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }

  const key = process.env.AIRTABLE_API_KEY;
  if (!key) {
    return Response.json(
      { ok: false, error: "Falta AIRTABLE_API_KEY en Vercel." },
      { status: 500 }
    );
  }

  // El id del registro es lo que identifica al evento: el slug se repite
  // entre un archivado y su gemelo publicado.
  let id = "";
  let slug = "";
  let motivo = "";
  try {
    const body = await request.json();
    id = String(body?.id || "");
    slug = String(body?.slug || "");
    // Opcional: por qué se saca. Queda escrito en la nota, que es lo que va a
    // leer el que dentro de seis meses se pregunte por qué no está.
    motivo = String(body?.motivo || "").trim().slice(0, 200);
  } catch {
    id = "";
    slug = "";
  }
  if (!id && !slug) {
    return Response.json({ ok: false, error: "Falta el evento." }, { status: 400 });
  }

  const ev = await getEventoDelPanel({ id, slug });
  if (!ev) {
    return Response.json(
      { ok: false, error: "No existe ese evento, o ya está fuera de la agenda." },
      { status: 404 }
    );
  }

  const cabeceras = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  // Se lee el registro antes de escribir para AGREGAR abajo de las notas y no
  // pisarlas: ahí escriben también el robot de la agenda y el buscador de
  // contactos. Mandar solo la línea nueva borraba todo lo anterior.
  const actual = await fetch(
    `https://api.airtable.com/v0/${BASE}/${TABLA}/${ev.id}`,
    { headers: cabeceras, cache: "no-store" }
  );
  if (!actual.ok) {
    console.warn(`[descartar] Airtable ${actual.status} al leer ${ev.slug}`);
    return Response.json(
      { ok: false, error: explicar(actual.status) },
      { status: 502 }
    );
  }
  const campos = (await actual.json())?.fields || {};
  const notas = String(campos["Notas internas"] || "");
  const estadoPrevio = String(campos["Estado"] || "Aprobado");

  if (estadoPrevio === "Archivado") {
    return Response.json(
      { ok: false, error: "Ese evento ya estaba fuera de la agenda." },
      { status: 409 }
    );
  }

  const hoy = new Date().toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const linea = `[${hoy}] Sacado de la agenda desde el panel. Estaba como "${estadoPrevio}".${
    motivo ? ` Motivo: ${motivo}` : ""
  }`;

  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
    method: "PATCH",
    headers: cabeceras,
    body: JSON.stringify({
      records: [
        {
          id: ev.id,
          fields: {
            Estado: "Archivado",
            "Notas internas": notas ? `${notas}\n${linea}` : linea,
          },
        },
      ],
      typecast: true,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.warn(`[descartar] Airtable ${res.status}: ${detalle.slice(0, 200)}`);
    return Response.json(
      { ok: false, error: explicar(res.status) },
      { status: 502 }
    );
  }

  // La ficha tiene que dejar de aparecer ya, no dentro de una hora.
  try {
    revalidateTag("agenda");
  } catch {
    // Si falla, la agenda se actualiza sola en la próxima revalidación.
  }

  return Response.json({ ok: true, nombre: ev.nombre, estadoPrevio });
}
