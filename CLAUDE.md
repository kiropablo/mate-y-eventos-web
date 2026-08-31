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

**`app/lib/`** — todo lo que no es una página vive acá.

*Contenido en archivos del repo*
- `site.js` — config central: `SITE`, `LINKS`, `NAV`, `EJES` (los 4 ejes editoriales, con la frase con la que se los nombra en un título), `AUTORES` (Pablo y Alexis, con cargo, bio, recorrido y LinkedIn), `STATS` (métricas **a mano**, hoy congeladas) y `fechaCorta()`.
- `articulos.js` / `articulos-admin.js` — leen `content/articulos/{direccion}.md`. El de admin trae también los borradores. El archivo se llama por su tema (esa es la URL); lo que lo ata a su episodio es el campo `episodio`, no el nombre.
- `glosario.js` / `glosario-admin.js` — igual, sobre `content/glosario/`.
- `transcripts.js` — `content/transcripts/{videoId}.txt` y sus subtítulos en `secciones/{videoId}.json`.
- `mensajes.js` — los textos de los mails a organizadores, editables desde `/admin`. Dos mensajes: `primer-contacto` y `confirmacion`, cada uno en `content/mensajes/{id}.md`.
- `newsletter.js` — arma el borrador semanal con lo que ya existe. El corte de la semana va en horario de Buenos Aires; si Airtable sale corto, el bloque de agenda no se arma.
- `ejes.js` — agrupa los artículos por eje editorial para las landings de `/articulos/eje/`.
- `enlaces.js` — qué términos del glosario **nombra** cada artículo, buscando la palabra en el texto. De ahí salen el `about`/`mentions` del artículo, el `subjectOf` del término y el bloque "Dónde se usa" de la ficha del glosario. **No mira los alias**: son otra palabra y la promesa es que se pueda comprobar con Ctrl+F.
- `redirecciones.js` — las direcciones viejas de los artículos mudados salen del propio contenido.

*La agenda (Airtable)*
- `agenda.js` — el corazón. Lee la base, mapea los campos y expone `getEventos()`, `getEventosConEstado()` (que además dice si la lectura vino **completa**), `yaPaso()`, `formatRango()`, `nombreConAnio()`, `mesLargo()`. La lectura se cachea una hora con la etiqueta `agenda`.
- `semana.js` — los otros eventos de la misma semana, los del mismo organizador (`delMismoOrganizador`) y si llegamos a difundir con tiempo. El comparador de organizadores parte el campo en entidades: Messe Frankfurt está escrito de diez formas distintas.
- `radiografia.js` — los números de la agenda y su CSV.
- `organizadores-admin.js`, `campos-ficha.js`, `firma.js` (links firmados con HMAC), `ics.js`.

*Los mails*
- `mail-base.js` — el marco compartido: cabecera, el arreglo del modo oscuro de Apple Mail, el pie, y los ladrillos. **Está compartido a propósito**: con una copia por mail, el día que haya que tocar el arreglo de Apple se arregla uno y nadie se entera.
- `mail-invitacion.js` — el primer mail: "revisá tu ficha".
- `mail-confirmacion.js` — el segundo: "quedó verificada".
- `correo.js` — Resend. Regla: **un mail que no sale nunca voltea la operación que lo disparó**.

*Otros*: `admin.js` (cookie con huella del `ADMIN_PASSWORD`), `youtube.js`, `migas.js` (BreadcrumbList), `bots.js`.

**Páginas**
- home — hero, el párrafo que define qué es esto, agenda, artículos, métricas, newsletter y FAQ
- `/episodios` y `/episodios/[id]` — video, descripción, transcripción con subtítulos, tarjeta al artículo y a los términos del episodio
- `/articulos`, `/articulos/[id]`, `/articulos/eje/[eje]` (4 hubs por eje), `/articulos/[id]/imprimir` (**noindex a propósito**)
- `/glosario` y `/glosario/[slug]`
- **La agenda**, que es lo más grande y por donde entra el 91% del tráfico de búsqueda:
  - `/agenda` (lista, calendario, filtros y la tira de destacados)
  - `/agenda/[slug]` — la ficha, con su portada 1200×630 autogenerada
  - `/agenda/[slug]/confirmar` — el link firmado donde el organizador revisa campo por campo
  - `/agenda/{pais,tipo,provincia,mes}/…` — 26 landings automáticas
  - `/agenda/esta-semana`, `/agenda/calendario`, `/agenda/sugerir`
  - `/agenda/verificado` — qué es el sello y el generador del badge para la web del organizador
  - `/agenda/destacado` — el espacio pago, con precio publicado
  - **`/agenda/radiografia`** y su `datos.csv` — los números propios de la base
