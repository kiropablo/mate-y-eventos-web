// Carga y mantenimiento automático de la Agenda de eventos.
//
// Dos modos, elegidos con la variable MODO:
//
//   descubrir  → busca eventos nuevos y los carga como "Borrador IA".
//                Nunca publica nada: Pablo aprueba desde Airtable.
//
//   verificar  → repasa los eventos ya aprobados contra sus fuentes
//                oficiales. Si algo cambió, NO pisa los datos: deja el
//                hallazgo en "Hallazgos IA" y marca "Revisar".
//                Única excepción: si las fechas estaban en "Estimadas" o
//                "Por anunciar" y aparece la confirmación oficial, las
//                completa (y avisa igual).
//
// Se ejecuta desde .github/workflows/agenda.yml.

const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const MODELO = process.env.MODELO_IA || "claude-sonnet-5";

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";
const API = `https://api.airtable.com/v0/${BASE}/${TABLA}`;

const MODO = (process.env.MODO || "verificar").trim();
const TEMA = (process.env.TEMA || "").trim();
const MAX = Number(process.env.MAX_EVENTOS || 12);

// Los rubros que barre la búsqueda. Están acá adentro para que nadie
// tenga que escribir nada: el botón dispara el barrido completo.
const RUBROS = [
  "ferias, expos y encuentros del propio rubro eventos en Argentina: bodas, fiestas, catering, ambientación, sonido, iluminación, audiovisual, estructuras y proveedores de producción",
  "congresos y conferencias profesionales en Argentina de marketing, publicidad, comunicación, turismo, tecnología, recursos humanos y negocios, que contraten producción de eventos",
  "ferias comerciales grandes de otros rubros en Argentina que mueven producción de eventos: agro, industria, salud, construcción, automotor, gastronomía, hotelería, inmobiliario y energía",
  "festivales de música y recitales masivos en Argentina, incluidos los festivales de música electrónica y los festivales de verano",
  "fiestas nacionales, provinciales y municipales grandes de Argentina, y celebraciones populares con producción técnica relevante",
  "capacitaciones, cursos, diplomaturas y certificaciones para profesionales de eventos, producción, técnica y wedding planning en Argentina",
  "eventos deportivos masivos en Argentina: maratones, automovilismo, torneos internacionales y competencias con montaje y producción",
  "premios, galas y ceremonias de entrega de la industria en Argentina: publicidad, marketing, música, gastronomía, arquitectura y eventos",
  "convenciones pop, comic cons, gaming, anime, tatuajes, moda y ferias de nicho con gran montaje en Argentina",
  "eventos del rubro eventos en países limítrofes y de Latinoamérica relevantes para un profesional argentino: Uruguay, Chile, Brasil, Paraguay, México y Colombia",
];

const TIPOS = [
  "Congreso/Conferencia",
  "Expo/Feria",
  "Festival",
  "Recital masivo",
  "Corporativo",
  "Capacitación",
  "Deportivo masivo",
  "Premios y galas",
  "Público/Festivo",
];

const INTERESES = [
  "Oportunidad comercial",
  "Capacitación / Networking",
  "Relevante para clientes",
];

if (!AIRTABLE_KEY || !ANTHROPIC_KEY) {
  console.error("Faltan AIRTABLE_API_KEY o ANTHROPIC_API_KEY.");
  process.exit(1);
}

const hoy = new Date().toISOString().slice(0, 10);

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function main() {
  const registros = await traerTodos();
  console.log(`Agenda: ${registros.length} registros en la base.`);

  if (MODO === "completo") {
    // El botón de la consola: barre todos los rubros y después repasa
    // lo que ya está cargado.
    await descubrir(registros, RUBROS);
    await verificar(await traerTodos());
  } else if (MODO === "descubrir") {
    await descubrir(registros, TEMA ? [TEMA] : RUBROS);
  } else if (MODO === "diario") {
    // El mantenimiento de todos los días: repasa lo cargado y suma un
    // rubro por jornada, rotando, para que la base siga creciendo sola.
    await descubrir(registros, [rubroDelDia()]);
    await verificar(await traerTodos());
  } else {
    await verificar(registros);
  }
}

// Un rubro distinto cada día, en ciclo.
function rubroDelDia() {
  const dias = Math.floor(Date.now() / 86400000);
  return RUBROS[dias % RUBROS.length];
}

