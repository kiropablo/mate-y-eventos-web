# Mate y Eventos — contexto para trabajar con Claude Code

Soy Pablo Quiroga, co-creador del podcast **Mate y Eventos** (industria de eventos LATAM), junto a Alexis Vidal. Manejo dos proyectos web y a partir de ahora quiero trabajarlos desde acá.

---

## CÓMO QUIERO QUE TRABAJEMOS

- **No sé programar.** Explicame en español argentino, simple, sin tecnicismos. Cuando hagas un cambio, contame en dos líneas qué tocaste y qué va a pasar.
- **Antes de cambios grandes, explicame el plan y esperá mi OK.** Para cosas chicas (una foto, un texto, un número), avanzá directo.
- **Opiná con honestidad.** Si algo que te pido está mal pensado o hay una forma mejor, decímelo con argumentos. No valides por validar.
- **Nunca me pidas pegar API keys ni contraseñas en el chat.** Van en Vercel (Environment Variables) o GitHub Secrets. Si necesitás una, decime dónde cargarla y yo la cargo.
- **Antes de commitear, mostrame qué archivos cambiaron.** Todo va a producción solo (Vercel redeploya con cada push), así que no quiero sorpresas.
- Nunca borres transcripciones (`content/transcripts/`) ni artículos (`content/articulos/`) sin preguntarme: son contenido, no código.

---

## PROYECTO 1 — La web: `www.mateyeventos.com`

Repo: **`kiropablo/mate-y-eventos-web`** → Vercel (auto-deploy al pushear a `main`).
Stack: **Next.js 14** (App Router), **CSS puro** en `app/globals.css` (SIN Tailwind). DNS en Donweb.

### Estructura

**`app/lib/`**
- `site.js` — config central: `SITE` (nombre, tagline, frase institucional, url, email), `LINKS` (redes, IDs de playlists de YouTube, Drives de prensa), `NAV` (menú), `EJES` (4 ejes temáticos), `STATS` (métricas curadas **a mano**).
- `youtube.js` — trae episodios con la YouTube Data API. **Junta las dos playlists** (Temporada 2 + Temporada 1) con `unirEpisodios()`, saca repetidos y ordena por fecha. Fallback: RSS de playlists → feed del canal.
- `transcripts.js` — lee `content/transcripts/{videoId}.txt`.
- `articulos.js` — lee `content/articulos/{direccion-del-articulo}.md`. Por defecto **solo los publicados**. Separa cabecera, cuerpo y preguntas frecuentes. El archivo se llama por su tema (esa es la URL); lo que lo ata a su episodio es el campo `episodio` de la cabecera, no el nombre.
- `articulos-admin.js` — igual pero trae **también los borradores**, para el panel interno.
- `admin.js` — seguridad del panel: cookie con huella SHA-256 de `ADMIN_PASSWORD`.

**Páginas**
- home (hero + manifiesto + stats + FAQ con schema FAQPage)
- `/episodios` y `/episodios/[id]` (video + descripción + tarjeta al artículo + transcripción desplegable; schemas VideoObject y PodcastEpisode)
- `/articulos` y `/articulos/[id]` (cuerpo + bloque destacado + preguntas en acordeón + descargas; **schemas Article + FAQPage**)
- `/articulos/[id]/imprimir` (hoja blanca para guardar en PDF, **noindex a propósito**)
- `/articulos/[id]/opengraph-image.js` (portada de marca autogenerada para cuando se comparte el link)
- `/admin` (panel interno con contraseña)
- `/sobre`, `/sponsors`, `/newsletter`, `/prensa`, `/contacto`

**`app/api/`**: `subscribe` (beehiiv), `articulos/[id]/descargar` (.txt), `admin/login`, `admin/guardar` (escribe en GitHub vía API → dispara redeploy).

**Componentes**: `SiteNav`, `EpisodePlayer`, `SpotifyButton`, `NewsletterForm`, `Atmosphere`, `Motion`, `Footer`, `ArticuloCuerpo`, `BotonImprimir`.

### Pipeline de artículos con IA (lo más importante del sitio)

1. Subo el episodio a YouTube **y lo agrego a la playlist de la temporada**.
2. Todos los días a las 9 AM (Argentina) corre la Action **Transcripciones** → `scripts/fetch-transcripts.mjs` (Supadata + YouTube API) → guarda el `.txt`.
3. Al terminar dispara sola la Action **Articulos** → `scripts/generar-articulos.mjs` llama a la API de Claude y escribe el artículo como **borrador** (`publicado: false`).
4. `scripts/avisar-borradores.mjs` abre un **issue en GitHub** asignado a mí → me llega por mail con el link al panel.
5. Entro a `/admin`, reviso, corrijo y publico. Eso escribe en GitHub y redeploya.

**Formato de cada artículo** (`content/articulos/{direccion-del-articulo}.md`): cabecera entre `---` con `titulo`, `bajada`, `metaDescripcion`, `episodio`, `episodioTitulo`, `fecha`, `eje`, `etiquetas`, `slugsAnteriores`, `lectura`, `generado`, `publicado`. Después el cuerpo en Markdown con `##` para subtítulos, un bloque `:::checklist ... :::` (recuadro destacado) y al final `## Preguntas frecuentes` con cada pregunta en `###`.

**Criterio editorial** (está todo escrito en castellano en la constante `INSTRUCCIONES` dentro de `generar-articulos.mjs` — si hay que cambiar el estilo, se cambia ahí y en ningún otro lado):
- Los artículos **no son resúmenes**: amplían el episodio. ~1200 palabras.
- Español argentino, voz del medio (no de Pablo ni de Alexis), sin relleno motivacional.
- **Prohibido inventar** datos, cifras o nombres que no estén en la transcripción.
- 5 a 7 preguntas frecuentes por artículo pensadas para AI SEO; **cada respuesta se tiene que entender sola**.
- El script lee las preguntas ya usadas en artículos anteriores **para no repetirlas**.

