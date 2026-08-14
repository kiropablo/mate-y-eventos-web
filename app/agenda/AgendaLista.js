"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// Lista de eventos con filtros por tipo, país y provincia.
// Recibe los datos ya resueltos desde el servidor.
export default function AgendaLista({ proximos, pasados }) {
  const [tipo, setTipo] = useState("");
  const [pais, setPais] = useState("");
  const [provincia, setProvincia] = useState("");
  const [verPasados, setVerPasados] = useState(false);

  const todos = useMemo(() => [...proximos, ...pasados], [proximos, pasados]);

  const tipos = useMemo(
    () => unicos(todos.map((e) => e.tipo)),
    [todos]
  );
  const paises = useMemo(
    () => unicos(todos.map((e) => e.pais)),
    [todos]
  );
  const provincias = useMemo(
    () =>
      unicos(
        todos
          .filter((e) => !pais || e.pais === pais)
          .map((e) => e.provincia)
      ),
    [todos, pais]
  );

  const filtrar = (lista) =>
    lista.filter(
      (e) =>
        (!tipo || e.tipo === tipo) &&
        (!pais || e.pais === pais) &&
        (!provincia || e.provincia === provincia)
    );

  const proximosVisibles = filtrar(proximos);
  const pasadosVisibles = filtrar(pasados);

  return (
    <>
      <div className="ag-filtros reveal">
        <div className="ag-chips" role="group" aria-label="Filtrar por tipo">
          <button
            className={tipo === "" ? "chip chip--on" : "chip"}
            onClick={() => setTipo("")}
          >
            Todos
          </button>
          {tipos.map((t) => (
            <button
              key={t}
              className={tipo === t ? "chip chip--on" : "chip"}
              onClick={() => setTipo(tipo === t ? "" : t)}
            >
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
        </div>
      </div>

      {proximosVisibles.length === 0 ? (
        <div className="hold reveal" style={{ marginTop: "26px" }}>
          <span className="tag">Sin resultados</span>
          <p>No hay próximos eventos con esos filtros. Probá con otros.</p>
        </div>
      ) : (
        <div className="ag-grid">
          {proximosVisibles.map((ev) => (
            <EventoCard key={ev.slug} ev={ev} />
          ))}
        </div>
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
            <div className="ag-grid" style={{ marginTop: "26px" }}>
              {pasadosVisibles.map((ev) => (
                <EventoCard key={ev.slug} ev={ev} pasado />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function EventoCard({ ev, pasado = false }) {
  const lugar = [ev.ciudad, ev.provincia, ev.pais].filter(Boolean).join(", ");
  return (
    <article className={pasado ? "ev-card ev-card--pasado" : "ev-card"}>
      <Link href={`/agenda/${ev.slug}`}>
        <div className="ev-card__meta">
          {ev.tipo ? <span className="art-eje">{ev.tipo}</span> : null}
          {ev.destacado && !pasado ? (
            <span className="ev-star" title="Destacado">
              ★
            </span>
          ) : null}
          <span className="ev-card__fecha">
            {ev.fechas}
            {ev.estadoFechas === "Estimadas" ? " · a confirmar" : ""}
          </span>
        </div>
        <h2 className="ev-card__titulo">{ev.nombre}</h2>
        {ev.descCorta ? (
          <p className="ev-card__bajada">{ev.descCorta}</p>
        ) : null}
        {lugar ? <div className="ev-card__pie">{lugar}</div> : null}
      </Link>
    </article>
  );
}

function unicos(lista) {
  return [...new Set(lista.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}
