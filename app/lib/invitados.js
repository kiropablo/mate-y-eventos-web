import fs from "fs";
import path from "path";
import { urlHttp } from "./url-segura";

// Lee las fichas de invitados desde content/invitados/{slug}.md
//
// Mismo sistema que el glosario y los artículos: cabecera entre --- y el cuerpo
// en Markdown. Un archivo por persona.
//
// Tres reglas que hacen a esto distinto de los otros dos tipos de contenido,
// porque acá lo que se publica es una página sobre una PERSONA REAL:
//
// 1. Una ficha no se publica sin al menos un episodio donde esa persona habló.
//    Es lo mismo que pide el glosario y por la misma razón: lo que dice la
//    página se puede ir a escuchar.
//
// 2. Nada de lo que dice la ficha se inventa. El generador solo escribe lo que
//    se dijo en la conversación, y deja anotado en "fuente" de dónde lo sacó
//    para que una persona lo pueda comprobar de un vistazo antes de aprobar.
//
// 3. Acá NO van mail ni teléfono, ni aunque se hayan dicho al aire. Un invitado
//    vino a una charla, no a que le publiquemos una ficha de contacto. Van la
//    web y las redes profesionales, que ya son públicas y las puso la persona.
//    Es la misma lección de la regla 20: un dato de contacto publicado no se
//    puede despublicar.

const DIR = path.join(process.cwd(), "content", "invitados");

// Deshace el escapado que hace el generador al escribir el archivo.
// El orden importa: primero las comillas, después las barras.
function desescapar(t) {
  return String(t)
    .replace(/^"|"$/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function valorCabecera(crudo) {
  const t = crudo.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t.startsWith("[")) {
    return t
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((s) => desescapar(s.trim()))
      .filter(Boolean);
  }
  return desescapar(t);
}

function parsear(crudo, slug) {
  const m = crudo.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;

  const datos = {};
  m[1].split("\n").forEach((linea) => {
    const corte = linea.indexOf(":");
    if (corte > 0) {
      datos[linea.slice(0, corte).trim()] = valorCabecera(linea.slice(corte + 1));
    }
  });

  return {
    slug,
    nombre: datos.nombre || "",
    // A qué se dedica, en pocas palabras: "Mentalista", "Artista y diseñadora".
    // Sale de cómo lo presentaron al aire, no de una búsqueda.
    rol: datos.rol || "",
    // La corta, para la descripción de Google y el schema. Se mantiene cerca de
    // los 160 caracteres por lo mismo que las de Pablo y Alexis.
    bio: datos.bio || "",
    // En qué episodios habló. Es una lista: hay invitados que vuelven, y la
    // ficha tiene que juntarlos, no duplicarse.
    episodios: Array.isArray(datos.episodios)
      ? datos.episodios
      : datos.episodios
        ? [datos.episodios]
        : [],
    web: datos.web || "",
    // La misma dirección, pero solo si se puede linkear de verdad.
    //
    // Esta la escribe el PROPIO INVITADO en el formulario, y React 18 no
    // bloquea un href que arranque con "javascript:". La validación del panel
    // solo rechaza lo que parece un mail o un teléfono, así que por ahí pasa
    // derecho. Mismo criterio que la agenda: `web` sigue siendo el texto tal
    // cual —lo muestra el panel, que es donde se corrige— y `webUrl` es "el
    // texto, si se puede poner en un href".
    webUrl: urlHttp(datos.web),
    // Si tiene foto cargada. Es un campo de la cabecera y NO un fs.existsSync()
    // sobre public/: los archivos del repositorio no viajan solos a las
    // funciones del servidor —es la regla 7, la que dejó el sitemap sin
    // artículos durante semanas— y una comprobación que falla en silencio acá
    // haría desaparecer la foto de todas las fichas sin que nadie se entere.
    // La escribe la ruta que sube la imagen, en el mismo momento.
    foto: datos.foto === true,
    redes: Array.isArray(datos.redes) ? datos.redes : [],
    // De dónde salió el nombre y el rol. No se publica: lo lee quien aprueba,
    // para comprobar que el robot no inventó nada.
    fuente: datos.fuente || "",
    publicado: datos.publicado === true,
    revisado: datos.revisado || datos.generado || "",
    cuerpo: crudo.slice(m[0].length).trim(),
  };
}

// Una ficha se puede publicar si la aprobaron, tiene nombre, tiene algo escrito
// y tiene al menos un episodio. Sin episodio no hay nada que comprobar y la
// página sería una biografía suelta de alguien, que no es lo que hacemos.
export function sePuedePublicar(i) {
  return Boolean(i.publicado && i.nombre && i.cuerpo && i.episodios.length > 0);
}

export function getInvitados({ incluirBorradores = false } = {}) {
  let archivos = [];
  try {
    archivos = fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  } catch {
    // Todavía no existe la carpeta: no hay invitados, no está roto.
    return [];
  }

  const lista = [];
  for (const archivo of archivos) {
    try {
      const crudo = fs.readFileSync(path.join(DIR, archivo), "utf8");
      const i = parsear(crudo, archivo.replace(/\.md$/, ""));
      if (!i || !i.nombre) continue;
      if (incluirBorradores || sePuedePublicar(i)) lista.push(i);
    } catch {
      // Un archivo roto no puede tirar abajo la página entera.
    }
  }

  return lista.sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  );
}

export function getInvitado(slug, { incluirBorradores = false } = {}) {
  try {
    const crudo = fs.readFileSync(path.join(DIR, `${slug}.md`), "utf8");
    const i = parsear(crudo, slug);
    if (!i || !i.nombre) return null;
    if (!incluirBorradores && !sePuedePublicar(i)) return null;
    return i;
  } catch {
    return null;
  }
}

// Quiénes estuvieron en un episodio, para enlazarlos desde su ficha.
export function invitadosDelEpisodio(id) {
  if (!id) return [];
  return getInvitados().filter((i) => i.episodios.includes(id));
}
