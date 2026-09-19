import Link from "next/link";

// Convierte el Markdown del artículo en HTML.
// Es un lector chico y a propósito: solo entiende lo que el generador escribe
// (## subtítulos, párrafos, listas, **negritas**, links y el bloque
// :::checklist). Así no hace falta instalar ninguna librería extra.
//
// Los links los aprendió para las menciones a invitados: el generador NO
// escribe ninguno —no había ni uno en los 42 artículos ni en el glosario el día
// que esto se agregó— y los pone `menciones.js` al dibujar la página. Por eso
// solo se aceptan direcciones internas, las que empiezan con "/": un link es lo
// único de un artículo que manda al lector a otro lado, y el texto de los
// artículos lo escribe una IA sobre una transcripción. Si algún día apareciera
// un "[algo](http://...)" en el contenido, se ve tal cual está escrito en vez
// de convertirse en una puerta a un dominio ajeno.
function conFormato(texto) {
  return String(texto)
    .split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g)
    .map((parte, i) => {
      if (parte.startsWith("**") && parte.endsWith("**")) {
        return <strong key={i}>{parte.slice(2, -2)}</strong>;
      }
      const link = parte.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
      if (link) {
        return (
          <Link key={i} href={link[2]}>
            {link[1]}
          </Link>
        );
      }
      return parte;
    });
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
        if (b.tipo === "h2") return <h2 key={i}>{conFormato(b.texto)}</h2>;
        if (b.tipo === "h3") return <h3 key={i}>{conFormato(b.texto)}</h3>;
        if (b.tipo === "lista")
          return (
            <ul key={i}>
              {b.items.map((t, j) => (
                <li key={j}>{conFormato(t)}</li>
              ))}
            </ul>
          );
        if (b.tipo === "checklist")
          return (
            <aside className="art-check" key={i}>
              {b.titulo ? (
                <div className="art-check__titulo">{conFormato(b.titulo)}</div>
              ) : null}
              <ul>
                {b.items.map((t, j) => (
                  <li key={j}>{conFormato(t)}</li>
                ))}
              </ul>
            </aside>
          );
        return <p key={i}>{conFormato(b.texto)}</p>;
      })}
    </div>
  );
}
