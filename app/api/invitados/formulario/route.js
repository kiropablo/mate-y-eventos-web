import {
  CONTACTO,
  PREGUNTAS,
  FOTO,
  FOTO_MAX_BYTES,
  pareceContacto,
} from "../../../lib/formulario-invitados";
import { unaLinea } from "../../../lib/url-segura";
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
//
// ESTA RUTA ES LA ÚNICA PUERTA, y está abierta a internet.
//
// Antes pedía la clave del link (/invitados/formulario/<clave>) y eso era todo
// lo que tenía: ni tope, ni honeypot, ni nada. La clave se sacó porque no
// servía —el contador de visitas publica la dirección de cada página en el
// panel público, así que una dirección con clave adentro se publica sola— y
// entonces los frenos tienen que estar acá, donde se pueden leer:
//
//   1. el tope de tamaño del cuerpo, ANTES de parsearlo;
//   2. el tope de respuestas por día (amortiguador, ver regla 21);
//   3. la foto validada por sus bytes y no por lo que dice ser;
//   4. todo lo que escribe quien llena el formulario, pasado por unaLinea()
//      antes de entrar al mail que arma el servidor (regla 22).
//
// El tope DE VERDAD no está en este archivo: es la regla de rate limit del
// firewall de Vercel sobre /formulario y /api/invitados/formulario. Es la única
// que frena antes de que la función arranque, y por lo tanto la única que
// también cuida las invocaciones y la cuota de Resend.

export const dynamic = "force-dynamic";

const BASE = "appvziqRHGN0jtS19";
const TABLA = "tblHdZr5d8yWovqNk";

// El link que va en el aviso. Va la tabla y no una vista: una vista puede
// tener columnas escondidas o un filtro, y entonces el mail manda a un lugar
// donde la respuesta parece que no llegó.
const TABLA_URL = `https://airtable.com/${BASE}/${TABLA}`;

// Sube la foto como adjunto del registro.
//
// Va en un pedido aparte y DESPUÉS de crear la fila, porque Airtable necesita
// el id del registro para colgarle un archivo: no se puede mandar todo junto.
//
// Devuelve true o false y nunca tira: si la foto no sube, las respuestas ya
// están guardadas y el trámite del invitado terminó bien. Es la misma regla
// que el correo — lo secundario no voltea lo principal.
// ¿Los primeros bytes del archivo son los de la clase de imagen que dice ser?
//
// POR QUÉ HACE FALTA. El `data:image/jpeg;base64,…` de arriba es una ETIQUETA
// que escribe quien manda la foto, y el (.+) del final acepta cualquier cosa.
// O sea que sin esto, cualquiera guarda medio megabyte de lo que quiera como
// adjunto de la base diciendo que es un JPEG. Y los adjuntos de Airtable se
// sirven en una URL pública: la base queda usada de hosting de archivos
// ajenos, y el espacio ocupado no se recupera.
//
// Los números son la firma de cada formato, que va al principio del archivo y
// no se puede falsificar sin que el archivo deje de ser esa imagen.
function laFirmaCoincide(tipo, buf) {
  if (tipo === "image/jpeg") {
    return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (tipo === "image/png") {
    return buf.length > 8 && buf.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }
  if (tipo === "image/webp") {
    // "RIFF" ···· "WEBP": el tamaño va en medio y no se mira.
    return (
      buf.length > 12 &&
      buf.subarray(0, 4).toString("latin1") === "RIFF" &&
      buf.subarray(8, 12).toString("latin1") === "WEBP"
    );
  }
  return false;
}

// La extensión que corresponde al tipo real. Antes el nombre del archivo era
// siempre ".jpg", así que un PNG quedaba guardado con una extensión que no era
// la suya.
const EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function subirFoto(idRegistro, dataUrl, key, nombre) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl || "");
  if (!m) {
    console.warn("[formulario-invitados] la foto no vino como imagen: se descarta");
    return false;
  }
  const [, tipo, base64] = m;

  // El tope se mide sobre los bytes reales, no sobre el largo del texto:
  // base64 abulta un tercio y compararlo así dejaría pasar fotos más pesadas
  // de lo que dice el número.
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > FOTO_MAX_BYTES) {
    console.warn(`[formulario-invitados] foto de ${bytes} bytes: pasa el tope, se descarta`);
    return false;
  }

  // Y recién acá se mira el archivo de verdad. Se decodifica lo mismo que va a
  // decodificar Airtable, así que lo que se valida es exactamente lo que se
  // guarda.
  const crudo = Buffer.from(base64, "base64");
  if (!laFirmaCoincide(tipo, crudo)) {
    console.warn(
      `[formulario-invitados] el archivo dice ser ${tipo} y sus bytes no lo son: se descarta`
    );
    return false;
  }

  try {
    const res = await fetch(
      `https://content.airtable.com/v0/${BASE}/${idRegistro}/${FOTO.campo}/uploadAttachment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: tipo,
          file: base64,
          // El nombre lo escribió quien llenó el formulario: va por unaLinea()
          // antes de ser parte de un nombre de archivo, y la extensión es la
          // del tipo real y no ".jpg" fijo.
          filename: `${unaLinea(nombre, 60) || "invitado"}.${EXTENSION[tipo]}`,
        }),
      }
    );
    if (!res.ok) {
      console.warn(
        `[formulario-invitados] Airtable ${res.status} al subir la foto: ${(await res.text()).slice(0, 160)}`
      );
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[formulario-invitados] no se pudo subir la foto: ${e.message}`);
    return false;
  }
}

