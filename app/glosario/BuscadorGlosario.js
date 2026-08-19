"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// Índice del glosario con buscador. Filtra por el término, por sus otras
// formas de decirlo y por la definición, sin acentos ni mayúsculas, para que
// "rider tecnico" encuentre "rider técnico".

export default function BuscadorGlosario({ terminos }) {
  const [busca, setBusca] = useState("");

  const termino = pelado(busca);
  const visibles = useMemo(
    () =>
      terminos.filter(
        (t) =>
          !termino ||
          pelado(
            [t.termino, ...(t.alias || []), t.definicionCorta].join(" ")
          ).includes(termino)
      ),
    [terminos, termino]
  );

  const grupos = useMemo(() => {
    const m = new Map();
    for (const t of visibles) {
      const l = pelado(t.termino).charAt(0).toUpperCase();
      const letra = /[A-Z]/.test(l) ? l : "#";
      if (!m.has(letra)) m.set(letra, []);
      m.get(letra).push(t);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visibles]);

  return (
    <>
      <div className="ag-buscador reveal">
        <input
          className="input ag-buscar"
          type="search"
          value={busca}
          placeholder="Buscar un término…"
          aria-label="Buscar en el glosario"
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <p className="ag-cuenta">
        {visibles.length === 0
          ? "Ningún término con esa búsqueda"
          : `${visibles.length} ${visibles.length === 1 ? "término" : "términos"}${termino ? " · filtrado" : ""}`}
      </p>

      {grupos.map(([letra, lista]) => (
        <section className="glo-grupo reveal" key={letra}>
          <h2 className="glo-letra">{letra}</h2>
          <div className="glo-lista">
            {lista.map((t) => (
              <Link
                className="glo-item"
                href={`/glosario/${t.slug}`}
                key={t.slug}
              >
                <span className="glo-item__termino">{t.termino}</span>
                <span className="glo-item__def">{t.definicionCorta}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function pelado(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
