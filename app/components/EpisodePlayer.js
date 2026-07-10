"use client";

import { useState } from "react";

export default function EpisodePlayer({ id, title, thumb }) {
  const [play, setPlay] = useState(false);

  if (play) {
    return (
      <div className="ep-media">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
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
      onClick={() => setPlay(true)}
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
