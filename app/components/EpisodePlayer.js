"use client";

import { useState } from "react";
import { anotarSalida } from "../lib/medir-salida";

// La fachada del reproductor: miniatura más botón de play, y el iframe recién
// al hacer clic.
//
// NO ES UN DETALLE DE ESTILO, ES EL PESO DE LA PÁGINA. Un iframe de YouTube
// que se monta al entrar arrastra cerca de un megabyte de JavaScript ajeno y
// se lleva el LCP puesto. Con la fachada, lo único que carga de entrada es una
// imagen de i.ytimg.com —que ya está permitida en el img-src de la CSP— y el
// iframe aparece cuando alguien de verdad lo pidió. Es lo que hace que este
// mismo componente se pueda meter en la ficha de un evento, que ya dibuja tres
// bloques de JSON-LD, una imagen con priority y hasta N iframes de ediciones
// anteriores.
export default function EpisodePlayer({
  id,
  title,
  thumb,
  // Segundos desde los que arranca el video. Sirve para el glosario, donde
  // algún término tiene cargado el minuto en el que se habló de eso.
  inicio = 0,
  // ¿Se anota el play en el panel? APAGADO POR DEFECTO a propósito: en
  // /episodios el play es la razón de ser de la página y contarlo como una
  // "salida a YouTube" inflaría ese número con el uso normal del sitio. Se
  // enciende sólo en el bloque del podcast, que es donde la pregunta a
  // contestar es "¿sirvió este bloque?". Ver app/lib/medir-salida.js.
  medir = false,
}) {
  const [play, setPlay] = useState(false);

  if (play) {
    return (
      <div className="ep-media">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1${
            inicio > 0 ? `&start=${inicio}` : ""
          }`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      className="ep-media ep-facade"
      onClick={() => {
        if (medir) anotarSalida("youtube");
        setPlay(true);
      }}
      aria-label={`Reproducir: ${title}`}
    >
      {/* miniatura de YouTube con alt descriptivo (SEO + accesibilidad) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb} alt={`Miniatura del episodio: ${title}`} loading="lazy" />
      <span className="ep-play" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
