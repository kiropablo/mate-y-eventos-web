// Mudanza única: los artículos pasan de llamarse con el código de YouTube a
// llamarse por su tema.
//
//   content/articulos/AJpzAobAKOU.md
//   -> content/articulos/cuanto-cobrar-por-organizar-un-evento.md
//
// La dirección vieja no se pierde: queda anotada en el campo slugsAnteriores
// de cada artículo, y de ahí next.config.js arma la redirección permanente.
//
// Es idempotente: si ya se corrió, no hace nada. Y acumula, no pisa: si un
// artículo se vuelve a mudar, la lista de direcciones viejas suma la anterior
// en vez de reemplazarla, así ninguna dirección publicada queda en la nada.
//
// Se corre a mano una sola vez:  node scripts/mudar-articulos.mjs

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

// videoId -> dirección nueva. Escritas a mano leyendo el título de cada uno:
// lo que alguien tipearía en Google, no un resumen del título.
const MUDANZA = {
  "0VMLRXE3cbU": "como-entrar-a-trabajar-en-eventos",
  "3aPh6wbebDk": "huella-ambiental-de-un-festival",
  "5yDXWMoN0jk": "rentabilidad-de-producir-eventos-en-argentina",
  "6CQYIU04D7c": "como-vender-una-idea-de-evento",
  AAxeME91qJk: "diseno-de-stands-que-venden",
  AJpzAobAKOU: "cuanto-cobrar-por-organizar-un-evento",
  AxdHNzcnw1o: "minuto-cero-de-un-evento",
  BtX2HbTBrS8: "como-tratar-con-proveedores-de-eventos",
  ChPp5ty6F18: "que-hace-un-coordinador-de-area",
  D8SD_ASAmqs: "el-locutor-en-un-evento",
  ErJZUxUw4mo: "brief-de-un-evento",
  GVQOqNnF5qs: "disenar-eventos-sin-la-vista",
  KMGBj91hgso: "el-momento-wow-de-un-evento",
  "M9-bsaOsP0E": "vender-antes-de-fabricar",
  Nxgf0RwvQI4: "liderar-un-equipo-de-eventos",
  OSiFr7cvUUg: "crecer-rapido-en-la-industria-de-eventos",
  P8Kp5rQilZM: "tendencias-en-eventos",
  PEMDs92gVeo: "como-se-organiza-un-evento-por-dentro",
  "Q-7sD3-KOC0": "catering-para-eventos",
  Qxf21vLVCgk: "staff-para-eventos",
  SQyK9AQsmuA: "errores-que-hacen-fracasar-un-evento",
  TrZZp2oBWHc: "tecnologia-en-la-produccion-de-eventos",
  "Y9o-SqmIIlQ": "separar-el-que-del-como",
  YCc0wTmovjg: "la-marca-por-encima-del-fundador",
  Z6TPa4cjRoU: "como-elegir-proveedores-para-un-evento",
  "axR3Ow-V3sI": "sostenibilidad-en-eventos",
  gNbnmeCtvPg: "como-elegir-el-catering-de-un-evento",
  grd437fZP2c: "gestion-de-crisis-en-eventos",
  hcIMJOiQvVQ: "inteligencia-artificial-en-eventos",
  ie_dfPec9b4: "influencers-en-eventos",
  lAeikc5gbSc: "cuando-decir-que-no-a-un-cliente",
  oHtdo_8RCpc: "eventos-para-publico-infantil",
  pQ0Jia4J9t0: "la-bomba-de-tiempo-ritmo-y-multitudes",
  puJJ_sI3nX8: "roi-de-eventos-corporativos",
  pvA3zQh3CsU: "rider-tecnico-que-es",
  uJZ8OfGWa4I: "la-regla-que-ordena-las-discusiones-creativas",
  uzXUhBIjF2Y: "el-dj-en-un-evento",
  "vfdeXVw89-k": "freestyle-y-produccion-en-vivo",
  vwwHytGG140: "fidelizar-clientes-en-eventos",
  wjdmnMkYCT4: "diseno-sensorial-sin-pantallas",
};

// --------------------------------------------------------------------------

const campo = (texto, clave) => {
  const m = texto.match(new RegExp(`^${clave}:[^\\S\\r\\n]*(.*)$`, "m"));
  return m ? m[1].trim() : null;
};

// Suma una dirección vieja a la lista, sin repetir y sin perder las que ya
// estaban. Si el campo no existe todavía, se agrega después de "etiquetas".
function anotarDireccionVieja(texto, vieja) {
  const actual = campo(texto, "slugsAnteriores");
  const previas = actual
    ? [...actual.matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];
  if (previas.includes(vieja)) return texto;

  const linea = `slugsAnteriores: [${[...previas, vieja]
    .map((s) => `"${s}"`)
    .join(", ")}]`;

  if (actual !== null) {
    return texto.replace(/^slugsAnteriores:.*$/m, () => linea);
  }
  return texto.replace(/^(etiquetas:.*)$/m, (m) => `${m}\n${linea}`);
}

let mudados = 0,
  yaEstaban = 0,
  problemas = 0;

for (const [videoId, nueva] of Object.entries(MUDANZA)) {
  const viejo = path.join(DIR, `${videoId}.md`);
  const nuevo = path.join(DIR, `${nueva}.md`);

  if (!fs.existsSync(viejo)) {
    if (fs.existsSync(nuevo)) {
      yaEstaban++;
    } else {
      problemas++;
      console.log(`  ✗ ${videoId}: no está ni con el nombre viejo ni con el nuevo`);
    }
    continue;
  }
  if (fs.existsSync(nuevo)) {
    problemas++;
    console.log(`  ✗ ${nueva}: ya existe un archivo con ese nombre`);
    continue;
  }

  const texto = fs.readFileSync(viejo, "utf8");
  const episodio = (campo(texto, "episodio") || "").replace(/^"|"$/g, "");
  if (episodio !== videoId) {
    problemas++;
    console.log(
      `  ✗ ${videoId}: el campo episodio dice "${episodio}". No se toca.`
    );
    continue;
  }

  fs.writeFileSync(viejo, anotarDireccionVieja(texto, videoId), "utf8");
  // Con git mv para que el historial del artículo siga siendo el mismo.
  execSync(`git mv ${JSON.stringify(viejo)} ${JSON.stringify(nuevo)}`);
  mudados++;
  console.log(`  ✓ /articulos/${videoId}  ->  /articulos/${nueva}`);
}

console.log(
  `\nMudados: ${mudados} · ya estaban: ${yaEstaban} · con problema: ${problemas}`
);
if (problemas) process.exit(1);
