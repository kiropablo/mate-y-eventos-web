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
  // Cabeceras de seguridad. El sitio no mandaba ninguna.
  //
  // LO QUE ESTO ES Y LO QUE NO ES, para no creerle de más:
  //
  // La CSP lleva 'unsafe-inline' en scripts y estilos, y eso quiere decir que
  // NO frena un script inyectado en la página. No es pereza: esta home tiene 13
  // scripts en línea —Next hidratando y los bloques de JSON-LD— y 200 atributos
  // style=. Sin 'unsafe-inline' el sitio no arranca. La alternativa es firmar
  // cada uno con un nonce, y eso obliga a que TODAS las páginas se generen en
  // cada visita: se perderían las 338 fichas pre-generadas. El precio es más
  // caro que lo que compra.
  //
  // Lo que frena un script inyectado es el escape del `</script>` en el JSON-LD
  // (regla 19), que ya está puesto. Esto es la segunda capa, para las formas de
  // ataque que el escape no cubre. Cada línea de abajo dice cuál.
  async headers() {
    // En desarrollo, Next recarga en caliente usando eval(). Sin esto, `npm run
    // dev` muestra la página pero tira EvalError en la consola y la recarga
    // automática deja de andar. En producción no hace falta y NO se pone: ahí
    // está el visitante, y permitir eval le abre la puerta a un ataque que el
    // resto de la CSP frena.
    const enDesarrollo = process.env.NODE_ENV === "development";

    const csp = [
      "default-src 'self'",
      // Sin 'unsafe-inline' el sitio no arranca. Ver arriba.
      `script-src 'self' 'unsafe-inline'${enDesarrollo ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      // Las imágenes solo de donde de verdad vienen: los adjuntos de Airtable y
      // las miniaturas de YouTube. Un atacante ya no puede usar una imagen
      // alojada en su servidor para saber quién abrió una página nuestra.
      "img-src 'self' data: blob: https://v5.airtableusercontent.com https://dl.airtable.com https://i.ytimg.com",
      "font-src 'self' data:",
      // A dónde puede hablar la página. datos.mateyeventos.com es el panel, que
      // recibe el contador de visitas.
      "connect-src 'self' https://datos.mateyeventos.com",
      // Los reproductores de YouTube embebidos, y nada más.
      "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
      // ESTA SÍ ES PROTECCIÓN REAL Y NO NECESITA NONCE: nadie puede meter el
      // sitio —ni /admin— adentro de un iframe en su página para robarle clics
      // a quien está logueado.
      "frame-ancestors 'none'",
      // Bloquea <base href="http://otro-sitio">, que es la forma clásica de
      // convertir un HTML inyectado en carga de scripts ajenos.
      "base-uri 'self'",
      // Un formulario inyectado no puede mandar lo que escriba la persona a
      // otro servidor.
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Lo mismo que frame-ancestors, para los navegadores viejos que no
          // leen esa directiva.
          { key: "X-Frame-Options", value: "DENY" },
          // Que el navegador no adivine el tipo de un archivo: un .txt que
          // adivina como HTML es un XSS.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Al salir del sitio se manda el dominio, no la dirección completa.
          // Las fichas de confirmación llevan la firma en la URL.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No usamos nada de esto, así que se apaga: si algún día una
          // dependencia lo pide, el navegador dice que no.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
