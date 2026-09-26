import { ImageResponse } from "next/og";
import { getEvento, formatRango, nombreConAnio } from "../../lib/agenda";

// Portada que se genera sola para cada ficha de evento.
//
// Sirve para dos cosas a la vez:
//   · es la imagen que se ve cuando alguien comparte la ficha, y
//   · es el "image" del schema Event que lee Google.
//
// Antes ese campo llevaba el link directo al adjunto de Airtable, que vence a
// las pocas horas: Google lo leía vivo o muerto según cuándo pasara. Esta sale
// de nuestro dominio, mide 1200×630 como pide Google y no vence nunca.

export const runtime = "nodejs";
export const alt = "Mate y Eventos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  let nombre = "Agenda de eventos";
  let cuando = "";
  let donde = "";
  let tipo = "";

  // Dibujar esta portada no es gratis: hay que medir el texto, cargar las
  // tipografías y comprimir un PNG de 1200×630, y encima queda una entrada de
  // caché. Si una dirección inventada saliera con la portada genérica y un
  // 200, el que manda el pedido elegiría cuánto trabajo hacemos. Así que
  // cuando el evento no está, se contesta 404 y no se dibuja nada.
  let ev = null;
  let lecturaCorta = false;

  try {
    ev = await getEvento(params.slug);
  } catch {
    // getEvento tira error SOLO cuando no encontró el evento y además la
    // lectura de Airtable vino incompleta. Ahí no se puede afirmar que el
    // evento no exista —es lo que dejó 18 fichas de verdad en 404 el
    // 28/8/2026, y un 404 se cachea—, así que en ese caso NO se contesta 404:
    // sale la portada genérica, como salía antes.
    lecturaCorta = true;
  }

  if (!ev && !lecturaCorta) {
    return new Response("No existe", { status: 404 });
  }

  if (ev) {
    nombre = nombreConAnio(ev);
    cuando = formatRango(ev) || "Fecha por anunciar";
    donde = [ev.venue, ev.ciudad, ev.pais].filter(Boolean).join(" · ");
    tipo = ev.tipo || "";
  }

  // Un nombre largo tiene que entrar igual: se achica en escalones.
  const cuerpo = nombre.length > 74 ? 46 : nombre.length > 46 ? 58 : 70;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#010004",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              width: "180px",
              height: "6px",
              background: "linear-gradient(90deg, #ea478a, #93d5f7)",
            }}
          />
          <div
            style={{
              display: "flex",
              marginTop: "28px",
              fontSize: "24px",
              letterSpacing: "6px",
              color: "#93d5f7",
            }}
          >
            {tipo ? tipo.toUpperCase() : "AGENDA"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "1010px" }}>
          <div
            style={{
              display: "flex",
              fontSize: `${cuerpo}px`,
              lineHeight: 1.1,
              color: "#f5f5f5",
              fontWeight: 700,
            }}
          >
            {nombre}
          </div>
          {cuando ? (
            <div
              style={{
                display: "flex",
                marginTop: "22px",
                fontSize: "32px",
                color: "#ea478a",
              }}
            >
              {cuando}
            </div>
          ) : null}
          {donde ? (
            <div
              style={{
                display: "flex",
                marginTop: "10px",
                fontSize: "26px",
                color: "rgba(245,245,245,0.62)",
              }}
            >
              {donde.length > 72 ? `${donde.slice(0, 72)}…` : donde}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: "24px", color: "rgba(245,245,245,0.55)" }}>
            La agenda de la industria de eventos
          </div>
          <div style={{ display: "flex", fontSize: "24px", color: "rgba(245,245,245,0.55)" }}>
            mateyeventos.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