/* ─────────────────────────── Modo descubrir ─────────────────────────── */

async function descubrir(registros, temas) {
  // Los nombres ya cargados crecen a medida que avanzan las tandas, para
  // que un rubro no vuelva a proponer lo que trajo el anterior.
  const yaEstan = registros.map((r) => r.fields["Nombre"]).filter(Boolean);
  const conocidos = new Set(yaEstan.map(normalizar));
  let total = 0;

  for (const [i, tema] of temas.entries()) {
    console.log(`\n[${i + 1}/${temas.length}] ${tema.slice(0, 70)}…`);
    try {
      total += await descubrirTema(tema, yaEstan, conocidos);
    } catch (e) {
      console.error(`  Falló esta tanda: ${e.message}`);
    }
  }
  console.log(`\nTotal cargado: ${total} eventos como Borrador IA.`);
}

async function descubrirTema(tema, yaEstan, conocidos) {
  const foco = `Enfocate en: ${tema}. Buscá lo que ocurra en los próximos 18 meses.`;

  const prompt = `Sos el investigador de la agenda de eventos de Mate y Eventos, un medio
de la industria de eventos de Latinoamérica. Buscá en la web eventos para sumar a la agenda.

QUÉ ENTRA
Entra todo evento donde un profesional de la industria de eventos querría:
(1) ofrecer sus servicios, (2) capacitarse, promoverse o hacer networking, o
(3) que sea relevante para los clientes de nuestra audiencia (productores, técnicos,
creativos, planners, proveedores, marcas).

QUÉ NO ENTRA
Eventos culturales chicos o de baja trascendencia, religiosos, político-partidarios,
y activaciones privadas de marca.

${foco}

YA ESTÁN EN LA BASE (no los repitas, ni con otro nombre):
${yaEstan.join("\n") || "(la base está vacía)"}

REGLAS INNEGOCIABLES
- Nunca inventes datos. Si no encontrás un dato, dejá el campo vacío.
- HOY ES ${hoy}. Las fechas que cargues tienen que ser futuras. Si el evento es
  periódico y la única edición que encontrás ya se hizo, esa fecha NO va en
  fechaInicio: va en "edicionesAnteriores", y el evento queda con las fechas
  vacías y estadoFechas "Por anunciar". Buscá siempre la próxima edición.
- Las fechas jamás se estiman a ojo. Si la organización todavía no las anunció,
  poné estadoFechas "Por anunciar" y dejá las fechas vacías. Si hay una fecha
  tentativa publicada por la organización, usala con estadoFechas "Estimadas".
  Solo poné "Confirmadas" si la fuente oficial las anuncia como definitivas.
- Toda ficha necesita al menos una fuente verificable (URL). Priorizá el sitio
  oficial del evento y la cámara o entidad organizadora.
- La descripción larga tiene que cerrar con un párrafo que explique por qué le
  sirve a un profesional de eventos. Ese es el valor que aportamos nosotros.
- Escribí en español rioplatense, sin exagerar ni hacer publicidad del evento.

Devolvé hasta ${MAX} eventos en JSON, sin texto alrededor y sin backticks:
{"eventos":[{
  "nombre":"", "tipo":"uno de: ${TIPOS.join(" | ")}",
  "interes":["uno o más de: ${INTERESES.join(" | ")}"],
  "organizador":"", "edicion":"Anual/Bienal/Única/etc",
  "fechaInicio":"YYYY-MM-DD o vacío", "fechaFin":"YYYY-MM-DD o vacío",
  "estadoFechas":"Confirmadas | Estimadas | Por anunciar",
  "pais":"", "provincia":"", "ciudad":"", "venue":"",
  "descCorta":"una o dos oraciones", "descLarga":"2 a 4 párrafos",
  "web":"", "contactos":"", "redes":"una red por línea, formato: Instagram https://...",
  "edicionesAnteriores":"una por línea, con datos concretos si los hay",
  "fuentes":["url", "url"]
}]}`;

  const datos = await preguntarleAClaude(prompt, 16000);
  const eventos = (datos.eventos || []).filter((e) => e && e.nombre);

  const nuevos = eventos.filter((e) => !conocidos.has(normalizar(e.nombre)));
  const conFuente = nuevos.filter(
    (e) => Array.isArray(e.fuentes) && e.fuentes.length > 0
  );

  console.log(
    `  Propone ${eventos.length} · repetidos ${eventos.length - nuevos.length} · sin fuente ${nuevos.length - conFuente.length}`
  );
  if (conFuente.length === 0) return 0;

  // Los damos por cargados antes de escribir, así la próxima tanda no
  // los vuelve a traer.
  for (const e of conFuente) {
    conocidos.add(normalizar(e.nombre));
    yaEstan.push(e.nombre);
  }

  const filas = conFuente.map((e) => ({ fields: aCampos(e) }));
  for (let i = 0; i < filas.length; i += 10) {
    await escribir("POST", filas.slice(i, i + 10));
  }
  console.log(`  Cargados ${filas.length}.`);
  return filas.length;
}

