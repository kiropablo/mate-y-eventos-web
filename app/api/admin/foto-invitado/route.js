import { haySesion } from "../../../lib/admin";
import {
  getInvitadosAirtable,
  registroDeFicha,
} from "../../../lib/invitados-airtable";
import { listarInvitadosParaPanel } from "../../../lib/invitados-admin";

// Sube o saca la foto de un invitado.
//
// Escribe dos archivos en GitHub, en este orden: primero la imagen en
// public/invitados/{slug}.jpg y después el campo "foto" en la ficha. Vercel
// redespliega solo y la foto aparece.
//
// Por qué el campo en la ficha y no un fs.existsSync() sobre public/: los
// archivos del repositorio no viajan solos a las funciones del servidor. Es la
// regla 7, la que dejó el sitemap sin artículos ni glosario durante semanas sin
// que nada diera error. Una comprobación así, cuando falla, no falla: devuelve
// "no hay foto" y las fichas se publican sin imagen.
//
// La imagen llega ya redimensionada desde el navegador, a 800x1000, que es el
// mismo tamaño de las fotos de Pablo y Alexis. Hacerlo del lado del servidor
// pediría una librería de imágenes; hacerlo en el navegador es gratis y de paso
// el que sube no tiene que esperar a que suban 5 MB.

export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO || "kiropablo/mate-y-eventos-web";
const RAMA = process.env.GITHUB_BRANCH || "main";

// Tope de lo que se acepta, ya redimensionado. Una foto de 800x1000 en JPEG
// pesa entre 60 y 150 KB; medio mega es holgado y corta cualquier cosa rara.
const MAX_BYTES = 512 * 1024;

const urlImagen = (slug) =>
  `https://api.github.com/repos/${REPO}/contents/public/invitados/${encodeURIComponent(slug)}.jpg`;
const urlFicha = (slug) =>
  `https://api.github.com/repos/${REPO}/contents/content/invitados/${encodeURIComponent(slug)}.md`;

