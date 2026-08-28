import { revalidateTag } from "next/cache";
import { haySesion } from "../../../lib/admin";
import { getEventoDelPanel } from "../../../lib/agenda";
import {
  CAMPOS_EDITABLES,
  valoresEditables,
  parsearCorrecciones,
  PAISES,
  TIPOS,
  ESTADOS_FECHA,
} from "../../../lib/ficha-editable";

// Editar la ficha de un evento desde el panel.
//
// Hasta ahora el organizador respondía el link, su respuesta quedaba anotada
// como texto y había que entrar a Airtable a aplicarla campo por campo. Acá se
// aplica desde el panel, que es el mismo lugar donde después se le da el OK y
// se enciende el sello.
//
// Lo que NO cambia: nada se aplica solo. La ruta del organizador sigue sin
// tocar la ficha, y esto tampoco escribe si nadie aprieta guardar. El sello
// tiene que seguir queriendo decir "una persona miró esto".

export const dynamic = "force-dynamic";

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function explicar(estado) {
  if (estado === 401)
    return "Airtable rechazó la llave (401). Hay que revisar AIRTABLE_API_KEY en Vercel.";
  if (estado === 403) return "Airtable no deja escribir (403).";
  if (estado === 422)
    return "Airtable rechazó algún valor (422). Suele ser un desplegable con una opción que no existe.";
  if (estado === 429)
    return "Airtable cortó por exceso de pedidos (429). Esperá un minuto.";
  return `Airtable contestó ${estado}.`;
}

// Trae la ficha con sus valores actuales y lo que pidió corregir el organizador.
export async function GET(request) {
  if (!haySesion()) {
    return Response.json({ ok: false, error: "Sin sesión." }, { status: 401 });
  }
  // El id del registro identifica la ficha; el slug se repite entre un
  // archivado y su gemelo publicado.
  const params = new URL(request.url).searchParams;
  const id = String(params.get("id") || "");
  const slug = String(params.get("slug") || "");
  if (!id && !slug) {
    return Response.json({ ok: false, error: "Falta el evento." }, { status: 400 });
  }

  // Se lee fresco y no de lo que ya tenía el panel en pantalla: entre que se
  // cargó la lista y se abre el editor pueden haber pasado horas, y lo que se
  // está por hacer es pisar campos. Editar sobre una foto vieja es la forma
  // más fácil de deshacer sin querer un cambio de esta mañana.
  const ev = await getEventoDelPanel({ id, slug });
  if (!ev) {
    return Response.json(
      { ok: false, error: "No existe ese evento, o está fuera de la agenda." },
      { status: 404 }
    );
  }

  return Response.json({
    ok: true,
    slug: ev.slug,
    nombre: ev.nombre,
    verificado: ev.verificado,
    campos: CAMPOS_EDITABLES,
    valores: valoresEditables(ev),
    // El texto entero se manda igual: si el parseo no reconoce el formato, el
    // panel muestra lo crudo, que es lo que mostraba antes.
    correccionesTexto: ev.correcciones || "",
    ...parsearCorrecciones(ev.correcciones),
  });
}

