# Mate y Eventos — Sitio web

Este es el **esqueleto** del sitio de Mate y Eventos: la estructura, el diseño de
marca y la navegación completa, listo para subir. Algunas secciones tienen
contenido real y otras tienen "placeholders" que vamos a completar por etapas.

No necesitás saber nada de código para usarlo. Abajo está el paso a paso.

---

## Qué incluye esta etapa

- **Home** con identidad de marca (placa fotográfica de fondo, colores, tipografías).
- **Páginas**: Episodios, Sobre, Newsletter, Para marcas (sponsors) y Contacto.
- **Navegación** completa arriba y links reales en el pie (YouTube, Spotify,
  Apple, Instagram, TikTok, LinkedIn, mail).
- **Optimización para IA** desde el arranque: `robots.txt` (permite a los bots de
  ChatGPT, Claude, Perplexity y Google), `llms.txt`, sitemap y datos
  estructurados.
- El botón **"Para marcas"** destacado arriba, para dirigir hacia sponsors.

## Qué todavía NO está (lo hacemos en próximas etapas)

- La lista de episodios que se carga sola desde el feed (Episodios).
- La conexión del formulario de newsletter a un sistema de emails.
- Los números reales en la página de sponsors.

---

## Cómo subirlo (paso a paso)

Tu flujo es **GitHub → Vercel**. La idea es meter estos archivos en tu
repositorio de GitHub; Vercel los publica solo.

1. Entrá a tu repositorio de GitHub (el del dominio `mateyeventos.com`).
2. Tocá **Add file → Upload files**.
3. Arrastrá **todo el contenido de esta carpeta** (no la carpeta en sí, sino lo
   que hay adentro: `app`, `public`, `package.json`, etc.) a la ventana de
   GitHub.
4. Abajo, escribí un mensaje corto (ej. "Esqueleto del sitio") y tocá
   **Commit changes**.
5. Vercel detecta el cambio y publica solo. En 1–2 minutos, tu sitio está
   online.

> Si Vercel te pregunta el "framework", elegí **Next.js** (lo detecta solo casi
> siempre). No hace falta tocar ninguna otra configuración.

---

## Qué NO tocar

- La carpeta `app` y el archivo `package.json`: es la cocina del sitio.
- Si querés cambiar un texto o un link, avisame y lo hacemos juntos: casi todo
  está centralizado en `app/lib/site.js`.

## Colores y tipografías de marca (ya aplicados)

- Magenta `#EA478A` · Celeste `#93D5F7` · Negro `#000000` · Blanco `#F5F5F5`
- Títulos: Space Grotesk · Cuerpo: Inter

---

## Newsletter (beehiiv) — variables para el deploy

El formulario de newsletter ya está conectado. Para que funcione en vivo, en
**Vercel → Settings → Environment Variables** hay que cargar estas dos (se
copian desde beehiiv → Settings → Integrations). NO van en el código:

- `BEEHIIV_API_KEY` — la API Key de beehiiv.
- `BEEHIIV_PUBLICATION_ID` — el Publication ID (empieza con `pub_`).

Hasta que estén cargadas, el formulario muestra un mensaje amable de "en
preparación". Una vez cargadas, los mails entran directo a la lista de beehiiv.