// Cuánto se acepta por campo. Sin tope, una sola respuesta puede llenar la
// tabla: son campos de texto libre abiertos a internet.
const MAX_CORTO = 300;
const MAX_LARGO = 4000;

// Cuánto se acepta de cuerpo, medido ANTES de parsearlo.
//
// Los topes de arriba y el de la foto recortan DESPUÉS de haber leído todo, y
// Vercel acepta hasta unos 4,5 MB. Esto corta antes de gastar nada.
//
// Un millón es holgado a propósito: la foto sale del navegador recortada a
// 800×1000 en JPEG y pesa entre 100 y 200 KB en base64, y las diez respuestas
// suman unos pocos miles de caracteres. Nadie legítimo se acerca.
const MAX_CUERPO = 1_000_000;

// Tope de respuestas por día para todo el sitio.
//
// Honestidad sobre lo que esto vale, que es la regla 21: el contador vive en la
// memoria del proceso, y en Vercel cada instancia tiene la suya y arranca
// vacía. Frena al bot de una sola conexión, no al decidido. El freno de verdad
// es la regla del firewall de Vercel, que está fuera del repo.
//
// Diez y no cuarenta como en /sugerir: este formulario recibe unas tres
// respuestas por MES. Diez es más que cualquier día real —se graba uno o dos
// invitados por semana— y cada respuesta aceptada gasta un envío de la MISMA
// cuota de Resend que las invitaciones a organizadores y los avisos de fecha.
//
// Si alguna vez un día de grabación lo toca, se sube el número. Lo que no
// puede pasar es que una persona real quede afuera sin saber cómo seguir: por
// eso el mensaje del 429 lleva la dirección de correo.
const TOPE_POR_DIA = 10;
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
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) {
    return Response.json(
      { ok: false, error: "El formulario no está configurado. Escribinos y lo resolvemos." },
      { status: 500 }
    );
  }

  // Lo primero de todo: el tamaño, antes de leer el cuerpo.
  //
  // Es "lo que el pedido dice que mide". Si no viene la cabecera no se puede
  // saber de antemano y se sigue —el tope de la foto y los de cada campo
  // siguen estando—, pero el caso normal es que venga.
  const anunciado = Number(request.headers.get("content-length") || 0);
  if (anunciado > MAX_CUERPO) {
    console.warn(`[formulario-invitados] cuerpo de ${anunciado} bytes: pasa el tope`);
    return Response.json(
      { ok: false, error: "Lo que mandaste es demasiado grande. Probá con una foto más chica." },
      { status: 413 }
    );
  }

  let cuerpo = {};
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false, error: "No se entendió el pedido." }, { status: 400 });
  }

  // Honeypot: un campo que en la página no se ve y que una persona no puede
  // llenar. Si vino con algo, lo llenó un robot. Se contesta ok y se descarta,
  // igual que en /api/agenda/sugerir: decirle que lo detectamos es enseñarle a
  // evitarlo la próxima.
  if (cuerpo?.tel) {
    console.warn("[formulario-invitados] honeypot: se descarta");
    return Response.json({ ok: true });
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

  // El tope se cuenta DESPUÉS de validar: un pedido mal armado no le tiene que
  // gastar el cupo del día a una persona que sí está contestando. Está escrito
  // así en /api/agenda/sugerir y es la misma razón.
  if (!pasaElTope()) {
    console.warn(`[formulario-invitados] tope diario alcanzado (${TOPE_POR_DIA})`);
    return Response.json(
      {
        ok: false,
        error: `Recibimos muchas respuestas hoy y cortamos por las dudas. Escribinos a ${SITE.email} y lo resolvemos a mano.`,
      },
      { status: 429 }
    );
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

  // La autorización de la foto se anota con fecha. Es el consentimiento, y un
  // consentimiento sin fecha no sirve para nada: hay que poder decir cuándo.
  //
  // Se escribe solo si además vino la foto. Marcar la casilla y no mandar
  // ninguna no autoriza nada, así que dejar la fecha sola sería afirmar un
  // permiso sobre una imagen que no existe.
  const quiereFoto = Boolean(cuerpo?.fotoAutorizada && cuerpo?.foto);
  if (quiereFoto) fields[FOTO.campoFecha] = hoy;

  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    // Sin typecast, que es la regla 23: Airtable no rechaza un valor que no
    // está en un desplegable, lo CREA para siempre y borrarlo después no saca
    // la opción. Acá hoy no hay ninguno —son todos campos de texto y dos
    // fechas, que Airtable acepta en ISO "AAAA-MM-DD" sin ayuda—, así que no
    // hacía falta nunca; y dejarlo puesto en una ruta abierta a internet es
    // dejar la trampa cargada para el día que alguien convierta «Empresa /
    // Cargo» en un desplegable.
    body: JSON.stringify({ records: [{ fields }] }),
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

  // La foto, después de que la fila existe y sin poder voltear nada.
  let fotoGuardada = false;
  if (quiereFoto) {
    const creado = await res.json().catch(() => ({}));
    const idRegistro = creado?.records?.[0]?.id;
    if (idRegistro) {
      fotoGuardada = await subirFoto(idRegistro, cuerpo.foto, key, nombre);
    }
  }

  // El aviso va DESPUÉS de guardar y nunca voltea la respuesta: para el
  // invitado el trámite ya terminó bien. Es la misma regla que el resto de los
  // correos del sitio.
  try {
    // TODO lo que escribió quien llenó el formulario pasa por unaLinea() antes
    // de entrar acá. Es la regla 22 con el cuerpo del mail como cajón: texto()
    // recorta y acorta pero NO saca los saltos de línea, así que un nombre con
    // un Enter adentro agrega renglones a un mail que lo escribe el servidor,
    // y puede falsificar justamente el que dice si mandó foto y la autorizó.
    //
    // En Airtable el valor va crudo, no por acá: ahí el campo tiene que quedar
    // tal como lo cargaron o se pierde justo en el lugar donde se corrige.
    const enUnaLinea = (id) => unaLinea(texto(id, MAX_CORTO), MAX_CORTO);
    const nombreLinea = enUnaLinea("nombre") || "(sin nombre)";

    await mandarCorreo({
      para: correoInterno(),
      asunto: `📝 ${nombreLinea} llenó el formulario de invitados`,
      texto: [
        `${nombreLinea} completó el formulario.`,
        "",
        `Nombre:   ${nombreLinea}`,
        v.comoNombrar ? `Lo nombramos: ${enUnaLinea("comoNombrar")}` : null,
        v.empresa ? `Empresa:  ${enUnaLinea("empresa")}` : null,
        // Que la foto esté o no cambia lo que hay que hacer después, así que
        // se dice acá y no hay que ir a mirar.
        quiereFoto && fotoGuardada
          ? "Mandó foto y autorizó publicarla."
          : quiereFoto
            ? "Mandó foto pero no se pudo guardar. Hay que pedírsela de nuevo."
            : "No mandó foto: hay que conseguir una.",
        "",
        // El link directo, no "está en Airtable". Antes el mail decía que las
        // respuestas también se veían en el panel, y no era cierto: el panel
        // lee el contacto, no las diez preguntas. Mandar a alguien a un lugar
        // donde no está lo que busca es peor que no decirle nada.
        "Las diez respuestas y el contacto, acá:",
        TABLA_URL,
        "",
        `La ficha pública se arma después, desde ${SITE.url}/admin, pestaña Invitados.`,
        "",
        // Regla 24: nadie de afuera decide a dónde mandamos un link firmado.
        // Esta dirección la eligió quien llenó el formulario, y el formulario
        // ahora está abierto a internet. Responder este mail es seguro —no
        // manda ningún link—, pero el pedido de revisión sale del panel y
        // después de mirar el registro, no de acá.
        "Ojo: estos datos los escribió quien llenó el formulario y nadie los verificó",
        "todavía. El pedido de revisión con su link se manda desde el panel, después",
        "de mirar el registro.",
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
