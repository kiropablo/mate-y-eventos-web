// Busca el mail de contacto de cada evento en el sitio oficial del evento.
//
// Qué hace exactamente: entra a la web que ya está cargada en la ficha, mira
// la home y las páginas de contacto habituales, y se queda con la dirección
// que el propio organizador publica para que le escriban. Es lo mismo que
// haría una persona abriendo el sitio, pero sobre 243 eventos.
//
// Lo que NO hace, a propósito:
//   · no compra bases de datos ni usa servicios de "enriquecimiento"
//   · no adivina direcciones armándolas con el nombre de alguien
//   · no busca mails de personas: se queda con los buzones institucionales
//     (contacto@, info@, prensa@) y descarta lo que parezca personal salvo
//     que no haya ninguna otra cosa, y en ese caso lo marca aparte
//
// Por defecto NO escribe nada: deja un informe para revisar. Con --escribir
// guarda en Airtable, y solo en fichas que hoy no tienen mail.
//
//   node scripts/buscar-contactos.mjs               → informe
//   node scripts/buscar-contactos.mjs --escribir    → informe + guarda
//   node scripts/buscar-contactos.mjs --limite 20   → prueba con pocos
//
// Con --desde archivo.json toma la lista de ahí en vez de Airtable, para poder
// probarlo sin la clave. El archivo es una lista de {id, nombre, web}.

import fs from "node:fs";
import path from "node:path";

const AIRTABLE_KEY = process.env.AIRTABLE_API_KEY;
const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";
const API = `https://api.airtable.com/v0/${BASE}/${TABLA}`;

const ESCRIBIR = process.argv.includes("--escribir");
const DESDE = (process.argv[process.argv.indexOf("--desde") + 1] || "").startsWith("-")
  ? ""
  : process.argv.includes("--desde")
    ? process.argv[process.argv.indexOf("--desde") + 1]
    : "";
const LIMITE = Number(
  (process.argv.find((a) => a.startsWith("--limite=")) || "").split("=")[1] ||
    (process.argv[process.argv.indexOf("--limite") + 1] ?? 0)
) || 0;

// Nos presentamos. Un sitio que quiera bloquearnos tiene que poder hacerlo, y
// el que quiera saber quién le entró tiene adónde escribir.
const AGENTE =
  "MateYEventosBot/1.0 (+https://www.mateyeventos.com/agenda; agenda de eventos)";

// Las páginas donde un sitio pone su contacto. Se prueban en este orden y se
// corta apenas aparece algo bueno: no hace falta recorrer el sitio entero.
const RUTAS = [
  "/contacto",
  "/contact",
  "/contato",       // los eventos de Brasil son un rubro entero de la agenda
  "/fale-conosco",
  "/contactanos",
  "/contactenos",
  "/institucional",
  "/quienes-somos",
  "/nosotros",
  "/prensa",
];

// Cómo se llama un link de contacto. Se usa para seguir los que el sitio ya
// tiene en su menú en vez de adivinar direcciones: es más certero y son menos
// pedidos, porque no se piden páginas que no existen.
const ES_CONTACTO = /contact|contato|conosco|prensa|press|institucional|nosotros|quienes/i;

const MAX_PAGINAS = 6;
const ESPERA_MS = 600;
const TIMEOUT_MS = 12000;
const MAX_BYTES = 900_000;

// Buzones institucionales: son los que queremos.
const BUENOS = [
  "contacto", "contact", "info", "informacion", "hola", "consultas",
  "prensa", "press", "comunicacion", "comercial", "ventas", "administracion",
  "expositores", "sponsors", "marketing", "eventos", "atencion", "mail",
  "secretaria", "produccion", "organizacion",
];

// Buzones que existen en el dominio pero NO son para esto. Escribirle a
// compliance@ —el canal de denuncias éticas— para preguntar por las fechas de
// una feria es peor que no escribir. La primera corrida eligió justo ese para
// Messe Frankfurt, busquedas@ (empleo) para el Automóvil Club y competitors@
// (los corredores) para el Desafío Ruta 40.
const PROHIBIDOS = [
  "compliance", "legal", "denuncias", "etica", "ethics", "whistle",
  "busquedas", "empleo", "rrhh", "recursoshumanos", "jobs", "cv", "trabaja",
  "postulaciones", "reclutamiento", "seleccion",
  "competitors", "competidores", "inscripciones", "inscripcion", "socios",
  "cobranzas", "facturacion", "pagos", "finanzas", "tesoreria",
  "soporte", "support", "webmaster", "hosting", "abuse", "dpo", "privacidad",
  "unsubscribe", "bajas", "spam", "postmaster",
];

