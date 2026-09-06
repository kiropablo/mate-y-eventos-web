import { getEvento } from "../../../../lib/agenda";
import { anotarAviso, yaPidio } from "../../../../lib/avisos";

// "Avisame cuando confirmen la fecha de este evento."
//
// Solo para los eventos que TODAVÍA no tienen fecha. Ofrecerlo en uno que ya
// la tiene sería pedir un correo a cambio de nada.
//
// La promesa es chica y hay que cumplirla tal cual: un correo, una vez,
// cuando la fecha exista. No entra al newsletter y no se usa para otra cosa.

export const dynamic = "force-dynamic";

const TOPE_POR_DIA = 5;
const pedidos = new Map();

function pasaElTope(slug) {
  const hoy = new Date().toISOString().slice(0, 10);
  const c = `${slug}:${hoy}`;
  const n = (pedidos.get(c) || 0) + 1;
  pedidos.set(c, n);
  return n <= TOPE_POR_DIA;
}

export async function POST(req, { params }) {
  const slug = String(params?.slug || "");

  let datos;
  try {
    datos = await req.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  // Trampa para robots, igual que en los otros formularios públicos.
  if (datos.tel) return Response.json({ ok: true });

  const email = String(datos.email || "").trim().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return Response.json(
      { error: "Ese correo no parece estar bien escrito." },
      { status: 400 }
    );
  }

  if (!pasaElTope(slug)) {
    return Response.json(
      { error: "Recibimos varios pedidos de este evento hoy. Probá más tarde." },
      { status: 429 }
    );
  }

  // getEvento tira error si la lectura vino corta, así que un "no existe" acá
  // es de verdad un "no existe".
  const ev = await getEvento(slug);
  if (!ev) {
    return Response.json({ error: "No encontramos ese evento." }, { status: 404 });
  }

  // Si ya tiene fecha no hay nada que avisar. Se contesta bien igual —la
  // persona no hizo nada mal— y se le dice cuál es.
  if (ev.fechaInicio) {
    return Response.json({ ok: true, yaTieneFecha: true });
  }

  // Repetido: se contesta que sí sin escribir de nuevo. Recargar la página y
  // volver a mandar no puede terminar en dos correos idénticos.
  if (await yaPidio(ev.id, email)) {
    return Response.json({ ok: true, repetido: true });
  }

  const r = await anotarAviso({
    idEvento: ev.id,
    nombreEvento: ev.nombre,
    email,
  });
  if (!r.ok) {
    return Response.json(
      { error: "No pudimos anotarlo. Probá de nuevo en un rato." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
