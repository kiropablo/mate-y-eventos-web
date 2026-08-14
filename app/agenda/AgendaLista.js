"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TIPO_COLOR, MESES_LARGO } from "../lib/agenda";

// Agenda con dos vistas — lista compacta y calendario — que comparten
// los mismos filtros (tipo, país, provincia y fecha puntual).

const HOY = new Date();
const hoyISO = iso(HOY.getFullYear(), HOY.getMonth() + 1, HOY.getDate());

export default function AgendaLista({ proximos, pasados }) {
  const [vista, setVista] = useState("lista");
  const [tipo, setTipo] = useState("");
  const [pais, setPais] = useState("");
  const [provincia, setProvincia] = useState("");
  const [fecha, setFecha] = useState(""); // filtro por día puntual (desde el calendario)
  const [verPasados, setVerPasados] = useState(false);

  const todos = useMemo(() => [...proximos, ...pasados], [proximos, pasados]);
  const tipos = useMemo(() => unicos(todos.map((e) => e.tipo)), [todos]);
  const paises = useMemo(() => unicos(todos.map((e) => e.pais)), [todos]);
  const provincias = useMemo(
    () =>
      unicos(
        todos.filter((e) => !pais || e.pais === pais).map((e) => e.provincia)
      ),
    [todos, pais]
  );

  const hayFiltros = tipo || pais || provincia || fecha;

  const borrarFiltros = () => {
    setTipo("");
    setPais("");
    setProvincia("");
    setFecha("");
  };

  const pasaFiltros = (e) =>
    (!tipo || e.tipo === tipo) &&
    (!pais || e.pais === pais) &&
    (!provincia || e.provincia === provincia) &&
    (!fecha || enDia(e, fecha));

  const proximosVisibles = proximos.filter(pasaFiltros);
  const pasadosVisibles = pasados.filter(pasaFiltros);

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
          <Link className="btn btn--chico" href="/agenda/sugerir">
            + Sugerir evento
          </Link>
        </div>
      </div>

      {/* Filtros compartidos */}
      <div className="ag-filtros reveal">
        <div className="ag-chips" role="group" aria-label="Filtrar por tipo">
          {tipos.map((t) => (
            <button
              key={t}
              className={tipo === t ? "chip chip--on" : "chip"}
              onClick={() => setTipo(tipo === t ? "" : t)}
            >
              <span className="dot" style={{ background: color(t) }} />
              {t}
            </button>
          ))}
        </div>
        <div className="ag-selects">
          <select
            className="ag-select"
            value={pais}
            aria-label="Filtrar por país"
            onChange={(e) => {
              setPais(e.target.value);
              setProvincia("");
            }}
          >
            <option value="">Todos los países</option>
            {paises.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            className="ag-select"
            value={provincia}
            aria-label="Filtrar por provincia o región"
            onChange={(e) => setProvincia(e.target.value)}
          >
            <option value="">Todas las provincias</option>
            {provincias.map((p) => (
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
      </div>

      {vista === "calendario" ? (
        <Calendario
          eventos={todos.filter(
            (e) =>
              e.fechaInicio &&
              (!tipo || e.tipo === tipo) &&
              (!pais || e.pais === pais) &&
              (!provincia || e.provincia === provincia)
          )}
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
              {verPasados && (
                <div style={{ marginTop: "22px", textAlign: "left" }}>
                  <ListaCompacta eventos={pasadosVisibles} pasado />
                </div>
              )}
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
      const clave = e.fechaInicio ? e.fechaInicio.slice(0, 7) : "por-anunciar";
      if (!map.has(clave)) map.set(clave, []);
      map.get(clave).push(e);
    }
    return [...map.entries()];
  }, [eventos]);

  return (
    <div className="ag-meses">
      {grupos.map(([clave, lista]) => (
        <section key={clave}>
          <h2 className="ag-mes">
            {clave === "por-anunciar"
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
                  </span>
                  <span className="ag-fila__meta">
                    {[ev.ciudad || ev.provincia, ev.pais]
                      .filter(Boolean)
                      .join(", ")}
                    {ev.estadoFechas === "Estimadas" ? " · a confirmar" : ""}
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

function Calendario({ eventos, onDia }) {
  const [anio, setAnio] = useState(HOY.getFullYear());
  const [mes, setMes] = useState(HOY.getMonth() + 1); // 1-12

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

// "12" o "12–14" para la columna de fecha de la lista.
function diaCorto(ev) {
  const di = Number(ev.fechaInicio.slice(8, 10));
  if (!ev.fechaFin || ev.fechaFin === ev.fechaInicio) return String(di);
  const df = Number(ev.fechaFin.slice(8, 10));
  if (ev.fechaFin.slice(0, 7) === ev.fechaInicio.slice(0, 7))
    return `${di}–${df}`;
  return `${di}→`;
}

function fechaLinda(diaISO) {
  const [a, m, d] = diaISO.split("-").map(Number);
  return `${d} ${MESES_LARGO[m - 1].slice(0, 3).toLowerCase()} ${a}`;
}