// Casillas gratuitas: sirven para mirar, no para que un robot las guarde solo.
const GRATUITO = /@(gmail|hotmail|yahoo|outlook|live|icloud|proton)\./i;

// Basura que aparece en el HTML y no es un contacto de nadie.
const BASURA =
  /(^|@)(example|ejemplo|test|noreply|no-reply|donotreply|sentry|wixpress|godaddy|localhost|domain|email|tu-?mail|yourmail|nombre)\b/i;
const ARCHIVO = /\.(png|jpe?g|gif|webp|svg|css|js|woff2?|ttf|ico|pdf|mp4)$/i;

const RE_MAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}/g;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function bajar(url) {
  const corte = AbortSignal.timeout(TIMEOUT_MS);
  const res = await fetch(url, {
    headers: {
      "user-agent": AGENTE,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "es-AR,es;q=0.9",
    },
    redirect: "follow",
    signal: corte,
  });
  if (!res.ok) return null;
  const tipo = res.headers.get("content-type") || "";
  if (!tipo.includes("html")) return null;
  const texto = await res.text();
  return texto.slice(0, MAX_BYTES);
}

// Las direcciones que aparecen en una página, limpias.
function mailsDe(html, dominio) {
  const vistos = new Map();

  const sumar = (crudo, deMailto) => {
    let m = String(crudo || "").trim().toLowerCase();
    // A veces el HTML trae la entidad, o el mailto viene con parámetros.
    m = m.replace(/^mailto:/, "").split("?")[0].replace(/&#64;|%40/gi, "@");
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,24}$/.test(m)) return;
    if (BASURA.test(m) || ARCHIVO.test(m)) return;
    // "logo@2x.png" y compañía ya cayeron arriba; esto saca los sufijos
    // de imágenes retina que igual se cuelan.
    if (/@\d+x$/.test(m.split(".")[0])) return;
    const previo = vistos.get(m);
    if (!previo || (deMailto && !previo.deMailto)) {
      vistos.set(m, { mail: m, deMailto: Boolean(deMailto) });
    }
  };

  for (const m of html.matchAll(/mailto:([^"'>\s?]+)/gi)) sumar(m[1], true);
  for (const m of html.match(RE_MAIL) || []) sumar(m, false);

  return [...vistos.values()].map((v) => ({ ...v, ...puntuar(v, dominio) }));
}

// Qué tan buena es una dirección como contacto del evento.
function puntuar({ mail, deMailto }, dominio) {
  const [buzon, host] = mail.split("@");
  const raiz = (d) => String(d || "").replace(/^www\./, "").toLowerCase();
  const mismoDominio =
    raiz(host) === raiz(dominio) ||
    raiz(host).endsWith("." + raiz(dominio)) ||
    raiz(dominio).endsWith("." + raiz(host));

  const prohibido = PROHIBIDOS.some(
    (b) => buzon === b || buzon.startsWith(b) || buzon.endsWith(b)
  );
  const institucional =
    !prohibido &&
    BUENOS.some(
      (b) => buzon === b || buzon.startsWith(b + ".") || buzon.startsWith(b + "-")
    );
  // Un buzón con nombre y apellido es de una persona. Sirve, pero es la
  // última opción: preferimos escribirle a la organización.
  const personal = !institucional && /^[a-z]+([._-][a-z]+)+$/.test(buzon);

  const gratuito = GRATUITO.test(mail);

  let puntos = 0;
  if (institucional) puntos += 12;
  if (mismoDominio) puntos += 8;
  if (deMailto) puntos += 3;
  if (personal) puntos -= 6;
  if (gratuito) puntos -= 5;
  if (prohibido) puntos -= 30;

  // Lo único que se puede guardar sin que lo mire nadie: un buzón
  // institucional, del dominio del propio sitio y que no sea gratuito. Todo
  // lo demás va al informe. Es el mismo criterio que en la agenda: mejor
  // pocos y buenos que muchos y a medias.
  const confiable = institucional && mismoDominio && !gratuito && !prohibido;

  return { puntos, institucional, personal, mismoDominio, prohibido, gratuito, confiable };
}

// Todas las direcciones que publica un sitio, mirando pocas páginas.
async function contactosDe(web) {
  let url;
  try {
    url = new URL(web.startsWith("http") ? web : `https://${web}`);
  } catch {
    return { error: "la dirección web no se entiende" };
  }
  const dominio = url.hostname;
  const encontrados = new Map();
  const vistas = new Set();
  let paginas = 0;
  let ultimoError = null;

  // Se arranca siempre por la home, y de ahí salen las páginas que el propio
  // sitio llama "contacto". Las rutas adivinadas quedan de respaldo, para
  // cuando el menú está armado con JavaScript y no viene en el HTML.
  const cola = [url.href];

  const mirar = async (destino) => {
    if (vistas.has(destino) || paginas >= MAX_PAGINAS) return null;
    vistas.add(destino);
    try {
      const html = await bajar(destino);
      paginas++;
      await esperar(ESPERA_MS);
      if (!html) return null;
      for (const c of mailsDe(html, dominio)) {
        if (!encontrados.has(c.mail)) encontrados.set(c.mail, c);
      }
      return html;
    } catch (e) {
      ultimoError = e.name === "TimeoutError" ? "tardó demasiado" : e.message;
      await esperar(ESPERA_MS);
      return null;
    }
  };

  const yaEstaBien = () =>
    [...encontrados.values()].some((c) => c.confiable);

  const home = await mirar(cola[0]);
  if (home) {
    for (const m of home.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)</gi)) {
      if (!ES_CONTACTO.test(m[1]) && !ES_CONTACTO.test(m[2])) continue;
      try {
        const abs = new URL(m[1], url.href);
        // Solo dentro del mismo sitio: un link a la agencia que lo hizo no.
        if (abs.hostname !== url.hostname) continue;
        cola.push(abs.href);
      } catch {}
    }
  } else if (ultimoError) {
    // Si la home no contesta, el resto del sitio tampoco.
    return { dominio, lista: [], error: ultimoError };
  }

  for (const destino of cola.slice(1)) {
    if (yaEstaBien() || paginas >= MAX_PAGINAS) break;
    await mirar(destino);
  }
  for (const ruta of RUTAS) {
    if (yaEstaBien() || paginas >= MAX_PAGINAS) break;
    await mirar(new URL(ruta, url.origin).href);
  }

  const lista = [...encontrados.values()].sort((a, b) => b.puntos - a.puntos);
  return { dominio, lista, error: lista.length ? null : ultimoError };
}

async function traerSinMail() {
  const RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
  const todos = [];
  let offset = "";
  do {
    const u = new URL(API);
    u.searchParams.set("pageSize", "100");
    if (offset) u.searchParams.set("offset", offset);
    const res = await fetch(u, {
      headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const d = await res.json();
    todos.push(...d.records);
    offset = d.offset || "";
  } while (offset);

  return todos
    .filter((r) => r.fields["Estado"] === "Aprobado")
    .filter(
      (r) =>
        !String(r.fields["Email del organizador"] || "").trim() &&
        !RE.test(String(r.fields["Contactos"] || ""))
    )
    .filter((r) => String(r.fields["Web oficial"] || "").trim())
    .map((r) => ({
      id: r.id,
      nombre: r.fields["Nombre"],
      organizador: r.fields["Organizador"] || "",
      web: String(r.fields["Web oficial"]).trim(),
      fecha: r.fields["Fecha inicio"] || "",
      // Se trae para poder AGREGAR abajo y no pisar lo que ya diga: ahí
      // escriben también el robot de la agenda y el archivado de duplicados.
      notas: String(r.fields["Notas internas"] || ""),
    }));
}

async function guardar(filas) {
  for (let i = 0; i < filas.length; i += 10) {
    const lote = filas.slice(i, i + 10);
    const res = await fetch(API, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: lote, typecast: true }),
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    await esperar(250);
  }
}

async function main() {
  if (!AIRTABLE_KEY && !DESDE) {
    console.error("Falta AIRTABLE_API_KEY (o pasá --desde archivo.json).");
    process.exit(1);
  }
  if (ESCRIBIR && !AIRTABLE_KEY) {
    console.error("Para escribir hace falta AIRTABLE_API_KEY.");
    process.exit(1);
  }

  let pendientes = DESDE
    ? JSON.parse(fs.readFileSync(DESDE, "utf8"))
    : await traerSinMail();
  console.log(`${pendientes.length} eventos aprobados sin mail y con web cargada.`);
  if (LIMITE) pendientes = pendientes.slice(0, LIMITE);

  // Varios eventos comparten organizador y sitio (cinco son del mismo
  // autódromo). Se entra una sola vez por dominio y se reparte el resultado.
  const porDominio = new Map();
  for (const p of pendientes) {
    let clave;
    try {
      clave = new URL(p.web.startsWith("http") ? p.web : `https://${p.web}`)
        .hostname.replace(/^www\./, "");
    } catch {
      clave = p.web;
    }
    if (!porDominio.has(clave)) porDominio.set(clave, []);
    porDominio.get(clave).push(p);
  }
  console.log(`${porDominio.size} sitios distintos para visitar.\n`);

  const resultados = [];
  let hechos = 0;
  for (const [dominio, eventos] of porDominio) {
    hechos++;
    const r = await contactosDe(eventos[0].web);
    const mejor = r.lista?.[0] || null;
    const etiqueta = `[${hechos}/${porDominio.size}] ${dominio}`;
    if (mejor) {
      const sello = mejor.institucional ? "" : mejor.personal ? " (personal)" : "";
      console.log(`  ${etiqueta} → ${mejor.mail}${sello}`);
    } else {
      console.log(`  ${etiqueta} → nada${r.error ? ` (${r.error})` : ""}`);
    }
    for (const ev of eventos) {
      resultados.push({
        ...ev,
        dominio,
        mail: mejor?.mail || "",
        institucional: mejor?.institucional || false,
        personal: mejor?.personal || false,
        mismoDominio: mejor?.mismoDominio || false,
        confiable: mejor?.confiable || false,
        notas: ev.notas || "",
        alternativos: (r.lista || []).slice(1, 4).map((c) => c.mail),
        error: r.error || "",
      });
    }
  }

  const dir = path.join(process.cwd(), "datos-contactos");
  fs.mkdirSync(dir, { recursive: true });
  const salida = path.join(dir, "encontrados.json");
  fs.writeFileSync(salida, JSON.stringify(resultados, null, 2), "utf8");

  // Y una planilla, que es lo que se mira de verdad. Ordenada por fecha del
  // evento: los que arrancan antes son a los que hay que escribirles ya.
  const celda = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const orden = { guardar: 0, revisar: 1, "sin datos": 2 };
  const filas = [...resultados]
    .map((r) => ({
      ...r,
      estado: !r.mail ? "sin datos" : r.confiable ? "guardar" : "revisar",
      motivo: !r.mail
        ? r.error || "no publica el mail en el sitio"
        : r.confiable
          ? ""
          : [
              r.personal && "parece de una persona",
              r.gratuito && "casilla gratuita",
              !r.mismoDominio && "de otro dominio",
              r.prohibido && "buzón que no es para esto",
            ]
              .filter(Boolean)
              .join(" · ") || "no es un buzón institucional",
    }))
    .sort(
      (a, b) =>
        orden[a.estado] - orden[b.estado] ||
        String(a.fecha).localeCompare(String(b.fecha))
    );

  const csv = [
    ["Estado", "Motivo", "Evento", "Fecha", "Organizador", "Mail encontrado", "Otros mails", "Sitio"]
      .map(celda)
      .join(","),
    ...filas.map((r) =>
      [
        r.estado, r.motivo, r.nombre, r.fecha, r.organizador,
        r.mail, (r.alternativos || []).join(" "), r.web,
      ].map(celda).join(",")
    ),
  ].join("\n");
  const planilla = path.join(dir, "contactos.csv");
  // Con BOM para que Excel no rompa los acentos.
  fs.writeFileSync(planilla, "\uFEFF" + csv, "utf8");

  const con = resultados.filter((r) => r.mail);
  const inst = con.filter((r) => r.confiable);
  console.log(`\n${con.length} de ${resultados.length} eventos con mail encontrado.`);
  console.log(`  para guardar solos (institucional, del propio dominio): ${inst.length}`);
  console.log(`  para que los mires vos (personales, de otro dominio, gratuitos): ${con.length - inst.length}`);
  console.log(`Informe: ${salida}`);
  console.log(`Planilla: ${planilla}`);

  if (!ESCRIBIR) {
    console.log("\nNo se escribió nada. Repasá el informe y volvé a correrlo con --escribir.");
    return;
  }

  // Solo los institucionales se guardan solos. Los que parecen de una
  // persona quedan en el informe para que los mire Pablo: escribirle al mail
  // personal de alguien sin querer es exactamente lo que no queremos.
  const hoy = new Date().toISOString().slice(0, 10);
  const aGuardar = con
    .filter((r) => r.confiable)
    .map((r) => {
      const linea = `[${hoy}] Mail tomado de ${r.dominio}. Sin confirmar con el organizador.`;
      return {
        id: r.id,
        fields: {
          "Email del organizador": r.mail,
          // Se agrega abajo, no se pisa: el campo ya puede traer la nota de
          // provincia que escribe el robot de la agenda, o la de un duplicado
          // archivado. Mandar solo la línea nueva las borraba.
          "Notas internas": r.notas ? `${r.notas}\n${linea}` : linea,
        },
      };
    });
  await guardar(aGuardar);
  console.log(`\nGuardados ${aGuardar.length} mails en Airtable.`);
  console.log(`Quedaron ${con.length - aGuardar.length} para revisar a mano en el informe.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
