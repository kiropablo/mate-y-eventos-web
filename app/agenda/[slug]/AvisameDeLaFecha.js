"use client";

import { useState } from "react";

// "Avisame cuando confirmen la fecha."
//
// Va solo en las fichas sin fecha anunciada, que son 110 de las 338. Hasta
// ahora esa persona llegaba buscando exactamente eso —"fiesta de la chaya
// 2027"—, leía "fechas por anunciar" y no tenía nada que hacer.
//
// Es la persona con la intención más clara de todo el sitio: vino a preguntar
// una cosa concreta y la respuesta todavía no existe. Ofrecerle avisarle no es
// pedirle el correo a cambio de nada: es contestarle la pregunta más tarde.
//
// Por eso el texto promete poco y exacto. Un correo, una vez. Prometer una
// lista sería otra cosa, y no es lo que vino a buscar.

export default function AvisameDeLaFecha({ slug, nombre }) {
  const [estado, setEstado] = useState("cerrado"); // cerrado | abierto | enviando | ok | error
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [error, setError] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setEstado("enviando");
    setError("");
    try {
      const res = await fetch(`/api/agenda/${encodeURIComponent(slug)}/avisame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tel }),
      });
      const cuerpo = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(cuerpo.error || "No se pudo. Probá de nuevo en un rato.");
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
      <div className="aviso-fecha aviso-fecha--ok">
        <p>
          <strong>Listo.</strong> Cuando {nombre} anuncie la fecha te
          escribimos a {email}. Un solo correo, y nada más: no te sumamos a
          ninguna lista.
        </p>
      </div>
    );
  }

  return (
    <div className="aviso-fecha">
      {estado === "cerrado" ? (
        <p>
          <strong>Todavía no hay fecha.</strong>{" "}
          <button
            type="button"
            className="aviso-fecha__link"
            onClick={() => setEstado("abierto")}
          >
            Avisame cuando la confirmen
          </button>
        </p>
      ) : (
        <form onSubmit={enviar}>
          <p className="aviso-fecha__intro">
            <strong>Te avisamos cuando la anuncien.</strong> Un correo, una
            vez, con la fecha y la sede. No entrás a ninguna lista y no te
            escribimos por nada más.
          </p>
          <div className="aviso-fecha__fila">
            <label>
              <span className="visualmente-oculto">Tu correo</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />
            </label>
            <button type="submit" className="btn" disabled={estado === "enviando"}>
              {estado === "enviando" ? "Enviando…" : "Avisame"}
            </button>
          </div>

          {/* Trampa para robots: una persona no lo ve. */}
          <input
            type="text"
            name="tel"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
          />

          {error && <p className="aviso-fecha__error">{error}</p>}
        </form>
      )}
    </div>
  );
}
