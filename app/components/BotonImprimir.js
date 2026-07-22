"use client";

// Abre el diálogo de impresión del navegador.
// En el iPad y en el celular, desde ahí se elige "Guardar en Archivos" (PDF).

export default function BotonImprimir({ children = "Guardar en PDF" }) {
  return (
    <button
      type="button"
      className="btn"
      onClick={() => window.print()}
    >
      {children}
    </button>
  );
}
