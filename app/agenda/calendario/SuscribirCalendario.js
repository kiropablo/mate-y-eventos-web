"use client";

import { useEffect, useMemo, useState } from "react";
import { SITE } from "../../lib/site";
import { pasaFiltros, pelado } from "../../lib/agenda";

// Armador de la suscripción: elegís qué querés recibir y te da la URL,
// el botón de Google y el de Apple/Outlook, todo actualizado en vivo.
//
// Los filtros son acumulativos, igual que en /agenda: podés suscribirte a
// varios países o varios tipos de evento a la vez.

const HOST = SITE.url.replace(/^https?:\/\//, "");

export default function SuscribirCalendario({ eventos, tipos: tiposDisponibles, paises: paisesDisponibles }) {
  const [tipos, setTipos] = useState([]);
  const [paises, setPaises] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [copiado, setCopiado] = useState(false);

  // Las provincias que se ofrecen dependen de los países elegidos.
  const provinciasDisponibles = useMemo(
    () =>
      unicos(
        eventos
          .filter((e) => paises.length === 0 || estaEn(e.pais, paises))
          .map((e) => e.provincia)
      ),
    [eventos, paises]
  );

  const seleccion = { tipos, paises, provincias };
  const cuantos = eventos.filter((e) => pasaFiltros(e, seleccion)).length;

  const ruta = useMemo(() => {
    const q = new URLSearchParams();
    tipos.forEach((t) => q.append("tipo", t));
    paises.forEach((p) => q.append("pais", p));
    provincias.forEach((p) => q.append("provincia", p));
    const s = q.toString();
    return `/api/agenda/ics${s ? `?${s}` : ""}`;
  }, [tipos, paises, provincias]);

  const urlHttps = `${SITE.url}${ruta}`;
  const urlWebcal = `webcal://${HOST}${ruta}`;
  const urlGoogle = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(urlWebcal)}`;

  const hayFiltros = tipos.length || paises.length || provincias.length;

  // Suma o saca un valor de una lista de filtros. Siempre con la forma
  // funcional: si leyera la lista del render actual, dos clics seguidos
  // antes de que React vuelva a dibujar perderían uno.
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
  // corresponden.
  useEffect(() => {
    setProvincias((previas) => {
      const validas = previas.filter((p) =>
        provinciasDisponibles.some((d) => pelado(d) === pelado(p))
      );
      return validas.length === previas.length ? previas : validas;
    });
  }, [provinciasDisponibles]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(urlHttps);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <>
      <div className="sus-caja reveal">
        <h2 className="ev-h2" style={{ marginTop: 0 }}>
          1. Elegí qué querés seguir
        </h2>
        <p className="sus-ayuda">
          Si no tocás nada, te suscribís a la agenda completa. Podés marcar
          varios tipos, países y provincias a la vez: se suman entre ellos.
        </p>

        <div className="ag-chips" style={{ marginTop: "18px" }} role="group" aria-label="Filtrar por tipo de evento">
          {tiposDisponibles.map((t) => {
            const puesto = tipos.some((v) => pelado(v) === pelado(t));
            return (
              <button
                key={t}
                className={puesto ? "chip chip--on" : "chip"}
                aria-pressed={puesto}
                onClick={() => alternarTipo(t)}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="ag-selects" style={{ marginTop: "14px" }}>
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
          {hayFiltros ? (
            <button
              className="chip chip--limpiar"
              onClick={() => {
                setTipos([]);
                setPaises([]);
                setProvincias([]);
              }}
            >
              ✕ Borrar filtros
            </button>
          ) : null}
        </div>

        {paises.length > 0 || provincias.length > 0 ? (
          <div className="ag-elegidos" role="group" aria-label="Filtros de lugar puestos">
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

        <p className="sus-cuenta">
          {cuantos === 0
            ? "Ningún evento con estos filtros — probá con menos."
            : `${cuantos} ${cuantos === 1 ? "evento" : "eventos"} en tu calendario`}
        </p>
      </div>

      <div className="sus-caja reveal" style={{ transitionDelay: ".05s" }}>
        <h2 className="ev-h2" style={{ marginTop: 0 }}>
          2. Agregalo a tu calendario
        </h2>

        <div className="sus-botones">
          <a
            className="btn"
            href={urlGoogle}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Calendar
          </a>
          <a className="btn btn--ghost" href={urlWebcal}>
            Apple Calendario / Outlook
          </a>
        </div>

        <p className="sus-ayuda" style={{ marginTop: "22px" }}>
          ¿Preferís hacerlo a mano? Copiá esta dirección y pegala donde tu
          calendario pida “agregar desde una URL”.
        </p>

        <div className="sus-url">
          <code>{urlHttps}</code>
          <button className="chip" onClick={copiar}>
            {copiado ? "✓ Copiada" : "Copiar"}
          </button>
        </div>
      </div>
    </>
  );
}

function unicos(lista) {
  return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function estaEn(valor, elegidos) {
  if (!elegidos || elegidos.length === 0) return true;
  return elegidos.some((e) => pelado(e) === pelado(valor));
}
