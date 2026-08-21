import { revalidatePath, revalidateTag } from "next/cache";
import { haySesion } from "../../../lib/admin";

// Las dos acciones de la agenda que se disparan desde la consola.
//
//   refrescar → trae los cambios de Airtable a la web al instante,
//               sin esperar la actualización automática de cada hora.
//   buscar    → dispara la Action de GitHub que busca eventos nuevos en
//               internet y repasa los que ya están cargados.
//
// Usa el mismo GITHUB_TOKEN que ya guarda los artículos. Si el token es
// de los nuevos (fine-grained), necesita además el permiso
// "Actions: read and write" sobre el repositorio.

export const dynamic = "force-dynamic";

const REPO = process.env.GITHUB_REPO || "kiropablo/mate-y-eventos-web";
const RAMA = process.env.GITHUB_BRANCH || "main";
const WORKFLOW = "agenda.yml";

export async function POST(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }

  let accion = "";
  try {
    accion = (await request.json())?.accion || "";
  } catch {
    accion = "";
  }

  if (accion === "refrescar") {
    // La etiqueta es lo que de verdad tira abajo la copia guardada de
    // Airtable, que es la que comparten TODOS los que leen la agenda. Sin
    // esto solo se refrescaban las páginas listadas abajo, y el resto del
    // sitio seguía sirviendo datos de hasta una hora.
    revalidateTag("agenda");
    revalidatePath("/agenda");
    revalidatePath("/agenda/[slug]", "page");
    return Response.json({
      ok: true,
      mensaje: "Listo: la web ya muestra lo último que cargaste en Airtable.",
    });
  }

  if (accion === "buscar") {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return Response.json(
        { ok: false, error: "Falta la variable GITHUB_TOKEN en Vercel." },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: RAMA,
          inputs: { modo: "completo", tema: "", cantidad: "10" },
        }),
      }
    );

    if (res.status === 204) {
      return Response.json({
        ok: true,
        mensaje:
          "Búsqueda lanzada. Tarda entre 10 y 30 minutos. Los eventos nuevos van a aparecer en Airtable como Borrador IA.",
      });
    }

    const detalle = await res.text();
    if (res.status === 403 || res.status === 404) {
      return Response.json(
        {
          ok: false,
          error:
            "GitHub rechazó el pedido. Suele ser porque al token le falta el permiso de Actions, o porque el archivo agenda.yml todavía no está en la rama principal.",
        },
        { status: 502 }
      );
    }
    return Response.json(
      { ok: false, error: `GitHub respondió ${res.status}: ${detalle.slice(0, 200)}` },
      { status: 502 }
    );
  }

  return Response.json({ ok: false, error: "Acción desconocida." }, { status: 400 });
}
