import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import SpotifyButton from "../../components/SpotifyButton";
import {
  getEpisodes,
  getEpisodeById,
  formatDate,
  partirTitulo,
} from "../../lib/youtube";
import {
  getTranscript,
  getSecciones,
  armarTranscripcion,
} from "../../lib/transcripts";
import { getArticuloDeEpisodio } from "../../lib/articulos";
import { terminosDelEpisodio } from "../../lib/glosario";
import { SITE, LINKS, AUTORES } from "../../lib/site";
import { migas } from "../../lib/migas";

export const revalidate = 3600;

// Limpia texto para meta descripción: sin saltos de línea, cortado en palabra.
function metaDescription(text) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  return clean.slice(0, 157).replace(/\s+\S*$/, "") + "…";
}

// Detecta "T02E21" → { season: 2, episode: 21 } para el schema.
function seasonEpisode(title) {
  const m = (title || "").match(/T\s*(\d+)\s*E\s*(\d+)/i);
  return m ? { season: parseInt(m[1], 10), episode: parseInt(m[2], 10) } : null;
}

// Pre-genera las páginas de los episodios actuales del feed.
export async function generateStaticParams() {
  const episodes = await getEpisodes();
  return episodes.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }) {
  const ep = await getEpisodeById(params.id);
  if (!ep) return { title: "Episodio" };
  const { codigo, tema, invitado } = partirTitulo(ep.title);
  // El tema va primero: el código de episodio adelante se comía los primeros
  // caracteres del título, que es lo poco que muestra Google. El invitado
  // pasa a la descripción, donde suma sin ocupar el lugar de la búsqueda.
  const desc = metaDescription(
    (invitado ? `Con ${invitado}. ` : "") +
      (ep.description || SITE.descripcion),
  );
  // Escalera de títulos, de más completo a más corto. Google muestra unos 65
  // caracteres: si el tema ya se los come, sumarle la marca solo consigue que
  // el corte se lleve el final del tema en vez de la marca.
  const conCodigo = `${tema} · ${SITE.name}${codigo ? ` ${codigo}` : ""}`;
  const conMarca = `${tema} · ${SITE.name}`;
  const titulo =
    conCodigo.length <= 65 ? conCodigo : conMarca.length <= 65 ? conMarca : tema;

  return {
    title: { absolute: titulo },
    description: desc,
    alternates: { canonical: `/episodios/${ep.id}` },
    openGraph: {
      type: "video.other",
      title: titulo,
      description: desc,
      images: [{ url: ep.thumb }],
    },
  };
}

