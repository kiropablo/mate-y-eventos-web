// Los datos de su ficha que el invitado repasa, uno por uno.
//
// Está acá y no dentro de la página por lo mismo que campos-ficha.js: lo usan
// tres lugares —la página que él ve, la ruta que guarda su respuesta y el panel
// donde la leemos—. Si cada uno armara su propia lista, tarde o temprano
// dirían cosas distintas.
//
// Lo que NO se le muestra, a propósito: su mail y su teléfono. No porque sean
// un secreto para él, obviamente, sino porque esta página no publica nada de
// eso y mostrarlos acá daría a entender que sí. Si quiere corregirlos, contesta
// el mail.

export const CAMPOS = [
  {
    clave: "nombre",
    rotulo: "Cómo te nombramos",
    ayuda: "El nombre con el que aparecés en la ficha y en el episodio.",
  },
  {
    clave: "rol",
    rotulo: "A qué te dedicás",
    ayuda: "La línea que va abajo de tu nombre.",
  },
  {
    clave: "bio",
    rotulo: "La línea de resumen",
    ayuda: "Es la que muestra Google cuando alguien te busca.",
  },
  {
    clave: "cuerpo",
    rotulo: "El texto de tu ficha",
    ayuda: "Lo escribimos nosotros a partir de lo que dijiste en el episodio.",
  },
  {
    clave: "web",
    rotulo: "Tu sitio",
    ayuda: "Si no tenés o preferís que no aparezca, decilo.",
  },
  {
    clave: "redes",
    rotulo: "Tus redes",
    ayuda: "Las que quieras que estén enlazadas desde tu ficha.",
  },
];

// El valor publicado de cada campo, en texto plano.
export function valoresDe(inv) {
  return {
    nombre: inv.nombre || "",
    rol: inv.rol || "",
    bio: inv.bio || "",
    cuerpo: inv.cuerpo || "",
    web: inv.web || "",
    redes: (inv.redes || []).join("\n"),
  };
}

export function filasDe(inv) {
  const valores = valoresDe(inv);
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

// Arma el texto que queda en Airtable con lo que respondió el invitado.
//
// Se guarda legible y no como datos crudos porque lo lee una persona antes de
// aplicar nada. Y el sangrado no es cosmético: es lo que garantiza que nada de
// lo que escriba el invitado pueda imitar la marca "[fecha] Respuesta del
// invitado" con la que se cuenta el tope de respuestas por día. Misma lección
// que la regla 22.
export function resumirRespuesta(inv, revisiones, fecha) {
  const valores = valoresDe(inv);
  const bien = [];
  const cambios = [];

  for (const c of CAMPOS) {
    const r = revisiones?.[c.clave];
    if (!r) continue;
    if (r.ok) {
      bien.push(c.rotulo);
    } else if (String(r.correccion || "").trim()) {
      cambios.push(
        `• ${c.rotulo}\n    dice: ${sangrar(valores[c.clave] || "(vacío)")}\n    debería decir: ${sangrar(
          String(r.correccion).trim()
        )}`
      );
    }
  }

  const partes = [`[${fecha}] Respuesta del invitado`];
  if (cambios.length) partes.push("", "A CORREGIR:", ...cambios);
  if (bien.length) partes.push("", `Confirmó que están bien: ${bien.join(", ")}.`);
  if (!cambios.length && !bien.length) partes.push("", "No marcó nada.");
  return partes.join("\n");
}
