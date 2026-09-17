import { haySesion } from "../../../lib/admin";

// Guarda y elimina fichas de invitados desde el panel.
//
// Escribe el archivo en GitHub, igual que los artículos y el glosario: Vercel
// redespliega solo. No hay base de datos de por medio y el historial de cambios
// es el del repositorio, que además dice quién y cuándo.
//
// Lo que esta ruta cuida más que las otras dos: acá se publica una página sobre
// una PERSONA REAL. Por eso el campo "fuente" —la frase de la transcripción de
// donde el robot sacó el nombre— nunca se pierde al guardar, aunque el panel no
// lo mande: es la única forma de volver a comprobar, dentro de seis meses, que
// la ficha dice lo que la persona dijo.

export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO || "kiropablo/mate-y-eventos-web";
const RAMA = process.env.GITHUB_BRANCH || "main";

const urlDe = (id) =>
  `https://api.github.com/repos/${REPO}/contents/content/invitados/${encodeURIComponent(
    id
  )}.md`;

function cabeceras(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

function explicar(estado, que) {
  if (estado === 401)
    return "GitHub rechazó la llave (401). Lo más probable es que el token haya vencido: hay que generar uno nuevo y cargarlo en Vercel como GITHUB_TOKEN.";
  if (estado === 403)
    return "GitHub aceptó la llave pero no la deja escribir (403). Al token le falta permiso, o se agotó el límite de pedidos por hora.";
  if (estado === 404) return `No se encontró ${que} en el repositorio (404).`;
  if (estado === 409)
    return "Alguien más guardó esta ficha mientras la editabas (409). Recargá el panel y volvé a aplicar tu cambio.";
  return `GitHub contestó ${estado}.`;
}

// Escapa para meter un texto adentro de comillas en la cabecera del .md.
// El orden importa: primero las barras, después las comillas.
const comillas = (t) =>
  `"${String(t ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ")
    .trim()}"`;

const lista = (arr) => `[${(arr || []).map(comillas).join(", ")}]`;

// El valor de un campo en la cabecera que ya está guardada. Se usa para los que
// el panel no edita y no puede perder: los episodios, la fuente, la fecha.
function campoDe(crudo, clave) {
  const m = crudo.match(new RegExp(`^${clave}:[^\\S\\r\\n]*(.*)$`, "m"));
  return m ? m[1].trim() : "";
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

  let d;
  try {
    d = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Pedido inválido." }, { status: 400 });
  }

  const id = String(d?.id || "");
  // El mismo molde que usa el generador. Sin esto, un id con "../" escribiría
  // en cualquier otra parte del repositorio.
  if (!/^[a-z0-9-]{2,60}$/.test(id)) {
    return Response.json({ ok: false, error: "Ficha inválida." }, { status: 400 });
  }
  if (!String(d?.nombre || "").trim()) {
    return Response.json(
      { ok: false, error: "El nombre no puede quedar vacío." },
      { status: 400 }
    );
  }

  // Un mail o un teléfono no entran ni a mano. La ficha es de una persona que
  // vino a una charla: sus redes públicas sí, su contacto personal no.
  const redes = String(d?.redes || "")
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);
  const sospechoso = [...redes, String(d?.web || "")].find((r) =>
    /^mailto:|@[^/]*\.[a-z]{2,}$|^tel:|^\+?\d[\d\s()-]{7,}$/i.test(r)
  );
  if (sospechoso) {
    return Response.json(
      {
        ok: false,
        error: `«${sospechoso}» parece un mail o un teléfono. En la ficha de un invitado van links a perfiles públicos, no su contacto personal.`,
      },
      { status: 400 }
    );
  }

  try {
    const actual = await fetch(`${urlDe(id)}?ref=${RAMA}`, {
      headers: cabeceras(token),
      cache: "no-store",
    });
    if (!actual.ok) {
      return Response.json(
        { ok: false, error: explicar(actual.status, "la ficha") },
        { status: 502 }
      );
    }
    const info = await actual.json();
    const crudo = Buffer.from(info.content || "", "base64").toString("utf8");

    // Lo que el panel NO edita se copia tal cual del archivo. Reconstruir la
    // cabecera desde cero perdería los episodios —que los pone el generador— y
    // la fuente, que es lo que hace comprobable la ficha.
    const episodios = campoDe(crudo, "episodios") || "[]";
    const hoy = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });

    const cabecera = [
      "---",
      `nombre: ${comillas(d.nombre)}`,
      `rol: ${comillas(d.rol || "")}`,
      `bio: ${comillas(d.bio || "")}`,
      `episodios: ${episodios}`,
      `episodioTitulo: ${comillas(campoDe(crudo, "episodioTitulo").replace(/^"|"$/g, ""))}`,
      `web: ${comillas(d.web || "")}`,
      `redes: ${lista(redes)}`,
      `fuente: ${campoDe(crudo, "fuente") || '""'}`,
      // La foto la sube otra ruta. Se copia tal cual del archivo: si se
      // reconstruyera acá, guardar la ficha desde el panel le borraría la foto.
      `foto: ${campoDe(crudo, "foto") === "true" ? "true" : "false"}`,
      `generado: ${campoDe(crudo, "generado") || comillas(hoy)}`,
      `publicado: ${d.publicado ? "true" : "false"}`,
      // Cuándo una persona la aprobó. Se anota al publicar y no se toca al
      // despublicar: la fecha dice cuándo se revisó, no cuándo está online.
      `revisado: ${d.publicado ? comillas(hoy) : campoDe(crudo, "revisado") || '""'}`,
      "---",
      "",
      String(d.cuerpo || "").trim(),
      "",
    ].join("\n");

    const guardado = await fetch(urlDe(id), {
      method: "PUT",
      headers: cabeceras(token),
      body: JSON.stringify({
        message: `${d.publicado ? "Publicar" : "Guardar"} la ficha de ${d.nombre}`,
        content: Buffer.from(cabecera, "utf8").toString("base64"),
        sha: info.sha,
        branch: RAMA,
      }),
    });

    if (!guardado.ok) {
      const detalle = await guardado.text();
      return Response.json(
        {
          ok: false,
          error: `GitHub rechazó el cambio (${guardado.status}). ${detalle.slice(0, 160)}`,
        },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, publicado: !!d.publicado });
  } catch (e) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado." },
      { status: 500 }
    );
  }
}

