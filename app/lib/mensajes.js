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

const RUTA = path.join(process.cwd(), "content", "mensajes", "primer-contacto.md");

// El archivo son bloques separados por una línea "## id". Se eligió eso y no
// JSON porque los textos tienen comillas, apóstrofes y saltos de línea, y un
// JSON mal escapado rompe todo el mail. Acá lo peor que puede pasar es que un
// bloque quede vacío y se use el de fábrica.
export function leerCrudo() {
  try {
    return fs.readFileSync(RUTA, "utf8");
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

export function armar(valores) {
  return CAMPOS.map(
    (c) => `## ${c.id}\n${String(valores[c.id] ?? c.porDefecto).trim()}`
  ).join("\n\n");
}

// Los textos que se usan de verdad: lo guardado, y lo de fábrica donde falte.
export function getMensaje() {
  const guardado = partir(leerCrudo());
  const salida = {};
  for (const c of CAMPOS) {
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