Las dos Actions tienen un **bucle de 3 reintentos con `git pull --rebase`** antes de pushear: si el repo cambia mientras corren, el push se rechaza y se pierde el trabajo (ya nos pasó, se perdieron 24 artículos generados).

### Diseño ("neón cinematográfico")
Fondo negro `#010004`, magenta `#EA478A`, celeste `#93D5F7`, acento azul `#5aa0ff`. Fuentes: **Rajdhani** (display), **Space Grotesk** (UI), **Inter** (cuerpo). Animaciones reveal con IntersectionObserver, acento por sección (`body[data-accent]`). Hero: `public/fondo-v3.jpg`. Fotos de bios: `public/pablo.jpg` y `public/alexis.jpg`, ambas **800×1000**.

### SEO / AI-SEO (ya implementado)
`robots.txt` permite bots de IA (GPTBot, ClaudeBot, PerplexityBot…) y bloquea `/admin` y `/api/`. Hay `llms.txt`, sitemap dinámico con episodios y artículos, canonicals por página. Schemas: Organization + PodcastSeries (layout), FAQPage (home), VideoObject + PodcastEpisode + transcript (episodios), Article + FAQPage (artículos). Search Console verificado.

### Claves
- **GitHub Secrets**: `YOUTUBE_API_KEY`, `SUPADATA_API_KEY`, `ANTHROPIC_API_KEY`
- **Vercel**: `YOUTUBE_API_KEY`, `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, `ADMIN_PASSWORD`, `GITHUB_TOKEN`

---

## PROYECTO 2 — El panel: `datos.mateyeventos.com`

Repo: **`kiropablo/mate-y-eventos-panel`** (privado) → Vercel. Es un **proyecto separado** de la web: no comparten código ni deploy.

Son solo 3 archivos:
- `index.html` — el dashboard entero (frontend, sin claves adentro)
- `api/data.js` — función serverless que consulta **Windsor.ai** y arma los datos
- `package.json`

**Qué hace `api/data.js`**: pide a Windsor tres conectores — `instagram`, `youtube` y `tiktok_organic` — y arma series diarias, listas de piezas (posts de IG, videos de YouTube, videos de TikTok) y estadísticas derivadas. Cachea 6 horas. Si una plataforma falla, devuelve vacío y el resto del panel igual carga (`pullSafe`). **Spotify no pasa por Windsor**: sale de una Google Sheet publicada como CSV (`SPOTIFY_CSV_URL`) que cargo a mano cada mes.

Variables en Vercel: `WINDSOR_API_KEY`, `SPOTIFY_CSV_URL`, `PAUTA_DESDE` (fecha desde la que se marca la banda de pauta en el gráfico de IG).

⚠️ Ojo con Spotify: desde el 11/06/2026 solo cuenta como "play" una reproducción de 30 segundos o más. Las comparaciones con meses anteriores muestran una caída que es cambio de regla, no pérdida de audiencia.

---

## REGLAS APRENDIDAS A LOS GOLPES

1. **Todo video nuevo tiene que estar agregado a la playlist de su temporada en YouTube.** La web y los scripts leen las playlists, **no el canal**. Si el video no está en la playlist: no aparece en la web, no se le baja transcripción y no se le escribe artículo. No da ningún error, simplemente no pasa nada.
2. **Mientras una GitHub Action está corriendo, no tocar el repo** (el push falla por conflicto).
3. Los números que se ven en la web (`STATS` en `site.js`) están **escritos a mano**, no vienen de ningún lado automático.
4. La web y el panel son proyectos separados: un cambio en uno no afecta al otro.
6. **Los imperdibles se cargan desde Airtable**, en el campo `Imperdible del mes` de cada evento: es un desplegable con los meses. Elegís el mes y el evento entra en `/imperdibles/{mes}`. Sin ningún evento etiquetado, la sección se publica vacía.
5. **Un artículo no se renombra a mano.** Su nombre de archivo es su URL. Si hay que cambiarla, hay que sumar la dirección vieja a `slugsAnteriores` en la cabecera: de ahí salen solas las redirecciones (`app/lib/redirecciones.js` → `next.config.js`). Renombrar sin eso deja la URL vieja en la nada.

---

## ESTADO Y PENDIENTES

- ~38 transcripciones y ~38 artículos generados, la mayoría todavía en borrador.
- **Criterio: publicar de a 4 o 5 artículos por semana**, no todos juntos (para no disparar señales de contenido masivo en Google y para poder revisarlos de verdad).

Pendientes que quiero encarar:

1. **Bajar el costo de Windsor.ai** — hoy se usa solo en el panel, para Instagram, YouTube y TikTok. La idea es empezar por **sacar YouTube de Windsor y traerlo con la YouTube Data API / YouTube Analytics API** (gratis, y ya tengo la clave andando en la web). Si con eso puedo bajar de plan en Windsor, ya se justifica. Instagram y TikTok después, con calma, evaluando cuánto trabajo real es conectarlos directo.
2. **Newsletter automático semanal** con los artículos nuevos vía beehiiv. Primero hay que verificar si mi plan permite **crear y enviar campañas por API** (hoy solo uso el alta de suscriptores). Si no lo permite, que la Action deje el borrador armado y lo envío yo.
3. **Decidir** si la web, además de las playlists, debería mirar el canal de YouTube y sumar episodios faltantes (evitaría que un olvido de playlist corte toda la cadena, pero pierdo control sobre qué aparece).

---

## MI PEDIDO DE HOY

(acá escribo lo que necesito en cada sesión)
