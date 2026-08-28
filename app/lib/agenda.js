// Lee la agenda de eventos desde Airtable.
//
// Fuente: base "Mate y Eventos — Plan Editorial 2026",
// tabla "Base de Datos — Eventos y Agenda".
// Solo se publican los registros con Estado = "Aprobado".
//
// Necesita AIRTABLE_API_KEY en las variables de entorno (Vercel).
// Si falta la clave o Airtable no responde, devuelve una lista vacía
// y la página muestra su estado "muy pronto" sin romperse.

const BASE_ID = process.env.AIRTABLE_AGENDA_BASE || "app6q7METE3ofZz1S";
const TABLE_ID = process.env.AIRTABLE_AGENDA_TABLE || "tblaLHf2VSyyyeN2s";

// Color de cada tipo de evento (dots del calendario y la lista).
export const TIPO_COLOR = {
  "Congreso/Conferencia": "#5aa0ff",
  "Expo/Feria": "#93d5f7",
  Festival: "#b78cff",
  "Recital masivo": "#ea478a",
  Corporativo: "#9aa3b2",
  "Capacitación": "#7fe0a7",
  "Deportivo masivo": "#ffb35a",
  "Premios y galas": "#ffd75e",
  "Público/Festivo": "#5ad8c9",
};

export const MESES_LARGO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Convierte un registro de Airtable en un objeto cómodo para las páginas.
function mapear(record) {
  const f = record.fields || {};
  const nombre = (f["Nombre"] || "").trim();
  if (!nombre) return null;

  const slug =
    (f["Slug"] || "").trim() ||
    nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const imagen =
    Array.isArray(f["Imagen/Logo"]) && f["Imagen/Logo"][0]
      ? f["Imagen/Logo"][0].url
      : null;

  return {
    id: record.id,
    nombre,
    slug,
    // En qué estado está el registro: "Aprobado", "Borrador IA" o "Archivado".
    // El sitio lee solo los aprobados y por eso nunca lo necesitó. Lo usa el
    // panel, que sí muestra los tres para poder revisarlos y descartarlos.
    estado: f["Estado"] || "",
    tipo: f["Tipo"] || "",
    interes: f["Interés MyE"] || [],
    // El destacado del mes es un espacio pago y vence solo.
    //
    // Sin fecha de vencimiento habría que acordarse de destildarlo a mano: se
    // vende un mes, alguien se olvida, y el evento queda arriba gratis medio
    // año. Con "Destacado hasta" cargado, el sitio lo saca el día que
    // corresponde.
    //
    // Si está tildado y sin fecha, es un destacado editorial nuestro: no vence
    // y no se declara como pago, porque no lo es.
    destacado: Boolean(f["Destacado"]) && vigenteDestacado(f["Destacado hasta"]),
    destacadoHasta: f["Destacado hasta"] || null,
    // Solo los que tienen fecha de vencimiento son pagos. Es lo que decide si
    // la tarjeta lleva la etiqueta y si el link al sitio del evento sale
    // marcado como patrocinado.
    destacadoPago: Boolean(f["Destacado"]) && Boolean(f["Destacado hasta"]),
    // El sello solo se enciende con la casilla que marca Pablo a mano después
    // de hablar con el organizador. Ojo: NO usar "Última verificación", que
    // la escribe el robot en cada pasada y la tienen todos los eventos.
    verificado: Boolean(f["Verificado por el organizador"]),
    fechaVerificacion: f["Fecha de verificación"] || null,
    // El circuito de difusión: lo que el organizador pidió corregir, y si ya
    // lo publicamos en las redes.
    correcciones: (f["Correcciones del organizador"] || "").trim(),
    revisionPendiente: Boolean(f["Revisión pendiente"]),
    fechaContacto: f["Fecha de contacto"] || null,
    // Cuándo se le avisó que el sello quedó encendido. Va aparte de la fecha
    // de difusión: entre confirmar y publicar en redes pueden pasar días.
    fechaConfirmacion: f["Fecha de confirmación"] || null,
    emailOrganizador: (f["Email del organizador"] || "").trim(),
    difundido: Boolean(f["Difundido"]),
    fechaDifusion: f["Fecha de difusión"] || null,
    // Los 5 imperdibles del mes. El mes vive en el evento (y no en una lista
    // aparte) para que el archivo de ediciones se arme solo: un evento
    // elegido en septiembre se queda con "2026-09" para siempre.
    imperdibleMes: mesValido(f["Imperdible del mes"]),
    porQueImperdible: (f["Por qué es imperdible"] || "").trim(),
    imagen,
    organizador: (f["Organizador"] || "").trim(),
    edicion: (f["Edición/Frecuencia"] || "").trim(),
    fechaInicio: f["Fecha inicio"] || null,
    fechaFin: f["Fecha fin"] || null,
    estadoFechas: f["Estado de fechas"] || "Por anunciar",
    pais: f["País"] || "",
    provincia: (f["Provincia/Región"] || "").trim(),
    ciudad: (f["Ciudad"] || "").trim(),
    venue: (f["Venue"] || "").trim(),
    descCorta: (f["Descripción corta"] || "").trim(),
    descLarga: (f["Descripción larga"] || "").trim(),
    web: (f["Web oficial"] || "").trim(),
    contactos: lineas(f["Contactos"]),
    redes: lineas(f["Redes"]),
    edicionesAnteriores: lineas(f["Ediciones anteriores"]),
    fuentes: lineas(f["Fuentes"]),
  };
}

