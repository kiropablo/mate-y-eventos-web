import { haySesion } from "../../../lib/admin";
import { CAMPOS, getMensaje, armar, leerCrudo } from "../../../lib/mensajes";

// Lee y guarda los textos del mail de primer contacto.
//
// Guarda igual que los artículos y el glosario: escribiendo el archivo en
// GitHub. Vercel redespliega solo y el mail siguiente ya sale con el texto
// nuevo. No hay base de datos de por medio: el historial de cambios es el
// historial del repositorio, que además dice quién y cuándo.

export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO || "kiropablo/mate-y-eventos-web";
const RAMA = process.env.GITHUB_BRANCH || "main";
const RUTA = "content/mensajes/primer-contacto.md";
const URL_API = `https://api.github.com/repos/${REPO}/contents/${RUTA}`;

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

export async function GET() {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }
  return Response.json({
    ok: true,
    campos: CAMPOS,
    valores: getMensaje(),
    // Si el archivo todavía no existe, el panel muestra los textos de fábrica
    // y avisa que nunca se editó.
    guardadoAlgunaVez: Boolean(leerCrudo().trim()),
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
  try {
    valores = (await request.json())?.valores || {};
  } catch {
    return Response.json({ ok: false, error: "No se entendió el pedido." }, { status: 400 });
  }

  // Un campo vacío no se guarda vacío: vuelve al texto de fábrica. Un mail sin
  // pie de baja o sin saludo sale peor que uno sin editar.
  const limpios = {};
  for (const c of CAMPOS) {
    const v = String(valores[c.id] ?? "").trim();
    limpios[c.id] = v || c.porDefecto;
  }

  const contenido = `${armar(limpios)}\n`;

  // El sha del archivo, para que GitHub avise si alguien lo cambió mientras
  // tanto en vez de pisarlo. Si no existe, se crea.
  let sha;
  const actual = await fetch(`${URL_API}?ref=${RAMA}`, { headers: cabeceras(token) });
  if (actual.ok) {
    sha = (await actual.json()).sha;
  } else if (actual.status !== 404) {
    return Response.json(
      { ok: false, error: explicar(actual.status) },
      { status: 502 }
    );
  }

  const res = await fetch(URL_API, {
    method: "PUT",
    headers: cabeceras(token),
    body: JSON.stringify({
      message: "Editar el mensaje de primer contacto desde el panel",
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
