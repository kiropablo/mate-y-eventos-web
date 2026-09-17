"use client";

import { useState } from "react";

// El repaso de la ficha, dato por dato. Mismo mecanismo y mismo aspecto que el
// que usan los organizadores con su evento.
//
// Cada fila arranca SIN tildar a propósito. Si vinieran todas tildadas, el
// camino cómodo sería mandar sin leer, y entonces "el invitado lo validó" no
// significaría nada. Para el caso normal —está todo bien— hay un "confirmar
// todo" arriba: sigue siendo un clic, pero es un clic deliberado.
//
// No pide el mail, a diferencia del de organizadores: acá ya lo tenemos, que es
// justamente cómo llegó este link a su casilla.

export default function ConfirmarInvitado({ slug, firma, nombre, filas }) {
  const [revisiones, setRevisiones] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  const marcar = (clave, ok) =>
    setRevisiones((p) => ({ ...p, [clave]: { ...p[clave], ok } }));

  const corregir = (clave, correccion) =>
    setRevisiones((p) => ({ ...p, [clave]: { ...p[clave], ok: false, correccion } }));

  function confirmarTodo() {
    const nuevo = {};
    for (const f of filas) nuevo[f.clave] = { ok: true };
    setRevisiones(nuevo);
  }

  const tocados = filas.filter(
    (f) =>
      revisiones[f.clave]?.ok ||
      String(revisiones[f.clave]?.correccion || "").trim()
  ).length;

  async function enviar() {
    setEnviando(true);
    setError("");
    try {
      const res = await fetch(
        `/api/invitados/${encodeURIComponent(slug)}/confirmar?f=${encodeURIComponent(firma)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revisiones }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      setListo(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="cf-listo">
        <h2>Listo, nos llegó</h2>
        <p>
          Gracias por repasar tu ficha, <strong>{nombre}</strong>. Aplicamos lo
          que nos marcaste y recién ahí la publicamos.
        </p>
        <p className="cf-nota">
          Si te olvidaste de algo o querés cambiar otra cosa, respondé el mail
          que te mandamos y lo corregimos.
        </p>
      </div>
    );
  }

  return (
    <div className="cf-caja">
      <div className="cf-todo">
        <button type="button" className="btn btn--ghost" onClick={confirmarTodo}>
          Está todo bien, confirmar los {filas.length} datos
        </button>
        <span className="cf-cuenta">
          {tocados} de {filas.length} revisados
        </span>
      </div>

      <ul className="cf-filas">
        {filas.map((f) => {
          const r = revisiones[f.clave] || {};
          const corrigiendo = r.ok === false;
          return (
            <li key={f.clave} className="cf-fila" data-ok={r.ok ? "si" : "no"}>
              <div className="cf-fila-dato">
                <span className="cf-fila-rotulo">{f.rotulo}</span>
                {f.falta ? (
                  <span className="cf-falta">Esto no lo tenemos</span>
                ) : (
                  <span className="cf-fila-valor">{f.valor}</span>
                )}
                {f.ayuda ? <span className="cf-ayuda">{f.ayuda}</span> : null}
              </div>

              <div className="cf-fila-acciones">
                {!f.falta ? (
                  <label className="cf-check">
                    <input
                      type="checkbox"
                      checked={Boolean(r.ok)}
                      onChange={(e) => marcar(f.clave, e.target.checked)}
                    />
                    <span>Está bien</span>
                  </label>
                ) : null}
                <button
                  type="button"
                  className="cf-corregir"
                  onClick={() => corregir(f.clave, r.correccion || "")}
                >
                  {f.falta ? "Completar" : "Corregir"}
                </button>
              </div>

              {corrigiendo ? (
                <textarea
                  className="cf-fila-input"
                  rows={f.clave === "cuerpo" ? 6 : 2}
                  value={r.correccion || ""}
                  autoFocus
                  onChange={(e) => corregir(f.clave, e.target.value)}
                  placeholder={
                    f.clave === "redes"
                      ? "Un link por línea"
                      : f.falta
                        ? "Escribilo vos"
                        : "Escribí cómo tiene que decir"
                  }
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="cf-botones">
        <button
          type="button"
          className="btn"
          onClick={enviar}
          disabled={enviando || tocados === 0}
        >
          {enviando ? "Enviando…" : "Enviar"}
        </button>
        {tocados === 0 ? (
          <span className="cf-cuenta">Marcá al menos un dato para enviar</span>
        ) : null}
      </div>

      {error ? <p className="cf-error">{error}</p> : null}
    </div>
  );
}