// Acepta "2026-09" y también "2026-09-15" o "2026-9", que es lo que sale si
// alguien lo escribe apurado. Cualquier otra cosa se ignora en silencio: un
// mes mal escrito no tiene que hacer aparecer una edición fantasma.
//
// En Airtable el campo es un desplegable con los meses cargados, así que hoy
// no debería llegar nada raro. La tolerancia se deja igual: el campo se puede
// volver a tocar, y un error acá sería una sección entera vacía.
function mesValido(crudo) {
  const t = String(crudo || "").trim();
  const m = t.match(/^(\d{4})-(\d{1,2})/);
  if (!m) return null;
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return `${m[1]}-${String(mes).padStart(2, "0")}`;
}

// ¿Sigue vigente el destacado? Sin fecha, sí: es editorial y no vence.
function vigenteDestacado(hasta) {
  if (!hasta) return true;
  return String(hasta).slice(0, 10) >= hoyISO();
}

// Divide un campo de texto largo en líneas limpias.
function lineas(crudo) {
  if (!crudo) return [];
  return String(crudo)
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);
}

// Trae todos los eventos aprobados, paginando si hace falta.
//
// Por defecto degrada: si Airtable no contesta devuelve lo que haya (o nada)
// y las páginas muestran su estado vacío en vez de romperse.
//
// Con { estricto: true } avisa el error en vez de devolver una lista corta.
// Lo usa el feed de calendario: publicar una lista incompleta ahí no es
// "mostrar menos", es hacer que los calendarios de los suscriptos BORREN
// los eventos que faltan.
export async function getEventos(opciones) {
  const { eventos } = await getEventosConEstado(opciones);
  return eventos;
}

// La ficha de un evento, sin pasar por la copia guardada. La usa el panel
// después de escribir en Airtable, para no mostrar lo que acaba de pisar.
export async function getEventoFresco(slug) {
  const { eventos } = await getEventosConEstado({ fresco: true });
  return eventos.find((e) => e.slug === slug) || null;
}

// El evento que está mirando el panel, buscado por el id del registro.
//
// El slug NO es único y nunca lo fue: el robot lo arma del nombre
// (scripts/agenda-ia.mjs) y cuando archiva un duplicado deja dos registros con
// el mismo nombre y el mismo slug, uno Aprobado y otro Archivado. Mientras el
// panel mostraba solo los aprobados eso no se notaba. Al empezar a mostrar los
// tres estados, buscar por slug significa que apretar un botón en la fila del
// archivado le pega al que está publicado.
//
// Busca en los tres estados a propósito: el panel tiene que poder trabajar
// sobre un borrador para aprobarlo y sobre un archivado para traerlo de
// vuelta. Eso no publica nada: lo que protege al sitio es el filtro de las
// páginas públicas, no este.
//
// Cae al slug solo si no le pasan id, para no romper nada que todavía lo mande
// así, y en ese caso se queda con el aprobado si hay más de uno.
//
// getEventoFresco queda como estaba, con su búsqueda entre aprobados: la usa
// app/api/agenda/[slug]/confirmar, que es la única ruta PÚBLICA que escribe en
// Airtable. Abrirla dejaría que alguien con un link firmado confirme un
// borrador que nadie miró, o reviva un archivado.
export async function getEventoDelPanel({ id = "", slug = "" } = {}) {
  if (!id && !slug) return null;
  const { eventos } = await getEventosConEstado({
    fresco: true,
    todosLosEstados: true,
  });
  if (id) return eventos.find((e) => e.id === id) || null;
  const conEseSlug = eventos.filter((e) => e.slug === slug);
  return (
    conEseSlug.find((e) => e.estado === "Aprobado") || conEseSlug[0] || null
  );
}