function aCampos(e) {
  const f = {
    Nombre: e.nombre,
    Slug: slug(e.nombre),
    Estado: "Borrador IA",
    Origen: "Carga IA",
    "Última verificación": hoy,
  };
  if (TIPOS.includes(e.tipo)) f["Tipo"] = e.tipo;
  const interes = (e.interes || []).filter((i) => INTERESES.includes(i));
  if (interes.length) f["Interés MyE"] = interes;
  if (e.organizador) f["Organizador"] = e.organizador;
  if (e.edicion) f["Edición/Frecuencia"] = e.edicion;
  if (esFecha(e.fechaInicio)) f["Fecha inicio"] = e.fechaInicio;
  if (esFecha(e.fechaFin)) f["Fecha fin"] = e.fechaFin;
  f["Estado de fechas"] = ["Confirmadas", "Estimadas", "Por anunciar"].includes(
    e.estadoFechas
  )
    ? e.estadoFechas
    : "Por anunciar";
  // Coherencia: sin fecha cargada no puede decir que están confirmadas.
  if (!f["Fecha inicio"] && f["Estado de fechas"] === "Confirmadas") {
    f["Estado de fechas"] = "Por anunciar";
  }
  if (e.pais) f["País"] = e.pais;
  if (e.provincia) f["Provincia/Región"] = e.provincia;
  if (e.ciudad) f["Ciudad"] = e.ciudad;
  if (e.venue) f["Venue"] = e.venue;
  if (e.descCorta) f["Descripción corta"] = e.descCorta;
  if (e.descLarga) f["Descripción larga"] = e.descLarga;
  if (e.web) f["Web oficial"] = e.web;
  if (e.contactos) f["Contactos"] = e.contactos;
  if (e.redes) f["Redes"] = e.redes;
  if (e.edicionesAnteriores) f["Ediciones anteriores"] = e.edicionesAnteriores;
  if (e.fuentes?.length) f["Fuentes"] = e.fuentes.join("\n");
  return f;
}

/* ─────────────────────────── Modo verificar ─────────────────────────── */

async function verificar(registros) {
  // Repasamos primero lo que más puede haber cambiado: los aprobados sin
  // fecha firme, y después los que tienen la verificación más vieja.
  const candidatos = registros
    .filter((r) => r.fields["Estado"] === "Aprobado")
    .filter((r) => !esUnicaVez(r) || !quedoEnElPasado(r))
    .sort((a, b) => {
      // Primero los que quedaron con una fecha vieja: son los que se ven mal.
      const prioridad = (r) => {
        if (quedoEnElPasado(r)) return 0;
        if (r.fields["Estado de fechas"] !== "Confirmadas") return 1;
        return 2;
      };
      if (prioridad(a) !== prioridad(b)) return prioridad(a) - prioridad(b);
      return (a.fields["Última verificación"] || "").localeCompare(
        b.fields["Última verificación"] || ""
      );
    })
    .slice(0, MAX);

  if (candidatos.length === 0) {
    console.log("No hay eventos aprobados para verificar.");
    return;
  }
  console.log(`Verificando ${candidatos.length} eventos.`);

  for (const r of candidatos) {
    try {
      await verificarUno(r);
    } catch (e) {
      console.error(`Falló ${r.fields["Nombre"]}: ${e.message}`);
    }
  }
}

async function verificarUno(r) {
  if (quedoEnElPasado(r)) return reciclarEdicion(r);
  return verificarVigente(r);
}

