import { yaPaso, hoyISO, mesLargo } from "./agenda";

// Los números de la agenda, calculados sobre la propia base.
//
// Es el único contenido del sitio que no es opinión: son datos que no publica
// nadie más en castellano, porque nadie más tiene una base de eventos de la
// región cargada evento por evento. Un artículo de tendencias lo escribe
// cualquiera; "en septiembre y octubre se concentra un tercio del calendario"
// solo lo puede decir el que tiene el calendario.
//
// Reglas que se siguen en todo el archivo, porque son las que hacen que estos
// números se puedan citar:
//
//   1. Todo número va con su denominador. "El 31% son expos" no se entiende
//      sin "de los 308 eventos por delante al 27 de agosto".
//   2. Nada se redondea hacia arriba ni se adorna. Si un corte tiene tres
//      casos, se dice que tiene tres casos.
//   3. Lo que no se sabe se cuenta aparte y se publica: 112 de los eventos
//      todavía no tienen fecha anunciada, y ese también es un dato.

// Duración máxima que se considera para las medianas.
//
// Arriba de un mes ya no es un evento sino una temporada —CASACOR dura de
// agosto a octubre— y mezclarlas corre el promedio de todos los demás.
const DIAS_MAXIMO = 31;

// Cuántos meses hacia adelante se dibujan. Más allá de un año, lo que hay son
// tres o cuatro eventos anunciados con mucha anticipación y la curva miente.
const MESES = 12;

function contar(lista, obtener) {
  const cuenta = new Map();
  for (const e of lista) {
    const v = obtener(e);
    if (!v) continue;
    cuenta.set(v, (cuenta.get(v) || 0) + 1);
  }
  return [...cuenta.entries()]
    .map(([valor, n]) => ({ valor, n }))
    .sort((a, b) => b.n - a.n || a.valor.localeCompare(b.valor));
}

function mediana(numeros) {
  if (!numeros.length) return null;
  const orden = [...numeros].sort((a, b) => a - b);
  const m = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[m] : (orden[m - 1] + orden[m]) / 2;
}