// Un pedido a Airtable, con reintentos.
//
// Airtable corta a las 5 consultas por segundo por base. Un build que
// prerrenderiza 338 fichas y cada una relee la agenda pasa ese techo sin
// despeinarse, y ahí contesta 429. Antes eso se tomaba como "no hay más
// datos": la lectura se cortaba a mitad, devolvía la lista incompleta, y la
// ficha que faltaba concluía que el evento no existía. Reintentar es la
// diferencia entre un tropiezo de un segundo y una página caída una hora.
//
// Se reintenta solo lo que puede salir bien la próxima: 429 (frenó) y los 5xx
// (se cayó del otro lado). Un 401 o un 404 se reintentan en vano.
const ESPERAS = [1000, 3000, 9000];

async function traerPagina(url, opciones) {
  let ultimo = null;

  for (let intento = 0; intento <= ESPERAS.length; intento++) {
    if (intento > 0) {
      await new Promise((r) => setTimeout(r, ESPERAS[intento - 1]));
    }
    try {
      const res = await fetch(url, opciones);
      if (res.ok) return { res };
      ultimo = `Airtable respondió ${res.status}`;
      if (res.status !== 429 && res.status < 500) return { error: ultimo };
    } catch (error) {
      ultimo = error?.message || String(error);
    }
    if (intento < ESPERAS.length) {
      console.warn(
        `[agenda] ${ultimo}. Reintento ${intento + 1} de ${ESPERAS.length}.`
      );
    }
  }

  return { error: ultimo };
}

