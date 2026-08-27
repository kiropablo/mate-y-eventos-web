import fs from "node:fs";
import path from "node:path";
import { SITE } from "./site";

// Los textos del mail de primer contacto, editables desde /admin.
//
// Por qué solo los textos y no el mail entero: el mail arma solo la ficha del
// evento, la lista de la semana y el link firmado. Si se editara todo como un
// bloque, la primera edición se llevaría puesta esa maquinaria. Acá se edita
// lo que es redacción; lo que se calcula, se calcula.
//
// El archivo puede no existir: estos valores son los que están hoy en
// producción y son los que valen si falta. Nunca se rompe el mail por no
// poder leer un archivo.

export const CAMPOS = [
  {
    id: "asunto",
    titulo: "Asunto",
    ayuda: "Lo primero que ve en la bandeja. Si al reemplazar los datos queda muy largo, el mail lo acorta solo sacando el lugar.",
    marcas: ["{evento}", "{cuando}", "{lugar}"],
    porDefecto: "{evento}: {cuando} en {lugar} — ¿está bien?",
  },
  {
    id: "titular",
    titulo: "Titular",
    ayuda: "El título grande arriba de todo, en la versión con formato.",
    marcas: ["{evento}"],
    porDefecto: "Publicamos {evento} en nuestra agenda. ¿Están bien estos datos?",
  },
  {
    id: "saludo",
    titulo: "Saludo",
    ayuda: "No lleva nombre: no sabemos quién lo abre.",
    marcas: [],
    porDefecto: "Hola:",
  },
  {
    id: "entrada",
    titulo: "Primera línea",
    ayuda: "Arriba de la ficha con los datos publicados.",
    marcas: ["{evento}"],
    porDefecto:
      "Publicamos {evento} en nuestra agenda de eventos de la industria. Así quedó:",
  },
  {
    id: "aclaracion",
    titulo: "Por qué le escribimos",
    ayuda: "Va justo abajo de la ficha, antes del botón.",
    marcas: [],
    porDefecto:
      "Los datos los armamos con información pública, así que puede haber algo desactualizado. Antes de dejarlo así queremos que lo mires vos.",
  },
  {
    id: "boton",
    titulo: "Texto del botón",
    ayuda: "Corto. Es el único botón del mail.",
    marcas: [],
    porDefecto: "Repasar los datos",
  },
  {
    id: "queGana",
    titulo: "Qué gana confirmando",
    ayuda: "La contraprestación. Es la parte que decide si contesta o no.",
    marcas: [],
    porDefecto:
      "Son dos minutos: marcás lo que está bien, corregís lo que no. Si está todo correcto, le encendemos el sello Verificado, que dice que los datos los confirmó el organizador y no que los copiamos de algún lado.",
  },
  {
    id: "quienesSomos",
    titulo: "Quiénes somos",
    ayuda: "Va después del pedido, no antes: primero el dato que le sirve.",
    marcas: ["{medio}"],
    porDefecto:
      "Soy Pablo Quiroga, de {medio}: un podcast de la industria de eventos de Latinoamérica y una agenda pública con más de 260 eventos de la región.",
  },
  {
    id: "cierre",
    titulo: "Cierre",
    ayuda: "La última línea antes de la firma.",
    marcas: [],
    porDefecto: "Cualquier cosa, respondeme acá.",
  },
  {
    id: "firma",
    titulo: "Firma",
    ayuda: "Una línea por renglón.",
    marcas: ["{medio}"],
    porDefecto: "Un abrazo,\nPablo Quiroga\nCo-creador de {medio}, junto a Alexis Vidal",
  },
  {
    id: "pie",
    titulo: "Pie de baja",
    ayuda: "Por qué recibió el mail y cómo pedir que no le escribamos más. Conviene no sacarlo: es lo que separa esto de un spam.",
    marcas: ["{evento}", "{agenda}"],
    porDefecto:
      'Te escribimos porque {evento} figura en nuestra agenda pública de eventos ({agenda}). Si preferís que lo saquemos, o que no te escribamos más, respondé este mail con la palabra "baja" y listo.',
  },
];

