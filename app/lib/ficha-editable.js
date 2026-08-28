// Los campos de la ficha que se editan desde el panel, y cómo se lee lo que
// pidió corregir el organizador.
//
// Está acá y no dentro de la página por lo mismo que campos-ficha.js: lo usan
// el panel (que dibuja el formulario) y la ruta que guarda (que valida y
// escribe). Si cada uno tuviera su lista, tarde o temprano el panel mostraría
// un campo que la ruta no guarda, y el cambio se perdería en silencio.
//
// Ojo: acá los campos son los de AIRTABLE, no los que repasa el organizador.
// No es lo mismo. "Ciudad y provincia" es una sola línea para él y son tres
// campos en la base; "Fechas" es una frase y son dos fechas más el estado.
// Esa traducción es justamente lo que hoy hay que ir a hacer a Airtable.

// Los desplegables, tal como están cargados en la base. Se validan contra esta
// lista antes de escribir: Airtable, con typecast prendido, CREA la opción que
// no existe. Un país mal tipeado no daría error, agregaría "Argentna" al
// desplegable para siempre y rompería el filtro de la agenda.
export const PAISES = [
  "Argentina", "Uruguay", "Chile", "Brasil", "Paraguay", "Bolivia", "México",
  "Colombia", "Perú", "Panamá", "El Salvador", "Estados Unidos", "Canadá",
  "España", "Francia", "Alemania", "Italia", "Jamaica",
  "Emiratos Árabes Unidos", "Internacional", "Otro",
];

export const TIPOS = [
  "Congreso/Conferencia", "Expo/Feria", "Festival", "Recital masivo",
  "Corporativo", "Capacitación", "Deportivo masivo", "Premios y galas",
  "Público/Festivo",
];

export const ESTADOS_FECHA = ["Confirmadas", "Estimadas", "Por anunciar"];

export const CAMPOS_EDITABLES = [
  { clave: "nombre", rotulo: "Nombre", campo: "Nombre", tipo: "texto" },
  {
    clave: "fechaInicio",
    rotulo: "Fecha de inicio",
    campo: "Fecha inicio",
    tipo: "fecha",
  },
  {
    clave: "fechaFin",
    rotulo: "Fecha de cierre",
    campo: "Fecha fin",
    tipo: "fecha",
    ayuda: "Si dura un día, dejala igual a la de inicio o vacía",
  },
  {
    clave: "estadoFechas",
    rotulo: "Estado de las fechas",
    campo: "Estado de fechas",
    tipo: "select",
    opciones: ESTADOS_FECHA,
    ayuda: "«Confirmadas» solo si las anunció la organización",
  },
  { clave: "tipo", rotulo: "Tipo", campo: "Tipo", tipo: "select", opciones: TIPOS },
  { clave: "venue", rotulo: "Sede", campo: "Venue", tipo: "texto" },
  { clave: "ciudad", rotulo: "Ciudad", campo: "Ciudad", tipo: "texto" },
  {
    clave: "provincia",
    rotulo: "Provincia o región",
    campo: "Provincia/Región",
    tipo: "texto",
  },
  { clave: "pais", rotulo: "País", campo: "País", tipo: "select", opciones: PAISES },
  {
    clave: "organizador",
    rotulo: "Quién organiza",
    campo: "Organizador",
    tipo: "texto",
  },
  { clave: "web", rotulo: "Sitio oficial", campo: "Web oficial", tipo: "texto" },
  {
    clave: "redes",
    rotulo: "Redes",
    campo: "Redes",
    tipo: "area",
    ayuda: "Un link por línea",
  },
  {
    clave: "contactos",
    rotulo: "Contactos",
    campo: "Contactos",
    tipo: "area",
    ayuda: "Un mail o teléfono por línea. Son públicos: van en la ficha",
  },
  {
    clave: "descCorta",
    rotulo: "Descripción corta",
    campo: "Descripción corta",
    tipo: "area",
    ayuda: "La que se ve en el listado y en Google. Una o dos oraciones",
  },
  {
    clave: "descLarga",
    rotulo: "Descripción larga",
    campo: "Descripción larga",
    tipo: "area",
    ayuda: "La de «De qué se trata». Es la que repasa el organizador",
  },
];

