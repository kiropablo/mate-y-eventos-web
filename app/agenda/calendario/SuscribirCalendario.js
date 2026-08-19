"use client";

import { useMemo, useState } from "react";
import { SITE } from "../../lib/site";

// Armador de la suscripción: elegís qué querés recibir y te da la URL,
// el botón de Google y el de Apple/Outlook, todo actualizado en vivo.

const HOST = SITE.url.replace(/^https?:\/\//, "");

export default function SuscribirCalendario({ eventos, tipos, paises }) {
  const [tipo, setTipo] = useState("");
  const [pais, setPais] = useState("");
  const [provincia, setProvincia] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Las provincias que se ofrecen dependen del país elegido.
  const provincias = useMemo(
    () =>
      unicos(
        eventos
          .filter((e) => !pais || igual(e.pais, pais))
          .map((e) => e.provincia)
      ),
    [eventos, pais]
  );

  const cuantos = eventos.filter(
    (e) =>
      (!tipo || igual(e.tipo, tipo)) &&
      (!pais || igual(e.pais, pais)) &&
      (!provincia || igual(e.provincia, provincia))
  ).length;

  const ruta = useMemo(() => {
    const q = new URLSearchParams();
    if (tipo) q.set("tipo", tipo);
    if (pais) q.set("pais", pais);
    if (provincia) q.set("provincia", provincia);
    const s = q.toString();
    return `/api/agenda/ics${s ? `?${s}` : ""}`;
  }, [tipo, pais, provincia]);

  const urlHttps = `${SITE.url}${ruta}`;
  const urlWebcal = `webcal://${HOST}${ruta}`;
  const urlGoogle = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(urlWebcal)}`;

  const hayFiltros = Boolean(tipo || pais || provincia);

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
          Si no tocás nada, te suscribís a la agenda completa. Podés cambiar de
          idea después: te suscribís de nuevo con otro filtro.
        </p>

        <div className="ag-selects" style={{ marginTop: "18px" }}>
          <select
            className="ag-select"
            value={tipo}
            aria-label="Filtrar por tipo de evento"
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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
          {hayFiltros ? (
            <button
              className="chip chip--limpiar"
              onClick={() => {
                setTipo("");
                setPais("");
                setProvincia("");
              }}
            >
              ✕ Borrar filtros
            </button>
          ) : null}
        </div>

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

function igual(a, b) {
  return (
    String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase()
  );
}
