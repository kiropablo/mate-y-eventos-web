"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SITE } from "../../lib/site";

// "Toda la agenda en tu calendario", al pie de la ficha.
//
// POR QUÉ ACÁ. El 100% del tráfico de búsqueda del sitio es genérico y el de
// marca es 0%: nadie busca "Mate y Eventos", todos buscan el nombre de un
// evento, se llevan la fecha y se van. Las cinco fichas que más traen son
// cuatro de público general y una profesional, así que lo único que se le
// puede ofrecer a las dos audiencias es lo que las dos vinieron a buscar:
// cuándo son los eventos. Quien escribió "abierto de polo tortugas 2026"
// demostró exactamente esa intención.
//
// Se descartó sugerir un episodio del podcast: no hay ningún campo que ate un
// evento a un episodio, y matchear "tipo de evento → eje editorial" sería
// inventar la relación. Es la misma regla que ya dice enlaces.js.
//
// Y es el único alcance que no se evapora: una suscripción sigue entregando la
// agenda todas las semanas sin volver a ganarse la atención.

const HOST = SITE.url.replace(/^https?:\/\//, "");

export default function EnTuCalendario({ cuantos }) {
  // EL SID SE ARMA EN EL NAVEGADOR Y DESPUÉS DE MONTAR, NO EN EL PRIMER
  // DIBUJO.
  //
  // Esta ficha se prerenderiza y se cachea una hora. Un identificador hecho
  // del lado del servidor viajaría DENTRO de esa copia, así que sería el mismo
  // para todos los que la reciban: el panel cuenta suscripciones por sid
  // distinto, y cientos de personas quedarían contadas como una sola. El
  // número daría chico y creíble, que es la forma más incómoda de estar mal.
  //
  // Arrancar en vacío también evita que el primer dibujo del cliente difiera
  // del del servidor: hasta que monta, el link es la suscripción sin
  // identificar, que funciona igual —solo no se cuenta—.
  const [sid, setSid] = useState("");

  useEffect(() => {
    // El prefijo "f-" dice de dónde salió la suscripción. Es la única forma de
    // responder "¿sirvió este bloque?" sin tocar el panel: su consulta agrupa
    // por sid y por filtros, y desde una ficha el filtro es siempre "(todo)",
    // o sea indistinguible de alguien que se suscribió desde
    // /agenda/calendario. Los sid de ahí no llevan guión, así que un
    // `LIKE 'f-%'` separa los dos orígenes.
    //
    // No identifica a una persona: identifica a una suscripción, como el
    // número de un abono. No sale de ningún dato del visitante.
    setSid(
      "f-" +
        Math.random().toString(36).slice(2, 10) +
        Date.now().toString(36).slice(-4)
    );
  }, []);

  const ruta = `/api/agenda/ics${sid ? `?s=${encodeURIComponent(sid)}` : ""}`;
  const urlWebcal = `webcal://${HOST}${ruta}`;
  const urlGoogle = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(urlWebcal)}`;

  return (
    // Bloque propio y al pie, lejos del sello "Datos verificados por el
    // organizador" que vive en la cabecera. El sello certifica LOS DATOS DEL
    // EVENTO y lo firma el organizador; esto es una oferta nuestra. Por eso va
    // en su propia sección, con su propio título y diciendo de quién es: que
    // se lea como avalado por el organizador sería romper lo único que hace
    // que el sello valga algo.
    <section className="sus-caja reveal" style={{ marginTop: "40px" }}>
      <h2 className="ev-h2" style={{ marginTop: 0 }}>
        La agenda de {SITE.name}, en tu calendario
      </h2>
      <p className="sus-ayuda">
        Si viniste a ver cuándo es este evento, esto te ahorra la próxima
        búsqueda: suscribite una vez y los {cuantos} eventos con fecha
        anunciada —más los que entren después— aparecen solos en tu Google
        Calendar, Apple Calendario u Outlook. No hay que dejar el correo ni
        crearse una cuenta.
      </p>

      <div className="sus-botones" style={{ marginTop: "18px" }}>
        <a className="btn" href={urlGoogle} target="_blank" rel="noopener noreferrer">
          Google Calendar
        </a>
        <a className="btn btn--ghost" href={urlWebcal}>
          Apple Calendario / Outlook
        </a>
      </div>

      <p className="sus-ayuda" style={{ marginTop: "18px" }}>
        ¿Preferís solo tu país o un tipo de evento?{" "}
        <Link href="/agenda/calendario">Armá el recorte en una pantalla</Link> y
        copiá la dirección.
      </p>
    </section>
  );
}
