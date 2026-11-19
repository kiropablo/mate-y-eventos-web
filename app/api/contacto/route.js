import { mandarCorreo, correoInterno } from "../../lib/correo";
import { unaLinea } from "../../lib/url-segura";
import { SITE } from "../../lib/site";

// El formulario de contacto de /contacto.
//
// POR QUÉ EXISTE. Los dos botones de esa página eran links `mailto:`, y un
// `mailto:` no hace NADA si el navegador no tiene un programa de correo
// asociado. El que usa Gmail desde Chrome sin ponerlo de predeterminado
// aprieta el botón y no pasa nada: ni se abre algo, ni aparece un error. El
// visitante cree que el sitio está roto y se va. Ahora el mensaje viaja por
// acá y el `mailto:` queda solo al pie, como alternativa para el que prefiera
// escribir desde su propio correo.
//
// ACÁ EL MAIL ES LA OPERACIÓN, Y ESO CAMBIA UNA REGLA DE LA CASA.
//
// En el resto del sitio vale que «un mail que no sale nunca voltea la
// operación que lo disparó»: el organizador ya confirmó su ficha, el invitado
// ya mandó sus respuestas, y lo que importa quedó guardado en Airtable. Acá no
// hay ningún lado donde quede guardado: si Resend falla y le contestamos «ok»
// igual, la persona se va convencida de que nos escribió y el mensaje no
// existe en ninguna parte. Por eso este es el único lugar donde un mail que no
// sale SÍ devuelve error, y el error le dice a dónde escribir a mano.

export const dynamic = "force-dynamic";

// Los motivos posibles, y cómo se nombra cada uno en el asunto.
//
// Es una lista cerrada y el asunto sale de ACÁ, nunca de lo que mandó el
// visitante: si el asunto se armara con su texto, cualquiera escribe lo que
// quiera en el renglón del mail que leemos todos los días.
// Los cinco salen de un botón distinto del sitio, y la diferencia importa en
// la bandeja de entrada: «Sponsor fundador» no es la misma conversación que
// «Sponsoreo», y los `mailto:` viejos ya los separaban con asuntos distintos.
// Mantenerlos separados es conservar lo que había, no agregar nada.
const MOTIVOS = {
  sponsoreo: "Sponsoreo",
  idea: "Invitado / Colaboración",
  fundador: "Sponsor fundador",
  prensa: "Prensa",
  destacado: "Destacado en Agenda",
};

const MAX_CORTO = 200;
const MAX_MENSAJE = 4000;

// Cuánto se acepta de cuerpo, medido antes de parsearlo. Acá no viajan fotos
// ni adjuntos: son cinco campos de texto. Cincuenta mil es de sobra.
const MAX_CUERPO = 50_000;

// Tope de mensajes por día para todo el sitio.
//
// Lo mismo que está escrito en /sugerir y en el formulario de invitados, que
// es la regla 21: el contador vive en la memoria del proceso y en Vercel cada
// instancia tiene la suya y arranca vacía. Frena al bot de una sola conexión,
// no al decidido. El freno de verdad es una regla de rate limit del firewall
// de Vercel, que está fuera del repo y es la única que corta antes de que la
// función arranque —y por lo tanto la única que cuida la cuota de Resend, que
// este formulario comparte con las invitaciones a organizadores y los avisos
// de fecha—.
//
// Veinte es muy por encima de cualquier día real: por acá entran uno o dos
// mensajes por semana. Y si alguna vez lo toca, el mensaje del 429 lleva la
// dirección, para que una persona real no quede sin forma de escribirnos.
const TOPE_POR_DIA = 20;
let cuenta = { dia: "", n: 0 };

function pasaElTope() {
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  if (cuenta.dia !== hoy) cuenta = { dia: hoy, n: 0 };
  cuenta.n += 1;
  return cuenta.n <= TOPE_POR_DIA;
}

