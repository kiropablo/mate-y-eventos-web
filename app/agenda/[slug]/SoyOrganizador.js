"use client";

import { useState } from "react";

// "¿Organizás este evento?" — el pedido de verificación, desde la propia ficha.
//
// Por qué acá y no en una página aparte: el organizador de cada evento ya
// entra a esta página. Busca el nombre de su evento en Google, la ficha
// aparece entre los primeros resultados, y hasta ahora no había nada que le
// dijera que puede reclamarla. El circuito del sello arrancaba siempre con
// una invitación que sale de acá adentro, de a una, y por eso hay 10
// verificados sobre 338.
//
// Arranca cerrado y sin formulario: es un renglón discreto al pie de la
// ficha. El que no organiza el evento no tiene por qué toparse con esto, y el
// que sí lo organiza lo está buscando.

export default function SoyOrganizador({ slug, nombre }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState("editando"); // editando | enviando | ok | error
  const [error, setError] = useState("");
  const [datos, setDatos] = useState({ nombre: "", email: "", mensaje: "", tel: "" });

  const cambiar = (c) => (e) => setDatos((d) => ({ ...d, [c]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setEstado("enviando");
    setError("");
    try {
      const res = await fetch(`/api/agenda/${encodeURIComponent(slug)}/organizador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(cuerpo.error || "No se pudo enviar. Probá de nuevo en un rato.");
        setEstado("error");
        return;
      }
      setEstado("ok");
    } catch {
      setError("No se pudo enviar. Fijate si tenés conexión.");
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div className="org-pedido org-pedido--ok">
        <p>
          <strong>Listo, nos llegó.</strong> Te vamos a escribir a{" "}
          {datos.email} con un link para que revises los datos de{" "}
          {nombre} campo por campo. Cuando confirmes, la ficha lleva el sello.
        </p>
        <p className="org-pedido__chico">
          El sello no se paga ni se pide por favor: se enciende cuando vos
          confirmás que los datos están bien.
        </p>
      </div>
    );
  }

  return (
    <div className="org-pedido">
      {!abierto ? (
        <p>
          ¿Organizás {nombre}?{" "}
          <button type="button" className="org-pedido__link" onClick={() => setAbierto(true)}>
            Revisá los datos y pedí el sello Verificado
          </button>
        </p>
      ) : (
        <form onSubmit={enviar}>
          <p className="org-pedido__intro">
            Te mandamos un link para revisar la ficha campo por campo. Cuando
            confirmes que está bien, lleva el sello con el mes en que se
            confirmó. <strong>No se paga y no lo decide un formulario:</strong>{" "}
            lo revisamos con vos.
          </p>

          <div className="org-pedido__campos">
            <label>
              <span>Tu nombre</span>
              <input
                type="text"
                value={datos.nombre}
                onChange={cambiar("nombre")}
                required
                autoComplete="name"
              />
            </label>
            <label>
              <span>Tu correo</span>
              <input
                type="email"
                value={datos.email}
                onChange={cambiar("email")}
                required
                autoComplete="email"
                placeholder="mejor si es el del evento"
              />
            </label>
          </div>

          <label className="org-pedido__ancho">
            <span>Algo que quieras contarnos (opcional)</span>
            <textarea rows={2} value={datos.mensaje} onChange={cambiar("mensaje")} />
          </label>

          {/* Trampa para robots: una persona no ve este campo. */}
          <input
            type="text"
            name="tel"
            value={datos.tel}
            onChange={cambiar("tel")}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
          />

          {error && <p className="org-pedido__error">{error}</p>}

          <div className="org-pedido__botones">
            <button type="submit" className="btn" disabled={estado === "enviando"}>
              {estado === "enviando" ? "Enviando…" : "Pedir la verificación"}
            </button>
            <button
              type="button"
              className="org-pedido__link"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
