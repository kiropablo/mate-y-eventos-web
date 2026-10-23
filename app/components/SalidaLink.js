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
//
// El armado del aviso NO vive acá: está en app/lib/medir-salida.js, compartido
// con el reproductor del bloque del podcast. El motivo está escrito allá y es
// el mismo de medir-calendario.js: del otro lado hay una lista cerrada y una
// copia por componente se vuelve mentira en silencio.
import { useCallback } from "react";
import { anotarSalida } from "../lib/medir-salida";

export default function SalidaLink({
  destino,          // "spotify" · "apple" · "youtube" — la lista la valida el panel
  href,
  className = "",
  style,
  children,
}) {
  const avisar = useCallback(() => anotarSalida(destino), [destino]);

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
