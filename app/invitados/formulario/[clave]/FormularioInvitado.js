"use client";

import { useState } from "react";

// El formulario en sí. Es cliente porque tiene estado y manda el pedido; la
// página que lo envuelve es de servidor y es la que valida la clave del link.

export default function FormularioInvitado({ clave, contacto, preguntas }) {
  const [valores, setValores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  const poner = (id, v) => setValores((p) => ({ ...p, [id]: v }));

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/invitados/formulario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave, valores }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data?.error || "No se pudo enviar.");
      setListo(true);
      // Arriba de todo: el cartel de "listo" está al principio del formulario y
      // si no, alguien que llenó diez preguntas largas no lo ve nunca.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <section className="sem-bloque">
        <h2 className="ag-mes">Listo, nos llegó</h2>
        <p className="sem-nota">
          Gracias. Lo leemos antes de grabar. Si necesitamos algo más te
          escribimos al mail que dejaste, y cuando tu ficha esté armada te la
          mandamos para que la revises antes de que salga publicada.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={enviar}>
      <section className="sem-bloque">
        <h2 className="ag-mes">Tus datos</h2>
        {contacto.map((c) => (
          <div className="form-campo" key={c.id}>
            <label htmlFor={`f-${c.id}`}>
              {c.rotulo}
              {c.requerido ? " *" : ""}
              {c.privado ? <span className="form-privado">no se publica</span> : null}
            </label>
            {c.tipo === "area" ? (
              <textarea
                id={`f-${c.id}`}
                value={valores[c.id] || ""}
                onChange={(e) => poner(c.id, e.target.value)}
              />
            ) : (
              <input
                id={`f-${c.id}`}
                type={
                  c.tipo === "email" ? "email" : c.tipo === "tel" ? "tel" : "text"
                }
                required={Boolean(c.requerido)}
                value={valores[c.id] || ""}
                onChange={(e) => poner(c.id, e.target.value)}
              />
            )}
            {c.ayuda ? <p className="form-ayuda">{c.ayuda}</p> : null}
          </div>
        ))}
      </section>

      <section className="sem-bloque">
        <h2 className="ag-mes">Diez preguntas</h2>
        <p className="sem-nota" style={{ marginBottom: "22px" }}>
          Contestá las que te salgan. No hace falta que estén todas ni que sean
          largas: con una idea por respuesta nos alcanza para preparar la
          charla.
        </p>
        {preguntas.map((p, n) => (
          <div className="form-campo" key={p.id}>
            <label htmlFor={`f-${p.id}`}>
              {n + 1}. {p.rotulo}
            </label>
            <textarea
              id={`f-${p.id}`}
              value={valores[p.id] || ""}
              onChange={(e) => poner(p.id, e.target.value)}
            />
          </div>
        ))}
      </section>

      <div className="form-acciones">
        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar"}
        </button>
        {error ? <span className="form-error">{error}</span> : null}
      </div>
    </form>
  );
}
