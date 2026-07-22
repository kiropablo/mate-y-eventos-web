// Convierte el Markdown del artículo en HTML.
// Es un lector chico y a propósito: solo entiende lo que el generador escribe
// (## subtítulos, párrafos, listas, **negritas** y el bloque :::checklist).
// Así no hace falta instalar ninguna librería extra.

function conNegritas(texto) {
  return String(texto)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((parte, i) =>
      parte.startsWith("**") && parte.endsWith("**") ? (
        <strong key={i}>{parte.slice(2, -2)}</strong>
      ) : (
        parte
      )
    );
}

function armarBloques(markdown) {
  const lineas = String(markdown || "").split("\n");
  const bloques = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i];

    // Bloque práctico :::checklist Título ... :::
    if (linea.trim().startsWith(":::checklist")) {
      const titulo = linea.trim().slice(":::checklist".length).trim();
      const items = [];
      i++;
      while (i < lineas.length && !lineas[i].trim().startsWith(":::")) {
        const t = lineas[i].trim();
        if (t.startsWith("- ")) items.push(t.slice(2));
        i++;
      }
      i++;
      bloques.push({ tipo: "checklist", titulo, items });
      continue;
    }

    if (linea.startsWith("## ")) {
      bloques.push({ tipo: "h2", texto: linea.slice(3).trim() });
      i++;
      continue;
    }

    if (linea.startsWith("### ")) {
      bloques.push({ tipo: "h3", texto: linea.slice(4).trim() });
      i++;
      continue;
    }

    if (linea.trim().startsWith("- ")) {
      const items = [];
      while (i < lineas.length && lineas[i].trim().startsWith("- ")) {
        items.push(lineas[i].trim().slice(2));
        i++;
      }
      bloques.push({ tipo: "lista", items });
      continue;
    }

    if (!linea.trim()) {
      i++;
      continue;
    }

    const buffer = [];
    while (
      i < lineas.length &&
      lineas[i].trim() &&
      !lineas[i].startsWith("#") &&
      !lineas[i].trim().startsWith(":::") &&
      !lineas[i].trim().startsWith("- ")
    ) {
      buffer.push(lineas[i].trim());
      i++;
    }
    bloques.push({ tipo: "p", texto: buffer.join(" ") });
  }

  return bloques;
}

export default function ArticuloCuerpo({ markdown }) {
  const bloques = armarBloques(markdown);

  return (
    <div className="art-cuerpo">
      {bloques.map((b, i) => {
        if (b.tipo === "h2") return <h2 key={i}>{b.texto}</h2>;
        if (b.tipo === "h3") return <h3 key={i}>{b.texto}</h3>;
        if (b.tipo === "lista")
          return (
            <ul key={i}>
              {b.items.map((t, j) => (
                <li key={j}>{conNegritas(t)}</li>
              ))}
            </ul>
          );
        if (b.tipo === "checklist")
          return (
            <aside className="art-check" key={i}>
              {b.titulo ? (
                <div className="art-check__titulo">{b.titulo}</div>
              ) : null}
              <ul>
                {b.items.map((t, j) => (
                  <li key={j}>{conNegritas(t)}</li>
                ))}
              </ul>
            </aside>
          );
        return <p key={i}>{conNegritas(b.texto)}</p>;
      })}
    </div>
  );
}