// Igual que getEventos, pero además dice si la lectura salió entera.
//
// Hace falta para no mentir: el hub muestra "actualizada al {fecha}", y si
// Airtable cortó a mitad del paginado esa leyenda estaría afirmando frescura
// sobre una lista incompleta. Con "completa" en false, la página muestra los
// eventos que pudo traer pero se guarda el sello.
export async function getEventosConEstado({
  estricto = false,
  fresco = false,
  // Solo para el panel. El sitio publica únicamente los aprobados, y esa línea
  // no se toca: es lo que impide que un borrador que nadie miró salga a la web.
  // Pero el panel tiene que poder ver los borradores para aprobarlos y los
  // archivados para traerlos de vuelta.
  todosLosEstados = false,
} = {}) {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) {
    if (estricto) throw new Error("Agenda: falta AIRTABLE_API_KEY");
    return { eventos: [], completa: false };
  }

  const eventos = [];
  let offset = "";

  try {
    do {
      const params = new URLSearchParams({ pageSize: "100" });
      if (!todosLosEstados) params.set("filterByFormula", '{Estado}="Aprobado"');
      if (offset) params.set("offset", offset);

      const { res, error } = await traerPagina(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${params}`,
        {
          headers: { Authorization: `Bearer ${key}` },
          // Con "fresco" se saltea la copia guardada y se va a Airtable.
          // Lo usa el panel interno: ahí ver algo de hace media hora no es
          // "un poco viejo", es cargar un evento en Airtable, no verlo, y no
          // entender por qué.
          ...(fresco
            ? { cache: "no-store" }
            : {
                // La etiqueta permite refrescar de un saque todo lo que lee
                // la agenda —páginas, fichas y los .ics— desde
                // /api/agenda/revalidar.
                next: { revalidate: 3600, tags: ["agenda"] },
              }),
        }
      );
      if (!res) {
        if (estricto) throw new Error(`Agenda: ${error}`);
        return corta(eventos, error);
      }

      const data = await res.json();
      (data.records || []).forEach((r) => {
        const ev = mapear(r);
        if (ev) eventos.push(ev);
      });
      offset = data.offset || "";
    } while (offset);
  } catch (error) {
    if (estricto) throw error;
    return corta(eventos, error?.message || String(error));
  }

  return { eventos: ordenados(eventos), completa: true };
}

// La salida degradada, en un solo lugar y con el motivo escrito.
//
// Regla 8 del CLAUDE.md: si algo puede quedar vacío, tiene que quedar en los
// registros. Antes esto devolvía la lista a medias en silencio y el que la
// recibía no tenía forma de saber que le faltaban eventos.
function corta(eventos, motivo) {
  console.warn(
    `[agenda] LECTURA INCOMPLETA: ${motivo}. Se devuelven ${eventos.length} eventos de los que haya.`
  );
  return { eventos: ordenados(eventos), completa: false };
}

// Orden: primero los que tienen fecha (más cercana arriba), después los
// "por anunciar".
//
// Se ordena también cuando la lectura salió corta. Antes las salidas
// degradadas devolvían la lista en el orden crudo de Airtable —que es por
// código de registro— y el hub mostraba el 28 de septiembre arriba del 3.
function ordenados(eventos) {
  return [...eventos].sort((a, b) => {
    if (a.fechaInicio && b.fechaInicio)
      return a.fechaInicio < b.fechaInicio ? -1 : 1;
    if (a.fechaInicio) return -1;
    if (b.fechaInicio) return 1;
    return a.nombre.localeCompare(b.nombre);
  });
}

// La ficha de un evento.
//
// Devuelve null SOLO cuando de verdad no está. Si la lectura vino corta,
// tira error en vez de contestar null, y esa distinción es todo el asunto.
//
// Lo que pasaba: Airtable contestaba a medias, la lista llegaba incompleta,
// esta función no encontraba el evento y devolvía null, y la página de arriba
// leía ese null como "no existe" y llamaba a notFound(). Ese 404 se guardaba
// una hora. El 28/8/2026 había 18 fichas así —de 338, todas Aprobadas en
// Airtable y todas publicadas en el sitemap—, o sea que Google estaba
// entrando a la puerta cerrada. Se veía en que /agenda/fit daba 404 y
// /api/agenda/fit/ics, que lee exactamente lo mismo, daba 200: cada ruta se
// había quedado con la foto que le tocó.
//
// Un error, en cambio, no se cachea: Next sigue sirviendo la última versión
// buena de la página y deja el motivo escrito en los registros.
export async function getEvento(slug) {
  const { eventos, completa } = await getEventosConEstado();
  const ev = eventos.find((e) => e.slug === slug) || null;
  if (!ev && !completa) {
    throw new Error(
      `Agenda: la lectura vino incompleta, así que no se puede afirmar que "${slug}" no existe. No se cachea un 404 sobre una lista a medias.`
    );
  }
  return ev;
}

// Compara sin distinguir mayúsculas, acentos ni espacios de más. Un
// "Cordoba " cargado a las apuradas en Airtable tiene que seguir entrando
// en el filtro de "Córdoba".
export function pelado(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ¿El evento pasa los filtros elegidos?
//
// Cada filtro es una lista. Vacía quiere decir "todos". Dentro de un mismo
// filtro los valores SUMAN (Córdoba o Santa Fe); entre filtros distintos se
// CRUZAN (Córdoba o Santa Fe, y además solo festivales).
//
// Vive acá porque la usan tres lugares que tienen que dar siempre el mismo
// resultado: la lista, el calendario y el feed .ics.
export function pasaFiltros(ev, { tipos, paises, provincias } = {}) {
  return (
    estaEn(ev.tipo, tipos) &&
    estaEn(ev.pais, paises) &&
    estaEn(ev.provincia, provincias)
  );
}

function estaEn(valor, elegidos) {
  if (!elegidos || elegidos.length === 0) return true;
  const v = pelado(valor);
  return elegidos.some((e) => pelado(e) === v);
}

// Hoy, en hora de Argentina, como "2026-08-19".
//
// Importa el detalle: los servidores de Vercel corren en UTC, así que sin
// esto, a partir de las 21 de acá el sitio ya creería que es mañana y los
// eventos de hoy desaparecerían de "los próximos" tres horas antes.
export function hoyISO() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

// Suma (o resta) días a una fecha "2026-08-19".
export function sumarDias(fechaISO, dias) {
  const [a, m, d] = String(fechaISO).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

// ¿El evento ya pasó? (comparado contra hoy)
export function yaPaso(ev) {
  const fin = ev.fechaFin || ev.fechaInicio;
  if (!fin) return false;
  return fin < hoyISO();
}

// Las ediciones de "Los 5 imperdibles" que existen, de la más nueva a la más
// vieja. Cada una es un mes con al menos un evento elegido.
export function edicionesImperdibles(eventos) {
  const meses = new Map();
  for (const e of eventos) {
    if (!e.imperdibleMes) continue;
    if (!meses.has(e.imperdibleMes)) meses.set(e.imperdibleMes, []);
    meses.get(e.imperdibleMes).push(e);
  }
  return [...meses.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([mes, lista]) => ({
      mes,
      eventos: lista.sort((a, b) =>
        (a.fechaInicio || "9").localeCompare(b.fechaInicio || "9")
      ),
    }));
}

// "septiembre de 2026" a partir de "2026-09".
export function mesLargo(mes) {
  const [a, m] = String(mes).split("-").map(Number);
  return `${MESES_LARGO[m - 1].toLowerCase()} de ${a}`;
}

// Ya arrancó y todavía no terminó.
export function enCurso(ev, hoy = hoyISO()) {
  if (!ev.fechaInicio) return false;
  const fin = ev.fechaFin || ev.fechaInicio;
  return ev.fechaInicio <= hoy && fin >= hoy;
}

// "12 al 14 de mar 2027", "5 de sep 2026" o "Fechas por anunciar".
export function formatRango(ev) {
  if (!ev.fechaInicio) return "Fechas por anunciar";
  const [ai, mi, di] = ev.fechaInicio.split("-").map(Number);
  const ini = `${di} de ${MESES[mi - 1]}`;
  // La fecha de cierre anterior a la de inicio no se dibuja: sale publicada
  // como "22 de sep al 24 de ago" en la ficha, en el og:title y en el mail al
  // organizador. Si el dato está mal en la base, es mejor mostrar solo el
  // inicio —que es cierto— que un rango imposible. Hoy hay un caso así.
  if (
    !ev.fechaFin ||
    ev.fechaFin === ev.fechaInicio ||
    ev.fechaFin < ev.fechaInicio
  ) {
    return `${ini} ${ai}`;
  }
  const [af, mf, df] = ev.fechaFin.split("-").map(Number);
  if (mi === mf && ai === af) return `${di} al ${df} de ${MESES[mi - 1]} ${ai}`;
  const fin = `${df} de ${MESES[mf - 1]}`;
  if (ai === af) return `${ini} al ${fin} ${ai}`;
  return `${ini} ${ai} al ${fin} ${af}`;
}

// Detecta el ID de un video de YouTube dentro de un texto, si lo hay.
export function youtubeId(texto) {
  const m = String(texto).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

// Separa "Etiqueta: resto" de una línea; si no hay etiqueta, va todo al texto.
export function partirLinea(linea) {
  const url = (linea.match(/https?:\/\/\S+/) || [null])[0];
  const corte = linea.indexOf(":");
  // Cuidado con "https:" — la etiqueta solo vale si aparece antes de la URL.
  if (corte > 0 && (!url || corte < linea.indexOf(url))) {
    return {
      etiqueta: linea.slice(0, corte).trim(),
      texto: linea.slice(corte + 1).trim(),
      url,
    };
  }
  return { etiqueta: "", texto: linea.trim(), url };
}

// ---------------------------------------------------------------------------
// Títulos de las fichas de evento
// ---------------------------------------------------------------------------

// El año de la edición sale de la fecha de inicio, no del nombre.
export function anioDeEvento(ev) {
  return ev && ev.fechaInicio ? ev.fechaInicio.slice(0, 4) : "";
}

// El nombre del evento con el año de SU edición.
//
// En Airtable muchos nombres vienen con el año pegado, y el robot que corre
// las fechas de un año al siguiente no toca el nombre. Así, un evento anual
// queda con el nombre en 2025 y la fecha ya en 2026: si solo preguntáramos
// "¿el nombre ya dice 2026?", el título saldría "Expo Auto Chino 2025 2026".
//
// Se saca el año viejo antes de pegar el nuevo, pero solo si está cerca del
// de la edición. Un año lejano casi siempre es parte del nombre y no una
// edición: "Rock 2000" no es la edición del año 2000, es como se llama.
const DISTANCIA_MAXIMA = 3;
// Los separadores que suelen acompañar a un año dentro de un nombre.
const SEPARADORES = "-–—·|,:;/";
// Marca interna para saber dónde estaba el año mientras se limpia alrededor.
const HUECO = "\u0000";

export function nombreConAnio(ev) {
  const nombre = String((ev && ev.nombre) || "").trim();
  const anio = anioDeEvento(ev);
  if (!nombre || !anio) return nombre;

  // Si el nombre YA trae el año de esta edición, no se toca nada. Muchos lo
  // tienen en el medio y ahí está bien: "Copa Davis 2026 – Playoffs Grupo
  // Mundial I" no mejora en nada si lo mandamos al final.
  if (new RegExp(`\\b${anio}\\b`).test(nombre)) return nombre;

  const limpio = nombre
    // Se marca el año viejo en vez de borrarlo, para poder limpiar después lo
    // que quedó a su alrededor sabiendo dónde estaba.
    .replace(/\b(19|20)\d{2}\b/g, (encontrado) =>
      Math.abs(Number(encontrado) - Number(anio)) <= DISTANCIA_MAXIMA
        ? HUECO
        : encontrado
    )
    // Si el año venía precedido de un separador, ese separador se va con él:
    // en "Expo — 2025 — Rosario" el primer guion solo estaba ahí para colgar
    // el año, y sin esto quedaría "Expo — — Rosario". El de atrás NO se toca,
    // porque ese sí separa lo que quedó: en "Expo 2025, Rosario" la coma
    // sigue haciendo falta.
    .replace(new RegExp(`\\s*[${SEPARADORES}]\\s*${HUECO}`, "g"), " ")
    .replace(new RegExp(HUECO, "g"), " ")
    // Un paréntesis que se quedó sin contenido: "Congreso (2025)".
    .replace(/\(\s*\)|\[\s*\]/g, " ")
    // Y el espacio que queda colgando delante de un signo.
    .replace(/\s+([,:;.!?)\]])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(new RegExp(`^[\\s${SEPARADORES}]+|[\\s${SEPARADORES}]+$`, "g"), "")
    .trim();

  // Si al sacar los años no quedó nada, el nombre era el año y con eso alcanza.
  return limpio ? `${limpio} ${anio}` : anio;
}

// El título de la ficha, recortado para que entre en el resultado de Google.
//
// El patrón completo es "{Evento} {año} — fechas, sede y contactos", pero con
// la marca que agrega el layout muchos nombres se van a 90 caracteres y
// Google corta cerca de 60: el usuario termina sin ver ni el año ni la marca.
// Así que se va soltando cola hasta que entre, y el nombre con el año —que es
// lo que la gente escribe cuando busca— nunca se toca.
//
// Devuelve un texto (y el layout le agrega " · Mate y Eventos") o, cuando ni
// el nombre solo entra con la marca, un { absolute } para que no se la agregue.
const MARCA = " · Mate y Eventos";
const LARGO_IDEAL = 60;
const COLAS = [
  " — fechas, sede y contactos",
  " — fechas y sede",
  " — fechas",
  "",
];

export function tituloDeEvento(ev) {
  const base = nombreConAnio(ev);

  // Primero se intenta con la marca, que es como sale el resto del sitio.
  for (const cola of COLAS) {
    if ((base + cola + MARCA).length <= LARGO_IDEAL) return base + cola;
  }

  // Si el nombre es tan largo que ni pelado entra con la marca, se suelta la
  // marca y se usa ese lugar para la cola más larga que entre.
  for (const cola of COLAS) {
    if ((base + cola).length <= LARGO_IDEAL) return { absolute: base + cola };
  }

  // Un nombre larguísimo va solo: recortarlo sería cortar el propio evento.
  return { absolute: base };
}
