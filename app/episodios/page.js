import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import EpisodePlayer from "../components/EpisodePlayer";
import SpotifyButton from "../components/SpotifyButton";
import { getEpisodes, formatDate } from "../lib/youtube";
import { LINKS } from "../lib/site";

export const metadata = {
  alternates: { canonical: "/episodios" },
  title: "Episodios",
  description:
    "Todos los episodios de Mate y Eventos, el podcast de la industria de eventos en Latinoamérica. Nuevo capítulo cada miércoles.",
};

export const revalidate = 3600;

export default async function Episodios() {
  const episodes = await getEpisodes();
  const [featured, ...rest] = episodes;

  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Episodios
          </div>
          <h1>
            Nuevo capítulo<br />cada miércoles.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Conversaciones ágiles sobre producción, estrategia, tecnología y el
            lado humano de la industria de eventos.
          </p>
          <div className="reveal" style={{ transitionDelay: ".18s", marginTop: "24px" }}>
            <SpotifyButton href={LINKS.spotify} />
          </div>
        </div>
      </section>

      {episodes.length === 0 ? (
        <section className="section-p" data-accent="blue">
          <div className="wrap">
            <div className="hold reveal">
              <span className="tag">Cargando episodios</span>
              <p>
                Los episodios se cargan automáticamente desde el canal de
                YouTube. Si no ves la lista, mirá directo en las plataformas:
              </p>
              <div
                className="field-row"
                style={{ justifyContent: "center", maxWidth: "none" }}
              >
                <a
                  className="btn"
                  href={LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube
                </a>
                <SpotifyButton href={LINKS.spotify} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section
            className="section-p"
            data-accent="blue"
            style={{ paddingBottom: "clamp(50px,9vh,90px)" }}
          >
            <div className="wrap">
              <div className="eyebrow reveal">
                <span className="n">01</span>Último episodio
              </div>
              <div className="ep-featured reveal" style={{ marginTop: "22px" }}>
                <EpisodePlayer
                  id={featured.id}
                  title={featured.title}
                  thumb={featured.thumb}
                />
                <div className="ep-featured__info">
                  <div className="ep-date">{formatDate(featured.published)}</div>
                  <Link href={`/episodios/${featured.id}`}>
                    <h2 className="ep-featured__title">{featured.title}</h2>
                  </Link>
                  {featured.description ? (
                    <p className="ep-desc ep-desc--long">
                      {featured.description}
                    </p>
                  ) : null}
                  <div className="ep-actions">
                    <Link
                      href={`/episodios/${featured.id}`}
                      className="btn btn--ghost"
                    >
                      Ver episodio
                    </Link>
                    <SpotifyButton href={LINKS.spotify} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {rest.length > 0 && (
            <section
              className="section-p"
              data-accent="blue"
              style={{ paddingTop: 0 }}
            >
              <div className="wrap">
                <div className="eyebrow reveal">
                  <span className="n">02</span>Anteriores
                </div>
                <div className="ep-grid" style={{ marginTop: "34px" }}>
                  {rest.map((ep) => (
                    <article className="ep-card reveal" key={ep.id}>
                      <Link
                        href={`/episodios/${ep.id}`}
                        className="ep-media ep-facade"
                        aria-label={ep.title}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ep.thumb}
                          alt={`Miniatura del episodio: ${ep.title}`}
                          loading="lazy"
                        />
                        <span className="ep-play" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </Link>
                      <div className="ep-card__info">
                        <div className="ep-date">{formatDate(ep.published)}</div>
                        <Link href={`/episodios/${ep.id}`}>
                          <h3 className="ep-card__title">{ep.title}</h3>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <Footer />
    </>
  );
}
