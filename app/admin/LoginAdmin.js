"use client";

import { useState } from "react";

export default function LoginAdmin() {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    setEntrando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: clave }),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.reload();
      } else {
        setError(data.error || "No se pudo entrar.");
      }
    } catch {
      setError("No se pudo conectar.");
    }
    setEntrando(false);
  }

  return (
    <main className="adm-login">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .adm-login{min-height:70vh;display:flex;align-items:center;justify-content:center;padding:40px 24px;position:relative;z-index:2}
        .adm-caja{width:100%;max-width:380px;background:#141418;border:1px solid rgba(245,245,245,.1);border-radius:18px;padding:34px}
        .adm-caja h1{font-family:var(--font-display);font-size:1.6rem;font-weight:700;margin-bottom:8px}
        .adm-caja p{font-family:var(--font-body);font-size:.92rem;color:rgba(245,245,245,.55);margin-bottom:24px;line-height:1.5}
        .adm-caja input{width:100%;background:#0c0c0f;border:1px solid rgba(245,245,245,.12);border-radius:10px;padding:14px 16px;color:#f5f5f5;font-family:var(--font-ui);font-size:1rem}
        .adm-caja button{width:100%;margin-top:14px;background:#ea478a;color:#fff;border:none;border-radius:999px;padding:15px;font-family:var(--font-ui);font-weight:700;font-size:.95rem;cursor:pointer}
        .adm-caja button:disabled{opacity:.5}
        .adm-error{color:#ea478a;font-family:var(--font-ui);font-size:.88rem;margin-top:14px}
      `,
        }}
      />
      <div className="adm-caja">
        <h1>Panel interno</h1>
        <p>Revisión y publicación de artículos de Mate y Eventos.</p>
        <input
          type="password"
          value={clave}
          placeholder="Contraseña"
          autoComplete="current-password"
          onChange={(e) => setClave(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") entrar();
          }}
        />
        <button type="button" onClick={entrar} disabled={entrando || !clave}>
          {entrando ? "Entrando…" : "Entrar"}
        </button>
        {error ? <div className="adm-error">{error}</div> : null}
      </div>
    </main>
  );
}
