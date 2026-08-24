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
  "eventos deportivos masivos en Argentina: maratones, torneos internacionales y competencias con montaje y producción",
  "fechas puntuales del calendario de automovilismo argentino (Turismo Carretera, TC2000, Top Race, Súper TC2000): cada carrera con su autódromo, su ciudad y su fin de semana, NUNCA la temporada completa. Cargá una ficha por fecha, con nombre del estilo \"Turismo Carretera — Autódromo de Rafaela\"",
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

// El campo Provincia/Región es texto libre, así que sin control la IA
// escribe cosas como "Jujuy / Mendoza" o "Variable (últimas ediciones en…)"
// y el filtro de la web se llena de opciones basura. Acá lo encauzamos.
const PROVINCIAS = [
  "Ciudad de Buenos Aires", "Buenos Aires", "Catamarca", "Chaco", "Chubut",
  "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
  "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta",
  "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
  "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

const ITINERANTE = "Itinerante";

// Devuelve una provincia limpia, "Itinerante", o "" si no se puede saber.
function normalizarProvincia(texto, ciudad, pais) {
  const crudo = String(texto || "").trim();
  if (!crudo) return "";

  const plano = sinAcentos(crudo);

  // La Ciudad gana siempre, aunque el texto traiga una aclaración: el atajo de
  // alias de abajo pide coincidencia exacta, y con "Ciudad Autónoma de Buenos
  // Aires (CABA)" caíamos al bloque de menciones, donde "Buenos Aires" matchea
  // adentro y el evento terminaba cargado en la PROVINCIA. "CABA, Argentina"
  // era peor todavía: se iba sin provincia ninguna.
  // (sinAcentos no baja a minúsculas: por eso las dos van con /i)
  if (/\b(caba|capital federal)\b/i.test(plano) ||
      /\bciudad (autonoma de |de )?buenos aires\b/i.test(plano)) {
    return "Ciudad de Buenos Aires";
  }

  // Sedes que cambian de edición en edición.
  if (/variable|itinerant|rotativ|varias sedes|distintas sedes|cambia/i.test(plano)) {
    return ITINERANTE;
  }

  // Fuera de Argentina no aplicamos la lista de provincias: alcanza con
  // recortar la aclaración, si la hubiera.
  if (pais && sinAcentos(pais).toLowerCase() !== "argentina") {
    return crudo.split(/[(,]/)[0].trim();
  }

  // Coincidencia exacta con el nombre canónico.
  const exacta = PROVINCIAS.find((p) => sinAcentos(p) === plano);
  if (exacta) return exacta;

  // Alias frecuentes de la Ciudad de Buenos Aires.
  if (/^(caba|capital federal|ciudad autonoma de buenos aires|buenos aires city)$/i.test(plano)) {
    return "Ciudad de Buenos Aires";
  }

  // Nombra varias ("Jujuy / Mendoza"): si la ciudad desempata, gana la ciudad.
  const mencionadas = PROVINCIAS.filter((p) =>
    new RegExp(`\\b${sinAcentos(p)}\\b`, "i").test(plano)
  );
  if (mencionadas.length > 1) {
    const porCiudad = mencionadas.find((p) =>
      sinAcentos(String(ciudad || "")).includes(sinAcentos(p))
    );
    return porCiudad || ITINERANTE;
  }
  if (mencionadas.length === 1) return mencionadas[0];

  return "";
}

// La búsqueda web de Claude devuelve el texto con marcas de citación
// (<cite index="2-4">…</cite>). Si no se sacan, terminan publicadas.
function sinCitas(texto) {
  if (typeof texto !== "string") return texto;
  return texto
    .replace(/<\/?cite[^>]*>/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function sinAcentos(t) {
  return String(t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const INTERESES = [
  "Oportunidad comercial",
  "Capacitación / Networking",
  "Relevante para clientes",
];

if (!AIRTABLE_KEY || !ANTHROPIC_KEY) {
  console.error("Faltan AIRTABLE_API_KEY o ANTHROPIC_API_KEY.");
  process.exit(1);
}

// Igual que hoyISO() en app/lib/agenda.js. Con toISOString() se usaba la hora
// del runner, que es UTC: apretando el botón de /admin a las 22 de Argentina
// ya era "mañana", y un evento que estaba pasando en ese momento caía en
// quedoEnElPasado() y se archivaba como edición vieja mientras sucedía.
const hoy = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
});

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function main() {
  const registros = await traerTodos();
  console.log(`Agenda: ${registros.length} registros en la base.`);

  if (MODO === "limpiar") {
    await archivarDuplicados(registros);
    await limpiarTextos(registros);
    await limpiarProvincias(registros);
    return;
  }

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

// Saca las marcas de citación que quedaron guardadas en fichas ya publicadas.
async function limpiarTextos(registros) {
  const CAMPOS = [
    "Descripción corta", "Descripción larga", "Ediciones anteriores",
    "Contactos", "Redes", "Fuentes", "Organizador", "Venue",
    "Edición/Frecuencia", "Hallazgos IA", "Notas internas",
  ];

  const arreglos = [];
  for (const r of registros) {
    const campos = {};
    for (const c of CAMPOS) {
      const v = r.fields[c];
      if (typeof v !== "string" || !/<\/?cite/i.test(v)) continue;
      campos[c] = sinCitas(v);
    }
    if (Object.keys(campos).length) {
      arreglos.push({ id: r.id, fields: campos });
      console.log(`  ${r.fields["Nombre"]}: ${Object.keys(campos).join(", ")}`);
    }
  }

  if (arreglos.length === 0) {
    console.log("No hay marcas de citación para sacar.");
    return;
  }
  for (let i = 0; i < arreglos.length; i += 10) {
    await escribir("PATCH", arreglos.slice(i, i + 10));
  }
  console.log(`Textos limpiados en ${arreglos.length} fichas.\n`);
}

// Dos corridas simultáneas pueden haber cargado el mismo evento dos veces.
// No borramos nada: al repetido se lo pasa a "Archivado", que no se publica,
// y queda anotado por si hubiera que recuperarlo.
async function archivarDuplicados(registros) {
  const porNombre = new Map();
  for (const r of registros) {
    if (r.fields["Estado"] === "Archivado") continue;
    const clave = normalizar(r.fields["Nombre"]);
    if (!clave) continue;
    if (!porNombre.has(clave)) porNombre.set(clave, []);
    porNombre.get(clave).push(r);
  }

  const aArchivar = [];
  for (const [, grupo] of porNombre) {
    if (grupo.length < 2) continue;
    // Se queda el registro más completo; si empatan, el más viejo.
    grupo.sort((a, b) => {
      // Lo que ya está publicado gana siempre. Antes se elegía solo por
      // cantidad de campos llenos: un aprobado al que Pablo le vació campos
      // podía perder contra su propio borrador y terminar en "Archivado",
      // o sea desaparecer de la web sin ningún error de por medio.
      const rango = (r) => (r.fields["Estado"] === "Aprobado" ? 0 : 1);
      if (rango(a) !== rango(b)) return rango(a) - rango(b);
      const peso = (r) => Object.keys(r.fields).length;
      if (peso(a) !== peso(b)) return peso(b) - peso(a);
      return String(a.createdTime).localeCompare(String(b.createdTime));
    });
    const [gana, ...repetidos] = grupo;
    console.log(`  "${gana.fields["Nombre"]}": ${repetidos.length} repetido(s)`);
    for (const r of repetidos) {
      aArchivar.push({
        id: r.id,
        fields: {
          Estado: "Archivado",
          "Notas internas": `Duplicado de ${gana.id}, archivado automáticamente el ${hoy}.`,
        },
      });
    }
  }

  if (aArchivar.length === 0) {
    console.log("No hay duplicados.");
    return;
  }
  for (let i = 0; i < aArchivar.length; i += 10) {
    await escribir("PATCH", aArchivar.slice(i, i + 10));
  }
  console.log(`Archivados ${aArchivar.length} duplicados.\n`);
}

// Pasada de trapo sobre lo ya cargado: deja el campo Provincia/Región
// con nombres limpios para que el filtro de la web sirva. No usa IA.
async function limpiarProvincias(registros) {
  const arreglos = [];

  for (const r of registros) {
    const actual = r.fields["Provincia/Región"];
    if (!actual) continue;
    const limpia = normalizarProvincia(actual, r.fields["Ciudad"], r.fields["País"]);
    if (limpia === actual) continue;

    const campos = { "Provincia/Región": limpia || null };
    const notas = r.fields["Notas internas"] || "";
    if (!notas.includes(actual)) {
      campos["Notas internas"] = notas
        ? `${notas}\nProvincia original: ${actual}`
        : `Provincia original: ${actual}`;
    }
    arreglos.push({ id: r.id, fields: campos });
    console.log(`  ${r.fields["Nombre"]}: "${actual}" → "${limpia || "(vacío)"}"`);
  }

  if (arreglos.length === 0) {
    console.log("Las provincias ya estaban limpias.");
    return;
  }
  for (let i = 0; i < arreglos.length; i += 10) {
    await escribir("PATCH", arreglos.slice(i, i + 10));
  }
  console.log(`\nCorregidos ${arreglos.length} registros.`);
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
  // También sin el año. Cuando a un evento se le mueve la fecha al año que
  // viene, el nombre no se toca: la ficha sigue diciendo "Expo Eventos 2026"
  // con fechas de 2027. Comparando el nombre exacto, la próxima vez que el
  // rubro vuelve a tocar en la rotación el robot propone "Expo Eventos 2027",
  // no lo reconoce, y carga una segunda ficha del mismo evento.
  const conocidosSinAnio = new Set(yaEstan.map(sinAnio));
  let total = 0;

  for (const [i, tema] of temas.entries()) {
    console.log(`\n[${i + 1}/${temas.length}] ${tema.slice(0, 70)}…`);
    try {
      total += await descubrirTema(tema, yaEstan, conocidos, conocidosSinAnio);
    } catch (e) {
      console.error(`  Falló esta tanda: ${e.message}`);
    }
  }
  console.log(`\nTotal cargado: ${total} eventos como Borrador IA.`);
}

async function descubrirTema(tema, yaEstan, conocidos, conocidosSinAnio = new Set()) {
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

Tampoco entran, aunque parezcan del rubro:
- Cursos, cursadas, carreras, diplomaturas, licenciaturas y certificaciones.
  Una formación que dura meses no es un evento de agenda. Sí entra un congreso
  o una jornada de capacitación con fecha propia y sede, de uno o dos días.
- Temporadas y campeonatos completos ("Turismo Carretera temporada 2026",
  "Campeonato Provincial de Rally"). Un calendario deportivo entero no es un
  evento: si lo cargás, tiene que ser una fecha puntual, con su sede y su día
  ("TC en Rafaela, 12 de octubre").
- Ciclos permanentes de webinars o jornadas sin fecha única.

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
  "pais":"", "provincia":"solo el nombre de la provincia o region, sin aclaraciones ni barras; si la sede cambia cada edicion escribi Itinerante", "ciudad":"", "venue":"",
  "descCorta":"una o dos oraciones", "descLarga":"2 a 4 párrafos",
  "web":"", "contactos":"", "redes":"una red por línea, formato: Instagram https://...",
  "edicionesAnteriores":"una por línea, con datos concretos si los hay",
  "fuentes":["url", "url"]
}]}`;

  const datos = await preguntarleAClaude(prompt, 16000);
  const eventos = (datos.eventos || []).filter((e) => e && e.nombre);

  const nuevos = eventos.filter(
    (e) => !conocidos.has(normalizar(e.nombre)) && !conocidosSinAnio.has(sinAnio(e.nombre))
  );
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
  // Todo lo que venga de la IA pasa por el filtro antes de guardarse.
  for (const k of Object.keys(e)) {
    if (typeof e[k] === "string") e[k] = sinCitas(e[k]);
  }
  const f = {
    Nombre: e.nombre,
    Slug: slug(e.nombre),
    Estado: "Borrador IA",
    Origen: "Carga IA",
    "Última verificación": hoy,
  };
  if (TIPOS.includes(e.tipo)) f["Tipo"] = e.tipo;
  // El modelo a veces manda un texto suelto en vez de una lista cuando el
  // evento entra en una sola categoría. Sin esto, .filter no existe, aCampos
  // explota antes del primer POST y se pierden los diez eventos de la tanda
  // —con la Action igual en verde, porque el error lo traga el try/catch.
  const crudoInteres = Array.isArray(e.interes)
    ? e.interes
    : e.interes
      ? [e.interes]
      : [];
  const interes = crudoInteres.filter((i) => INTERESES.includes(i));
  if (interes.length) f["Interés MyE"] = interes;
  if (e.organizador) f["Organizador"] = e.organizador;
  if (e.edicion) f["Edición/Frecuencia"] = e.edicion;
  if (esFecha(e.fechaInicio)) f["Fecha inicio"] = e.fechaInicio;
  const finNuevo = fechaFinValida(e.fechaFin, e.fechaInicio);
  if (finNuevo) f["Fecha fin"] = finNuevo;
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
  const prov = normalizarProvincia(e.provincia, e.ciudad, e.pais);
  if (prov) f["Provincia/Región"] = prov;
  // Si el dato original decía algo más (sedes rotativas, aclaraciones), no se
  // pierde: queda anotado adentro.
  if (e.provincia && prov !== e.provincia) {
    f["Notas internas"] = `Provincia según la fuente: ${e.provincia}`;
  }
  if (e.ciudad) f["Ciudad"] = e.ciudad;
  if (e.venue) f["Venue"] = e.venue;
  if (e.descCorta) f["Descripción corta"] = e.descCorta;
  if (e.descLarga) f["Descripción larga"] = e.descLarga;
  if (e.web) f["Web oficial"] = e.web;
  if (e.contactos) f["Contactos"] = e.contactos;
  if (e.redes) f["Redes"] = e.redes;
  if (e.edicionesAnteriores) f["Ediciones anteriores"] = e.edicionesAnteriores;
  if (e.fuentes?.length) f["Fuentes"] = e.fuentes.map(sinCitas).join("\n");
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
  const linea = [rango, f["Ciudad"], sinCitas(d.comoResulto)].filter(Boolean).join(" · ");
  if (rango && !historia.includes(f["Fecha inicio"])) {
    campos["Ediciones anteriores"] = historia ? `${historia}\n${linea}` : linea;
  }

  if (d.hayProxima && esFecha(d.fechaInicio) && d.fechaInicio > hoy) {
    campos["Fecha inicio"] = d.fechaInicio;
    campos["Fecha fin"] = fechaFinValida(d.fechaFin, d.fechaInicio);
    campos["Estado de fechas"] = d.estadoFechas === "Confirmadas" ? "Confirmadas" : "Estimadas";
    apagarSello(f, campos);
    campos["Hallazgos IA"] = `[${hoy}] Próxima edición: ${d.fechaInicio}. ${sinCitas(d.resumen || "")}${d.fuente ? `\nFuente: ${sinCitas(d.fuente)}` : ""}`;
    console.log(`  ${f["Nombre"]}: próxima edición → ${d.fechaInicio}`);
  } else {
    // Sin anuncio: se limpian las fechas para que no siga figurando como pasado.
    campos["Fecha inicio"] = null;
    campos["Fecha fin"] = null;
    campos["Estado de fechas"] = "Por anunciar";
    // Dos casos distintos, y antes los dos decían lo mismo. Si el modelo avisa
    // que hay próxima edición pero la fecha no se puede usar —"2027-03" sin
    // día, o un mes de un solo dígito—, afirmar que "no anunciaron la próxima"
    // contradice al resumen que va dos renglones más abajo.
    const anunciadaSinFecha = d.hayProxima && !esFecha(d.fechaInicio);
    const cabecera = anunciadaSinFecha
      ? `La edición ${rango} ya se hizo. Anunciaron la próxima pero sin una fecha que se pueda cargar: hay que ponerla a mano.`
      : `La edición ${rango} ya se hizo y todavía no anunciaron la próxima. Queda a la espera.`;
    campos["Hallazgos IA"] = `[${hoy}] ${cabecera}${d.resumen ? `\n${sinCitas(d.resumen)}` : ""}${d.fuente ? `\nFuente: ${sinCitas(d.fuente)}` : ""}`;
    console.log(
      `  ${f["Nombre"]}: ${anunciadaSinFecha ? "próxima anunciada sin fecha usable" : "edición pasada archivada, sin próxima fecha"}`
    );
  }

  await escribir("PATCH", [{ id: r.id, fields: campos }]);
}

async function verificarVigente(r) {
  const f = r.fields;
  const prompt = `Verificá contra las fuentes oficiales si cambió algo de este evento
de la agenda de Mate y Eventos. Hoy es ${hoy}. Buscá en la web el sitio oficial
y las comunicaciones de la organización.

La agenda publica lo que TODAVÍA NO PASÓ. Si lo único que encontrás son las
fechas de una edición que ya se hizo, eso NO es una confirmación: contalo en el
resumen, pero devolvé las fechas vacías.

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
- Solo devolvé fechas POSTERIORES a ${hoy}. Una fecha ya pasada va en el resumen,
  nunca en el campo de fechas.
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
    campos["Hallazgos IA"] = `[${hoy}] ${sinCitas(d.resumen)}${d.fuente ? `\nFuente: ${sinCitas(d.fuente)}` : ""}`;
    campos["Revisar"] = true;

    // Completar fechas solo cuando antes NO estaban firmes. Si ya figuraban
    // como confirmadas, no se tocan: queda el aviso y decide Pablo.
    const eranFirmes = f["Estado de fechas"] === "Confirmadas";

    // La fecha tiene que ser futura. reciclarEdicion() ya lo exigía y a esta
    // rama le faltaba: preguntándole "¿se confirmaron las fechas?" sin decirle
    // qué día es hoy, el modelo contestaba con la edición que YA SE HIZO y la
    // dábamos por confirmada. El evento se llenaba de una fecha pasada, salía
    // de la agenda sin que nadie se enterara, y como quedaba en "Confirmadas"
    // esta misma función no lo volvía a mirar. El 24/8/2026 pasó con cinco
    // eventos en una sola corrida.
    const esFutura = esFecha(d.fechaInicio) && d.fechaInicio >= hoy;

    if (!eranFirmes && esFutura && d.estadoFechas === "Confirmadas") {
      campos["Fecha inicio"] = d.fechaInicio;
      campos["Fecha fin"] = fechaFinValida(d.fechaFin, d.fechaInicio);
      campos["Estado de fechas"] = "Confirmadas";
      apagarSello(f, campos);
      console.log(`  ${f["Nombre"]}: fechas confirmadas → ${d.fechaInicio}`);
    } else if (esFecha(d.fechaInicio) && !esFutura) {
      // Se avisa aparte para que en el log se vea que el modelo trajo una
      // edición vieja, y no quede como un "hallazgo" cualquiera.
      console.log(`  ${f["Nombre"]}: descartada fecha pasada (${d.fechaInicio}), queda para revisar`);
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

// El nombre sin el año, para reconocer que "Expo Eventos 2027" es la misma
// ficha que ya está cargada como "Expo Eventos 2026".
function sinAnio(nombre) {
  return normalizar(String(nombre || "").replace(/\b(19|20)\d{2}\b/g, " "));
}

function esFecha(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

// La fecha de cierre que se puede guardar junto a una de inicio dada.
//
// Devuelve null —o sea, BORRA la que hubiera— en vez de dejar la vieja. Si se
// escribe una fecha de inicio nueva y la de fin se deja como estaba, el evento
// queda terminando antes de empezar: la web lo lista como "17 al 12 de sep",
// el .ics sale con el cierre antes de la apertura (los calendarios lo tiran) y
// yaPaso() —que mira la fecha fin primero— lo saca de la agenda el día del
// cierre viejo, o sea ANTES de que el evento ocurra.
//
// Y se descarta la que venga anterior al inicio: al modelo se le escapa el año
// de la edición pasada en el cierre ("inicio 2027-03-12, fin 2026-03-14"), y
// con eso el evento se hace invisible aunque falte un año.
// El sello "Verificado" dice que los datos los confirmó el organizador. Si el
// robot cambia las fechas por su cuenta, deja de ser cierto: la ficha seguiría
// mostrando "datos verificados por el organizador" y el schema seguiría
// emitiendo lastReviewed sobre un dato que salió de una búsqueda web. Se apaga
// y queda Revisar en true, que es lo que corresponde: lo vuelve a encender
// Pablo cuando el organizador confirme de nuevo.
function apagarSello(f, campos) {
  if (!f["Verificado por el organizador"]) return;
  campos["Verificado por el organizador"] = false;
  campos["Fecha de verificación"] = null;
}

function fechaFinValida(fin, inicio) {
  if (!esFecha(fin) || !esFecha(inicio)) return null;
  return fin >= inicio ? fin : null;
}
