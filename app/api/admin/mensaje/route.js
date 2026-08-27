import { haySesion } from "../../../lib/admin";
import {
  MENSAJES,
  camposDe,
  getMensaje,
  armar,
  leerCrudo,
} from "../../../lib/mensajes";

// Lee y guarda los textos de los mails que salen del panel.
//
// Son dos: el de primer contacto, que le pide al organizador que revise su
// ficha, y el de confirmación, que le avisa que el sello quedó encendido.
// Cada uno vive en su propio archivo dentro de content/mensajes/.
//
// Guarda igual que los artículos y el glosario: escribiendo el archivo en
// GitHub. Vercel redespliega solo y el mail siguiente ya sale con el texto
// nuevo. No hay base de datos de por medio: el historial de cambios es el
// historial del repositorio, que además dice quién y cuándo.

export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO || "kiropablo/mate-y-eventos-web";
const RAMA = process.env.GITHUB_BRANCH || "main";
// Cuál de los dos mensajes pidieron. Se valida contra la lista y no se arma
// la ruta con lo que llegue: si no, un pedido con "../../.env" escribiría
// donde no debe.
function cual(valor) {
  const id = String(valor || "").trim();
  return MENSAJES[id] ? id : "primer-contacto";
}

const urlDe = (id) =>
  `https://api.github.com/repos/${REPO}/contents/content/mensajes/${id}.md`;

function explicar(estado) {
  if (estado === 401)
    return "GitHub rechazó la llave de acceso (401). Lo más probable es que el token haya vencido: hay que generar uno nuevo y cargarlo en Vercel como GITHUB_TOKEN.";
  if (estado === 403)
    return "GitHub aceptó la llave pero no la deja escribir (403). Al token le falta permiso de escritura, o se agotó el límite de pedidos por hora.";
  if (estado === 409)
    return "Alguien más guardó el mensaje mientras lo editabas (409). Recargá el panel y volvé a aplicar tu cambio.";
  return `GitHub contestó ${estado} al guardar el mensaje.`;
}

function cabeceras(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

export async function GET(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }
  const id = cual(new URL(request.url).searchParams.get("cual"));
  return Response.json({
    ok: true,
    cual: id,
    mensajes: Object.entries(MENSAJES).map(([k, m]) => ({
      id: k,
      titulo: m.titulo,
      ayuda: m.ayuda,
    })),
    campos: camposDe(id),
    valores: getMensaje(id),
    // Si el archivo todavía no existe, el panel muestra los textos de fábrica
    // y avisa que nunca se editó.
    guardadoAlgunaVez: Boolean(leerCrudo(id).trim()),
  });
}

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { ok: false, error: "Falta GITHUB_TOKEN en Vercel." },
      { status: 500 }
    );
  }

  let valores = {};
  let id = "primer-contacto";
  try {
    const body = await request.json();
    valores = body?.valores || {};
    id = cual(body?.cual);
  } catch {
    return Response.json({ ok: false, error: "No se entendió el pedido." }, { status: 400 });
  }

  // Un campo vacío no se guarda vacío: vuelve al texto de fábrica. Un mail sin
  // pie de baja o sin saludo sale peor que uno sin editar.
  const limpios = {};
  for (const c of camposDe(id)) {
    const v = String(valores[c.id] ?? "").trim();
    limpios[c.id] = v || c.porDefecto;
  }

  const contenido = `${armar(limpios, id)}\n`;

  // El sha del archivo, para que GitHub avise si alguien lo cambió mientras
  // tanto en vez de pisarlo. Si no existe, se crea.
  let sha;
  const url = urlDe(id);
  const actual = await fetch(`${url}?ref=${RAMA}`, { headers: cabeceras(token) });
  if (actual.ok) {
    sha = (await actual.json()).sha;
  } else if (actual.status !== 404) {
    return Response.json(
      { ok: false, error: explicar(actual.status) },
      { status: 502 }
    );
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: cabeceras(token),
    body: JSON.stringify({
      message: `Editar el mensaje "${MENSAJES[id].titulo}" desde el panel`,
      content: Buffer.from(contenido, "utf8").toString("base64"),
      branch: RAMA,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    return Response.json(
      { ok: false, error: explicar(res.status) },
      { status: 502 }
    );
  }

  return Response.json({
    ok: true,
    mensaje:
      "Guardado. El sitio se rearma solo en un minuto y el próximo mail sale con este texto.",
  });
}