// El segundo mail: el que sale cuando el sello ya quedó encendido.
//
// Es el que cierra el círculo. El primero pide y este entrega: sin este, el
// organizador confirma sus datos y no vuelve a saber nada de nosotros hasta
// que publicamos en las redes, que puede ser una semana después.
export const CAMPOS_CONFIRMACION = [
  {
    id: "asunto",
    titulo: "Asunto",
    ayuda: "Corto: ya sabe quiénes somos, es la respuesta a algo que él hizo.",
    marcas: ["{evento}"],
    porDefecto: "Listo: {evento} quedó verificado en la agenda",
  },
  {
    id: "titular",
    titulo: "Titular",
    ayuda: "El título grande, en la versión con formato.",
    marcas: ["{evento}"],
    porDefecto: "{evento} quedó verificado.",
  },
  {
    id: "saludo",
    titulo: "Saludo",
    ayuda: "No lleva nombre: puede abrirlo cualquiera del equipo.",
    marcas: [],
    porDefecto: "Hola:",
  },
  {
    id: "entrada",
    titulo: "Primera línea",
    ayuda: "Lo primero: está hecho. Nada de preámbulo.",
    marcas: ["{evento}", "{mesSello}"],
    porDefecto:
      "Listo, ya está. El sello Verificado quedó encendido en la ficha de {evento}, con la fecha de {mesSello}.",
  },
  {
    id: "porQueLaFecha",
    titulo: "Por qué el sello lleva fecha",
    ayuda: "Explica que el sello envejece. Es lo que lo hace valer.",
    marcas: [],
    porDefecto:
      "La fecha va a propósito: un dato confirmado hace dos años no es lo mismo que uno de este mes.",
  },
  {
    id: "boton",
    titulo: "Texto del botón",
    ayuda: "Corto. Lleva a la ficha publicada.",
    marcas: [],
    porDefecto: "Ver la ficha",
  },
  {
    id: "badge",
    titulo: "El sello para su propia web",
    ayuda: "No se manda el código en el mail: se lo manda a la página donde lo copia con un botón.",
    marcas: ["{evento}", "{verificado}"],
    porDefecto:
      "Si querés ponerlo en la web de {evento}, el código está en {verificado}: elegís tu evento en el desplegable y lo copiás. Va en claro y en oscuro.",
  },
  {
    id: "difusion",
    titulo: "Qué sigue",
    ayuda: "Lo que prometimos en el primer mail. Ojo: acá se está comprometiendo una fecha.",
    marcas: ["{medio}"],
    porDefecto:
      "Esta semana lo publicamos en las redes de {medio} y te aviso cuando salga.",
  },
  {
    id: "cambios",
    titulo: "Si algo cambia",
    ayuda: "La puerta abierta. Es lo que evita que la ficha envejezca sola.",
    marcas: [],
    porDefecto:
      "Si cambia algo —una fecha, la sede, un contacto— escribime y lo corrijo el mismo día. La idea es que la ficha no envejezca.",
  },
  {
    id: "otrosEventos",
    titulo: "Los otros eventos que organizan",
    ayuda: "El pedido que más rinde y no cuesta nada. Si detectamos otros eventos suyos en la agenda, se listan solos en {otros}; si no hay ninguno, este bloque no sale.",
    marcas: ["{otros}"],
    porDefecto:
      "Aprovecho: veo que también organizan {otros}. Si querés, hacemos lo mismo con esos y te queda todo el calendario con los datos derechos. Es el mismo trabajo para mí.",
  },
  {
    id: "otrosEventosSinLista",
    titulo: "Los otros eventos (cuando no detectamos ninguno)",
    ayuda: "La versión para cuando en la agenda no hay más eventos de esa organización.",
    marcas: [],
    porDefecto:
      "Aprovecho: ¿organizan otros eventos este año? Si me pasás cuáles, los cargo y hacemos lo mismo con todos.",
  },
  {
    id: "podcast",
    titulo: "La invitación al podcast",
    ayuda: "Lo único que podemos ofrecer que no tiene nadie más. Sale un capítulo por semana y necesitamos invitados: acá los dos ganan.",
    marcas: ["{evento}", "{medio}"],
    porDefecto:
      "Y si alguna vez querés contar cómo se produce {evento}, en {medio} sale un capítulo por semana y nos interesa escuchar a los que arman los eventos, no a los que opinan sobre ellos. Avisame y lo coordinamos.",
  },
  {
    id: "destacado",
    titulo: "La aclaración del espacio pago",
    ayuda: "Está para marcar el límite, no para vender: dice que el sello NO se paga. Sacarlo es peor, porque entonces parece que lo escondemos.",
    marcas: ["{destacado}"],
    porDefecto:
      "Una aclaración por las dudas: el sello no se pide ni se paga, lo proponemos nosotros. Distinto es el espacio destacado de arriba de la agenda, que sí es pago y está explicado acá por si alguna vez te sirve: {destacado}",
  },
  {
    id: "firma",
    titulo: "Firma",
    ayuda: "Una línea por renglón.",
    marcas: ["{medio}"],
    porDefecto: "Un abrazo,\nPablo Quiroga\nCo-creador de {medio}, junto a Alexis Vidal",
  },
  {
    id: "pie",
    titulo: "Pie de baja",
    ayuda: "Más corto que en el primer mail: acá ya hubo conversación. Conviene no sacarlo igual.",
    marcas: ["{evento}", "{agenda}"],
    porDefecto:
      "Te escribimos porque {evento} está en nuestra agenda pública de eventos ({agenda}). Si en algún momento preferís que no te escribamos más, respondé este mail con la palabra \"baja\".",
  },
];

