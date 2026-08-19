import { reglasDeRedireccion } from "./app/lib/redirecciones.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Las direcciones viejas de los artículos que se mudaron. Salen del propio
  // contenido (el campo slugsAnteriores de cada artículo), así que se
  // mantienen solas: no hay una lista aparte que se pueda desactualizar.
  async redirects() {
    return reglasDeRedireccion();
  },
  images: {
    // Logos de eventos servidos desde los adjuntos de Airtable.
    // Next los optimiza y los cachea, así que dejan de depender de la
    // URL temporal de Airtable (que vence a las 2 horas).
    remotePatterns: [
      { protocol: "https", hostname: "v5.airtableusercontent.com" },
      { protocol: "https", hostname: "dl.airtable.com" },
    ],
  },
};
export default nextConfig;
