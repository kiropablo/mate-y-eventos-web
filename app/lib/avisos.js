// "Avisame cuando confirmen la fecha".
//
// De los 338 eventos aprobados, 110 no tienen fecha anunciada. Alguien busca
// "fiesta de la chaya 2027", cae en la ficha, lee "fechas por anunciar" y no
// tiene NADA que hacer: se va y no vuelve. Y es la persona con la intención
// más clara de todo el sitio, porque vino a preguntar exactamente eso.
//
// Esto no es un formulario de suscripción disfrazado: es una promesa puntual
// sobre un evento. Un correo, una vez, cuando la fecha exista. No entra a la
// lista del newsletter, no se le escribe por otra cosa, y cuando se cumple
// queda marcado para no volver a escribirle nunca.

const BASE = "app6q7METE3ofZz1S";
const TABLA_AVISOS = "tbluXdijw3flLOYjA";

const API = `https://api.airtable.com/v0/${BASE}/${TABLA_AVISOS}`;

function clave() {
  return process.env.AIRTABLE_API_KEY;
}

// Los que están esperando: sin fecha en "Avisado el".
//
// Se traen todos porque son pocos y hay que cruzarlos con la agenda igual. Si
// algún día son miles, esto pide un filtro del lado de Airtable.
export async function avisosPendientes() {
  const key = clave();
  if (!key) return [];

  const salida = [];
  let offset = "";
  try {
    do {
      const params = new URLSearchParams({
        pageSize: "100",
        filterByFormula: "{Avisado el} = BLANK()",
      });
      if (offset) params.set("offset", offset);
      const res = await fetch(`${API}?${params}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn(`[avisos] Airtable respondió ${res.status} al leer`);
        return salida;
      }
      const d = await res.json();
      for (const r of d.records || []) {
        salida.push({
          id: r.id,
          email: (r.fields["Email"] || "").trim(),
          evento: (r.fields["Evento"] || "").trim(),
          nombre: (r.fields["Nombre del evento"] || "").trim(),
        });
      }
      offset = d.offset || "";
    } while (offset);
  } catch (e) {
    console.warn(`[avisos] no se pudieron leer: ${e.message}`);
  }
  return salida;
}

// ¿Esta persona ya pidió que le avisen de este evento?
//
// Sin esto, recargar la página y volver a mandar el formulario deja dos filas
// y termina en dos correos idénticos. Se compara en minúsculas porque el mismo
// mail escrito con mayúscula es el mismo mail.
export async function yaPidio(idEvento, email) {
  const key = clave();
  if (!key) return false;
  const e = String(email || "").trim().toLowerCase().replace(/'/g, "\\'");
  const ev = String(idEvento || "").replace(/'/g, "\\'");
  if (!e || !ev) return false;
  try {
    const params = new URLSearchParams({
      pageSize: "1",
      filterByFormula: `AND(LOWER({Email}) = '${e}', {Evento} = '${ev}')`,
    });
    const res = await fetch(`${API}?${params}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    return ((await res.json()).records || []).length > 0;
  } catch {
    return false;
  }
}

export async function anotarAviso({ idEvento, nombreEvento, email }) {
  const key = clave();
  if (!key) return { ok: false, motivo: "sin-clave" };
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Email: email,
              Evento: idEvento,
              "Nombre del evento": nombreEvento,
              "Pedido el": hoy,
            },
          },
        ],
        typecast: true,
      }),
    });
    if (!res.ok) {
      console.warn(`[avisos] Airtable ${res.status} al anotar: ${(await res.text()).slice(0, 160)}`);
      return { ok: false, motivo: `airtable-${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.warn(`[avisos] no se pudo anotar: ${e.message}`);
    return { ok: false, motivo: e.message };
  }
}

// Se marca DESPUÉS de que el correo salió, nunca antes.
//
// Si se marcara primero y el envío fallara, la persona quedaría marcada como
// avisada sin haber recibido nada, y no hay forma de darse cuenta después.
// Al revés el riesgo es un correo repetido, que es molesto pero no rompe la
// promesa.
export async function marcarAvisados(ids) {
  const key = clave();
  if (!key || !ids?.length) return 0;
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  let hechos = 0;
  // Airtable acepta 10 por PATCH.
  for (let i = 0; i < ids.length; i += 10) {
    const tanda = ids.slice(i, i + 10);
    try {
      const res = await fetch(API, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: tanda.map((id) => ({ id, fields: { "Avisado el": hoy } })),
        }),
      });
      if (res.ok) hechos += tanda.length;
      else console.warn(`[avisos] Airtable ${res.status} al marcar`);
    } catch (e) {
      console.warn(`[avisos] no se pudo marcar: ${e.message}`);
    }
  }
  return hechos;
}
