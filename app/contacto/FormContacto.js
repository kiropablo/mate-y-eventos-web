"use client";

import { useRef, useState } from "react";

// Las dos puertas de entrada de /contacto y el formulario al que llevan.
//
// Las tarjetas y el formulario viven en el MISMO componente a propósito: el
// botón de cada tarjeta tiene que dejar elegido el motivo antes de bajar, y
// partirlo en dos archivos obligaría a pasarse el dato por el hash de la URL
// o por un contexto, que es mucha maquinaria para dos botones.
//
// Antes cada botón era un `mailto:`. No andaban: un `mailto:` no hace nada si
// el navegador no tiene un programa de correo asociado, que es el caso de
// cualquiera que use Gmail desde Chrome sin ponerlo de predeterminado. No da
// error, no abre nada: parece que el sitio está roto. El `mailto:` sigue al
// pie de la página, en la fila "Email", para el que prefiera su propio correo.

const PUERTAS = [
  {
    id: "sponsoreo",
    eyebrow: "Marcas",
    titulo: "Quiero sponsorear",
    texto:
      "Si tu marca quiere llegar a la comunidad de eventos de LATAM, escribinos y te pasamos las oportunidades disponibles.",
    boton: "Escribir sobre sponsoreo",
    clase: "btn",
  },
  {
    id: "idea",
    eyebrow: "Comunidad",
    titulo: "Invitados y colaboraciones",
    texto:
      "¿Tenés una historia que aporte valor a la industria, o una idea para colaborar? Nos encanta conocer gente del rubro.",
    boton: "Proponer una idea",
    clase: "btn btn--azul",
  },
];

export default function FormContacto({ email }) {
  const [motivo, setMotivo] = useState("");
  const [valores, setValores] = useState({
    nombre: "",
    email: "",
    empresa: "",
    mensaje: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  // El honeypot, aparte de los valores que se mandan como contenido.
  const [trampa, setTrampa] = useState("");

  const caja = useRef(null);
  const primerCampo = useRef(null);

  const poner = (id) => (e) =>
    setValores((v) => ({ ...v, [id]: e.target.value }));

  // Elegir una puerta deja el motivo puesto y baja hasta el formulario. El
  // foco va al primer campo: si solo scrolleara, en un celular la persona
  // igual tiene que buscar dónde tocar.
  function abrir(id) {
    setMotivo(id);
    setError("");
    requestAnimationFrame(() => {
      caja.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      primerCampo.current?.focus({ preventScroll: true });
    });
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...valores, motivo, tel: trampa }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data?.error || "No se pudo enviar.");
      setListo(true);
      caja.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <div className="grid grid--2">
        {PUERTAS.map((p, i) => (
          <article
            className="card reveal"
            key={p.id}
            style={i > 0 ? { transitionDelay: ".1s" } : undefined}
          >
            <div className="eyebrow" style={{ marginBottom: "12px" }}>
              {p.eyebrow}
            </div>
            <h3>{p.titulo}</h3>
            <p>{p.texto}</p>
            <button
              type="button"
              className={p.clase}
              style={{ marginTop: "18px" }}
              onClick={() => abrir(p.id)}
              aria-expanded={motivo === p.id}
            >
              {p.boton}
            </button>
          </article>
        ))}
      </div>

      <div ref={caja} style={{ marginTop: "48px", scrollMarginTop: "90px" }}>
        {listo ? (
          <section className="sem-bloque">
            <h2 className="ag-mes">Listo, nos llegó</h2>
            <p className="sem-nota">
              Gracias por escribir. Te contestamos a{" "}
              <strong>{valores.email}</strong> lo antes posible, normalmente
              dentro de las 48 horas.
            </p>
          </section>
        ) : motivo ? (
          <form onSubmit={enviar}>
            {/* honeypot invisible. Reusa la clase del formulario de sugerir:
                es el mismo truco y no hace falta un estilo que repita lo
                mismo con otro nombre. */}
            <input
              className="sug-tel"
              tabIndex={-1}
              autoComplete="off"
              value={trampa}
              onChange={(e) => setTrampa(e.target.value)}
              aria-hidden="true"
            />

            <section className="sem-bloque">
              <h2 className="ag-mes">
                {motivo === "sponsoreo"
                  ? "Contanos de tu marca"
                  : "Contanos tu idea"}
              </h2>
              <p className="sem-nota" style={{ marginBottom: "22px" }}>
                Lo leemos nosotros dos y te contestamos por mail.{" "}
                <button
                  type="button"
                  className="form-cambiar"
                  onClick={() =>
                    abrir(motivo === "sponsoreo" ? "idea" : "sponsoreo")
                  }
                >
                  {motivo === "sponsoreo"
                    ? "¿Era por una idea o colaboración?"
                    : "¿Era por sponsoreo?"}
                </button>
              </p>

              <div className="form-campo">
                <label htmlFor="c-nombre">Tu nombre *</label>
                <input
                  id="c-nombre"
                  ref={primerCampo}
                  type="text"
                  required
                  value={valores.nombre}
                  onChange={poner("nombre")}
                />
              </div>

              <div className="form-campo">
                <label htmlFor="c-email">Tu mail *</label>
                <input
                  id="c-email"
                  type="email"
                  required
                  value={valores.email}
                  onChange={poner("email")}
                />
                <p className="form-ayuda">Es a donde te vamos a contestar.</p>
              </div>

              <div className="form-campo">
                <label htmlFor="c-empresa">
                  {motivo === "sponsoreo" ? "Tu marca o empresa" : "Empresa o proyecto"}
                </label>
                <input
                  id="c-empresa"
                  type="text"
                  value={valores.empresa}
                  onChange={poner("empresa")}
                />
              </div>

              <div className="form-campo">
                <label htmlFor="c-mensaje">Tu mensaje *</label>
                <textarea
                  id="c-mensaje"
                  required
                  style={{ minHeight: "160px" }}
                  value={valores.mensaje}
                  onChange={poner("mensaje")}
                />
                <p className="form-ayuda">
                  {motivo === "sponsoreo"
                    ? "Qué hace tu marca, a quién querés llegar y en qué estás pensando."
                    : "De qué te gustaría hablar, o qué tenés en mente para colaborar."}
                </p>
              </div>
            </section>

            <div className="form-acciones">
              <button className="btn" type="submit" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar"}
              </button>
              {error ? <span className="form-error">{error}</span> : null}
            </div>

            <p className="form-ayuda" style={{ marginTop: "18px" }}>
              Si preferís escribirnos desde tu propio correo, es a{" "}
              <a href={`mailto:${email}`}>{email}</a>.
            </p>
          </form>
        ) : null}
      </div>
    </>
  );
}
