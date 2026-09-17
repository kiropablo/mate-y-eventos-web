import { firmaInvitadoValida } from "../../../../lib/firma";
import { getInvitado } from "../../../../lib/invitados";
import { CAMPOS, resumirRespuesta } from "../../../../lib/campos-invitado";
import {
  getInvitadosAirtable,
  registroDeFicha,
  guardarEnAirtable,
} from "../../../../lib/invitados-airtable";
import { mandarCorreo, correoInterno } from "../../../../lib/correo";
import { SITE } from "../../../../lib/site";

// El invitado contesta si su ficha está bien o qué hay que corregirle.
//
// Escribe en Airtable y NUNCA en el repositorio. Dos razones, y las dos
// importan: lo que escribe puede traer datos suyos, y una ruta pública que
// escribe en GitHub necesitaría el token de escritura del repo dado de alta en
// una función abierta a internet.
//
// Y lo más importante: acá NO se publica nada. La respuesta deja la ficha en
// "revisión pendiente" y una persona la mira, aplica lo que corresponda y
// recién entonces la publica. Si se publicara sola, "el invitado lo validó"
// querría decir "alguien apretó un botón", que no es lo mismo.

export const dynamic = "force-dynamic";

const recortar = (v, max) => String(v ?? "").trim().slice(0, max);

// Cuántas respuestas se aceptan por ficha y por día. El link firmado no vence
// ni se agota: quien lo tenga puede volver a mandarlo, y cada envío escribe en
// Airtable y dispara un mail. Sin tope, alguien con el link nos llena la
// casilla y nos quema la cuota. Dos por día alcanzan para cualquier uso normal.
const MAXIMO_POR_DIA = 2;
const MAXIMO_CORRECCIONES = 20000;

export async function POST(req, { params }) {
  const slug = String(params?.slug || "");
  const { searchParams } = new URL(req.url);

  // Sin firma válida no se toca nada: es lo que impide que alguien marque como
  // revisada la ficha de otra persona escribiendo la dirección a mano.
  if (!firmaInvitadoValida(slug, searchParams.get("f"))) {
    return Response.json({ error: "Link inválido o vencido." }, { status: 403 });
  }

  const inv = getInvitado(slug, { incluirBorradores: true });
  if (!inv) {
    return Response.json({ error: "No existe esa ficha." }, { status: 404 });
  }

  let revisiones = {};
  try {
    revisiones = (await req.json())?.revisiones || {};
  } catch {
    return Response.json({ error: "No se entendió el pedido." }, { status: 400 });
  }

  // Solo los campos que existen, y con tope de largo. Lo que llegue de más se
  // ignora en silencio: es una ruta abierta a internet.
  const limpias = {};
  for (const c of CAMPOS) {
    const r = revisiones[c.clave];
    if (!r || typeof r !== "object") continue;
    limpias[c.clave] = {
      ok: r.ok === true,
      correccion: recortar(r.correccion, 4000),
    };
  }
  if (Object.keys(limpias).length === 0) {
    return Response.json(
      { error: "No marcaste ningún dato." },
      { status: 400 }
    );
  }

  const registros = await getInvitadosAirtable();
  const registro = registroDeFicha(registros, inv);
  if (!registro) {
    // Sin registro no hay dónde anotar la respuesta. Pasa si nadie unió la
    // ficha con su fila de Airtable desde el panel. Se avisa por correo igual,
    // porque perder la respuesta de alguien que se tomó el trabajo de contestar
    // es peor que cualquier otra cosa que pueda salir mal acá.
    console.warn(`[confirmar-invitado] ${slug} no tiene registro en Airtable`);
    await avisar(inv, limpias, "(la ficha no está unida a ningún registro de Airtable)");
    return Response.json({ ok: true, pendiente: true });
  }

  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  // El contador y el dato del invitado no comparten cajón: la marca
  // "[fecha] Respuesta del invitado" solo la puede escribir el servidor, porque
  // todo lo que manda él va sangrado. Es la regla 22.
  const yaHoy = (
    registro.correcciones.match(
      new RegExp(`^\\[${hoy}\\] Respuesta del invitado`, "gm")
    ) || []
  ).length;
  if (yaHoy >= MAXIMO_POR_DIA) {
    return Response.json(
      {
        error:
          "Ya recibimos tu respuesta hoy. Si te falta algo, respondé el mail que te mandamos.",
      },
      { status: 429 }
    );
  }

  const resumen = resumirRespuesta(inv, limpias, hoy);
  const previas = registro.correcciones ? `${registro.correcciones}\n\n` : "";
  const historial = `${previas}${resumen}`;

  const guardado = await guardarEnAirtable(registro.id, {
    "Revisión pendiente": true,
    "Respondió la revisión el": hoy,
    "Correcciones del invitado":
      historial.length > MAXIMO_CORRECCIONES
        ? `…\n\n${historial.slice(-MAXIMO_CORRECCIONES)}`
        : historial,
  });

  if (!guardado) {
    return Response.json({ error: "No se pudo guardar." }, { status: 502 });
  }

  // El aviso va después de guardar y nunca voltea la respuesta: para el
  // invitado el trámite ya terminó bien.
  await avisar(inv, limpias, resumen);

  return Response.json({ ok: true, pendiente: true });
}

async function avisar(inv, limpias, resumen) {
  const pidioCambios = Object.values(limpias).some((r) => !r.ok);
  try {
    await mandarCorreo({
      para: correoInterno(),
      asunto: pidioCambios
        ? `✏️ ${inv.nombre} pidió corregir su ficha`
        : `✅ ${inv.nombre} validó su ficha`,
      texto: [
        pidioCambios
          ? `${inv.nombre} repasó su ficha y marcó cosas para corregir.`
          : `${inv.nombre} repasó su ficha y está todo bien.`,
        "",
        `Ficha: ${SITE.url}/invitados/${inv.slug}`,
        "",
        resumen,
        "",
        "La ficha NO se publicó: queda esperando tu OK.",
        `Entrá al panel, pestaña Invitados: ${SITE.url}/admin`,
      ].join("\n"),
    });
  } catch {
    // Si el aviso falla, la respuesta ya está guardada en Airtable.
  }
}
