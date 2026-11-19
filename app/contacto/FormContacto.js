"use client";

import { useEffect, useRef, useState } from "react";

// Las dos puertas de entrada de /contacto y el formulario al que llevan.
//
// Las tarjetas y el formulario viven en el MISMO componente a propósito: el
// botón de cada tarjeta tiene que dejar elegido el motivo antes de bajar, y
// partirlo en dos archivos obligaría a pasarse el dato por un contexto, que es
// mucha maquinaria para dos botones.
//
// Antes cada botón era un `mailto:`. No andaban: un `mailto:` no hace nada si
// el navegador no tiene un programa de correo asociado, que es el caso de
// cualquiera que use Gmail desde Chrome sin ponerlo de predeterminado. No da
// error, no abre nada: parece que el sitio está roto. El `mailto:` sigue al
// pie de la página, en la fila "Email", para el que prefiera su propio correo.
//
// DE DÓNDE SALE EL MOTIVO CUANDO SE LLEGA DE OTRA PÁGINA. Los botones de
// /sponsors, /prensa y /agenda/destacado tenían el mismo problema y ahora
// apuntan acá, cada uno con su motivo en el hash: /contacto#prensa.
//
// Va en el hash y no en la query (?motivo=prensa) por una razón concreta: leer
// la query desde un componente cliente obliga a envolverlo en un <Suspense> y
// saca a /contacto de las páginas estáticas. El hash ni siquiera viaja al
// servidor, así que la página se sigue sirviendo armada desde el CDN.

// Lo que cambia en el formulario según de dónde vino la persona. El asunto del
// mail NO sale de acá: sale de la lista cerrada de app/api/contacto/route.js,
// y los dos tienen que tener las mismas claves.
const MOTIVOS = {
  sponsoreo: {
    titulo: "Contanos de tu marca",
    empresa: "Tu marca o empresa",
    ayuda: "Qué hace tu marca, a quién querés llegar y en qué estás pensando.",
    pregunta: "¿Era por sponsoreo?",
    otro: "idea",
  },
  idea: {
    titulo: "Contanos tu idea",
    empresa: "Empresa o proyecto",
    ayuda: "De qué te gustaría hablar, o qué tenés en mente para colaborar.",
    pregunta: "¿Era por una idea o colaboración?",
    otro: "sponsoreo",
  },
  fundador: {
    titulo: "Hablemos de ser sponsor fundador",
    empresa: "Tu marca o empresa",
    ayuda:
      "Qué hace tu marca y qué te gustaría lograr acompañando el proyecto desde el comienzo.",
    pregunta: "¿Era por el sponsoreo común?",
    otro: "sponsoreo",
  },
  prensa: {
    titulo: "Contanos qué necesitás",
    empresa: "Medio o publicación",
    ayuda:
      "Si es una entrevista, una nota o material adicional, y para cuándo lo necesitás.",
    pregunta: "¿Era por prensa?",
    otro: "idea",
  },
  destacado: {
    titulo: "Contanos de tu evento",
    empresa: "Organizador o productora",
    ayuda:
      "El nombre del evento y el mes que querés. Si todavía no está en la agenda, cargalo primero desde /agenda/sugerir: es gratis y no hace falta contratar nada para estar.",
    pregunta: "¿Era por sponsoreo?",
    otro: "sponsoreo",
  },
};

// Las dos tarjetas que se ven en la página. Los otros tres motivos no tienen
// tarjeta: se llega a ellos desde el botón de su propia página.
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

  // Elegir un motivo lo deja puesto y baja hasta el formulario. El foco va al
  // primer campo: si solo scrolleara, en un celular la persona igual tiene que
  // buscar dónde tocar.
  //
  // `suave` va en false cuando se llega con el hash ya puesto: al abrir la
  // página el scroll suave pelea con la posición que el navegador restaura, y
  // se ve un salto raro.
  function abrir(id, suave = true) {
    if (!MOTIVOS[id]) return;
    setMotivo(id);
    setError("");
    requestAnimationFrame(() => {
      caja.current?.scrollIntoView({
        behavior: suave ? "smooth" : "auto",
        block: "start",
      });
      primerCampo.current?.focus({ preventScroll: true });
    });
  }

  // El motivo que viene en la dirección, al entrar y si cambia después. Lo
  // segundo pasa de verdad: desde /sponsors se llega con un Link de Next, que
  // navega sin recargar, y si solo mirara al montar el formulario no se
  // enteraría de nada.
  useEffect(() => {
    const mirar = (suave) => {
      const id = window.location.hash.replace(/^#/, "");
      if (MOTIVOS[id]) abrir(id, suave);
    };
    mirar(false);
    const alCambiar = () => mirar(true);
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
    // Solo al montar: adentro no se lee ningún estado, y volver a correrlo en
    // cada tecleo reabriría el formulario sobre lo que la persona escribió.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const actual = MOTIVOS[motivo];

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

      {/* Sin JavaScript los botones de arriba no hacen nada, así que la
          dirección tiene que quedar a mano igual. Antes eran links `mailto:`
          y funcionaban sin JS; esto devuelve ese camino. */}
      <noscript>
        <p className="form-ayuda" style={{ marginTop: "18px" }}>
          Escribinos a <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </noscript>

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
        ) : actual ? (
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
              <h2 className="ag-mes">{actual.titulo}</h2>
              <p className="sem-nota" style={{ marginBottom: "22px" }}>
                Lo leemos nosotros dos y te contestamos por mail.{" "}
                <button
                  type="button"
                  className="form-cambiar"
                  onClick={() => abrir(actual.otro)}
                >
                  {MOTIVOS[actual.otro].pregunta}
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
                <label htmlFor="c-empresa">{actual.empresa}</label>
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
                <p className="form-ayuda">{actual.ayuda}</p>
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
