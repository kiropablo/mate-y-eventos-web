// Recibe sugerencias del formulario público y crea un registro
// en Airtable como "Borrador IA" + Origen "Sugerido web".
// Nunca se publica nada sin aprobación manual.

const BASE = "app6q7METE3ofZz1S";
const TABLA = "tblaLHf2VSyyyeN2s";

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

  const fields = {
    Nombre: nombreEvento,
    Estado: "Borrador IA",
    Origen: "Sugerido web",
    "Sugerido por": nombrePersona,
    "Email sugerencia": email,
    "Notas internas": `Sugerido desde la web el ${new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}.`,
  };

  const tipo = limpiar(datos.tipo, 60);
  if (tipo) fields["Tipo"] = tipo;
  const pais = limpiar(datos.pais, 60);
  if (pais) fields["País"] = pais;
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
