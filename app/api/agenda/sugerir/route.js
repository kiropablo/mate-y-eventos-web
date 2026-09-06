// Recibe sugerencias del formulario público y crea un registro
// en Airtable como "Borrador IA" + Origen "Sugerido web".
// Nunca se publica nada sin aprobación manual.

import { PAISES, TIPOS } from "../../../lib/ficha-editable";

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";

// Tope de sugerencias por día para TODO el sitio.
//
// Es la única ruta pública que CREA registros, y no tenía ningún freno: el
// mismo pedido en un bucle llenaba la agenda de basura. El tope es global y no
// por IP porque rotar IPs es gratis y rotar el día no.
//
// Honestidad sobre lo que esto vale: el contador vive en la memoria del
// proceso, y en Vercel cada instancia tiene la suya. Frena al bot de una sola
// conexión, no al decidido. El freno de verdad, si algún día hace falta, es una
// regla del firewall de Vercel sobre esta ruta.
const TOPE_POR_DIA = 40;
let cuenta = { dia: "", n: 0 };

function pasaElTope() {
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  if (cuenta.dia !== hoy) cuenta = { dia: hoy, n: 0 };
  cuenta.n += 1;
  return cuenta.n <= TOPE_POR_DIA;
}

export async function POST(req) {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) {
    return Response.json({ error: "Sin configurar" }, { status: 500 });
  }

  let datos;
  try {
    datos = await req.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  // Honeypot: si un bot llenó el campo oculto, respondemos ok y descartamos.
  if (datos.tel) {
    return Response.json({ ok: true });
  }

  const nombrePersona = limpiar(datos.nombrePersona, 120);
  const email = limpiar(datos.email, 160);
  const nombreEvento = limpiar(datos.nombreEvento, 200);

  if (!nombrePersona || !nombreEvento || !/.+@.+\..+/.test(email)) {
    return Response.json({ error: "Faltan datos" }, { status: 400 });
  }

  // El tope se cuenta DESPUÉS de validar: un pedido mal armado no le tiene que
  // gastar el cupo del día a una persona que sí quiere sugerir algo.
  if (!pasaElTope()) {
    console.warn(`[sugerir] tope diario alcanzado (${TOPE_POR_DIA})`);
    return Response.json(
      { error: "Recibimos muchas sugerencias hoy. Probá mañana o escribinos." },
      { status: 429 }
    );
  }

  const fields = {
    Nombre: nombreEvento,
    Estado: "Borrador IA",
    Origen: "Sugerido web",
    "Sugerido por": nombrePersona,
    "Email sugerencia": email,
    "Notas internas": `Sugerido desde la web el ${new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}.`,
  };

  // Tipo y País se validan contra las listas, igual que en el panel
  // (app/api/admin/ficha/route.js). NO es una formalidad: esta ruta escribe con
  // typecast, y con typecast Airtable no rechaza un valor que no está en el
  // desplegable — lo CREA, para siempre. Borrar después el registro basura no
  // saca la opción: hay que ir a la base a sacarla a mano.
  //
  // Si el valor no está en la lista simplemente no se escribe ese campo. La
  // sugerencia entra igual: es un borrador que alguien va a revisar, y el
  // dato lo completa quien lo apruebe.
  const tipo = limpiar(datos.tipo, 60);
  if (tipo && TIPOS.includes(tipo)) fields["Tipo"] = tipo;
  const pais = limpiar(datos.pais, 60);
  if (pais && PAISES.includes(pais)) fields["País"] = pais;
  // Provincia/Región queda como texto libre a propósito: en la base también lo
  // es, y en LATAM las divisiones no entran en una lista cerrada.
  const provincia = limpiar(datos.provincia, 120);
  if (provincia) fields["Provincia/Región"] = provincia;
  const ciudad = limpiar(datos.ciudad, 120);
  if (ciudad) fields["Ciudad"] = ciudad;
  const desc = limpiar(datos.descripcion, 2000);
  if (desc) fields["Descripción corta"] = desc;
  const web = limpiar(datos.web, 500);
  if (web) fields["Web oficial"] = web;
  const contacto = limpiar(datos.contacto, 500);
  if (contacto) fields["Contactos"] = contacto;
  if (esFecha(datos.fechaInicio)) fields["Fecha inicio"] = datos.fechaInicio;
  if (esFecha(datos.fechaFin)) fields["Fecha fin"] = datos.fechaFin;

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/${TABLA}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    }
  );

  if (!res.ok) {
    return Response.json({ error: "No se pudo guardar" }, { status: 502 });
  }
  return Response.json({ ok: true });
}

function limpiar(v, max) {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

function esFecha(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
