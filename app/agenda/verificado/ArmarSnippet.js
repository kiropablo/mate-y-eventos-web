"use client";

import { useMemo, useState } from "react";
import { SITE } from "../../lib/site";

// Generador del código para incrustar el sello. El organizador elige su
// evento y el color que le va a su web, ve cómo queda y se lo lleva copiado.

export default function ArmarSnippet({ eventos }) {
  const [slug, setSlug] = useState(eventos[0]?.slug || "");
  const [tema, setTema] = useState("oscuro");
  const [copiado, setCopiado] = useState(false);

  const ev = eventos.find((e) => e.slug === slug) || eventos[0];

  const ruta = `/api/agenda/${ev.slug}/badge.svg${tema === "claro" ? "?tema=claro" : ""}`;
  // El código que se copia lleva la dirección completa, porque va a vivir en
  // otro sitio. La previsualización de acá abajo, en cambio, apunta a la ruta
  // relativa: así se ve siempre, incluso apenas se enciende el sello y la
  // versión publicada todavía no se enteró.
  const src = `${SITE.url}${ruta}`;
  const href = `${SITE.url}/agenda/${ev.slug}`;
  const alt = `${ev.nombre}: evento verificado en Mate y Eventos`;

  const codigo = useMemo(
    () =>
      `<a href="${href}" target="_blank" rel="noopener">
  <img src="${src}"
       alt="${alt}"
       width="268" height="62">
</a>`,
    [href, src, alt]
  );

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="sus-caja reveal">
      <h2 className="ev-h2" style={{ marginTop: 0 }}>
        Generá tu código
      </h2>
      <p className="sus-ayuda">
        Elegí tu evento y el color que combine con tu sitio. El código se pega
        una sola vez: el sello se actualiza solo desde acá.
      </p>

      <div className="ag-selects" style={{ marginTop: "18px" }}>
        {eventos.length > 1 && (
          <select
            className="ag-select"
            value={slug}
            aria-label="Elegí tu evento"
            onChange={(e) => setSlug(e.target.value)}
          >
            {eventos.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.nombre}
              </option>
            ))}
          </select>
        )}
        <div className="ag-vistas" role="group" aria-label="Color del sello">
          <button
            className={tema === "oscuro" ? "chip chip--on" : "chip"}
            aria-pressed={tema === "oscuro"}
            onClick={() => setTema("oscuro")}
          >
            Para fondo oscuro
          </button>
          <button
            className={tema === "claro" ? "chip chip--on" : "chip"}
            aria-pressed={tema === "claro"}
            onClick={() => setTema("claro")}
          >
            Para fondo claro
          </button>
        </div>
      </div>

      <p className="sus-ayuda" style={{ marginTop: "24px" }}>
        Así se va a ver:
      </p>
      <div className={`sello-previa sello-previa--${tema}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ruta} alt={alt} width="268" height="62" />
      </div>

      <p className="sus-ayuda" style={{ marginTop: "24px" }}>
        Copiá este código y pegalo donde quieras que aparezca:
      </p>
      <div className="sello-codigo">
        <pre>
          <code>{codigo}</code>
        </pre>
        <button className="chip" onClick={copiar}>
          {copiado ? "✓ Copiado" : "Copiar código"}
        </button>
      </div>
    </div>
  );
}
