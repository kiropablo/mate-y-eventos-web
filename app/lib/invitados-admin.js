import fs from "fs";
import path from "path";

// Lector de las fichas de invitados pensado solo para el panel interno.
// A diferencia de lib/invitados.js, trae también los borradores y devuelve el
// texto tal cual está en el archivo, listo para editar.

const DIR = path.join(process.cwd(), "content", "invitados");

// Deshace el mismo escapado que aplica el generador al escribir el archivo.
// El orden importa: primero las comillas, después las barras.
function limpiar(valor) {
  return String(valor)
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function comoLista(valor) {
  const t = String(valor || "").trim();
  if (!t.startsWith("[")) return t ? [limpiar(t)] : [];
  return t
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((s) => limpiar(s))
    .filter(Boolean);
}

// Le pega a cada ficha lo suyo de Airtable: el mail, en qué punto está el
// circuito y qué pidió corregir. Las dos mitades viven separadas porque una es
// pública y la otra no, pero el panel las muestra juntas: quien lo usa no tiene
// por qué saber que están en dos lados.
const pelar = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Qué registros de Airtable PODRÍAN ser esta persona, mejor primero.
//
// Es una sugerencia, no una decisión: el que une los dos lados es Pablo con un
// click. El caso que explica por qué: la ficha dice "Michel" y el registro dice
// "Miguel Ángel Clavello", pero su campo Empresa/Cargo dice "Michel Mentalista".
// Un puntaje alto ahí NO alcanza para afirmar que son la misma persona —eso es
// adivinar el nombre real de alguien a partir de un parecido— pero sí para
// ponerlo primero en la lista y que confirmarlo cueste un segundo.
function puntuar(ficha, r) {
  const nombre = pelar(ficha.nombre);
  if (!nombre) return { p: 0, seguro: false };

  // Por dónde matchea importa más que cuánto. Que el nombre de la ficha
  // aparezca en el NOMBRE del registro es una cosa; que aparezca en su campo
  // Empresa/Cargo es otra completamente distinta, aunque el texto coincida
  // igual de bien. El caso que lo explica es Michel: "michel" está adentro de
  // "Michel Mentalista", que es el cargo de MIGUEL ÁNGEL CLAVELLO. El parecido
  // es perfecto y los nombres no tienen nada que ver. Ese es exactamente el que
  // hay que mirar dos veces, así que no puede salir marcado como seguro.
  const porNombre = [r.nombre, r.comoNombrar].map(pelar);
  const porCargo = pelar(r.empresa);

  if (porNombre.some((c) => c && (c.includes(nombre) || nombre.includes(c)))) {
    return { p: 100, seguro: true };
  }
  if (porCargo && porCargo.includes(nombre)) {
    // Buen candidato, primero en la lista, pero con el cartel de "mirá bien".
    return { p: 80, seguro: false };
  }

  // Palabras en común de más de tres letras: "larocca", "giacco".
  const palabras = new Set(nombre.split(" ").filter((w) => w.length > 3));
  const otras = new Set(
    [...porNombre, porCargo].join(" ").split(" ").filter((w) => w.length > 3)
  );
  const comunes = [...palabras].filter((w) => otras.has(w)).length;
  return comunes > 0 ? { p: 40 + comunes * 10, seguro: false } : { p: 0, seguro: false };
}

export function unirConAirtable(fichas, registros, registroDeFicha) {
  // Los que no están atados a ninguna ficha: son los únicos que se pueden
  // ofrecer. Uno ya atado aparecería como candidato de dos fichas distintas.
  const libres = registros.filter((r) => !r.ficha);

  return fichas.map((f) => {
    const r = registroDeFicha(registros, f);
    const sugeridos = r
      ? []
      : libres
          .map((c) => ({ c, ...puntuar(f, c) }))
          .filter((x) => x.p > 0)
          .sort((a, b) => b.p - a.p)
          .slice(0, 5)
          .map(({ c, seguro }) => ({
            id: c.id,
            nombre: c.nombre,
            empresa: c.empresa,
            email: c.email,
            seguro,
          }));
    return {
      ...f,
      sugeridos,
      // Todos los libres, por si el sugerido no es ninguno de los cinco.
      libres: r
        ? []
        : libres.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            empresa: c.empresa,
          })),
      // Sin registro no hay mail ni circuito, y el panel lo dice en vez de
      // mostrar botones que no van a funcionar.
      registro: r
        ? {
            id: r.id,
            email: r.email,
            telefono: r.telefono,
            empresa: r.empresa,
            nombreCompleto: r.nombre,
            web: r.web,
            redes: r.redes,
            pedidoEl: r.pedidoEl,
            validadoEl: r.validadoEl,
            revisionPendiente: r.revisionPendiente,
            correcciones: r.correcciones,
          }
        : null,
    };
  });
}

export function listarInvitadosParaPanel() {
  let archivos = [];
  try {
    archivos = fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  } catch {
    return [];
  }

  const items = [];

  for (const archivo of archivos) {
    try {
      const crudo = fs.readFileSync(path.join(DIR, archivo), "utf8");
      const m = crudo.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
      if (!m) continue;

      const datos = {};
      m[1].split("\n").forEach((linea) => {
        const corte = linea.indexOf(":");
        if (corte > 0) {
          datos[linea.slice(0, corte).trim()] = linea.slice(corte + 1);
        }
      });

      const nombre = limpiar(datos.nombre || "");
      if (!nombre) continue;

      const episodios = comoLista(datos.episodios);

      items.push({
        id: archivo.replace(/\.md$/, ""),
        nombre,
        rol: limpiar(datos.rol || ""),
        bio: limpiar(datos.bio || ""),
        web: limpiar(datos.web || ""),
        foto: limpiar(datos.foto || "") === "true",
        // Se editan como texto, un link por línea: es más fácil de pegar que
        // una lista con corchetes y comillas.
        redes: comoLista(datos.redes).join("\n"),
        episodios,
        episodioTitulo: limpiar(datos.episodioTitulo || ""),
        // La frase de la transcripción de donde el robot sacó el nombre y el
        // rol. Es LO PRIMERO que hay que mirar antes de aprobar: si eso no dice
        // lo que dice la ficha, el robot se equivocó de persona. No se publica.
        fuente: limpiar(datos.fuente || ""),
        generado: limpiar(datos.generado || ""),
        publicado: limpiar(datos.publicado || "") === "true",
        // Sin episodio la ficha no sale publicada aunque esté marcada: sería la
        // biografía suelta de alguien, sin nada que se pueda ir a escuchar.
        listoParaPublicar: Boolean(nombre && episodios.length > 0),
        cuerpo: crudo.slice(m[0].length).trim(),
      });
    } catch {
      // Un archivo roto no puede tirar abajo el panel entero.
    }
  }

  // Primero los borradores, que son los que hay que revisar.
  return items.sort((a, b) => {
    if (a.publicado !== b.publicado) return a.publicado ? 1 : -1;
    return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
  });
}
