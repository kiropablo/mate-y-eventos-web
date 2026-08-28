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
      correcciones: (ev.correcciones || "").slice(0, CORRECCIONES_EN_LISTA),
      tieneCorrecciones: Boolean((ev.correcciones || "").trim()),
      aTiempo: llegamosADifundir(ev),
      ficha: `${SITE.url}/agenda/${ev.slug}`,
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