export default async function Episodio({ params }) {
  const ep = await getEpisodeById(params.id);
  if (!ep) notFound();

  const cleanDesc = (ep.description || SITE.descripcion)
    .replace(/\s+/g, " ")
    .trim();
  const se = seasonEpisode(ep.title);
  const partes = partirTitulo(ep.title);
  const transcript = getTranscript(ep.id);
  const bloques = armarTranscripcion(transcript, getSecciones(ep.id));
  const terminos = terminosDelEpisodio(ep.id);
  const articulo = getArticuloDeEpisodio(ep.id);

  // Cada entidad se declara UNA vez y con @id, y lo demás la referencia.
  //
  // Antes cada página de episodio publicaba su propia PodcastSeries, su propia
  // Organization y el VideoObject dos veces —suelto y adentro de
  // associatedMedia—: 41 páginas creando dos series de podcast homónimas con
  // URL distinta y dos organizaciones homónimas, sin nada que las una. Es lo
  // contrario de lo que hace el layout, donde cada entidad lleva @id
  // justamente para que la máquina entienda que son la misma.
  const idVideo = `${SITE.url}/episodios/${ep.id}#video`;

  const videoObject = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": idVideo,
    name: ep.title,
    description: cleanDesc,
    thumbnailUrl: ep.thumb,
    uploadDate: ep.published,
    embedUrl: `https://www.youtube.com/embed/${ep.id}`,
    url: `${SITE.url}/episodios/${ep.id}`,
    publisher: { "@id": `${SITE.url}/#organization` },
    ...(transcript ? { transcript } : {}),
  };

  const podcastEpisode = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: ep.title,
    description: cleanDesc,
    datePublished: ep.published,
    url: `${SITE.url}/episodios/${ep.id}`,
    ...(se ? { episodeNumber: se.episode } : {}),
    ...(se
      ? { partOfSeason: { "@type": "PodcastSeason", seasonNumber: se.season } }
      : {}),
    // La serie y el video son los que ya están declarados: la del layout y el
    // VideoObject de arriba de este mismo archivo.
    partOfSeries: { "@id": `${SITE.url}/#podcast` },
    associatedMedia: { "@id": idVideo },
    publisher: { "@id": `${SITE.url}/#organization` },
    // Los dos que conducen, por @id contra los Person del layout.
    author: AUTORES.map((a) => ({ "@id": `${SITE.url}/#${a.id}` })),
  };

  const jsonLd = [
    videoObject,
    podcastEpisode,
    migas([
      ["Episodios", "/episodios"],
      // El tema, no el título crudo de YouTube: en la ruta, "T02E20 | Cómo
      // definir el precio…" arranca con un código que no le dice nada a nadie.
      // partirTitulo() ya separa código, tema e invitado y la ficha la usa.
      [partes.tema || ep.title, null],
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="wrap">
        <SiteNav />
      </div>

      <section
        className="page-top"
        data-accent="blue"
        style={{ paddingBottom: 0 }}
      >
        <div className="wrap">
          <Link href="/episodios" className="ep-back">
            ← Todos los episodios
          </Link>
          <div className="ep-date" style={{ marginTop: "18px" }}>
            {formatDate(ep.published)}
          </div>
          <h1 style={{ marginTop: "10px" }}>{partes.tema}</h1>
          {partes.invitado ? (
            <p className="lead reveal" style={{ marginTop: "14px" }}>
              Con {partes.invitado}
              {partes.codigo ? ` · ${partes.codigo}` : ""}
            </p>
          ) : null}
        </div>
      </section>

      <section
        className="section-p"
        data-accent="blue"
        style={{ paddingTop: "36px" }}
      >
        <div className="wrap">
          <div className="ep-media" style={{ maxWidth: "900px" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ep.id}`}
              title={ep.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div style={{ marginTop: "26px" }}>
            <SpotifyButton href={LINKS.spotify} />
          </div>

          {ep.description ? (
            <div style={{ marginTop: "40px", maxWidth: "760px" }}>
              <div className="eyebrow" style={{ marginBottom: "14px" }}>
                Sobre este episodio
              </div>
              <div className="ep-desc" style={{ whiteSpace: "pre-line" }}>
                {ep.description}
              </div>
            </div>
          ) : null}

          {articulo ? (
            <Link
              href={`/articulos/${articulo.id}`}
              className="ep-articulo"
              style={{ marginTop: "40px", maxWidth: "760px" }}
            >
              <div className="eyebrow">Para leer</div>
              <h2 className="ep-articulo__titulo">{articulo.titulo}</h2>
              <p className="ep-articulo__bajada">{articulo.bajada}</p>
              <span className="ep-articulo__link">
                Leer el artículo · {articulo.lectura} min
              </span>
            </Link>
          ) : null}

          {terminos.length > 0 ? (
            <div className="ep-glosario">
              <h2 className="ev-h2">Palabras que salen en este episodio</h2>
              <div className="ep-glosario__tira">
                {terminos.map((t) => (
                  <Link
                    className="chip"
                    href={`/glosario/${t.slug}`}
                    key={t.slug}
                  >
                    {t.termino}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {transcript ? (
            <details
              className="transcript"
              style={{ marginTop: "48px", maxWidth: "760px" }}
            >
              <summary className="transcript__toggle">
                <span className="transcript__label">Transcripción</span>
                <span className="transcript__hint">Ver texto completo</span>
              </summary>
              <div className="ep-transcript" style={{ marginTop: "20px" }}>
                {bloques.map((b, i) => (
                  <section key={i}>
                    {b.titulo ? (
                      <h2 className="ep-transcript__h2">{b.titulo}</h2>
                    ) : null}
                    {b.parrafos.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </section>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      </section>

      <Footer />
    </>
  );
}
