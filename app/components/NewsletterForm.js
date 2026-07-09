"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ok | pending | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setStatus("ok");
      else if (data.error === "not_configured") setStatus("pending");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <p className="lead" style={{ marginTop: "28px" }}>
        ¡Listo! Revisá tu casilla para confirmar la suscripción y sumarte a la
        comunidad.
      </p>
    );
  }

  if (status === "pending") {
    return (
      <p className="lead" style={{ marginTop: "28px" }}>
        ¡Gracias! Estamos terminando de conectar el sistema de emails. Muy
        pronto vas a recibir el newsletter en tu casilla.
      </p>
    );
  }

  return (
    <>
      <form className="field-row" onSubmit={handleSubmit}>
        <input
          className="input"
          type="email"
          required
          placeholder="tu@email.com"
          aria-label="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
        />
        <button
          className="btn"
          type="submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Enviando…" : "Suscribirme"}
        </button>
      </form>
      {status === "error" && (
        <p className="form-note" style={{ color: "var(--magenta)" }}>
          Hubo un problema. Probá de nuevo en un momento.
        </p>
      )}
      <p className="form-note">Sin spam. Te podés dar de baja cuando quieras.</p>
    </>
  );
}
