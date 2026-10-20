"use client";
// Un link que se va a una plataforma de escucha y avisa que se fue.
//
// Por qué existe: el panel sabe cuántos ven los videos (65.000 vistas en
// YouTube, 53.000 en Instagram, 44.000 en TikTok) y cuántos escuchan el audio
// (622 reproducciones). Lo que no sabía nadie es cuántos hacen el viaje de uno
// al otro, porque entre el video y Spotify no había ningún punto medible. Este
// componente es ese punto.
//
// Mide igual que el contador de visitas: sin cookies, sin identificadores,
// sólo "alguien se fue a Spotify desde esta ruta". Por eso sigue sin hacer
// falta banner de consentimiento.
import { useCallback } from "react";

const REGISTRADOR = "https://datos.mateyeventos.com/api/registrar";

export default function SalidaLink({
  destino,          // "spotify" · "apple" · "youtube" — la lista la valida el panel
  href,
  className = "",
  style,
  children,
}) {
  const avisar = useCallback(() => {
    // Sólo cuenta el sitio publicado: las pruebas locales no son salidas.
    if (!/(^|\.)mateyeventos\.com$/.test(location.hostname)) return;
    try {
      navigator.sendBeacon(
        REGISTRADOR,
        new Blob(
          [
            JSON.stringify({
              tipo: "salida",
              destino,
              ruta: location.pathname,
              referrer: document.referrer || null,
              // De qué short vino. El mismo utm_source que ya usa el contador,
              // así la visita y la salida se cruzan por el mismo campo.
              utm: new URLSearchParams(location.search).get("utm_source"),
            }),
          ],
          { type: "text/plain" },
        ),
      );
    } catch {
      // Medir jamás rompe el link: si el beacon falla, el clic sigue igual.
    }
  }, [destino]);

  return (
    // sendBeacon está pensado justo para esto: sigue viajando aunque la página
    // se esté yendo. Por eso no hace falta demorar la navegación ni un
    // milisegundo esperando a que la medición termine.
    <a
      className={className}
      style={style}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={avisar}
      onAuxClick={avisar}
    >
      {children}
    </a>
  );
}
