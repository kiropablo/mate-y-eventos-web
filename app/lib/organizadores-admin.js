import { getEventosConEstado, yaPaso, formatRango } from "./agenda";
import { hayClave, firmar, linkDelEquipo } from "./firma";
import { mismaSemana, llegamosADifundir, diasHasta } from "./semana";
import { SITE } from "./site";

// Lo que necesita el panel para el circuito con organizadores.
//
// Por cada evento que viene: el link firmado para pegar en el mail, qué otros
// eventos caen esa misma semana, y en qué punto del circuito está
// (sin contactar → verificado → difundido).

// Más allá de esto no tiene sentido escribirle a nadie todavía. Ya no recorta
// la lista: ahora la pestaña muestra la base entera y esto solo marca cuáles
// entran en la ventana para escribirles, que es un filtro más.
const MESES_ADELANTE = 4;

// Cuánto se manda de las correcciones en la lista. El campo guarda hasta 20.000
// caracteres de historial y hay más de cuatrocientos eventos: mandarlo entero
// por cada uno haría pesada la pantalla para mostrar un texto que igual no
// entra en la tarjeta. El completo lo trae el editor cuando se abre.
const CORRECCIONES_EN_LISTA = 600;

// El final del historial de correcciones, no el principio.
//
// La ruta de confirmación agrega cada respuesta nueva ABAJO de las anteriores,
// así que lo último que dijo el organizador está al final. Cortando desde el
// principio, la tarjeta mostraba la corrección MÁS VIEJA y escondía la que
// acababa de llegar, que es justo la que hay que leer para decidir. Y sin
// decir que había más.
function ultimasCorrecciones(texto) {
  const t = String(texto || "").trim();
  if (!t) return { texto: "", recortado: false };
  if (t.length <= CORRECCIONES_EN_LISTA) return { texto: t, recortado: false };

  // Se arma de atrás para adelante y por entradas enteras: cortar por
  // cantidad de caracteres deja la tarjeta empezando a mitad de una oración.
  // Cada respuesta del organizador va separada por un renglón en blanco.
  const entradas = t.split(/\n{2,}/);
  const elegidas = [];
  let largo = 0;
  for (let i = entradas.length - 1; i >= 0; i--) {
    const e = entradas[i];
    if (elegidas.length && largo + e.length + 2 > CORRECCIONES_EN_LISTA) break;
    elegidas.unshift(e);
    largo += e.length + 2;
  }
  // Si una sola entrada ya no entra, se muestra su final, que es donde está
  // lo que el organizador escribió último.
  const salida =
    elegidas.length === 1 && elegidas[0].length > CORRECCIONES_EN_LISTA
      ? elegidas[0].slice(-CORRECCIONES_EN_LISTA)
      : elegidas.join("\n\n");
  return { texto: salida, recortado: elegidas.length < entradas.length || salida !== t };
}

// Todos los mails que aparezcan en el campo Contactos, que es texto libre.
//
// Se devuelven todos y no el primero porque el primero muchas veces no es el
// que sirve: hay fichas donde el de arriba es el de venta de entradas y el de
// prensa está abajo. Que elija una persona.
function emailsDe(lineas) {
  const encontrados = [];
  for (const l of lineas || []) {
    for (const m of String(l).matchAll(
      /[^\s<>()[\],;:"]+@[^\s<>()[\],;:"]+\.[a-z]{2,}/gi
    )) {
      const limpio = m[0].replace(/[.,;]+$/, "");
      if (!encontrados.includes(limpio)) encontrados.push(limpio);
    }
  }
  return encontrados;
}

