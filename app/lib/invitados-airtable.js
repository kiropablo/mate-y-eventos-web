// Lo privado de cada invitado: su contacto, sus respuestas del formulario y en
// qué punto está el circuito de validación.
//
// Vive en Airtable —base "Invitados MyE"— y no en el repositorio, a propósito:
// el repositorio es PÚBLICO y acá hay mail, teléfono y lo que la persona
// escribió antes de grabar. La ficha pública, que sí va al repo, es otra cosa.
//
// El vínculo entre las dos mitades es el campo "Ficha" de Airtable, que guarda
// el slug del archivo de content/invitados/. Si está vacío se cae al nombre,
// que es lo que pasa con los 16 registros que entraron por el formulario viejo
// y nunca supieron de ninguna ficha.

import { PREGUNTAS } from "./formulario-invitados";

const BASE = "appvziqRHGN0jtS19";
const TABLA = "tblHdZr5d8yWovqNk";

// El link a la tabla, para poder saltar a Airtable desde el panel cuando haga
// falta ver algo que acá no mostramos.
export const TABLA_URL = `https://airtable.com/${BASE}/${TABLA}`;

const sinAcentos = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function cabeceras(key) {
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function mapear(r) {
  const f = r.fields || {};
  return {
    id: r.id,
    nombre: String(f["Nombre y apellido"] || "").trim(),
    comoNombrar: String(f["Cómo quiere que lo nombremos"] || "").trim(),
    empresa: String(f["Empresa / Cargo"] || "").trim(),
    // PRIVADOS. No los devuelve ninguna página pública: solo el panel.
    email: String(f["Email"] || "").trim(),
    telefono: String(f["Teléfono"] || "").trim(),
    // Públicos: son los que pueden pasar a la ficha.
    web: String(f["Web"] || "").trim(),
    redes: String(f["Redes"] || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
    ficha: String(f["Ficha"] || "").trim(),
    respondioEl: f["Respondió el"] || null,
    // Las diez respuestas del formulario.
    //
    // Antes no se leían: el panel traía el contacto y nada más, así que para
    // leer lo que la persona había escrito antes de grabar —que es justamente
    // para lo que se le manda el formulario— había que entrar a Airtable. Y el
    // mail de aviso decía que se veían en el panel, que no era cierto.
    //
    // Los rótulos salen de PREGUNTAS, la misma lista con la que se arma el
    // formulario: si algún día se cambia una pregunta, acá se cambia sola. Las
    // vacías no entran, para que la ficha de alguien que contestó tres no
    // muestre siete renglones en blanco.
    respuestas: PREGUNTAS.map((p) => ({
      id: p.id,
      pregunta: p.rotulo || p.campo,
      respuesta: String(f[p.campo] || "").trim(),
    })).filter((r) => r.respuesta),
    // El circuito de validación.
    pedidoEl: f["Le pedimos que revise el"] || null,
    validadoEl: f["Respondió la revisión el"] || null,
    revisionPendiente: Boolean(f["Revisión pendiente"]),
    correcciones: String(f["Correcciones del invitado"] || "").trim(),
    yaEntrevistado: Boolean(f["Ya entrevistado"]),
  };
}

// Todos los registros. Se lee fresco siempre: esto lo usa el panel, donde ver
// algo de hace media hora no es "un poco viejo" —es cargar un mail y no verlo.
export async function getInvitadosAirtable() {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) return [];

  const registros = [];
  let offset = "";
  try {
    do {
      const params = new URLSearchParams({ pageSize: "100" });
      if (offset) params.set("offset", offset);
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE}/${TABLA}?${params}`,
        { headers: cabeceras(key), cache: "no-store" }
      );
      if (!res.ok) {
        // Se avisa en los registros del servidor: una lectura que falla en
        // silencio deja el panel sin mails y nadie se entera de por qué.
        console.warn(`[invitados-airtable] Airtable respondió ${res.status}`);
        return registros;
      }
      const data = await res.json();
      (data.records || []).forEach((r) => registros.push(mapear(r)));
      offset = data.offset || "";
    } while (offset);
  } catch (e) {
    console.warn(`[invitados-airtable] no se pudo leer: ${e.message}`);
  }
  return registros;
}

// El registro que le corresponde a una ficha. Primero por el campo "Ficha",
// que es el vínculo explícito; si no, por nombre sin acentos ni mayúsculas.
//
// Ojo con lo que NO hace: no adivina. Si el nombre de la ficha es "Michel" y en
// Airtable está como "Miguel Angel Clavello", acá no matchea, y está bien que
// no matchee. Esa unión la hace una persona desde el panel, que es la única que
// sabe que son la misma.
export function registroDeFicha(registros, ficha) {
  if (!ficha) return null;
  const porFicha = registros.find((r) => r.ficha && r.ficha === ficha.slug);
  if (porFicha) return porFicha;
  const nombre = sinAcentos(ficha.nombre);
  if (!nombre) return null;
  return (
    registros.find(
      (r) =>
        sinAcentos(r.nombre) === nombre || sinAcentos(r.comoNombrar) === nombre
    ) || null
  );
}

// Escribe campos en un registro. Devuelve false en vez de tirar: quien llama
// decide si eso voltea la operación o solo se anota.
export async function guardarEnAirtable(id, fields) {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key || !id) return false;
  try {
    const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLA}`, {
      method: "PATCH",
      headers: cabeceras(key),
      body: JSON.stringify({ records: [{ id, fields }], typecast: true }),
    });
    if (!res.ok) {
      console.warn(`[invitados-airtable] al guardar: ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[invitados-airtable] al guardar: ${e.message}`);
    return false;
  }
}

export { BASE as BASE_INVITADOS, TABLA as TABLA_INVITADOS };
