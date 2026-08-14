"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [hidratado, setHidratado] = useState(false);

  // Al entrar, recuperamos los filtros de la URL. Así el botón "atrás"
  // del navegador devuelve la agenda como estaba y se puede compartir
  // un link ya filtrado.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("vista") === "calendario") setVista("calendario");
    if (q.get("tipo")) setTipo(q.get("tipo"));
    if (q.get("pais")) setPais(q.get("pais"));
    if (q.get("provincia")) setProvincia(q.get("provincia"));
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.get("fecha") || "")) setFecha(q.get("fecha"));
    setHidratado(true);
  }, []);

  // Y cada cambio queda escrito en la URL, sin recargar la página.
  useEffect(() => {
    if (!hidratado) return;
    const q = new URLSearchParams();
    if (vista === "calendario") q.set("vista", "calendario");
    if (tipo) q.set("tipo", tipo);
    if (pais) q.set("pais", pais);
    if (provincia) q.set("provincia", provincia);
    if (fecha) q.set("fecha", fecha);
    const s = q.toString();
    window.history.replaceState(
      null,
      "",
      s ? `${window.location.pathname}?${s}` : window.location.pathname
    );
  }, [hidratado, vista, tipo, pais, provincia, fecha]);

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

  // Comparación tolerante: un espacio de más en Airtable no tiene por qué
  // romper un filtro.
  const igual = (a, b) =>
    String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

  const pasaFiltros = (e) =>
    (!tipo || igual(e.tipo, tipo)) &&
    (!pais || igual(e.pais, pais)) &&
    (!provincia || igual(e.provincia, provincia)) &&
    (!fecha || enDia(e, fecha));

  const proximosVisibles = proximos.filter(pasaFiltros);
  const pasadosVisibles = pasados.filter(pasaFiltros);

  // Los que puede dibujar el calendario (necesitan fecha), ya filtrados.
  const eventosCalendario = todos.filter(
    (e) =>
      e.fechaInicio &&
      (!tipo || igual(e.tipo, tipo)) &&
      (!pais || igual(e.pais, pais)) &&
      (!provincia || igual(e.provincia, provincia))
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

      <p className="ag-cuenta">
        {proximosVisibles.length === 0
          ? "Ningún evento con estos filtros"
          : `${proximosVisibles.length} ${proximosVisibles.length === 1 ? "evento" : "eventos"}`}
        {hayFiltros ? " · filtrado" : ""}
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
    // Meses en orden, y los que no tienen fecha siempre al final.
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "por-anunciar") return 1;
      if (b === "por-anunciar") return -1;
      return a.localeCompare(b);
    });
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
