"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TIPO_COLOR, MESES_LARGO, pasaFiltros, pelado } from "../lib/agenda";

// Agenda con dos vistas — lista compacta y calendario — que comparten
// los mismos filtros (tipo, país, provincia y fecha puntual).
//
// Los filtros son acumulativos: se pueden elegir varios tipos, varios
// países y varias provincias a la vez. Dentro de un mismo filtro los
// valores suman (Córdoba o Santa Fe); entre filtros se cruzan.

const HOY = new Date();
const hoyISO = iso(HOY.getFullYear(), HOY.getMonth() + 1, HOY.getDate());

export default function AgendaLista({ proximos, pasados }) {
  const [vista, setVista] = useState("lista");
  const [tipos, setTipos] = useState([]);
  const [paises, setPaises] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [fecha, setFecha] = useState(""); // filtro por día puntual (desde el calendario)
  const [verPasados, setVerPasados] = useState(false);
  const [busca, setBusca] = useState("");
  const [hidratado, setHidratado] = useState(false);

  // Al entrar, recuperamos los filtros de la URL. Así el botón "atrás"
  // del navegador devuelve la agenda como estaba y se puede compartir
  // un link ya filtrado. Se repite el parámetro por cada valor elegido
  // (?pais=Argentina&pais=Brasil), así que un link viejo con un solo
  // valor sigue funcionando igual.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("vista") === "calendario") setVista("calendario");
    setTipos(q.getAll("tipo"));
    setPaises(q.getAll("pais"));
    setProvincias(q.getAll("provincia"));
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.get("fecha") || "")) setFecha(q.get("fecha"));
    setHidratado(true);
  }, []);

  // Y cada cambio queda escrito en la URL, sin recargar la página.
  useEffect(() => {
    if (!hidratado) return;
    const q = new URLSearchParams();
    if (vista === "calendario") q.set("vista", "calendario");
    tipos.forEach((t) => q.append("tipo", t));
    paises.forEach((p) => q.append("pais", p));
    provincias.forEach((p) => q.append("provincia", p));
    if (fecha) q.set("fecha", fecha);
    const s = q.toString();
    window.history.replaceState(
      null,
      "",
      s ? `${window.location.pathname}?${s}` : window.location.pathname
    );
  }, [hidratado, vista, tipos, paises, provincias, fecha]);

  const todos = useMemo(() => [...proximos, ...pasados], [proximos, pasados]);
  const tiposDisponibles = useMemo(() => unicos(todos.map((e) => e.tipo)), [todos]);
  const paisesDisponibles = useMemo(() => unicos(todos.map((e) => e.pais)), [todos]);

  // Las provincias que se ofrecen dependen de los países elegidos.
  const provinciasDisponibles = useMemo(
    () =>
      unicos(
        todos
          .filter((e) => paises.length === 0 || estaEn(e.pais, paises))
          .map((e) => e.provincia)
      ),
    [todos, paises]
  );

  const hayFiltros =
    tipos.length || paises.length || provincias.length || fecha || busca;

  const borrarFiltros = () => {
    setBusca("");
    setTipos([]);
    setPaises([]);
    setProvincias([]);
    setFecha("");
  };

  // Suma o saca un valor de una lista de filtros.
  //
  // Siempre con la forma funcional (previa => …) y nunca leyendo la lista
  // del render actual: si no, dos clics seguidos antes de que React vuelva
  // a dibujar leen los dos el mismo valor viejo y uno se pierde.
  const alternar = (poner) => (valor) => {
    if (!valor) return;
    poner((previa) =>
      previa.some((v) => pelado(v) === pelado(valor))
        ? previa.filter((v) => pelado(v) !== pelado(valor))
        : [...previa, valor]
    );
  };

  const alternarTipo = alternar(setTipos);
  const alternarPais = alternar(setPaises);
  const alternarProvincia = alternar(setProvincias);

  // Si cambian los países, se caen solas las provincias que ya no
  // corresponden. Devolvemos la misma lista cuando no hay nada que sacar,
  // para no disparar otro render al pedo.
  useEffect(() => {
    if (!hidratado) return;
    setProvincias((previas) => {
      const validas = previas.filter((p) =>
        provinciasDisponibles.some((d) => pelado(d) === pelado(p))
      );
      return validas.length === previas.length ? previas : validas;
    });
  }, [hidratado, provinciasDisponibles]);

  const seleccion = { tipos, paises, provincias };

  // Busca por nombre, ciudad, provincia y organizador, sin acentos ni mayúsculas.
  const termino = pelado(busca);
  const coincide = (e) =>
    !termino ||
    pelado(
      [e.nombre, e.ciudad, e.provincia, e.pais, e.tipo, e.descCorta]
        .filter(Boolean)
        .join(" ")
    ).includes(termino);

  const visible = (e) =>
    coincide(e) && pasaFiltros(e, seleccion) && (!fecha || enDia(e, fecha));

  const proximosVisibles = proximos.filter(visible);
  const pasadosVisibles = pasados.filter(visible);

  // Hasta seis destacados vigentes, respetando los filtros puestos.
  const destacados = proximosVisibles.filter((e) => e.destacado).slice(0, 6);

  // Los que puede dibujar el calendario (necesitan fecha), ya filtrados.
  const eventosCalendario = todos.filter(
    (e) => e.fechaInicio && pasaFiltros(e, seleccion)
  );

  // El calendario abre en el primer mes que tenga algo para mostrar,
  // no en el mes actual (que puede estar vacío).
  const mesInicial = useMemo(() => {
    if (fecha) return fecha.slice(0, 7);
    const futuros = eventosCalendario
      .map((e) => (e.fechaFin || e.fechaInicio) >= hoyISO ? e.fechaInicio : null)
      .filter(Boolean)
      .sort();
    const ref = futuros[0] || hoyISO;
    return ref < hoyISO ? hoyISO.slice(0, 7) : ref.slice(0, 7);
  }, [eventosCalendario, fecha]);

  // El "ver más…" del calendario: pasa a la lista filtrada por ese día.
  const irADia = (dia) => {
    setFecha(dia);
    setVista("lista");
  };

  return (
    <>
      {/* Barra superior: vistas + acciones */}
      <div className="ag-barra reveal">
        <div className="ag-vistas" role="tablist" aria-label="Vista">
          <button
            role="tab"
            aria-selected={vista === "lista"}
            className={vista === "lista" ? "chip chip--on" : "chip"}
            onClick={() => setVista("lista")}
          >
            Lista
          </button>
          <button
            role="tab"
            aria-selected={vista === "calendario"}
            className={vista === "calendario" ? "chip chip--on" : "chip"}
            onClick={() => setVista("calendario")}
          >
            Calendario
          </button>
        </div>
        <div className="ag-acciones">
          {hayFiltros ? (
            <button className="chip chip--limpiar" onClick={borrarFiltros}>
              ✕ Borrar filtros
            </button>
          ) : null}
          <Link className="btn btn--ghost btn--chico" href="/imperdibles">
            ★ Los imperdibles
          </Link>
          <Link
            className="btn btn--ghost btn--chico"
            href="/agenda/calendario"
          >
            Suscribirme al calendario
          </Link>
          <Link className="btn btn--chico" href="/agenda/sugerir">
            + Sugerir evento
          </Link>
        </div>
      </div>

      {/* Filtros compartidos */}
      <div className="ag-filtros reveal">
        <div className="ag-buscador">
          <input
            className="input ag-buscar"
            type="search"
            value={busca}
            placeholder="Buscar por nombre, ciudad o provincia…"
            aria-label="Buscar eventos"
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="ag-chips" role="group" aria-label="Filtrar por tipo">
          {tiposDisponibles.map((t) => {
            const puesto = tipos.some((v) => pelado(v) === pelado(t));
            return (
              <button
                key={t}
                className={puesto ? "chip chip--on" : "chip"}
                aria-pressed={puesto}
                onClick={() => alternarTipo(t)}
              >
                <span className="dot" style={{ background: color(t) }} />
                {t}
              </button>
            );
          })}
        </div>
        <div className="ag-selects">
          {/* Los desplegables suman: al elegir uno aparece como chip abajo
              y sale de la lista, así se pueden ir apilando. */}
          <select
            className="ag-select"
            value=""
            aria-label="Agregar un país al filtro"
            onChange={(e) => alternarPais(e.target.value)}
          >
            <option value="">
              {paises.length ? "Agregar otro país…" : "Todos los países"}
            </option>
            {paisesDisponibles
              .filter((p) => !paises.some((v) => pelado(v) === pelado(p)))
              .map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>
          <select
            className="ag-select"
            value=""
            aria-label="Agregar una provincia o región al filtro"
            onChange={(e) => alternarProvincia(e.target.value)}
          >
            <option value="">
              {provincias.length
                ? "Agregar otra provincia…"
                : "Todas las provincias"}
            </option>
            {provinciasDisponibles
              .filter((p) => !provincias.some((v) => pelado(v) === pelado(p)))
              .map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>
          {fecha ? (
            <button className="chip chip--on" onClick={() => setFecha("")}>
              {fechaLinda(fecha)} ✕
            </button>
          ) : null}
        </div>

        {paises.length > 0 || provincias.length > 0 ? (
          <div
            className="ag-elegidos"
            role="group"
            aria-label="Filtros de lugar puestos"
          >
            {paises.map((p) => (
              <button
                key={`pa-${p}`}
                className="chip chip--on"
                aria-label={`Quitar el país ${p}`}
                onClick={() => alternarPais(p)}
              >
                {p} ✕
              </button>
            ))}
            {provincias.map((p) => (
              <button
                key={`pr-${p}`}
                className="chip chip--on"
                aria-label={`Quitar la provincia ${p}`}
                onClick={() => alternarProvincia(p)}
              >
                {p} ✕
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {destacados.length > 0 && vista === "lista" ? (
        <section className="ag-dest">
          <h2 className="ag-dest__tit">★ Destacados</h2>
          {/* Si alguno de los que están arriba pagó por estar ahí, se dice.
              No declararlo sería vender publicidad disfrazada de curaduría, y
              además Google lo penaliza. */}
          {destacados.some((e) => e.destacadoPago) ? (
            <p className="ag-dest__aviso">
              Algunos de estos eventos contrataron este espacio.{" "}
              <a href="/sponsors">Cómo funciona</a>.
            </p>
          ) : null}
          <div className="ag-dest__tira">
            {destacados.map((ev) => (
              <Link key={ev.slug} href={`/agenda/${ev.slug}`} className="ag-dest__card">
                {ev.imagen ? (
                  <img src={ev.imagen} alt="" className="ag-dest__logo" loading="lazy" />
                ) : (
                  <span className="ag-dest__logo ag-dest__logo--vacio" aria-hidden>
                    <span className="dot" style={{ background: color(ev.tipo) }} />
                  </span>
                )}
                <span className="ag-dest__nombre">{ev.nombre}</span>
                {ev.destacadoPago ? (
                  <span className="ag-dest__pago">Espacio contratado</span>
                ) : null}
                <span className="ag-dest__meta">{ev.fechas}</span>
                <span className="ag-dest__meta">
                  {[ev.ciudad || ev.provincia, ev.pais].filter(Boolean).join(", ")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <p className="ag-cuenta">
        {proximosVisibles.length === 0
          ? "Ningún evento con estos filtros"
          : `${proximosVisibles.length} ${proximosVisibles.length === 1 ? "evento" : "eventos"}${hayFiltros ? " · filtrado" : ""}`}
      </p>

      {vista === "calendario" ? (
        <Calendario
          eventos={eventosCalendario}
          mesInicial={mesInicial}
          onDia={irADia}
        />
      ) : (
        <>
          {proximosVisibles.length === 0 ? (
            <div className="hold" style={{ marginTop: "8px" }}>
              <span className="tag">Sin resultados</span>
              <p>
                No hay próximos eventos con esos filtros.
                {hayFiltros ? " Probá borrarlos." : ""}
              </p>
            </div>
          ) : (
            <ListaCompacta eventos={proximosVisibles} />
          )}

          {pasadosVisibles.length > 0 && (
            <div className="ag-pasados">
              <button
                className="chip"
                aria-expanded={verPasados}
                onClick={() => setVerPasados((v) => !v)}
              >
                {verPasados
                  ? "Ocultar ediciones pasadas"
                  : `Ver ediciones pasadas (${pasadosVisibles.length})`}
              </button>
              {/* Siempre en el HTML, escondida con CSS y no con un if.
                  Antes se dibujaba solo después del clic, así que los links a
                  las ediciones pasadas no existían para un rastreador: esas
                  fichas quedaban en el sitemap sin un solo link interno que
                  llevara a ellas. Con hidden alcanza: el navegador no las
                  muestra y el buscador las encuentra igual. */}
              <div
                className="ag-pasados__lista"
                hidden={!verPasados}
                style={{ marginTop: "22px", textAlign: "left" }}
              >
                <ListaCompacta eventos={pasadosVisibles} pasado />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ---------- Vista 1: lista compacta agrupada por mes ---------- */

function ListaCompacta({ eventos, pasado = false }) {
  const grupos = useMemo(() => {
    const map = new Map();
    for (const e of eventos) {
      let clave;
      if (!e.fechaInicio) {
        clave = "por-anunciar";
      } else if (
        e.fechaInicio < hoyISO &&
        (e.fechaFin || e.fechaInicio) >= hoyISO
      ) {
        // Temporadas, campeonatos y cursos largos: empezaron hace meses pero
        // todavía están pasando. No van bajo el mes en que arrancaron.
        clave = "en-curso";
      } else {
        clave = e.fechaInicio.slice(0, 7);
      }
      if (!map.has(clave)) map.set(clave, []);
      map.get(clave).push(e);
    }
    // Lo que está pasando ahora arriba, después los meses en orden, y los
    // que todavía no tienen fecha al final.
    const orden = (k) => (k === "en-curso" ? 0 : k === "por-anunciar" ? 2 : 1);
    return [...map.entries()].sort(([a], [b]) => {
      if (orden(a) !== orden(b)) return orden(a) - orden(b);
      return a.localeCompare(b);
    });
  }, [eventos]);

  return (
    <div className="ag-meses">
      {grupos.map(([clave, lista]) => (
        <section key={clave}>
          <h2 className="ag-mes">
            {clave === "en-curso"
              ? "Sucediendo ahora"
              : clave === "por-anunciar"
                ? "Fechas por anunciar"
                : tituloMes(clave)}
          </h2>
          <div className="ag-tabla">
            {lista.map((ev) => (
              <Link
                href={`/agenda/${ev.slug}`}
                key={ev.slug}
                className={pasado ? "ag-fila ag-fila--pasado" : "ag-fila"}
              >
                <span className="ag-fila__fecha">
                  {ev.fechaInicio ? diaCorto(ev) : "—"}
                </span>
                <span className="ag-fila__cuerpo">
                  <span className="ag-fila__nombre">
                    <span
                      className="dot"
                      style={{ background: color(ev.tipo) }}
                    />
                    {ev.destacado && !pasado ? (
                      <span className="ev-star">★ </span>
                    ) : null}
                    {ev.nombre}
                    {ev.verificado ? (
                      <span
                        className="sello-mini"
                        title="Datos verificados por el organizador"
                      >
                        ✓
                      </span>
                    ) : null}
                  </span>
                  <span className="ag-fila__meta">
                    {[ev.ciudad || ev.provincia, ev.pais]
                      .filter(Boolean)
                      .join(", ")}
                    {ev.estadoFechas !== "Confirmadas" ? " · a confirmar" : ""}
                  </span>
                </span>
                <span className="ag-fila__flecha" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- Vista 2: calendario mensual ---------- */

const MAX_DOTS = 4;

function Calendario({ eventos, mesInicial, onDia }) {
  const [anio, setAnio] = useState(() => Number(mesInicial.slice(0, 4)));
  const [mes, setMes] = useState(() => Number(mesInicial.slice(5, 7))); // 1-12

  const mover = (paso) => {
    let m = mes + paso;
    let a = anio;
    if (m < 1) {
      m = 12;
      a -= 1;
    }
    if (m > 12) {
      m = 1;
      a += 1;
    }
    setMes(m);
    setAnio(a);
  };

  // Eventos activos por día del mes visible.
  const porDia = useMemo(() => {
    const map = new Map();
    const dias = new Date(anio, mes, 0).getDate();
    for (let d = 1; d <= dias; d++) {
      const clave = iso(anio, mes, d);
      const del = eventos.filter((e) => enDia(e, clave));
      if (del.length) map.set(clave, del);
    }
    return map;
  }, [eventos, anio, mes]);

  const dias = new Date(anio, mes, 0).getDate();
  // Lunes = 0 … Domingo = 6
  const arranque = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;
  const celdas = [];
  for (let i = 0; i < arranque; i++) celdas.push(null);
  for (let d = 1; d <= dias; d++) celdas.push(d);

  const tiposDelMes = unicos([...porDia.values()].flat().map((e) => e.tipo));

  return (
    <div className="cal">
      <div className="cal-cab">
        <button
          className="chip"
          onClick={() => mover(-1)}
          aria-label="Mes anterior"
        >
          ←
        </button>
        <h2 className="ag-mes" style={{ margin: 0 }}>
          {MESES_LARGO[mes - 1]} {anio}
        </h2>
        <button
          className="chip"
          onClick={() => mover(1)}
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div className="cal-grid cal-grid--dias">
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
          <span className="cal-dia-nombre" key={d}>
            {d}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {celdas.map((d, i) => {
          if (!d)
            return <span key={`v${i}`} className="cal-celda cal-celda--vacia" />;
          const clave = iso(anio, mes, d);
          const del = porDia.get(clave) || [];
          const esHoy = clave === hoyISO;
          const conEventos = del.length > 0;
          return (
            <button
              key={clave}
              className={[
                "cal-celda",
                esHoy ? "cal-celda--hoy" : "",
                conEventos ? "cal-celda--eventos" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={!conEventos}
              onClick={() => onDia(clave)}
              aria-label={
                conEventos
                  ? `${del.length} evento${del.length > 1 ? "s" : ""} el ${d}`
                  : undefined
              }
            >
              <span className="cal-num">{d}</span>
              {conEventos && (
                <span className="cal-dots">
                  {del.slice(0, MAX_DOTS).map((e, j) => (
                    <span
                      key={j}
                      className="dot"
                      style={{ background: color(e.tipo) }}
                    />
                  ))}
                </span>
              )}
              {del.length > MAX_DOTS && <span className="cal-mas">ver más…</span>}
            </button>
          );
        })}
      </div>

      {tiposDelMes.length > 0 && (
        <div className="cal-leyenda">
          {tiposDelMes.map((t) => (
            <span key={t}>
              <span className="dot" style={{ background: color(t) }} />
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Helpers ---------- */

function color(tipo) {
  return TIPO_COLOR[tipo] || "#9aa3b2";
}

// ¿El valor está en la lista de elegidos? (sin distinguir acentos)
// pelado() viene de lib/agenda para no tener dos criterios distintos dando
// vueltas por el mismo problema.
function estaEn(valor, elegidos) {
  if (!elegidos || elegidos.length === 0) return true;
  return elegidos.some((e) => pelado(e) === pelado(valor));
}

function unicos(lista) {
  return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function iso(a, m, d) {
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ¿El evento está activo el día dado? (rango inicio–fin inclusive)
function enDia(e, dia) {
  if (!e.fechaInicio) return false;
  const fin = e.fechaFin || e.fechaInicio;
  return e.fechaInicio <= dia && dia <= fin;
}

function tituloMes(claveYYYYMM) {
  const [a, m] = claveYYYYMM.split("-").map(Number);
  return `${MESES_LARGO[m - 1]} ${a}`;
}

// "12", "12–14" o "29 abr–11 may" para la columna de fecha de la lista.
function diaCorto(ev) {
  const di = Number(ev.fechaInicio.slice(8, 10));
  if (!ev.fechaFin || ev.fechaFin === ev.fechaInicio) return String(di);
  const df = Number(ev.fechaFin.slice(8, 10));
  if (ev.fechaFin.slice(0, 7) === ev.fechaInicio.slice(0, 7))
    return `${di}–${df}`;
  return `${di} ${mesCorto(ev.fechaInicio)}–${df} ${mesCorto(ev.fechaFin)}`;
}

function mesCorto(fechaISO) {
  return MESES_LARGO[Number(fechaISO.slice(5, 7)) - 1]
    .slice(0, 3)
    .toLowerCase();
}

function fechaLinda(diaISO) {
  const [a, m, d] = diaISO.split("-").map(Number);
  return `${d} ${MESES_LARGO[m - 1].slice(0, 3).toLowerCase()} ${a}`;
}
