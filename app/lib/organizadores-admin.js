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
      fechaVerificacion: ev.fechaVerificacion,
      difundido: ev.difundido,
      email: ev.emailOrganizador || "",
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
