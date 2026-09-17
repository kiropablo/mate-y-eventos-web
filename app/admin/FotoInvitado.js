"use client";

import { useState } from "react";

// Subir la foto de un invitado desde el panel.
//
// La imagen se recorta y se achica ACÁ, en el navegador, antes de salir: a
// 800×1000, que es el mismo tamaño de las fotos de Pablo y Alexis, y en JPEG.
// Una foto de celular pesa 4 MB y sale de acá pesando 80 KB.
//
// Por qué en el navegador y no en el servidor: hacerlo allá pediría una
// librería de imágenes y una función que aguante subidas grandes. Acá es
// gratis, y de paso el que sube no espera a que viajen 4 MB para enterarse de
// que la foto era muy pesada.
//
// El recorte es al centro y no un "estirar para que entre": una cara deformada
// en una ficha con el nombre de una persona real queda peor que no tener foto.

const ANCHO = 800;
const ALTO = 1000;

export default function FotoInvitado({ id, tieneFoto, onCambio }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  // Para que la foto nueva se vea al instante: si no, el navegador sigue
  // mostrando la vieja de su caché y parece que no pasó nada.
  const [version, setVersion] = useState(0);

  async function achicar(archivo) {
    const bitmap = await createImageBitmap(archivo);
    const lienzo = document.createElement("canvas");
    lienzo.width = ANCHO;
    lienzo.height = ALTO;
    const ctx = lienzo.getContext("2d");

    // Recorte al centro, sin deformar: se toma el rectángulo más grande de la
    // foto original que tenga la proporción 800×1000.
    const escala = Math.max(ANCHO / bitmap.width, ALTO / bitmap.height);
    const w = bitmap.width * escala;
    const h = bitmap.height * escala;
    ctx.drawImage(bitmap, (ANCHO - w) / 2, (ALTO - h) / 2, w, h);

    return lienzo.toDataURL("image/jpeg", 0.85);
  }

  async function elegir(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setSubiendo(true);
    setError("");
    try {
      const imagen = await achicar(archivo);
      const res = await fetch("/api/admin/foto-invitado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, imagen }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data?.error || "No se pudo subir.");
      setVersion((v) => v + 1);
      onCambio?.(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function sacar() {
    if (!confirm("¿Sacar la foto de esta ficha?")) return;
    setSubiendo(true);
    setError("");
    try {
      const res = await fetch("/api/admin/foto-invitado", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data?.error || "No se pudo sacar.");
      onCambio?.(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="adm-campo">
      <label>Foto</label>
      <div className="inv-foto">
        {tieneFoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            className="inv-foto__vista"
            src={`/invitados/${id}.jpg?v=${version}`}
            alt=""
            width={80}
            height={100}
          />
        ) : (
          <div className="inv-foto__vacia">sin foto</div>
        )}
        <div className="inv-foto__acciones">
          <label className="adm-btn adm-btn--sec">
            {subiendo ? "Subiendo…" : tieneFoto ? "Cambiar la foto" : "Subir una foto"}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={subiendo}
              onChange={elegir}
            />
          </label>
          {tieneFoto ? (
            <button
              type="button"
              className="adm-btn adm-btn--peligro"
              disabled={subiendo}
              onClick={sacar}
            >
              Sacar
            </button>
          ) : null}
        </div>
      </div>
      <p className="adm-ayuda">
        Se recorta al centro y se guarda en 800×1000, como las de ustedes dos.
        Poné una donde se le vea bien la cara: el recorte es vertical.
      </p>
      {error ? <p className="adm-msg adm-msg--mal">{error}</p> : null}
    </div>
  );
}