export async function POST(request) {
  // El tamaño primero, antes de leer nada.
  const anunciado = Number(request.headers.get("content-length") || 0);
  if (anunciado > MAX_CUERPO) {
    console.warn(`[contacto] cuerpo de ${anunciado} bytes: pasa el tope`);
    return Response.json(
      { ok: false, error: "El mensaje es demasiado largo. Contanos lo esencial y lo seguimos por mail." },
      { status: 413 }
    );
  }

  let cuerpo = {};
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false, error: "No se entendió el pedido." }, { status: 400 });
  }

  // Honeypot: un campo que no se ve en la página y que una persona no puede
  // llenar. Se contesta ok y se descarta, igual que en /sugerir: avisarle al
  // bot que lo detectamos es enseñarle a evitarlo la próxima.
  if (cuerpo?.tel) {
    console.warn("[contacto] honeypot: se descarta");
    return Response.json({ ok: true });
  }

  // Todo lo que escribe el visitante sale de acá ya aplanado a una línea. Es
  // la regla 22: lo que escribe alguien de afuera no puede agregar renglones
  // al mail que arma el servidor. El mensaje es la excepción y se explica más
  // abajo, donde se usa.
  const campo = (id, max = MAX_CORTO) => unaLinea(cuerpo?.[id], max);

  const motivo = MOTIVOS[String(cuerpo?.motivo || "")] ? String(cuerpo.motivo) : "";
  if (!motivo) {
    return Response.json(
      { ok: false, error: "Elegí de qué se trata." },
      { status: 400 }
    );
  }

  const nombre = campo("nombre");
  const email = campo("email");
  const empresa = campo("empresa");
  // El mensaje SÍ conserva sus saltos de línea: es un texto largo y aplanarlo
  // lo volvería ilegible. Puede hacerlo porque va al final del mail y en su
  // propio bloque, después de una línea que dice dónde empieza: no hay ningún
  // renglón nuestro abajo que se pueda falsificar.
  const mensaje = String(cuerpo?.mensaje ?? "").trim().slice(0, MAX_MENSAJE);

  if (!nombre) {
    return Response.json({ ok: false, error: "Nos falta tu nombre." }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json(
      { ok: false, error: "Ese mail no parece válido. Lo necesitamos para contestarte." },
      { status: 400 }
    );
  }
  if (mensaje.length < 10) {
    return Response.json(
      { ok: false, error: "Contanos un poco más, así te podemos contestar algo útil." },
      { status: 400 }
    );
  }

  // El tope se cuenta DESPUÉS de validar: un pedido mal armado no le tiene que
  // gastar el cupo del día a alguien que sí está escribiendo.
  if (!pasaElTope()) {
    console.warn(`[contacto] tope diario alcanzado (${TOPE_POR_DIA})`);
    return Response.json(
      {
        ok: false,
        error: `Recibimos muchos mensajes hoy y cortamos por las dudas. Escribinos a ${SITE.email} y lo vemos igual.`,
      },
      { status: 429 }
    );
  }

  const resultado = await mandarCorreo({
    para: correoInterno(),
    asunto: `✉️ ${MOTIVOS[motivo]} — ${nombre}`,
    texto: [
      `${nombre} escribió desde el formulario de ${SITE.url}/contacto.`,
      "",
      `Motivo:   ${MOTIVOS[motivo]}`,
      `Nombre:   ${nombre}`,
      `Email:    ${email}`,
      empresa ? `Empresa:  ${empresa}` : null,
      "",
      // Regla 24 en espíritu: esa dirección la eligió quien escribió, y nadie
      // la verificó. Contestar este mail es seguro —no manda ningún link
      // firmado— pero el mail no puede afirmar que el remitente es quien dice.
      "Respondiendo este mail le contestás directo. Ojo que el nombre y la",
      "empresa los escribió esa persona y nadie los verificó.",
      "",
      "--- El mensaje ---",
      "",
      mensaje,
    ]
      .filter((l) => l !== null)
      .join("\n"),
    // Para que "Responder" vaya a la persona y no a nuestra propia casilla.
    responderA: email,
  });

  // Acá sí: si el mail no salió, no hay copia en ningún lado y la persona
  // tiene que enterarse. Lo contrario sería un cartel de "listo" sobre un
  // mensaje que no existe.
  if (!resultado.ok) {
    console.warn(`[contacto] no se pudo mandar el mensaje: ${resultado.motivo}`);
    return Response.json(
      {
        ok: false,
        error: `No pudimos mandar tu mensaje. Escribinos directo a ${SITE.email} y lo resolvemos.`,
      },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