function cabeceras(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

function explicar(estado) {
  if (estado === 401)
    return "GitHub rechazó la llave (401). Hay que generar un token nuevo y cargarlo en Vercel como GITHUB_TOKEN.";
  if (estado === 403) return "GitHub no deja escribir (403).";
  if (estado === 409)
    return "Alguien más tocó el archivo mientras tanto (409). Recargá el panel y probá de nuevo.";
  return `GitHub contestó ${estado}.`;
}

// El sha del archivo si ya existe, o undefined. GitHub lo pide para pisar uno
// que ya está, y lo rechaza si se manda para uno que no existe.
async function shaDe(url, token) {
  const res = await fetch(`${url}?ref=${RAMA}`, {
    headers: cabeceras(token),
    cache: "no-store",
  });
  if (res.ok) return (await res.json()).sha;
  return undefined;
}

// Prende o apaga el campo "foto" de la ficha, sin tocar nada más.
async function marcarFoto(slug, token, valor) {
  const res = await fetch(`${urlFicha(slug)}?ref=${RAMA}`, {
    headers: cabeceras(token),
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, estado: res.status };
  const info = await res.json();
  const crudo = Buffer.from(info.content || "", "base64").toString("utf8");

  // Si el campo no está —una ficha vieja, de antes de que existieran las
  // fotos— se agrega arriba del cierre de la cabecera en vez de perderse.
  const nuevo = /^foto:.*$/m.test(crudo)
    ? crudo.replace(/^foto:.*$/m, `foto: ${valor}`)
    : crudo.replace(/^---\s*$/m, "---").replace(
        /\n---\n/,
        `\nfoto: ${valor}\n---\n`
      );

  if (nuevo === crudo) return { ok: true, sinCambio: true };

  const guardado = await fetch(urlFicha(slug), {
    method: "PUT",
    headers: cabeceras(token),
    body: JSON.stringify({
      message: `${valor ? "Foto de" : "Sacar la foto de"} ${slug}`,
      content: Buffer.from(nuevo, "utf8").toString("base64"),
      sha: info.sha,
      branch: RAMA,
    }),
  });
  return { ok: guardado.ok, estado: guardado.status };
}

// Busca en Airtable la foto que mandó el propio invitado y la devuelve lista
// para subir. No la publica: eso lo hace el mismo camino de siempre, con sus
// mismas comprobaciones.
//
// Se exige la fecha de autorización. Una imagen suelta en el campo Foto
// —cargada a mano, o que quedó de una prueba— no es una foto autorizada, y
// publicarla sería poner la cara de alguien en internet porque había un
// archivo en una celda.
async function fotoDelRegistro(slug) {
  const ficha = listarInvitadosParaPanel().find((f) => f.id === slug);
  if (!ficha) {
    return { ok: false, estado: 404, error: "No encontramos esa ficha." };
  }

  const registro = registroDeFicha(await getInvitadosAirtable(), ficha);
  if (!registro) {
    return {
      ok: false,
      estado: 404,
      error:
        "Esta ficha no está unida a ningún registro de Airtable. Unila primero y volvé a probar.",
    };
  }
  if (!registro.foto?.url) {
    return {
      ok: false,
      estado: 404,
      error: registro.respondioEl
        ? "No mandó foto, o la mandó sin autorizar que se publique."
        : "Todavía no contestó el formulario.",
    };
  }

  try {
    // La dirección que da Airtable vence a las pocas horas: se usa ahora y no
    // se guarda en ningún lado.
    const res = await fetch(registro.foto.url, { cache: "no-store" });
    if (!res.ok) {
      return {
        ok: false,
        estado: 502,
        error: `Airtable no entregó la imagen (${res.status}). Recargá el panel y probá de nuevo: esas direcciones vencen.`,
      };
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    return { ok: true, base64: bytes.toString("base64") };
  } catch (e) {
    return { ok: false, estado: 502, error: `No se pudo traer la imagen: ${e.message}` };
  }
}

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sesión vencida." }, { status: 401 });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { ok: false, error: "Falta GITHUB_TOKEN en Vercel." },
      { status: 500 }
    );
  }

  let slug = "";
  let base64 = "";
  let desdeAirtable = false;
  try {
    const body = await request.json();
    slug = String(body?.id || "");
    desdeAirtable = Boolean(body?.desdeAirtable);
    // Llega como data URL desde el navegador: "data:image/jpeg;base64,...".
    base64 = String(body?.imagen || "").replace(/^data:image\/jpeg;base64,/, "");
  } catch {
    return Response.json({ ok: false, error: "Pedido inválido." }, { status: 400 });
  }

  if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
    return Response.json({ ok: false, error: "Ficha inválida." }, { status: 400 });
  }

  // "Usar la foto que mandó": la imagen no viene en el pedido, se busca.
  //
  // El navegador manda el slug y NADA MÁS. Ni la dirección de la imagen ni si
  // estaba autorizada: eso se vuelve a mirar acá, contra Airtable. Confiar en
  // lo que diga el navegador sería dejar que un pedido armado a mano publique
  // la foto de cualquiera, y el permiso es justamente lo único que hace que
  // esa foto se pueda publicar.
  if (desdeAirtable) {
    const traido = await fotoDelRegistro(slug);
    if (!traido.ok) {
      return Response.json({ ok: false, error: traido.error }, { status: traido.estado });
    }
    base64 = traido.base64;
  }
  if (!base64 || !/^[A-Za-z0-9+/=]+$/.test(base64)) {
    return Response.json({ ok: false, error: "No llegó la imagen." }, { status: 400 });
  }

  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > MAX_BYTES) {
    return Response.json(
      {
        ok: false,
        error: `La foto pesa ${Math.round(bytes.length / 1024)} KB y el tope es ${MAX_BYTES / 1024} KB.`,
      },
      { status: 400 }
    );
  }
  // Que sea un JPEG de verdad y no cualquier cosa renombrada: los tres
  // primeros bytes de un JPEG son siempre FF D8 FF.
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    return Response.json(
      { ok: false, error: "Eso no es un JPEG. Probá con otra imagen." },
      { status: 400 }
    );
  }

  try {
    const sha = await shaDe(urlImagen(slug), token);
    const subida = await fetch(urlImagen(slug), {
      method: "PUT",
      headers: cabeceras(token),
      body: JSON.stringify({
        message: `Foto de ${slug}`,
        content: base64,
        branch: RAMA,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!subida.ok) {
      return Response.json(
        { ok: false, error: explicar(subida.status) },
        { status: 502 }
      );
    }

    // La imagen ya está. Si esto falla, la foto existe pero la ficha no la
    // muestra: se avisa claro en vez de decir que salió todo bien.
    const marcado = await marcarFoto(slug, token, true);
    if (!marcado.ok) {
      return Response.json(
        {
          ok: false,
          error:
            "La foto se subió pero no se pudo marcar en la ficha. Volvé a intentar en un minuto.",
        },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, kb: Math.round(bytes.length / 1024) });
  } catch (e) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado." },
      { status: 500 }
    );
  }
}

// Sacar la foto. Apaga el campo primero y después borra el archivo: si se
// hiciera al revés y lo segundo fallara, la ficha quedaría apuntando a una
// imagen que ya no está.
export async function DELETE(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sesión vencida." }, { status: 401 });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { ok: false, error: "Falta GITHUB_TOKEN en Vercel." },
      { status: 500 }
    );
  }

  let slug = "";
  try {
    slug = String((await request.json())?.id || "");
  } catch {
    slug = "";
  }
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
    return Response.json({ ok: false, error: "Ficha inválida." }, { status: 400 });
  }

  try {
    const marcado = await marcarFoto(slug, token, false);
    if (!marcado.ok) {
      return Response.json(
        { ok: false, error: explicar(marcado.estado || 502) },
        { status: 502 }
      );
    }

    const sha = await shaDe(urlImagen(slug), token);
    if (sha) {
      await fetch(urlImagen(slug), {
        method: "DELETE",
        headers: cabeceras(token),
        body: JSON.stringify({
          message: `Sacar la foto de ${slug}`,
          sha,
          branch: RAMA,
        }),
      });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { ok: false, error: e?.message || "Error inesperado." },
      { status: 500 }
    );
  }
}
