import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import SpotifyButton from "../../components/SpotifyButton";
import { getEpisodes, getEpisodeById, formatDate } from "../../lib/youtube";
import { getTranscript } from "../../lib/transcripts";
import { SITE, LINKS } from "../../lib/site";

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
  return m
    ? { season: parseInt(m[1], 10), episode: parseInt(m[2], 10) }
    : null;
}

// Pre-genera las páginas de los episodios actuales del feed.
export async function generateStaticParams() {
  const episodes = await getEpisodes();
  return episodes.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }) {
  const ep = await getEpisodeById(params.id);
  if (!ep) return { title: "Episodio" };
  const desc = metaDescription(ep.description || SITE.descripcion);
  return {
    title: ep.title,
    description: desc,
    alternates: { canonical: `/episodios/${ep.id}` },
    openGraph: {
      type: "video.other",
      title: ep.title,
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
  const transcript = getTranscript(ep.id);

  const videoObject = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: ep.title,
    description: cleanDesc,
    thumbnailUrl: ep.thumb,
    uploadDate: ep.published,
    embedUrl: `https://www.youtube.com/embed/${ep.id}`,
    url: `${SITE.url}/episodios/${ep.id}`,
    publisher: { "@type": "Organization", name: SITE.name },
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
    partOfSeries: {
      "@type": "PodcastSeries",
      name: SITE.name,
      url: SITE.url,
    },
    associatedMedia: {
      "@type": "VideoObject",
      name: ep.title,
      embedUrl: `https://www.youtube.com/embed/${ep.id}`,
      thumbnailUrl: ep.thumb,
      uploadDate: ep.published,
    },
  };

  const jsonLd = [videoObject, podcastEpisode];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Link href="/episodios" className="ep-back">
            ← Todos los episodios
          </Link>
          <div className="ep-date" style={{ marginTop: "18px" }}>
            {formatDate(ep.published)}
          </div>
          <h1 style={{ marginTop: "10px" }}>{ep.title}</h1>
        </div>
      </section>

      <section className="section-p" data-accent="blue" style={{ paddingTop: "36px" }}>
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

          {transcript ? (
            <div style={{ marginTop: "48px", maxWidth: "760px" }}>
              <div className="eyebrow" style={{ marginBottom: "14px" }}>
                Transcripción
              </div>
              <div className="ep-transcript">
                {transcript.split(/\n\s*\n/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <Footer />
    </>
  );
}