// Los dos mensajes que se pueden editar desde el panel.
export const MENSAJES = {
  "primer-contacto": {
    titulo: "Primer contacto",
    ayuda: "El mail que le pide al organizador que revise su ficha.",
    campos: CAMPOS,
  },
  confirmacion: {
    titulo: "Confirmación",
    ayuda: "El que sale cuando el sello ya quedó encendido.",
    campos: CAMPOS_CONFIRMACION,
  },
};

export function camposDe(cual) {
  return (MENSAJES[cual] || MENSAJES["primer-contacto"]).campos;
}

function rutaDe(cual) {
  const id = MENSAJES[cual] ? cual : "primer-contacto";
  return path.join(process.cwd(), "content", "mensajes", `${id}.md`);
}

// El archivo son bloques separados por una línea "## id". Se eligió eso y no
// JSON porque los textos tienen comillas, apóstrofes y saltos de línea, y un
// JSON mal escapado rompe todo el mail. Acá lo peor que puede pasar es que un
// bloque quede vacío y se use el de fábrica.
export function leerCrudo(cual = "primer-contacto") {
  try {
    return fs.readFileSync(rutaDe(cual), "utf8");
  } catch {
    return "";
  }
}

export function partir(texto) {
  const salida = {};
  let actual = null;
  const buffer = [];
  const cerrar = () => {
    if (actual) salida[actual] = buffer.join("\n").trim();
    buffer.length = 0;
  };
  for (const linea of String(texto || "").split("\n")) {
    const m = /^##\s+([a-zA-Z]+)\s*$/.exec(linea);
    if (m) {
      cerrar();
      actual = m[1];
      continue;
    }
    if (actual) buffer.push(linea);
  }
  cerrar();
  return salida;
}

export function armar(valores, cual = "primer-contacto") {
  return camposDe(cual)
    .map((c) => `## ${c.id}\n${String(valores[c.id] ?? c.porDefecto).trim()}`)
    .join("\n\n");
}

// Los textos que se usan de verdad: lo guardado, y lo de fábrica donde falte.
export function getMensaje(cual = "primer-contacto") {
  const guardado = partir(leerCrudo(cual));
  const salida = {};
  for (const c of camposDe(cual)) {
    const v = String(guardado[c.id] ?? "").trim();
    salida[c.id] = v || c.porDefecto;
  }
  return salida;
}

// Reemplaza las marcas. Una marca que no se conoce se deja tal cual y no se
// borra: si alguien escribe {telefono} conviene que lo vea en la previsualiza-
// ción y no que desaparezca sin aviso.
export function reemplazar(texto, datos) {
  return String(texto || "").replace(/\{([a-zA-Z]+)\}/g, (entero, clave) =>
    datos[clave] !== undefined && datos[clave] !== null
      ? String(datos[clave])
      : entero
  );
}

export const MARCAS_BASE = () => ({
  medio: SITE.name,
  agenda: `${SITE.url}/agenda`,
});
