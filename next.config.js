import { reglasDeRedireccion } from "./app/lib/redirecciones.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // La carpeta content/ tiene que viajar a las funciones del servidor.
  //
  // Los artículos, el glosario, las transcripciones y los textos de los mails
  // son archivos del repo, no una base. Next los lee bien durante el build,
  // pero cuando una página se regenera en el servidor —el sitemap se rehace
  // cada hora— esos archivos no están en el paquete de la función y la lectura
  // falla. El sitemap lo tapaba con un try/catch: el build generaba 152 URLs
  // con los 41 artículos y los 59 términos, y producción servía 395 SIN
  // ninguno de los dos. Google venía recibiendo un mapa sin artículos ni
  // glosario, y nada lo avisaba.
  //
  // Va para todas las rutas y no solo para el sitemap: cualquier página que se
  // revalide en el servidor tiene el mismo problema, y las que leen content/
  // son media docena.
  // (en Next 14 esta opción vive bajo experimental; en 15 pasa a la raíz)
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": ["./content/**/*"],
    },
  },
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