// El valor de cada campo, tal como está hoy, listo para meter en el formulario.
export function valoresEditables(ev) {
  return {
    nombre: ev.nombre || "",
    fechaInicio: ev.fechaInicio || "",
    fechaFin: ev.fechaFin || "",
    estadoFechas: ev.estadoFechas || "Por anunciar",
    tipo: ev.tipo || "",
    venue: ev.venue || "",
    ciudad: ev.ciudad || "",
    provincia: ev.provincia || "",
    pais: ev.pais || "",
    organizador: ev.organizador || "",
    web: ev.web || "",
    redes: (ev.redes || []).join("\n"),
    contactos: (ev.contactos || []).join("\n"),
    descCorta: ev.descCorta || "",
    descLarga: ev.descLarga || "",
  };
}

// A qué campo editable apunta cada cosa que repasó el organizador.
//
// Los rótulos son los de campos-ficha.js, que es lo que él vio en pantalla.
// Tres quedan sin destino a propósito: "Fechas" es una frase ("del 3 al 5 de
// mayo") y no una fecha, "Ciudad y provincia" viene junto y son dos campos, y
// el logo es una imagen. Esos se muestran igual para leerlos, pero no tienen
// botón: meter "del 3 al 5 de mayo" adentro de un campo de fecha rompería la
// ficha, y adivinar dónde termina la ciudad y empieza la provincia, también.
const DESTINO = {
  "Nombre del evento": "nombre",
  Sede: "venue",
  "Quién organiza": "organizador",
  "Sitio oficial": "web",
  Redes: "redes",
  Descripción: "descLarga",
  Contacto: "contactos",
};

// Saca las líneas de continuación la sangría que les puso resumirRespuesta.
const desangrar = (t) =>
  String(t)
    .split("\n")
    .map((l) => l.replace(/^ {10}/, ""))
    .join("\n")
    .trim();

// Lee el texto que quedó en Airtable y devuelve lo que pidió cambiar.
//
// Se parsea SOLO la última respuesta. El campo guarda el historial entero, y
// si el organizador escribió dos veces, lo que vale es lo último que dijo:
// ofrecerle a Pablo aplicar una corrección vieja, ya aplicada, sería volver
// atrás un cambio sin que se note.
//
// Si el formato no coincide —porque alguien editó el campo a mano en Airtable,
// que es texto libre— devuelve lista vacía y el panel muestra el texto crudo,
// que es lo que hacía antes. Nunca se pierde nada: peor que no parsear sería
// parsear mal y ofrecer aplicar un valor equivocado.
export function parsearCorrecciones(texto) {
  const crudo = String(texto || "");
  if (!crudo.trim()) return { propuestas: [], fecha: "", confirmados: [] };

  const bloques = crudo.split(/\n(?=\[\d{4}-\d{2}-\d{2}\] Respuesta del organizador)/);
  const ultimo = bloques[bloques.length - 1] || "";
  const fecha = (ultimo.match(/^\[(\d{4}-\d{2}-\d{2})\]/) || [])[1] || "";

  const confirmados = (
    ultimo.match(/Confirmó que están bien:\s*([^\n]+)/) || []
  )[1]
    ? (ultimo.match(/Confirmó que están bien:\s*([^\n]+)/) || [])[1]
        .replace(/\.$/, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const desde = ultimo.indexOf("A CORREGIR:");
  if (desde < 0) return { propuestas: [], fecha, confirmados };

  // Corta antes del "Confirmó que están bien", que no es una corrección.
  let cuerpo = ultimo.slice(desde + "A CORREGIR:".length);
  const corte = cuerpo.indexOf("\nConfirmó que están bien:");
  if (corte >= 0) cuerpo = cuerpo.slice(0, corte);

  const propuestas = [];
  for (const item of cuerpo.split(/\n(?=• )/)) {
    const t = item.trim();
    if (!t.startsWith("• ")) continue;
    const rotulo = (t.slice(2).split("\n")[0] || "").trim();
    const iDice = t.indexOf("\n    dice: ");
    const iDeberia = t.indexOf("\n    debería decir: ");
    if (iDeberia < 0) continue;
    const dice =
      iDice >= 0 && iDice < iDeberia
        ? desangrar(t.slice(iDice + "\n    dice: ".length, iDeberia))
        : "";
    const propuesto = desangrar(t.slice(iDeberia + "\n    debería decir: ".length));
    if (!propuesto) continue;
    propuestas.push({
      rotulo,
      dice,
      propuesto,
      // Sin destino se muestra igual, pero sin botón de aplicar.
      destino: DESTINO[rotulo] || "",
    });
  }

  return { propuestas, fecha, confirmados };
}
