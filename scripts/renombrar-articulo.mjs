// Le cambia la dirección a un artículo sin dejar la vieja en la nada.
//
//   node scripts/renombrar-articulo.mjs <direccion-actual> <direccion-nueva>
//
// Renombra el archivo y suma la dirección actual a slugsAnteriores, que es de
// donde next.config.js saca las redirecciones. Acumula: un artículo que se
// mudó dos veces conserva las dos direcciones viejas, así ninguna URL que
// alguna vez estuvo publicada queda muerta.
//
// Existe porque renombrar a mano es justamente lo que rompe: el archivo pasa a
// llamarse distinto, la URL vieja deja de existir y nadie se entera hasta que
// alguien abre un link compartido.

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "articulos"
);

const [viejo, nuevo] = process.argv.slice(2);

if (!viejo || !nuevo) {
  console.error("Uso: node scripts/renombrar-articulo.mjs <actual> <nueva>");
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(nuevo)) {
  console.error(`"${nuevo}" no sirve como dirección: minúsculas, números y guiones.`);
  process.exit(1);
}
if (nuevo.length > 70) {
  console.error(`"${nuevo}" mide ${nuevo.length} caracteres; el máximo es 70.`);
  process.exit(1);
}

const rutaVieja = path.join(DIR, `${viejo}.md`);
const rutaNueva = path.join(DIR, `${nuevo}.md`);

if (!fs.existsSync(rutaVieja)) {
  console.error(`No existe content/articulos/${viejo}.md`);
  process.exit(1);
}
if (fs.existsSync(rutaNueva)) {
  console.error(`Ya hay un artículo en content/articulos/${nuevo}.md`);
  process.exit(1);
}

const texto = fs.readFileSync(rutaVieja, "utf8");

const m = texto.match(/^slugsAnteriores:[^\S\r\n]*(.*)$/m);
const previas = m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];

// La dirección nueva no puede figurar como vieja: seria un bucle.
const lista = [...previas.filter((s) => s !== nuevo), viejo];
const linea = `slugsAnteriores: [${[...new Set(lista)].map((s) => `"${s}"`).join(", ")}]`;

const actualizado = m
  ? texto.replace(/^slugsAnteriores:.*$/m, () => linea)
  : texto.replace(/^(etiquetas:.*)$/m, (x) => `${x}\n${linea}`);

fs.writeFileSync(rutaVieja, actualizado, "utf8");
execSync(`git mv ${JSON.stringify(rutaVieja)} ${JSON.stringify(rutaNueva)}`);

console.log(`/articulos/${viejo}  ->  /articulos/${nuevo}`);
console.log(`Redirigen ahora: ${[...new Set(lista)].join(", ")}`);