// Guarda. Escribe solo lo que cambió.
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

  let id = "";
  let slug = "";
  let entran = {};
  let originales = null;
  try {
    const body = await request.json();
    id = String(body?.id || "");
    slug = String(body?.slug || "");
    entran = body?.valores || {};
    // Cómo estaba la ficha cuando se abrió el editor. Si no viene, no se
    // puede chequear nada y se guarda como antes.
    originales = body?.originales || null;
  } catch {
    return Response.json({ ok: false, error: "No se entendió el pedido." }, { status: 400 });
  }
  if (!id && !slug) {
    return Response.json({ ok: false, error: "Falta el evento." }, { status: 400 });
  }

  const ev = await getEventoDelPanel({ id, slug });
  if (!ev) {
    return Response.json(
      { ok: false, error: "No existe ese evento, o está fuera de la agenda." },
      { status: 404 }
    );
  }

  const ahora = valoresEditables(ev);
  const nuevos = {};
  for (const c of CAMPOS_EDITABLES) {
    // Lo que no venga en el pedido se deja como está. Así un panel viejo, de
    // una pestaña abierta desde antes, no borra un campo que no conocía.
    if (!(c.clave in entran)) continue;
    nuevos[c.clave] = String(entran[c.clave] ?? "").trim();
  }

  // --- Validaciones. Se rechaza entero: guardar la mitad deja la ficha en un
  // estado que nadie pidió y encima sin avisar cuál mitad entró.
  const problemas = [];

  if ("nombre" in nuevos && !nuevos.nombre) {
    problemas.push("El nombre no puede quedar vacío.");
  }

  for (const clave of ["fechaInicio", "fechaFin"]) {
    const v = nuevos[clave];
    if (v && !ES_FECHA.test(v)) {
      problemas.push(`La ${clave === "fechaInicio" ? "fecha de inicio" : "fecha de cierre"} tiene que ser así: 2026-10-29.`);
    }
  }

  // Se comparan las de después de aplicar el cambio, no solo las que llegaron:
  // si se toca una sola, la otra sigue siendo la que está guardada. Hoy hay una
  // ficha en la base con las fechas al revés justamente por no chequear esto.
  const inicioFinal = "fechaInicio" in nuevos ? nuevos.fechaInicio : ahora.fechaInicio;
  const finFinal = "fechaFin" in nuevos ? nuevos.fechaFin : ahora.fechaFin;
  if (
    ES_FECHA.test(inicioFinal || "") &&
    ES_FECHA.test(finFinal || "") &&
    finFinal < inicioFinal
  ) {
    problemas.push("La fecha de cierre no puede ser anterior a la de inicio.");
  }

  const listas = { pais: PAISES, tipo: TIPOS, estadoFechas: ESTADOS_FECHA };
  for (const [clave, lista] of Object.entries(listas)) {
    const v = nuevos[clave];
    // Vacío se permite; una opción inventada no. Airtable con typecast crea la
    // opción que no existe, así que un país mal tipeado quedaría cargado para
    // siempre en el desplegable y rompería los filtros de la agenda.
    if (v && !lista.includes(v)) {
      problemas.push(`«${v}» no es una opción válida. Elegí una de la lista.`);
    }
  }

  if (problemas.length) {
    return Response.json({ ok: false, error: problemas.join(" ") }, { status: 400 });
  }

  // --- Solo lo que cambió de verdad. Mandar todo pisaría con el mismo valor
  // campos que nadie tocó, y ensucia el historial de Airtable, que es lo único
  // que después dice quién cambió qué.
  const fields = {};
  const cambiados = [];
  for (const c of CAMPOS_EDITABLES) {
    if (!(c.clave in nuevos)) continue;
    if (nuevos[c.clave] === (ahora[c.clave] || "")) continue;
    // Las fechas vacías van como null: mandar "" hace que Airtable rechace el
    // registro entero con un 422.
    fields[c.campo] =
      c.tipo === "fecha" && !nuevos[c.clave] ? null : nuevos[c.clave];
    cambiados.push(c.rotulo);
  }

  // --- ¿Alguien tocó la ficha mientras el editor estaba abierto?
  //
  // El editor manda TODOS los campos con el valor que tenían al abrirlo, no
  // solo los que se escribieron. Sin este chequeo, si el robot de la agenda
  // completaba una fecha a las 8 de la mañana y el editor estaba abierto desde
  // las 7, guardar cualquier otro campo revertía esa fecha al valor viejo, sin
  // que nada lo dijera.
  //
  // Se compara la foto de cuando se abrió contra lo que hay guardado AHORA. Si
  // difieren en algún campo que este guardado iba a pisar, se frena entero y
  // se dice cuál: guardar la mitad deja la ficha en un estado que nadie pidió,
  // igual que con las validaciones de arriba.
  if (originales && cambiados.length) {
    const pisados = [];
    for (const c of CAMPOS_EDITABLES) {
      if (!(c.campo in fields)) continue;
      if (!(c.clave in originales)) continue;
      const cuandoAbrio = String(originales[c.clave] ?? "").trim();
      const guardadoAhora = ahora[c.clave] || "";
      if (cuandoAbrio !== guardadoAhora) pisados.push(c.rotulo);
    }
    if (pisados.length) {
      return Response.json(
        {
          ok: false,
          error: `Mientras tenías el editor abierto cambió ${
            pisados.length === 1 ? "este campo" : "estos campos"
          }: ${pisados.join(", ")}. Cerrá el editor y volvé a abrirlo para ver lo que hay ahora; si guardás igual, pisás ese cambio.`,
        },
        { status: 409 }
      );
    }
  }

  // Si cambia el nombre, se congela la URL.
  //
  // El slug sale del campo Slug y solo se deriva del nombre cuando ese campo
  // está vacío. Hoy las 338 fichas aprobadas lo tienen cargado, así que
  // renombrar no mueve nada. Pero si alguna vez entra una sin él —creada a
  // mano, o por un camino nuevo— cambiarle el nombre le cambiaría la
  // dirección pública en silencio, y con ella se rompería el link firmado que
  // ya se le mandó al organizador: la firma es sobre el slug. Escribirlo acá
  // es gratis —para las 338 es el mismo valor que ya tienen— y cierra eso.
  if ("Nombre" in fields) fields["Slug"] = ev.slug;

  if (!cambiados.length) {
    return Response.json({ ok: true, cambiados: [], mensaje: "No había nada para cambiar." });
  }

  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ id: ev.id, fields }], typecast: true }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.warn(`[ficha] Airtable ${res.status}: ${detalle.slice(0, 200)}`);
    return Response.json({ ok: false, error: explicar(res.status) }, { status: 502 });
  }

  // La ficha pública tiene que mostrar lo corregido ya: si el organizador entra
  // a mirar después de que le avisamos, no puede seguir viendo el dato viejo.
  try {
    revalidateTag("agenda");
  } catch {
    // Se actualiza sola en la próxima revalidación.
  }

  return Response.json({
    ok: true,
    cambiados,
    mensaje: `Guardado: ${cambiados.join(", ")}.`,
  });
}