export async function listarOrganizadoresParaPanel() {
  let eventos = [];
  try {
    // Con los tres estados: el panel tiene que poder ver los borradores para
    // aprobarlos y los archivados para traerlos de vuelta. El sitio sigue
    // publicando solo los aprobados; eso no se toca.
    ({ eventos } = await getEventosConEstado({ fresco: true, todosLosEstados: true }));
  } catch {
    return { eventos: [], hayFirma: false, linkEquipo: "" };
  }

  // Los que están por delante y publicados. Es contra esta lista que se calcula
  // "qué más pasa esa semana": un archivado o uno que ya pasó no le sirve a
  // nadie como referencia.
  const vigentes = eventos.filter(
    (e) => e.estado === "Aprobado" && !yaPaso(e) && e.fechaInicio
  );
  const tope = new Date();
  tope.setUTCMonth(tope.getUTCMonth() + MESES_ADELANTE);
  const hasta = tope.toISOString().slice(0, 10);

  const hayFirma = hayClave();

  const lista = eventos
    .map((ev) => ({
      // Cada fila se identifica por el id del registro y no por el slug: un
      // archivado y su gemelo publicado comparten slug, y con el slug los
      // botones le pegaban al que sigue vivo.
      id: ev.id,
      slug: ev.slug,
      nombre: ev.nombre,
      organizador: ev.organizador || "",
      fechas: formatRango(ev) || "Sin confirmar",
      fechaInicio: ev.fechaInicio,
      // Sin fecha no hay cuenta regresiva. Antes esto no podía pasar porque la
      // lista solo traía los que tenían fecha; ahora entran los ~113 que están
      // "por anunciar", que son justamente los que hay que ir a completar.
      dias: ev.fechaInicio ? diasHasta(ev.fechaInicio) : null,
      estado: ev.estado || "",
      tipo: ev.tipo || "",
      pais: ev.pais || "",
      provincia: ev.provincia || "",
      ciudad: ev.ciudad || "",
      venue: ev.venue || "",
      estadoFechas: ev.estadoFechas || "Por anunciar",
      edicion: ev.edicion || "",
      web: ev.web || "",
      imperdibleMes: ev.imperdibleMes || null,
      destacado: Boolean(ev.destacado),
      paso: yaPaso(ev),
      verificado: ev.verificado,
      revisionPendiente: ev.revisionPendiente,
      fechaVerificacion: ev.fechaVerificacion,
      difundido: ev.difundido,
      fechaContacto: ev.fechaContacto || null,
      fechaConfirmacion: ev.fechaConfirmacion || null,
      email: ev.emailOrganizador || "",
      // Si en Contactos hay mails, se ofrecen como destinatarios para no
      // tener que buscarlos a mano. Se puede cambiar antes de enviar.
      emailSugerido: ev.emailOrganizador || emailsDe(ev.contactos)[0] || "",
      emailsSugeridos: ev.emailOrganizador
        ? [ev.emailOrganizador]
        : emailsDe(ev.contactos),
      // El campo entero, para ver de dónde sale cada mail: no es lo mismo el
      // de prensa que el de venta de entradas.
      contactos: (ev.contactos || []).join(" · ").slice(0, 300),
      correcciones: ultimasCorrecciones(ev.correcciones).texto,
      // Que la tarjeta pueda decir que hay más arriba, en vez de mostrar un
      // recorte como si fuera todo.
      correccionesRecortadas: ultimasCorrecciones(ev.correcciones).recortado,
      tieneCorrecciones: Boolean((ev.correcciones || "").trim()),
      aTiempo: llegamosADifundir(ev),
      // Solo los aprobados tienen ficha pública. Desde que el panel muestra
      // borradores y archivados, "Ver la ficha" llevaba a un 404 en todas esas
      // filas: la página existe recién cuando el evento se publica.
      ficha: ev.estado === "Aprobado" ? `${SITE.url}/agenda/${ev.slug}` : "",
      // Sin la clave cargada no se puede armar el link. Se avisa en el panel
      // en vez de mostrar uno roto.
      // Sin clave no se puede armar, y a un archivado o a uno que ya pasó no se
      // le manda a confirmar nada.
      link:
        hayFirma && ev.estado === "Aprobado" && !yaPaso(ev)
          ? `${SITE.url}/agenda/${ev.slug}/confirmar?f=${firmar(ev.slug)}`
          : "",
      // "Qué más pasa esa semana" solo se calcula para los que se pueden
      // escribir. Con la base entera son cuatrocientos por cuatrocientos
      // comparaciones para armar listas que nadie va a leer.
      semana:
        ev.estado === "Aprobado" && !yaPaso(ev) && ev.fechaInicio
          ? mismaSemana(ev, vigentes).map((o) => ({
              nombre: o.nombre,
              fechas: formatRango(o) || "",
              ciudad: o.ciudad || o.pais || "",
            }))
          : [],
    }))
    // Los que no tienen fecha van al final y no rompen la comparación: antes
    // no llegaban hasta acá, y localeCompare sobre null tira el panel entero.
    .sort((a, b) =>
      a.fechaInicio && b.fechaInicio
        ? a.fechaInicio.localeCompare(b.fechaInicio)
        : a.fechaInicio
          ? -1
          : b.fechaInicio
            ? 1
            : a.nombre.localeCompare(b.nombre, "es")
    );

  return { eventos: lista, hayFirma, linkEquipo: hayFirma ? linkDelEquipo() : "" };
}