- `/imperdibles` y `/imperdibles/[mes]`
- `/sobre` y `/sobre/[quien]` (Pablo y Alexis)
- `/admin` — el panel: artículos, glosario, organizadores y los textos de los mails
- `/admin/newsletter` — el borrador del newsletter de la semana, listo para copiar y pegar en beehiiv. Página aparte del panel a propósito
- `/sponsors`, `/newsletter`, `/prensa`, `/contacto`

**`app/api/`**: `subscribe` (beehiiv) · `agenda/[slug]/confirmar` (**la única ruta pública que escribe en Airtable**, con firma y tope de 2 por día) · `agenda/[slug]/badge.svg` · `agenda/ics` y `agenda/[slug]/ics` · `agenda/revalidar` · `agenda/sugerir` · `articulos/[id]/descargar` · y bajo `admin/`: `login`, `guardar`, `glosario`, `agenda`, `verificar`, `invitar`, `confirmacion`, `difundido`, `mensaje` y `mensaje/previsualizar`.

### El pipeline de contenido con IA (lo más importante del sitio)

1. Subo el episodio a YouTube **y lo agrego a la playlist de la temporada**.
2. **9 AM**: la Action **Transcripciones** (`fetch-transcripts.mjs`, Supadata + YouTube API) guarda el `.txt`.
3. Al terminar dispara sola la Action **Articulos** (`generar-articulos.mjs`): llama a la API de Claude y escribe el artículo como **borrador**.
4. Igual la Action **Glosario** (`generar-glosario.mjs`) y la Action **Secciones** (`segmentar-transcripciones.mjs`), que le pone subtítulos a la transcripción **sin reescribir el texto**: guarda posiciones, rearma la página y compara carácter por carácter antes de publicar. Si no coincide, descarta.
5. `avisar-borradores.mjs` abre un **issue en GitHub** asignado a mí, y me llega por mail.
6. Entro a `/admin`, reviso, corrijo y publico. Eso escribe en GitHub y redeploya.

**Criterio editorial** (todo escrito en castellano en la constante `INSTRUCCIONES` de `generar-articulos.mjs` — si hay que cambiar el estilo, se cambia ahí y en ningún otro lado):
- Los artículos **no son resúmenes**: amplían el episodio. ~1200 palabras.
- Español argentino, **voz del medio** (no de Pablo ni de Alexis), sin relleno motivacional.
- **Prohibido inventar** datos, cifras o nombres que no estén en la transcripción.
- 5 a 7 preguntas frecuentes por artículo; **cada respuesta se tiene que entender sola**.
- El script lee las preguntas ya usadas **para no repetirlas**.

Las Actions tienen un **bucle de 3 reintentos con `git pull --rebase`** antes de pushear: si el repo cambia mientras corren, el push se rechaza y se pierde el trabajo (ya nos pasó: se perdieron 24 artículos generados).

### El circuito con los organizadores

1. En el panel, pestaña **Organizadores**, se elige un evento y se manda la **invitación**: un mail con su ficha tal como está publicada, los otros eventos de esa semana —sin los suyos— y un link firmado.
2. El organizador entra al link y **confirma o corrige campo por campo**. Eso deja la ficha en "revisión pendiente".
3. Pablo da el OK desde el panel y **se enciende el sello Verificado**, con el mes.
4. Se manda la **confirmación**: el sello, el código del badge para su web, cuándo sale la difusión, y recién ahí se pide algo —los otros eventos que organizan— y se ofrece cobertura y contactos. No se vende: al pie una línea aclara que el sello no se paga.
5. Cuando se postea en redes, el botón **"Ya lo difundimos"** se lo avisa.

Los textos de los dos mails se editan desde `/admin` → Mensaje, con vista previa sobre un evento real.

### Cómo se carga la agenda sola