// Un evento periódico cuya edición ya se hizo no puede quedar en la agenda con
// la fecha vieja: la fecha pasa a "Ediciones anteriores" y se busca la próxima.
async function reciclarEdicion(r) {
  const f = r.fields;
  const rango = `${f["Fecha inicio"] || ""}${f["Fecha fin"] ? ` al ${f["Fecha fin"]}` : ""}`;

  const prompt = `Este evento de la agenda de Mate y Eventos figura con fechas que
YA PASARON. Hoy es ${hoy}.

FICHA
Nombre: ${f["Nombre"]}
Organiza: ${f["Organizador"] || "—"}
Edición que ya se hizo: ${rango}
Frecuencia: ${f["Edición/Frecuencia"] || "—"}
Lugar: ${[f["Venue"], f["Ciudad"], f["Provincia/Región"], f["País"]].filter(Boolean).join(", ")}
Web: ${f["Web oficial"] || "—"}

Buscá en la web si la organización ya anunció la PRÓXIMA edición: fechas, sede,
apertura de inscripción o de venta de stands. Buscá también, si la hay,
información sobre cómo resultó la edición que pasó (convocatoria, expositores,
novedades) que le sirva a un profesional de eventos.

REGLAS
- Nunca inventes. Si la próxima edición todavía no se anunció, decilo.
- Una fecha solo vale si la publica la organización o una fuente oficial.
- No des por hecho que se repite el mismo mes del año pasado.

Devolvé JSON sin texto alrededor y sin backticks:
{"hayProxima": true|false,
 "fechaInicio":"YYYY-MM-DD o vacío",
 "fechaFin":"YYYY-MM-DD o vacío",
 "estadoFechas":"Confirmadas | Estimadas | vacío",
 "resumen":"dos o tres oraciones sobre lo que encontraste",
 "comoResulto":"una o dos oraciones sobre la edición que pasó, o vacío",
 "fuente":"url"}`;

  const d = await preguntarleAClaude(prompt, 3000);
  const campos = { "Última verificación": hoy, Revisar: true };

  // La edición que pasó se guarda como historia, si no estaba ya anotada.
  const historia = f["Ediciones anteriores"] || "";
  const linea = [rango, f["Ciudad"], d.comoResulto].filter(Boolean).join(" · ");
  if (rango && !historia.includes(f["Fecha inicio"])) {
    campos["Ediciones anteriores"] = historia ? `${historia}\n${linea}` : linea;
  }

  if (d.hayProxima && esFecha(d.fechaInicio) && d.fechaInicio > hoy) {
    campos["Fecha inicio"] = d.fechaInicio;
    campos["Fecha fin"] = esFecha(d.fechaFin) ? d.fechaFin : null;
    campos["Estado de fechas"] = d.estadoFechas === "Confirmadas" ? "Confirmadas" : "Estimadas";
    campos["Hallazgos IA"] = `[${hoy}] Próxima edición: ${d.fechaInicio}. ${d.resumen || ""}${d.fuente ? `\nFuente: ${d.fuente}` : ""}`;
    console.log(`  ${f["Nombre"]}: próxima edición → ${d.fechaInicio}`);
  } else {
    // Sin anuncio: se limpian las fechas para que no siga figurando como pasado.
    campos["Fecha inicio"] = null;
    campos["Fecha fin"] = null;
    campos["Estado de fechas"] = "Por anunciar";
    campos["Hallazgos IA"] = `[${hoy}] La edición ${rango} ya se hizo y todavía no anunciaron la próxima. Queda a la espera.${d.resumen ? `\n${d.resumen}` : ""}${d.fuente ? `\nFuente: ${d.fuente}` : ""}`;
    console.log(`  ${f["Nombre"]}: edición pasada archivada, sin próxima fecha`);
  }

  await escribir("PATCH", [{ id: r.id, fields: campos }]);
}

