"use client";
// El contador de visitas propio. Sin cookies, sin identificadores, sin nada
// que siga a nadie: anota "alguien vio esta pagina, vino de tal lado" y listo.
// Por eso no hace falta banner de consentimiento.
//
// Manda el aviso al panel con sendBeacon, que no bloquea ni demora la pagina.
// Si el panel esta caido o el navegador lo bloquea, no pasa nada: la web
// nunca depende de su propia medicion.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Contador() {
  const ruta = usePathname();

  useEffect(() => {
    // Solo cuenta el sitio publicado: las pruebas locales no son visitas.
    if (!/(^|\.)mateyeventos\.com$/.test(location.hostname)) return;
    try {
      const dato = {
        tipo: "visita",
        ruta,
        referrer: document.referrer || null,
        utm: new URLSearchParams(location.search).get("utm_source"),
      };
      navigator.sendBeacon(
        "https://datos.mateyeventos.com/api/registrar",
        new Blob([JSON.stringify(dato)], { type: "text/plain" }),
      );
    } catch {
      // Medir jamas rompe la pagina.
    }
  }, [ruta]);

  return null;
}
