import { formatRango } from "./agenda";

// Los datos de la ficha que el organizador repasa uno por uno.
//
// Está acá y no dentro de la página porque lo usan tres lugares: la página que
// él ve, la ruta que guarda su respuesta y el panel donde nosotros revisamos.
// Si cada uno armara su propia lista, tarde o temprano dirían cosas distintas.
//
// Los que están vacíos también se muestran: preguntarle "¿cuál es el
// Instagram?" a quien organiza el evento es la forma más barata de completar
// la base, y es un dato que hoy no tenemos.

export const CAMPOS = [
  { clave: "nombre", rotulo: "Nombre del evento", campo: "Nombre" },
  {
    clave: "fechas",
    rotulo: "Fechas",
    campo: "—",
    ayuda: "Día de inicio y de cierre",
  },
  { clave: "venue", rotulo: "Sede", campo: "Venue", ayuda: "El predio o lugar" },
  { clave: "ciudad", rotulo: "Ciudad y provincia", campo: "Ciudad" },
  { clave: "organizador", rotulo: "Quién organiza", campo: "Organizador" },
  { clave: "web", rotulo: "Sitio oficial", campo: "Web oficial" },
  { clave: "redes", rotulo: "Redes", campo: "Redes", ayuda: "Instagram, LinkedIn" },
  { clave: "descripcion", rotulo: "Descripción", campo: "Descripción corta" },
  { clave: "contactos", rotulo: "Contacto", campo: "Contactos", ayuda: "Mail o teléfono público" },
  {
    clave: "logo",
    rotulo: "Logo",
    campo: "Imagen/Logo",
    ayuda: "Pegá el link a la imagen, o mandánosla respondiendo el mail",
    esImagen: true,
  },
];

// El valor publicado de cada campo, en texto plano.
export function valoresDe(ev) {
  const ubicacion = [ev.ciudad, ev.provincia, ev.pais].filter(Boolean).join(", ");
  return {
    nombre: ev.nombre || "",
    fechas: `${formatRango(ev) || "Sin fecha"}${
      ev.estadoFechas && ev.estadoFechas !== "Confirmadas"
        ? ` (publicadas como «${ev.estadoFechas.toLowerCase()}»)`
        : ""
    }`,
    venue: ev.venue || "",
    ciudad: ubicacion,
    organizador: ev.organizador || "",
    web: ev.web || "",
    redes: (ev.redes || []).join("\n"),
    // La misma que se publica en la ficha, no la corta: si el organizador
    // repasara un texto y en la web saliera otro, el sello no diría nada.
    descripcion: ev.descLarga || ev.descCorta || "",
    contactos: (ev.contactos || []).join("\n"),
    // Para el logo el "valor" es la imagen misma: se dibuja, no se lee.
    logo: ev.imagen || "",
  };
}

// Las filas listas para dibujar.
export function filasDe(ev) {
  const valores = valoresDe(ev);
  return CAMPOS.map((c) => ({
    ...c,
    valor: valores[c.clave] || "",
    falta: !valores[c.clave],
  }));
}

// Deja las líneas que siguen alineadas bajo la primera.
function sangrar(texto) {
  return String(texto).split("\n").join("\n          ");
}

// Arma el texto que queda en Airtable con lo que respondió el organizador.
// Se guarda legible y no como datos crudos porque lo lee una persona antes de
// aplicar nada.
export function resumirRespuesta(ev, revisiones, fecha) {
  const valores = valoresDe(ev);
  const bien = [];
  const cambios = [];

  for (const c of CAMPOS) {
    const r = revisiones?.[c.clave];
    if (!r) continue;
    if (r.ok) {
      bien.push(c.rotulo);
    } else if (String(r.correccion || "").trim()) {
      // Del logo no se escribe el valor: es un link larguísimo de Airtable que
      // además vence. Alcanza con decir si había uno cargado.
      const actual = c.esImagen
        ? valores[c.clave]
          ? "(hay un logo cargado)"
          : "(sin logo)"
        : valores[c.clave] || "(vacío)";
      // Redes y Contactos vienen con varias líneas. Sin sangrar las que
      // siguen, la segunda queda pegada al margen y se confunde con una
      // etiqueta del reporte.
      cambios.push(
        `• ${c.rotulo}\n    dice: ${sangrar(actual)}\n    debería decir: ${sangrar(String(r.correccion).trim())}`
      );
    }
  }

  const partes = [`[${fecha}] Respuesta del organizador`];
  if (cambios.length) partes.push("", "A CORREGIR:", ...cambios);
  if (bien.length) partes.push("", `Confirmó que están bien: ${bien.join(", ")}.`);
  if (!cambios.length && !bien.length) partes.push("", "No marcó nada.");
  return partes.join("\n");
}
