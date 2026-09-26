import { ImageResponse } from "next/og";
import { getArticulo } from "../../lib/articulos";

// Portada de marca que se genera sola para cada artículo.
// Es la imagen que aparece cuando alguien comparte el link en WhatsApp,
// LinkedIn, Instagram o X. Siempre consistente, sin diseñar nada a mano.

export const runtime = "nodejs";
export const alt = "Mate y Eventos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  // Si el artículo no está, se contesta 404 y no se dibuja nada.
  //
  // Dibujar cuesta: medir el texto, cargar las tipografías y comprimir un PNG
  // de 1200×630, más la entrada de caché que queda. Con la portada genérica y
  // un 200, cada dirección inventada nos hacía trabajar de gratis.
  //
  // Acá no hay riesgo de cachear un 404 sobre una lectura a medias, como sí lo
  // hay en la agenda: los artículos son archivos del repo y getArticulo
  // devuelve null solo cuando el archivo no está o el artículo todavía es
  // borrador, que es exactamente cuando la página también contesta 404.
  const art = getArticulo(params.id);
  if (!art) {
    return new Response("No existe", { status: 404 });
  }

  const titulo = art.titulo;
  const eje = art.eje || "Industria de eventos";

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
            MATE Y EVENTOS
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: titulo.length > 62 ? "58px" : "70px",
            lineHeight: 1.12,
            color: "#f5f5f5",
            fontWeight: 700,
            maxWidth: "1000px",
          }}
        >
          {titulo}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: "26px", color: "#ea478a" }}>
            {eje}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              color: "rgba(245,245,245,0.55)",
            }}
          >
            mateyeventos.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
