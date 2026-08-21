import { getEventos, yaPaso, formatRango } from "./agenda";
import { hayClave, firmar } from "./firma";
import { mismaSemana, llegamosADifundir, diasHasta } from "./semana";
import { SITE } from "./site";

// Lo que necesita el panel para el circuito con organizadores.
//
// Por cada evento que viene: el link firmado para pegar en el mail, qué otros
// eventos caen esa misma semana, y en qué punto del circuito está
// (sin contactar → verificado → difundido).

// Más allá de esto no tiene sentido escribirle a nadie todavía.
const MESES_ADELANTE = 4;

// El primer mail que aparezca en el campo Contactos, que es texto libre.
function primerEmail(lineas) {
  for (const l of lineas || []) {
    const m = String(l).match(/[^\s<>()[\],;:"]+@[^\s<>()[\],;:"]+\.[a-z]{2,}/i);
    if (m) return m[0].replace(/[.,;]+$/, "");
  }
  return "";
}

export async function listarOrganizadoresParaPanel() {
  let eventos = [];
  try {
    eventos = await getEventos();
  } catch {
    return { eventos: [], hayFirma: false };
  }

  const vigentes = eventos.filter((e) => !yaPaso(e) && e.fechaInicio);
  const tope = new Date();
  tope.setUTCMonth(tope.getUTCMonth() + MESES_ADELANTE);
  const hasta = tope.toISOString().slice(0, 10);

  const hayFirma = hayClave();

  const lista = vigentes
    .filter((e) => e.fechaInicio <= hasta)
    .map((ev) => ({
      slug: ev.slug,
      nombre: ev.nombre,
      organizador: ev.organizador || "",
      fechas: formatRango(ev) || "Sin confirmar",
      fechaInicio: ev.fechaInicio,
      dias: diasHasta(ev.fechaInicio),
      verificado: ev.verificado,
      revisionPendiente: ev.revisionPendiente,
      fechaVerificacion: ev.fechaVerificacion,
      difundido: ev.difundido,
      fechaContacto: ev.fechaContacto || null,
      email: ev.emailOrganizador || "",
      // Si en Contactos ya hay un mail, se ofrece como destinatario para no
      // tener que buscarlo a mano. Se puede cambiar antes de enviar.
      emailSugerido: ev.emailOrganizador || primerEmail(ev.contactos),
      correcciones: ev.correcciones || "",
      aTiempo: llegamosADifundir(ev),
      ficha: `${SITE.url}/agenda/${ev.slug}`,
      // Sin la clave cargada no se puede armar el link. Se avisa en el panel
      // en vez de mostrar uno roto.
      link: hayFirma
        ? `${SITE.url}/agenda/${ev.slug}/confirmar?f=${firmar(ev.slug)}`
        : "",
      semana: mismaSemana(ev, vigentes).map((o) => ({
        nombre: o.nombre,
        fechas: formatRango(o) || "",
        ciudad: o.ciudad || o.pais || "",
      })),
    }))
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));

  return { eventos: lista, hayFirma };
}
