"use client";

import { useState } from "react";

// Los dos botones que ve el organizador. Uno confirma, el otro abre el
// cuadro para escribir qué hay que corregir.
//
// El mail es opcional a propósito: pedirlo como obligatorio para confirmar
// convertiría un trámite de un clic en un formulario, y el clic es todo lo
// que le pedimos.

export default function Confirmar({ slug, firma, nombre }) {
  const [modo, setModo] = useState("");
  const [email, setEmail] = useState("");
  const [correcciones, setCorrecciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState("");
  const [error, setError] = useState("");

  async function enviar(confirma) {
    setEnviando(true);
    setError("");
    try {
      const res = await fetch(
        `/api/agenda/${encodeURIComponent(slug)}/confirmar?f=${encodeURIComponent(firma)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirma, email, correcciones }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      setListo(confirma ? "confirmado" : "correcciones");
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (listo === "confirmado") {
    return (
      <div className="cf-listo">
        <h2>Listo, quedó verificado</h2>
        <p>
          Ya encendimos el sello en la ficha de <strong>{nombre}</strong>. Si nos
          diste tu mail, te escribimos cuando lo publiquemos en nuestras redes.
        </p>
        <p className="cf-nota">
          Gracias por el minuto. Cualquier cambio que surja más adelante,
          respondé el mail que te mandamos y lo corregimos.
        </p>
      </div>
    );
  }

  if (listo === "correcciones") {
    return (
      <div className="cf-listo">
        <h2>Anotado, gracias</h2>
        <p>
          Nos llegó lo que hay que corregir de <strong>{nombre}</strong>. Lo
          revisamos y te escribimos cuando esté arreglado.
        </p>
      </div>
    );
  }

  return (
    <div className="cf-caja">
      {modo !== "corregir" ? (
        <>
          <label className="cf-campo">
            <span>Tu email (opcional)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="para avisarte cuando lo difundamos"
              autoComplete="email"
            />
          </label>

          <div className="cf-botones">
            <button
              type="button"
              className="btn"
              onClick={() => enviar(true)}
              disabled={enviando}
            >
              {enviando ? "Guardando…" : "Está todo bien"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setModo("corregir")}
              disabled={enviando}
            >
              Hay algo para corregir
            </button>
          </div>
        </>
      ) : (
        <>
          <label className="cf-campo">
            <span>¿Qué hay que corregir?</span>
            <textarea
              rows={5}
              value={correcciones}
              onChange={(e) => setCorrecciones(e.target.value)}
              placeholder="Las fechas cambiaron, la sede es otra, el contacto ya no responde…"
            />
          </label>
          <label className="cf-campo">
            <span>Tu email (opcional)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="para avisarte cuando esté corregido"
              autoComplete="email"
            />
          </label>

          <div className="cf-botones">
            <button
              type="button"
              className="btn"
              onClick={() => enviar(false)}
              disabled={enviando || !correcciones.trim()}
            >
              {enviando ? "Enviando…" : "Enviar la corrección"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setModo("")}
              disabled={enviando}
            >
              Volver
            </button>
          </div>
        </>
      )}

      {error ? <p className="cf-error">{error}</p> : null}
    </div>
  );
}
