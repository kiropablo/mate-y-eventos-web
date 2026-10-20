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

// Las direcciones que llevan una clave adentro se recortan ANTES de salir.
//
// POR QUÉ HACE FALTA. El panel es público a propósito —es el argumento de
// venta del espacio destacado— y lo que se le manda queda publicado en su API:
// /api/data lista las páginas más visitadas, con su dirección entera. Entonces
// cualquier dirección con una clave en el camino se publica sola.
//
// No es hipotético: la clave de /equipo estuvo listada ahí, en el puesto 9, a
// la vista de cualquiera que abriera el JSON. Abría la cola de difusión.
//
// El recorte es POR FORMA y no por una lista de rutas: cualquier tramo que sea
// un hexadecimal de 16 caracteres o más es una de nuestras claves —así las
// arma app/lib/firma.js, con LARGO = 16— y se reemplaza por [clave]. De esta
// manera una ruta con clave que se agregue mañana ya sale recortada sin que
// nadie se tenga que acordar de venir a tocar este archivo.
//
// Las firmas de los links de confirmación no pasan por acá: van en la query
// (?f=...) y usePathname() no la incluye.
function sinClaves(ruta) {
  return String(ruta || "").replace(/\/[0-9a-f]{16,}(?=\/|$)/g, "/[clave]");
}

export default function Contador() {
  const ruta = usePathname();

  useEffect(() => {
    // Solo cuenta el sitio publicado: las pruebas locales no son visitas.
    if (!/(^|\.)mateyeventos\.com$/.test(location.hostname)) return;
    try {
      const dato = {
        tipo: "visita",
        ruta: sinClaves(ruta),
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