La Action **Agenda** corre todos los días a las 8 (Argentina) y hace dos cosas:
- **descubre**: barre 3 rubros por día (rotando entre 10) y trae hasta 4 eventos de cada uno. **Solo carga los que están completos** —fecha futura anunciada, tipo, país, provincia, ciudad, organizador, web y descripciones—; al que le falta algo le da una segunda pasada buscando solo los huecos, y si sigue incompleto no entra y el log dice qué le faltaba. Todo entra como **Borrador IA**: nunca publica nada.
- **verifica**: repasa 10 fichas ya aprobadas contra sus fuentes. Nunca pisa datos: deja el hallazgo y marca "Revisar". Solo completa fechas si estaban sin anunciar **y la fecha es futura**.

### Diseño ("neón cinematográfico")
Fondo negro `#010004`, magenta `#EA478A`, celeste `#93D5F7`, acento azul `#5aa0ff`. Fuentes: **Rajdhani** (display), **Space Grotesk** (UI), **Inter** (cuerpo). Animaciones reveal con IntersectionObserver, acento por sección (`body[data-accent]`). Hero: `public/fondo-v3.jpg`. Fotos de bios: `public/pablo.jpg` y `public/alexis.jpg`, ambas **800×1000**.

### SEO / AI-SEO

`robots.txt` habilita a los bots de IA (GPTBot, ClaudeBot, PerplexityBot…) y bloquea `/admin` y `/api/`. Sitemap dinámico (~500 URLs), canonicals por página, `llms.txt`.

**El grafo de entidades** (en `app/layout.js`, una sola vez, y el resto lo referencia por `@id`): `Organization` con `knowsAbout` y `areaServed` · `WebSite` · los dos `Person` con su cargo, su LinkedIn y su página propia · `AV Eventos` como la productora que dirigen. Los artículos los **firma el equipo** (`author` = la organización) y llevan `editor` apuntando a Pablo, que es quien revisa y publica.

Por tipo de página: `Article` + `FAQPage` (artículos) · `VideoObject` + `PodcastEpisode` (episodios) · `Event` (fichas) · `CollectionPage` + `ItemList` (landings) · `DefinedTerm` (glosario) · `ProfilePage` (personas) · `Dataset` con licencia y CSV (radiografía) · `BreadcrumbList` en las tres plantillas de detalle.

**Lo que aprendimos sobre el llms.txt**: Google dijo en junio de 2026 que no lo usa, y Ahrefs midió que el 97% nunca fueron leídos. Se mantiene porque no cuesta nada, pero **no invertir más ahí ni contarlo como estrategia**.

**Los FAQPage no son un adorno de venta.** Google dejó de mostrar resultados enriquecidos de FAQ en 2023 salvo gobierno y salud; el valor que queda es que una IA lo levante. Marcar los bullets de una oferta comercial como preguntas frecuentes es justamente por lo que penaliza.

### Claves

Nunca van en el chat: se cargan en Vercel (Environment Variables) o en GitHub Secrets.

