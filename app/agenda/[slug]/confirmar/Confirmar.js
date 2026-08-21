"use client";

import { useState } from "react";

// El repaso de la ficha, dato por dato.
//
// Cada fila arranca SIN tildar a propósito. Si vinieran todas tildadas, el
// camino cómodo sería mandar sin leer, y el sello dejaría de significar algo.
// Para el caso normal —está todo bien— hay un "confirmar todo" arriba: sigue
// siendo un clic, pero es un clic deliberado.

export default function Confirmar({ slug, firma, nombre, filas }) {
  const [revisiones, setRevisiones] = useState({});
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  const marcar = (clave, ok) =>
    setRevisiones((p) => ({ ...p, [clave]: { ...p[clave], ok } }));

  const corregir = (clave, correccion) =>
    setRevisiones((p) => ({ ...p, [clave]: { ...p[clave], ok: false, correccion } }));

  const todoBien = filas.every((f) => revisiones[f.clave]?.ok);

  function confirmarTodo() {
    const nuevo = {};
    for (const f of filas) nuevo[f.clave] = { ok: true };
    setRevisiones(nuevo);
  }

  const tocados = filas.filter(
    (f) => revisiones[f.clave]?.ok || String(revisiones[f.clave]?.correccion || "").trim()
  ).length;

  async function enviar() {
    setEnviando(true);
    setError("");
    try {
      const res = await fetch(
        `/api/agenda/${encodeURIComponent(slug)}/confirmar?f=${encodeURIComponent(firma)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revisiones, email }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      setListo(true);
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
          Gracias por repasar la ficha de <strong>{nombre}</strong>. La miramos
          nosotros, aplicamos lo que nos marcaste y ahí encendemos el sello.
        </p>
        <p className="cf-nota">
          {email
            ? "Te escribimos a ese mail cuando esté."
            : "Si querés que te avisemos cuando esté, respondé el mail que te mandamos."}
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
                  <span className="cf-falta">
                    {f.esImagen
                      ? "No tenemos el logo del evento"
                      : "Este dato no lo tenemos"}
                  </span>
                ) : f.esImagen ? (
                  /* El logo se mira, no se lee. Va como <img> suelto y no con
                     el componente de Next porque acá la imagen viene de
                     Airtable con un link que vence. */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="cf-logo" src={f.valor} alt="Logo del evento" />
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
                  rows={f.clave === "descripcion" ? 3 : 2}
                  value={r.correccion || ""}
                  autoFocus
                  onChange={(e) => corregir(f.clave, e.target.value)}
                  placeholder={
                    f.esImagen
                      ? "Pegá el link a tu logo, o escribí «te lo mando por mail»"
                      : f.falta
                        ? "Escribí el dato"
                        : "Escribí cómo tiene que decir"
                  }
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <label className="cf-campo">
        <span>Tu email {todoBien ? "" : "(opcional)"}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="para avisarte cuando quede publicado"
          autoComplete="email"
        />
      </label>

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