// Eliminar una ficha.
//
// Borra el archivo del repositorio. El texto queda en el historial de git, así
// que se puede recuperar; lo que desaparece es la página y su dirección. Existe
// porque hay dos casos que no se arreglan despublicando: una ficha de alguien
// que el robot identificó mal, y una persona que pide que la bajemos. Lo
// segundo tiene que poder hacerse en el momento y sin pedirle nada a nadie.
export async function DELETE(request) {
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

  let id = "";
  try {
    id = String((await request.json())?.id || "");
  } catch {
    return Response.json({ ok: false, error: "Pedido inválido." }, { status: 400 });
  }
  if (!/^[a-z0-9-]{2,60}$/.test(id)) {
    return Response.json({ ok: false, error: "Ficha inválida." }, { status: 400 });
  }

  try {
    const actual = await fetch(`${urlDe(id)}?ref=${RAMA}`, {
      headers: cabeceras(token),
      cache: "no-store",
    });
    if (!actual.ok) {
      return Response.json(
        { ok: false, error: explicar(actual.status, "la ficha") },
        { status: 502 }
      );
    }
    const info = await actual.json();

    const borrado = await fetch(urlDe(id), {
      method: "DELETE",
      headers: cabeceras(token),
      body: JSON.stringify({
        message: `Eliminar la ficha de invitado "${id}" desde el panel`,
        sha: info.sha,
        branch: RAMA,
      }),
    });

    if (!borrado.ok) {
      const detalle = await borrado.text();
      return Response.json(
        {
          ok: false,
          error: `GitHub rechazó el borrado (${borrado.status}). ${detalle.slice(0, 160)}`,
        },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, id });
  } catch (e) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado." },
      { status: 500 }
    );
  }
}
