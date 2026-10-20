"use client";

import { useState } from "react";

// El formulario en sí. Es cliente porque tiene estado y manda el pedido; la
// página que lo envuelve es de servidor y es la que valida la clave del link.

export default function FormularioInvitado({
  clave,
  contacto,
  preguntas,
  foto: campoFoto,
  fotoAncho,
  fotoAlto,
}) {
  const [valores, setValores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  // La foto, ya recortada y en base64, lista para viajar. Y la casilla.
  const [foto, setFoto] = useState("");
  const [autorizada, setAutorizada] = useState(false);
  const [pesando, setPesando] = useState(false);

  const poner = (id, v) => setValores((p) => ({ ...p, [id]: v }));

  // Se recorta acá, en el navegador, antes de que salga: a 800×1000 y en JPEG.
  // Una foto de celular pesa 4 MB y sale de acá pesando 80 KB. Es lo mismo que
  // hace el panel cuando la sube Pablo, para que las fichas queden parejas.
  //
  // El recorte es al centro y sin deformar: una cara estirada en una ficha con
  // el nombre de una persona real queda peor que no tener foto.
  async function achicar(archivo) {
    const bitmap = await createImageBitmap(archivo);
    const lienzo = document.createElement("canvas");
    lienzo.width = fotoAncho;
    lienzo.height = fotoAlto;
    const ctx = lienzo.getContext("2d");
    const escala = Math.max(fotoAncho / bitmap.width, fotoAlto / bitmap.height);
    const w = bitmap.width * escala;
    const h = bitmap.height * escala;
    ctx.drawImage(bitmap, (fotoAncho - w) / 2, (fotoAlto - h) / 2, w, h);
    return lienzo.toDataURL("image/jpeg", 0.85);
  }

  async function elegirFoto(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setError("");
    setPesando(true);
    try {
      setFoto(await achicar(archivo));
    } catch {
      setError("No pudimos leer esa imagen. Probá con otra, en JPG o PNG.");
    } finally {
      setPesando(false);
    }
  }

  function sacarFoto() {
    setFoto("");
    setAutorizada(false);
  }

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/invitados/formulario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clave,
          valores,
          // La foto solo viaja si además está autorizada. Sin la casilla no se
          // manda: es el permiso y no un detalle que se arregla después.
          foto: foto && autorizada ? foto : "",
          fotoAutorizada: Boolean(foto && autorizada),
        }),
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

        {/* La foto. Va al final de los datos y no entre medio: es la única
            que abre el selector de archivos del celular, y cortar el tecleo a
            la mitad de un formulario hace que la gente lo abandone. */}
        <div className="form-campo form-foto">
          <label htmlFor="f-foto">{campoFoto.rotulo}</label>

          {foto ? (
            <div className="form-foto__hay">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="Tu foto, recortada" />
              <div className="form-foto__lado">
                <p className="form-ayuda">
                  Así se va a ver en tu ficha. Si no te gusta el recorte, probá
                  con otra donde estés más al centro.
                </p>
                <button
                  type="button"
                  className="form-foto__sacar"
                  onClick={sacarFoto}
                >
                  Sacar esta foto
                </button>
              </div>
            </div>
          ) : null}

          <input
            id="f-foto"
            type="file"
            accept="image/*"
            onChange={elegirFoto}
            disabled={pesando}
          />
          {pesando ? <p className="form-ayuda">Preparando la imagen…</p> : null}
          <p className="form-ayuda">{campoFoto.ayuda}</p>

          {/* La casilla aparece cuando hay foto: pedir permiso para algo que
              todavía no existe no significa nada. */}
          {foto ? (
            <label className="form-autorizo">
              <input
                type="checkbox"
                checked={autorizada}
                onChange={(e) => setAutorizada(e.target.checked)}
              />
              <span>{campoFoto.autorizacion}</span>
            </label>
          ) : null}

          {foto && !autorizada ? (
            <p className="form-ayuda form-ayuda--ojo">
              Sin tildar esa casilla la foto no se manda. El resto de lo que
              escribiste se guarda igual.
            </p>
          ) : null}
        </div>
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