async function verificarVigente(r) {
  const f = r.fields;
  const prompt = `Verificá contra las fuentes oficiales si cambió algo de este evento
de la agenda de Mate y Eventos. Buscá en la web el sitio oficial y las
comunicaciones de la organización.

FICHA ACTUAL
Nombre: ${f["Nombre"]}
Organiza: ${f["Organizador"] || "—"}
Fechas: ${f["Fecha inicio"] || "sin cargar"} a ${f["Fecha fin"] || "sin cargar"} (${f["Estado de fechas"] || "—"})
Lugar: ${[f["Venue"], f["Ciudad"], f["Provincia/Región"], f["País"]].filter(Boolean).join(", ")}
Web: ${f["Web oficial"] || "—"}

QUÉ MIRAR
- ¿Se confirmaron, movieron o cancelaron las fechas?
- ¿Cambió la sede?
- ¿Abrió inscripción, acreditación o venta de stands?
- ¿La organización anunció algo relevante para un profesional de eventos?

REGLAS
- Nunca inventes. Si no encontrás nada nuevo o no podés confirmarlo, decilo.
- Una fecha solo vale si la publica la organización o una fuente oficial.
- No repitas lo que ya dice la ficha: solo lo que cambió o se confirmó.

Devolvé JSON sin texto alrededor y sin backticks:
{"cambio": true|false,
 "resumen":"dos o tres oraciones, o vacío si no hay cambios",
 "fechaInicio":"YYYY-MM-DD o vacío",
 "fechaFin":"YYYY-MM-DD o vacío",
 "estadoFechas":"Confirmadas | Estimadas | Por anunciar | vacío",
 "fuente":"url"}`;

  const d = await preguntarleAClaude(prompt, 3000);
  const campos = { "Última verificación": hoy };

  if (d.cambio && d.resumen) {
    campos["Hallazgos IA"] = `[${hoy}] ${d.resumen}${d.fuente ? `\nFuente: ${d.fuente}` : ""}`;
    campos["Revisar"] = true;

    // Completar fechas solo cuando antes NO estaban firmes. Si ya figuraban
    // como confirmadas, no se tocan: queda el aviso y decide Pablo.
    const eranFirmes = f["Estado de fechas"] === "Confirmadas";
    if (!eranFirmes && esFecha(d.fechaInicio) && d.estadoFechas === "Confirmadas") {
      campos["Fecha inicio"] = d.fechaInicio;
      if (esFecha(d.fechaFin)) campos["Fecha fin"] = d.fechaFin;
      campos["Estado de fechas"] = "Confirmadas";
      console.log(`  ${f["Nombre"]}: fechas confirmadas → ${d.fechaInicio}`);
    } else {
      console.log(`  ${f["Nombre"]}: hallazgo para revisar`);
    }
  } else {
    console.log(`  ${f["Nombre"]}: sin novedades`);
  }

  await escribir("PATCH", [{ id: r.id, fields: campos }]);
}

/* ─────────────────────────── Airtable ─────────────────────────── */

async function traerTodos() {
  const out = [];
  let offset;
  do {
    const url = new URL(API);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const data = await res.json();
    out.push(...data.records);
    offset = data.offset;
  } while (offset);
  return out;
}

async function escribir(metodo, records) {
  const res = await fetch(API, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${AIRTABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records, typecast: true }),
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  // Airtable acepta 5 escrituras por segundo: vamos tranquilos.
  await new Promise((r) => setTimeout(r, 300));
}

/* ─────────────────────────── Claude ─────────────────────────── */

async function preguntarleAClaude(prompt, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
      tools: [
        { type: "web_search_20250305", name: "web_search", max_uses: 12 },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data.stop_reason === "max_tokens") {
    throw new Error("la respuesta quedó cortada (subir max_tokens)");
  }

  // La respuesta mezcla bloques de búsqueda y de texto: nos quedamos con el texto.
  const texto = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return JSON.parse(limpiar(texto));
}

// A veces el modelo envuelve el JSON en backticks o lo precede de una línea.
function limpiar(texto) {
  const sinCercas = texto.replace(/```json|```/g, "").trim();
  const desde = sinCercas.indexOf("{");
  const hasta = sinCercas.lastIndexOf("}");
  if (desde === -1 || hasta === -1) {
    throw new Error(`no vino JSON:\n${texto.slice(0, 400)}`);
  }
  return sinCercas.slice(desde, hasta + 1);
}

/* ─────────────────────────── Varios ─────────────────────────── */

function slug(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
}

function normalizar(nombre) {
  return String(nombre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// ¿Tiene cargada una fecha que ya pasó?
function quedoEnElPasado(r) {
  const fin = r.fields["Fecha fin"] || r.fields["Fecha inicio"];
  return Boolean(fin) && fin < hoy;
}

// Los eventos de una sola vez no se reciclan: son historia y punto.
function esUnicaVez(r) {
  const f = String(r.fields["Edición/Frecuencia"] || "").toLowerCase();
  return f.includes("única") || f.includes("unica") || f.includes("único") || f.includes("unico");
}

function esFecha(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