- **GitHub Secrets** (las usan las Actions): `YOUTUBE_API_KEY`, `SUPADATA_API_KEY`, `ANTHROPIC_API_KEY`, `AIRTABLE_API_KEY`, `REVALIDATE_TOKEN`
- **Vercel** (las usa el sitio): `YOUTUBE_API_KEY`, `AIRTABLE_API_KEY`, `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, `ADMIN_PASSWORD`, `GITHUB_TOKEN`, `RESEND_API_KEY`, `AGENDA_FIRMA_SECRET`, `REVALIDATE_TOKEN`

`AGENDA_FIRMA_SECRET` es la que firma los links de confirmación: sin ella el panel no puede armar el link, y si cambia se invalidan todos los que ya se mandaron.

---

## PROYECTO 2 — El panel: `datos.mateyeventos.com`

Repo: **`kiropablo/mate-y-eventos-panel`** (privado) → Vercel. Es un **proyecto separado** de la web: no comparten código ni deploy.

**Windsor.ai ya no existe acá** (se cortó en agosto 2026 y su histórico se perdió). Desde entonces el panel guarda su propio histórico en una **base Postgres en Neon**, y ese es el principio rector: los datos son nuestros, nada de ventanas móviles de un servicio pago.

Cómo fluye:
- **Cada hora** corre la Action **"Recolectar metricas"** → `scripts/recolectar.mjs`: guarda una foto de YouTube (Data API, misma clave que la web), del feed RSS del podcast y de las calificaciones de Apple por país. Solo guarda lo que cambió. Cada corrida queda anotada en la tabla `recolecciones`; si algo falla, la Action se pone en rojo y llega mail.
- **Spotify no tiene API** (ninguna, está verificado a fondo): una vez por mes se bajan los CSV de Spotify for Creators y **se arrastran a `datos-manuales/spotify/` en la web de GitHub** → la Action "Importar datos cargados a mano" los mete en la base sola. Los CSV quedan commiteados como respaldo crudo. El circuito está explicado en `datos-manuales/LEEME.md`.
- `api/data.js` (estilo CommonJS a propósito, no convertir a ESM) lee la base y arma el payload; `index.html` es el panel: pestañas Resumen / YouTube / Spotify / Podcast / Salud, **un botoncito "?" en cada métrica** que explica qué mide, y ningún número escrito a mano en el HTML.
- Botón **"Ver que hay en la base"** en Actions: estado de todo sin saber nada técnico.

Claves: `DATABASE_URL` (Neon) y `YOUTUBE_API_KEY` en **GitHub Secrets** del repo del panel; `DATABASE_URL` también en **Vercel** para que la API lea.

Cosas sabidas y verificadas (no volver a investigar):
- **Apple no muestra métricas con menos de 5 oyentes únicos** por período (umbral de privacidad documentado). Los guiones del dashboard no son un error. El Reporter tampoco sirve: mismo umbral y exige suscripciones pagas.
- **Amazon Music**: el show está distribuido y activo, con 0 reproducciones reales. No tiene API.
- El feed de reseñas RSS de Apple está **muerto para todo el mundo**: las estrellas se leen del HTML de la ficha pública (si Apple rediseña, la corrida se pone en roja, no devuelve ceros falsos).
- **No mudar el hosting del podcast** (Anchor/Spotify for Creators): todos los episodios tienen video en Spotify, que no viaja por RSS, y mudarse no automatiza ni Apple ni Spotify.

⚠️ Ojo con Spotify: desde el 11/06/2026 solo cuenta como "play" una reproducción de 30 segundos o más. Las comparaciones con meses anteriores muestran una caída que es cambio de regla, no pérdida de audiencia. Y no confundir: 30 s = "play" (analytics), 60 s = "stream" (monetización).

---

## REGLAS APRENDIDAS A LOS GOLPES

1. **Todo video nuevo tiene que estar agregado a la playlist de su temporada en YouTube.** La web y los scripts leen las playlists, **no el canal**. Si el video no está en la playlist: no aparece en la web, no se le baja transcripción y no se le escribe artículo. No da ningún error, simplemente no pasa nada.
2. **Mientras una GitHub Action está corriendo, no tocar el repo** (el push falla por conflicto).
3. Los números que se ven en la web (`STATS` en `site.js`) están **escritos a mano**, no vienen de ningún lado automático.
4. La web y el panel son proyectos separados: un cambio en uno no afecta al otro.
5. **Los imperdibles se cargan desde Airtable**, en el campo `Imperdible del mes` de cada evento: es un desplegable con los meses. Elegís el mes y el evento entra en `/imperdibles/{mes}`. Sin ningún evento etiquetado, la sección se publica vacía.
6. **Un artículo no se renombra a mano.** Su nombre de archivo es su URL. Si hay que cambiarla, hay que sumar la dirección vieja a `slugsAnteriores` en la cabecera: de ahí salen solas las redirecciones (`app/lib/redirecciones.js` → `next.config.js`). Renombrar sin eso deja la URL vieja en la nada.

7. **`content/` tiene que viajar a las funciones del servidor.** Los artículos, el glosario y las transcripciones son archivos del repo. Next los lee bien en el build, pero cuando una página se regenera en el servidor no están, y la lectura falla. Nos pasó con el sitemap: el build generaba 152 URLs con artículos y glosario, y producción servía 395 **sin ninguno de los dos**. Se resuelve con `outputFileTracingIncludes` en `next.config.js`.
8. **Un `try/catch` con `= []` adentro es una fuga silenciosa.** Así se escondió lo de arriba durante quién sabe cuánto: la lectura fallaba, las URLs desaparecían y el archivo seguía devolviendo 200. Si algo puede quedar vacío, tiene que quedar escrito en los registros.
9. **El build en verde no prueba nada.** Compilar el archivo viejo también compila: si un script de edición falla a mitad y no escribe, `npm run build` pasa igual. **Verificar contra el archivo o contra producción**, nunca contra el build.
10. **Un número sin fecha de corte es un pasivo.** Una IA que lo cite lo va a citar viejo y no tiene cómo saber que envejeció. Y si un número se puede contar del contenido, se cuenta: no se escribe a mano.
11. **Lo editorial no se vende ni se regala.** El sello Verificado y los imperdibles no se compran ni se dan a cambio de un favor. El Destacado es pago y **se declara en todos los listados donde aparece**. Es lo que hace que el resto valga.

12. **Que la palabra esté escrita no quiere decir que hable de eso.** El schema apunta a una entidad, no a una cadena de texto. "Retorno" en el glosario es el monitor que el artista escucha en el escenario; en tres artículos de negocio es el retorno de la inversión. Y un alias empeora el problema en vez de arreglarlo: el alias de "Brief" es "pedido", que engancha el verbo —"había pedido"— y así 28 de 112 relaciones quedaban declaradas sobre una palabra que no era el término. Cuando se enlaza automáticamente, el criterio tiene que ser comprobable abriendo la página.

13. **Si el código lo declara, la página lo tiene que mostrar.** El bloque "Dónde se usa" y el `subjectOf` del término salen de la misma lista y con el mismo corte, a propósito. Marcar una relación que el lector no puede ver es justamente por lo que Google penaliza.

14. **Un JSON-LD sin `@context` parsea igual y no existe para nadie.** Sin él, un parser no resuelve `BreadcrumbList` contra schema.org: lo toma como término relativo a la URL y el nodo queda vacío, con un tipo inventado. El JSON se ve perfecto a simple vista, que es por lo que 84 páginas estuvieron sin migas de pan sin que nadie lo notara. **Cada objeto de un array de JSON-LD necesita el suyo: no se hereda del vecino.** Y ojo con las asimetrías: la ficha de agenda lo tenía y las otras dos plantillas no, y esa diferencia era la única pista.

15. **El slug de un evento no es único.** El robot lo arma del nombre, así que un duplicado archivado y su gemelo publicado comparten slug. Todo lo que escriba tiene que identificar por el **id del registro de Airtable**. Mientras el panel mostraba solo los aprobados no se notaba; al mostrar los tres estados, apretar un botón en la fila del archivado le pegaba al evento publicado.

16. **Lo que se ve y lo que se declara no siempre coinciden, y hay que mirar las dos.** `organizer.url` publicaba la web del evento como si fuera la del organizador: en ocho fichas eso decía que una ticketera es el sitio de la productora. Nada de eso se ve en la página; solo en el schema.

17. **El build local no prueba las páginas de la agenda: en esta máquina no hay claves.** Sin `AIRTABLE_API_KEY`, `getEventos()` devuelve vacío, `generateStaticParams()` devuelve cero rutas y el componente de esa página **no llega a ejecutarse ni una vez**. El build termina en verde habiendo salteado todo lo que depende de Airtable, que es la mitad del sitio. Así se fue a producción un `esLaVigente` que estaba declarado en `generateMetadata` y usado en el componente: acá compiló, y en Vercel —donde sí hay datos— reventó al prerenderizar el primer mes. Es la regla 9 pero peor: no es que el build en verde no prueba nada, es que **prueba menos de lo que parece y no dice cuánto**. Cuando el cambio toca una página con datos, mirar en el resumen del build si esa ruta listó rutas hijas: si dice `● /imperdibles/[mes]` y abajo no hay ninguna, no se probó.

18. **Si el deploy no aparece, no es demora: preguntale a GitHub.** Estuve refrescando el CSS de producción quince veces esperando que propagara, y el deploy ya había fallado. GitHub anota cada deploy de Vercel con su estado, y se lee sin credenciales de Vercel:

    ```bash
    gh api repos/kiropablo/mate-y-eventos-web/deployments --jq '.[0].id'
    ```

    y con ese id, `gh api repos/kiropablo/mate-y-eventos-web/deployments/<id>/statuses --jq '.[].state'`. Dice `success` o `failure` en un segundo. **Es el chequeo que va después de cada push**, antes de ponerse a verificar nada en la web.

---

## ESTADO Y PENDIENTES

Todo lo que se puede contar, se cuenta solo: lo escribe `scripts/contar-estado.mjs`
desde la Action **Estado**, todos los días a las 11 (después de toda la cadena de contenido). Lo de abajo no se toca a mano.

<!-- CONTADO:INICIO -->
Contado solo el 31/8/2026. No editar a mano: lo reescribe
`scripts/contar-estado.mjs` y se pierde.

- **42 transcripciones**, 42 con subtítulos.
- **42 artículos**, todos publicados.
- **59 términos de glosario publicados** de 88 generados: quedan 29 en borrador.
- **338 eventos aprobados** en la agenda y 95 sin aprobar (borradores IA y archivados).
- **10 eventos verificados** por su organizador.
- De los aprobados: 115 sin fecha anunciada y 10 argentinos sin provincia. **No son datos que falten cargar**: son eventos cuya fecha o sede todavía no se anunció, y completarlos sería inventar.
- Search Console, semana del 23/8/2026 al 29/8/2026: **148 clics y 13.610 impresiones**. El grueso sigue entrando por fichas de agenda.
- YouTube: **47.990 visitas** y 292 suscriptores. Ojo: `STATS.vistasYouTube` en `app/lib/site.js` es un número aparte, escrito a mano, y es el que se publica en la web.
<!-- CONTADO:FIN -->

Los de Search Console y YouTube salen del **panel** (`datos.mateyeventos.com/api/data`,
que es público): ese proyecto ya guarda su propio histórico en Neon y lo actualiza cada hora.

Lo único que sigue a mano son los `STATS` de `app/lib/site.js` —las visitas de YouTube, el
crecimiento y los países—, que son **los números que se publican en la web**, con su fecha de
corte al pie. Las visitas se podrían tomar del panel igual que las de arriba; el crecimiento y
los países piden YouTube Analytics, que necesita OAuth y no alcanza con la clave que ya tenemos.

Pendientes:

1. ~~Los datos de Airtable~~ **no es un pendiente, es el estado real de esos eventos**. Los que no tienen fecha ni provincia son eventos cuya fecha o sede todavía no se anunció: completarlos sería inventar. El número exacto está arriba y se cuenta solo. Las fechas al revés de `curso-de-produccion-de-espectaculos` las detectó y vació el propio robot de verificación, y las notas internas publicadas en ExpoCehap y Expo Wedding se sacaron a mano y ahora el robot no las puede volver a escribir.
2. ~~8 títulos de episodio abren pregunta sin «¿»~~ **hecho** (28/8/2026): se corrigieron en YouTube y no queda ninguno.
3. ~~Newsletter automático semanal~~ **resuelto de otra forma** (27/8/2026, revisado el 28/8). Enviar por la API de beehiiv **pide el plan Max, US$96/mes**; su RSS-to-Send pide lo mismo, y la **Send API está en beta, se habilita a pedido y solo para Enterprise** —o sea que hoy está peor que en agosto, no mejor—. Launch y Scale traen la API de suscriptores —la que usa `/api/subscribe`— y con esa misma también se pueden **contar**: el listado devuelve `total_results`, así que `/admin/newsletter` muestra cuántos suscriptores activos hay pidiendo una sola fila (`app/lib/beehiiv.js`). La página arma el borrador solo —el episodio de la semana con su miniatura, los artículos, los términos nuevos y los eventos de los próximos diez días—, cada bloque se puede apagar, y el envío se hace a mano desde beehiiv. **No volver a investigar el plan sin mirar antes esa página.**
4. **Contenido que falta**: piezas de comparación ("A o B") y de costos con rangos propios fechados. Son las consultas que más se le hacen a una IA y las que hoy no cubrimos.
5. ~~Enlazar artículos y glosario por schema~~ **hecho** (27/8/2026): 31 de los 42 artículos declaran los términos que nombran y 17 fichas del glosario muestran en qué artículos se usa la palabra.
6. **Los términos del glosario no se enlazan entre sí.** El bloque "Términos relacionados" está programado en la ficha desde siempre, pero `generar-glosario.mjs` escribe `relacionados: []` fijo en los 89 y nadie lo llenó nunca: el bloque no apareció jamás en ninguna ficha. O se llena con un criterio comprobable —la misma idea de `enlaces.js`— o se saca el código.

## MI PEDIDO DE HOY

(acá escribo lo que necesito en cada sesión)
