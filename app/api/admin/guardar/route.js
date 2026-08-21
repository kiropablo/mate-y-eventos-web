import { haySesion } from "../../../lib/admin";

// Guarda un artículo editado escribiéndolo en GitHub.
// Al commitear, Vercel redespliega solo y el cambio aparece en la web.
//
// Necesita dos variables en Vercel:
//   GITHUB_TOKEN → token con permiso de escritura sobre el repo
//   GITHUB_REPO  → "kiropablo/mate-y-eventos-web" (opcional, ya viene por defecto)

export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO || "kiropablo/mate-y-eventos-web";
const RAMA = process.env.GITHUB_BRANCH || "main";

function apiUrl(id) {
  return `https://api.github.com/repos/${REPO}/contents/content/articulos/${encodeURIComponent(
    id
  )}.md`;
}

// Qué decirle a quien está en el panel según lo que contestó GitHub.
//
// Antes cualquier error salía como "No se encontró": con un 401 eso manda a
// buscar un archivo que está perfecto, cuando el problema es que la llave de
// GitHub venció. Los tokens tienen fecha de vencimiento y esto va a volver a
// pasar, así que conviene que el mensaje lo diga.
function explicar(estado, que) {
  if (estado === 401)
    return "GitHub rechazó la llave de acceso (401). Lo más probable es que el token haya vencido: hay que generar uno nuevo y cargarlo en Vercel como GITHUB_TOKEN.";
  if (estado === 403)
    return "GitHub aceptó la llave pero no la deja escribir (403). Al token le falta permiso de escritura sobre el repositorio, o se agotó el límite de pedidos por hora.";
  if (estado === 404)
    return `No se encontró ${que} en GitHub (404). Puede que el archivo se haya renombrado o que el token no tenga acceso a este repositorio.`;
  return `GitHub contestó ${estado} al buscar ${que}.`;
}

function cabeceras(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

// Escapa un texto para que entre entre comillas en la cabecera del archivo.
function comillas(texto) {
  return `"${String(texto || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\s+/g, " ")
    .trim()}"`;
}

// Cambia (o agrega) un campo de la cabecera sin tocar los demás.
function ponerCampo(cabecera, clave, valor) {
  const re = new RegExp(`^${clave}:.*$`, "m");
  const linea = `${clave}: ${valor}`;
  // El reemplazo va como función a propósito: si se pasa el texto directo,
  // JavaScript interpreta los "$&", "$\'" y "$`" que pueda tener escritos
  // Pablo y termina inyectando pedazos de la cabecera vieja adentro del valor.
  return re.test(cabecera)
    ? cabecera.replace(re, () => linea)
    : `${cabecera}\n${linea}`;
}

// Arma el archivo nuevo conservando todos los datos originales.
function reconstruir(original, datos) {
  const m = original.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new Error("El archivo no tiene cabecera válida.");

  let cabecera = m[1];
  cabecera = ponerCampo(cabecera, "titulo", comillas(datos.titulo));
  cabecera = ponerCampo(cabecera, "bajada", comillas(datos.bajada));
  cabecera = ponerCampo(cabecera, "publicado", datos.publicado ? "true" : "false");
  cabecera = ponerCampo(cabecera, "revisado", comillas(new Date().toISOString().slice(0, 10)));

  return `---\n${cabecera}\n---\n\n${String(datos.cuerpo || "").trim()}\n`;
}

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sesión vencida." }, { status: 401 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { ok: false, error: "Falta configurar GITHUB_TOKEN en Vercel." },
      { status: 500 }
    );
  }

  let datos;
  try {
    datos = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Pedido inválido." }, { status: 400 });
  }

  const id = String(datos?.id || "");
  // Hasta 80: un slug descriptivo ("como-elegir-proveedores-para-un-evento")
  // no entra en los 40 que alcanzaban para un código de YouTube.
  if (!/^[A-Za-z0-9_-]{2,80}$/.test(id)) {
    return Response.json({ ok: false, error: "Artículo inválido." }, { status: 400 });
  }
  if (!String(datos?.titulo || "").trim() || !String(datos?.cuerpo || "").trim()) {
    return Response.json(
      { ok: false, error: "El título y el cuerpo no pueden quedar vacíos." },
      { status: 400 }
    );
  }

  try {
    // 1) Traemos el archivo actual (necesitamos su "sha" para poder pisarlo).
    const actual = await fetch(`${apiUrl(id)}?ref=${RAMA}`, {
      headers: cabeceras(token),
      cache: "no-store",
    });

    if (!actual.ok) {
      return Response.json(
        { ok: false, error: explicar(actual.status, "el artículo") },
        { status: 502 }
      );
    }

    const info = await actual.json();
    const original = Buffer.from(info.content || "", "base64").toString("utf8");

    // 2) Armamos la versión nueva.
    const nuevo = reconstruir(original, datos);

    if (nuevo === original) {
      return Response.json({ ok: true, sinCambios: true });
    }

    // 3) La guardamos.
    const accion = datos.publicado ? "Publicar" : "Actualizar";
    const guardado = await fetch(apiUrl(id), {
      method: "PUT",
      headers: cabeceras(token),
      body: JSON.stringify({
        message: `${accion} artículo: ${String(datos.titulo).slice(0, 60)}`,
        content: Buffer.from(nuevo, "utf8").toString("base64"),
        sha: info.sha,
        branch: RAMA,
      }),
    });

    if (!guardado.ok) {
      const detalle = await guardado.text();
      return Response.json(
        { ok: false, error: `GitHub rechazó el cambio (${guardado.status}). ${detalle.slice(0, 160)}` },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, publicado: !!datos.publicado });
  } catch (e) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado." },
      { status: 500 }
    );
  }
}
