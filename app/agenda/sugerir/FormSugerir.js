"use client";

import { useState } from "react";
import Link from "next/link";

const TIPOS = [
  "Congreso/Conferencia",
  "Expo/Feria",
  "Festival",
  "Recital masivo",
  "Corporativo",
  "Capacitación",
  "Deportivo masivo",
  "Premios y galas",
  "Público/Festivo",
];

const PAISES = [
  "Argentina", "Uruguay", "Chile", "Brasil", "Paraguay",
  "Bolivia", "México", "Colombia", "Perú", "Otro",
];

export default function FormSugerir() {
  const [estado, setEstado] = useState("editando"); // editando | enviando | ok | error
  const [datos, setDatos] = useState({
    nombrePersona: "",
    email: "",
    nombreEvento: "",
    tipo: "",
    fechaInicio: "",
    fechaFin: "",
    pais: "Argentina",
    provincia: "",
    ciudad: "",
    web: "",
    descripcion: "",
    contacto: "",
    tel: "", // honeypot: los humanos no lo ven, los bots lo llenan
  });

  const set = (campo) => (e) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

  const enviar = async () => {
    if (!datos.nombrePersona.trim() || !datos.email.trim() || !datos.nombreEvento.trim()) {
      setEstado("faltan");
      return;
    }
    setEstado("enviando");
    try {
      const res = await fetch("/api/agenda/sugerir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      setEstado(res.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  };

  if (estado === "ok") {
    return (
      <div className="hold reveal">
        <span className="tag">¡Gracias!</span>
        <p>
          Recibimos tu sugerencia. El equipo editorial la revisa y, si encaja
          en la agenda, la vas a ver publicada pronto.
        </p>
        <div className="field-row" style={{ justifyContent: "center", maxWidth: "none" }}>
          <Link className="btn" href="/agenda">
            Volver a la agenda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sug-form reveal">
      <h2 className="ev-h2">Tus datos</h2>
      <div className="sug-grid">
        <label className="sug-campo">
          <span>Nombre y apellido *</span>
          <input className="input" value={datos.nombrePersona} onChange={set("nombrePersona")} />
        </label>
        <label className="sug-campo">
          <span>Email *</span>
          <input className="input" type="email" value={datos.email} onChange={set("email")} />
        </label>
      </div>

      {/* honeypot invisible */}
      <input
        className="sug-tel"
        tabIndex={-1}
        autoComplete="off"
        value={datos.tel}
        onChange={set("tel")}
        aria-hidden="true"
      />

      <h2 className="ev-h2">El evento</h2>
      <div className="sug-grid">
        <label className="sug-campo sug-campo--full">
          <span>Nombre del evento *</span>
          <input className="input" value={datos.nombreEvento} onChange={set("nombreEvento")} />
        </label>
        <label className="sug-campo">
          <span>Tipo</span>
          <select className="ag-select" value={datos.tipo} onChange={set("tipo")}>
            <option value="">Elegí uno</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="sug-campo">
          <span>País</span>
          <select className="ag-select" value={datos.pais} onChange={set("pais")}>
            {PAISES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="sug-campo">
          <span>Fecha de inicio</span>
          <input className="input" type="date" value={datos.fechaInicio} onChange={set("fechaInicio")} />
        </label>
        <label className="sug-campo">
          <span>Fecha de fin</span>
          <input className="input" type="date" value={datos.fechaFin} onChange={set("fechaFin")} />
        </label>
        <label className="sug-campo">
          <span>Provincia / Región</span>
          <input className="input" value={datos.provincia} onChange={set("provincia")} />
        </label>
        <label className="sug-campo">
          <span>Ciudad</span>
          <input className="input" value={datos.ciudad} onChange={set("ciudad")} />
        </label>
        <label className="sug-campo sug-campo--full">
          <span>Web oficial</span>
          <input className="input" type="url" placeholder="https://…" value={datos.web} onChange={set("web")} />
        </label>
        <label className="sug-campo sug-campo--full">
          <span>¿De qué se trata?</span>
          <textarea className="input sug-area" rows={4} value={datos.descripcion} onChange={set("descripcion")} />
        </label>
        <label className="sug-campo sug-campo--full">
          <span>Contacto del evento (si lo tenés)</span>
          <input className="input" value={datos.contacto} onChange={set("contacto")} />
        </label>
      </div>

      {estado === "faltan" && (
        <p className="form-note" style={{ color: "var(--magenta)" }}>
          Completá tu nombre, tu email y el nombre del evento.
        </p>
      )}
      {estado === "error" && (
        <p className="form-note" style={{ color: "var(--magenta)" }}>
          No pudimos enviar la sugerencia. Probá de nuevo en un rato.
        </p>
      )}

      <div className="field-row">
        <button className="btn" onClick={enviar} disabled={estado === "enviando"}>
          {estado === "enviando" ? "Enviando…" : "Enviar sugerencia"}
        </button>
        <Link className="chip" href="/agenda" style={{ alignSelf: "center" }}>
          Cancelar
        </Link>
      </div>
      <p className="form-note">
        Tu email es solo para consultarte por el evento si hace falta. No se
        publica ni se comparte.
      </p>
    </div>
  );
}
