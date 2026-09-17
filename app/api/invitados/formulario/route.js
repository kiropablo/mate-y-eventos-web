import { claveFormularioValida } from "../../../lib/firma";
import { CONTACTO, PREGUNTAS, pareceContacto } from "../../../lib/formulario-invitados";
import { mandarCorreo, correoInterno } from "../../../lib/correo";
import { SITE } from "../../../lib/site";

// Guarda la respuesta del formulario de invitados.
//
// Escribe en Airtable —base "Invitados MyE"— y no en el repositorio, a
// propósito: acá entran mail y teléfono de una persona, y el repositorio es
// PÚBLICO. Cualquiera baja un archivo de content/ sin credenciales. Es la
// regla 20, la de los 112 mails de organizadores.
//
// Lo que sí termina en el repositorio es la ficha pública que se arma después
// con parte de esto: nombre, empresa, web y redes. El contacto no viaja nunca.

export const dynamic = "force-dynamic";

const BASE = "appvziqRHGN0jtS19";
const TABLA = "tblHdZr5d8yWovqNk";

// Cuánto se acepta por campo. Sin tope, una sola respuesta puede llenar la
// tabla: son campos de texto libre abiertos a internet.
const MAX_CORTO = 300;
const MAX_LARGO = 4000;

export async function POST(request) {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) {
    return Response.json(
      { ok: false, error: "El formulario no está configurado. Escribinos y lo resolvemos." },
      { status: 500 }
    );
  }

  let cuerpo = {};
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false, error: "No se entendió el pedido." }, { status: 400 });
  }

  // Sin la clave del link no se escribe nada. No protege un dato sensible
  // —todavía no hay ninguno— sino que la página no ande suelta por internet.
  if (!claveFormularioValida(String(cuerpo?.clave || ""))) {
    return Response.json({ ok: false, error: "Link inválido." }, { status: 403 });
  }

  const v = cuerpo?.valores || {};
  const texto = (id, max) => String(v[id] ?? "").trim().slice(0, max);

  const nombre = texto("nombre", MAX_CORTO);
  const email = texto("email", MAX_CORTO);
  if (!nombre) {
    return Response.json(
      { ok: false, error: "Nos falta tu nombre." },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json(
      { ok: false, error: "Ese mail no parece válido. Lo necesitamos para escribirte." },
      { status: 400 }
    );
  }

  // Un mail o un teléfono pegados donde van las redes. Pasa sin mala intención
  // —alguien se equivoca de campo— y ese campo SÍ se publica. Se avisa en vez
  // de guardarlo, porque después nadie lo revisa.
  for (const id of ["web", "redes"]) {
    const linea = texto(id, MAX_LARGO)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && pareceContacto(l));
    if (linea) {
      return Response.json(
        {
          ok: false,
          error: `«${linea}» parece un mail o un teléfono, y ese campo sale publicado en tu ficha. Tu contacto va más arriba, en «Tu mail» y «Tu teléfono», y ese no lo publicamos.`,
        },
        { status: 400 }
      );
    }
  }

  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const fields = { "Respondió el": hoy };
  for (const c of CONTACTO) {
    const valor = texto(c.id, c.tipo === "area" ? MAX_LARGO : MAX_CORTO);
    if (valor) fields[c.campo] = valor;
  }
  for (const p of PREGUNTAS) {
    const valor = texto(p.id, MAX_LARGO);
    if (valor) fields[p.campo] = valor;
  }

  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    // El dominio, no la dirección: los registros de las funciones de Vercel
    // también se leen, y un console.log con un mail lo publica.
    console.warn(`[formulario-invitados] Airtable ${res.status}: ${detalle.slice(0, 200)}`);
    return Response.json(
      { ok: false, error: "No se pudo guardar tu respuesta. Probá de nuevo en un minuto." },
      { status: 502 }
    );
  }

  // El aviso va DESPUÉS de guardar y nunca voltea la respuesta: para el
  // invitado el trámite ya terminó bien. Es la misma regla que el resto de los
  // correos del sitio.
  try {
    await mandarCorreo({
      para: correoInterno(),
      asunto: `📝 ${nombre} llenó el formulario de invitados`,
      texto: [
        `${nombre} completó el formulario.`,
        "",
        `Nombre:   ${nombre}`,
        v.comoNombrar ? `Lo nombramos: ${texto("comoNombrar", MAX_CORTO)}` : null,
        v.empresa ? `Empresa:  ${texto("empresa", MAX_CORTO)}` : null,
        "",
        "El contacto y las diez respuestas están en Airtable, en «Invitados MyE».",
        `También los ves en ${SITE.url}/admin, pestaña Invitados.`,
      ]
        .filter((l) => l !== null)
        .join("\n"),
      responderA: email,
    });
  } catch {
    // Si el aviso falla, la respuesta ya está guardada. No se pierde nada.
  }

  return Response.json({ ok: true });
}