// Los días que dura un evento, contando el primero y el último.
export function duracionEnDias(ev) {
  if (!ev.fechaInicio) return null;
  const fin = ev.fechaFin || ev.fechaInicio;
  if (fin < ev.fechaInicio) return null;
  const a = Date.parse(`${ev.fechaInicio}T00:00:00Z`);
  const b = Date.parse(`${fin}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000) + 1;
}

// Los doce meses que vienen, incluido el que corre, aunque alguno esté vacío:
// un mes sin eventos también dice algo y saltearlo deforma la curva.
function mesesQueVienen(desde) {
  const [a, m] = desde.split("-").map(Number);
  return Array.from({ length: MESES }, (_, i) => {
    const total = (m - 1) + i;
    const anio = a + Math.floor(total / 12);
    const mes = (total % 12) + 1;
    return `${anio}-${String(mes).padStart(2, "0")}`;
  });
}

export function radiografia(eventos, { hoy = hoyISO() } = {}) {
  const vigentes = eventos.filter((e) => !yaPaso(e));
  const conFecha = vigentes.filter((e) => e.fechaInicio);
  const total = vigentes.length;

  // Por mes. El porcentaje se calcula sobre los que TIENEN fecha, no sobre el
  // total: los 112 sin anunciar no están en ningún mes y meterlos en el
  // denominador achataría todas las barras por igual.
  const porMes = mesesQueVienen(hoy.slice(0, 7)).map((mes) => ({
    mes,
    nombre: mesLargo(mes),
    n: conFecha.filter((e) => e.fechaInicio.slice(0, 7) === mes).length,
  }));
  const enLosDoceMeses = porMes.reduce((s, m) => s + m.n, 0);
  const pico = Math.max(1, ...porMes.map((m) => m.n));

  // El bimestre más cargado de los doce meses.
  let bimestre = null;
  for (let i = 0; i < porMes.length - 1; i++) {
    const n = porMes[i].n + porMes[i + 1].n;
    if (!bimestre || n > bimestre.n) {
      bimestre = { n, desde: porMes[i], hasta: porMes[i + 1] };
    }
  }

  const porTipo = contar(vigentes, (e) => e.tipo);
  const porPais = contar(vigentes, (e) => e.pais);

  const argentinos = vigentes.filter((e) => e.pais === "Argentina");
  const porProvincia = contar(argentinos, (e) => e.provincia);

  // Duración por tipo. Solo entran los que tienen las dos fechas y duran menos
  // de un mes; se publica el n de cada corte para que se vea sobre cuántos
  // casos está calculada cada mediana.
  const duraciones = new Map();
  for (const e of conFecha) {
    const d = duracionEnDias(e);
    if (d === null || d > DIAS_MAXIMO) continue;
    if (!duraciones.has(e.tipo)) duraciones.set(e.tipo, []);
    duraciones.get(e.tipo).push(d);
  }
  const porDuracion = [...duraciones.entries()]
    .map(([tipo, dias]) => ({ tipo, n: dias.length, mediana: mediana(dias) }))
    .filter((d) => d.n >= 5)
    .sort((a, b) => b.n - a.n);

  const sinFecha = total - conFecha.length;
  const confirmadas = vigentes.filter(
    (e) => e.estadoFechas === "Confirmadas"
  ).length;
  const verificados = vigentes.filter((e) => e.verificado).length;

  // Cuántas organizaciones distintas hay detrás. Se compara el texto pelado,
  // así que "Messe Frankfurt Argentina" y "Messe Frankfurt Argentina S.A."
  // cuentan como dos: es una cota superior y se dice así en la página.
  const organizadores = new Set(
    vigentes
      .map((e) => String(e.organizador || "").trim().toLowerCase())
      .filter(Boolean)
  ).size;

  return {
    hoy,
    total,
    conFecha: conFecha.length,
    sinFecha,
    confirmadas,
    verificados,
    organizadores,
    porMes,
    enLosDoceMeses,
    pico,
    bimestre,
    porTipo,
    porPais,
    porProvincia,
    argentinos: argentinos.length,
    porDuracion,
  };
}

// Las mismas cifras, en una tabla que se puede abrir en una planilla.
//
// Es la mitad del asunto: un dato que no se puede bajar y revisar es una
// afirmación, no una fuente.
export function radiografiaCSV(r) {
  const filas = [["corte", "categoria", "eventos"]];
  for (const m of r.porMes) filas.push(["mes", m.mes, m.n]);
  for (const t of r.porTipo) filas.push(["tipo", t.valor, t.n]);
  for (const p of r.porPais) filas.push(["pais", p.valor, p.n]);
  for (const p of r.porProvincia) filas.push(["provincia_argentina", p.valor, p.n]);
  for (const d of r.porDuracion) {
    filas.push(["duracion_mediana_dias", d.tipo, d.mediana]);
    filas.push(["duracion_casos_medidos", d.tipo, d.n]);
  }
  filas.push(["resumen", "eventos_por_delante", r.total]);
  filas.push(["resumen", "con_fecha_anunciada", r.conFecha]);
  filas.push(["resumen", "sin_fecha_anunciada", r.sinFecha]);
  filas.push(["resumen", "fechas_confirmadas", r.confirmadas]);
  filas.push(["resumen", "verificados_por_el_organizador", r.verificados]);
  filas.push(["resumen", "organizadores_distintos", r.organizadores]);
  filas.push(["resumen", "fecha_de_corte", r.hoy]);

  // Punto y coma: es lo que Excel en español espera, y estos archivos los va a
  // abrir gente del rubro, no gente que sabe importar un CSV.
  return filas
    .map((f) =>
      f
        .map((c) => {
          const t = String(c);
          return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
        })
        .join(";")
    )
    .join("\n");
}
