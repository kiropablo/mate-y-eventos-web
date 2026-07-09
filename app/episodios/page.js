import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import EpisodePlayer from "../components/EpisodePlayer";
import { getEpisodes, formatDate } from "../lib/youtube";
import { LINKS } from "../lib/site";

export const metadata = {
  title: "Episodios",
  description:
    "Todos los episodios de Mate y Eventos, el podcast de la industria de eventos en Latinoamérica. Nuevo capítulo cada miércoles.",
};

// Re-lee el feed cada hora: los episodios nuevos aparecen solos.
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
          <a
            className="btn btn--ghost reveal"
            style={{ marginTop: "24px", transitionDelay: ".18s" }}
            href={LINKS.spotify}
            target="_blank"
            rel="noopener noreferrer"
          >
            Escuchar en Spotify
          </a>
        </div>
      </section>

      {episodes.length === 0 ? (
        // Estado seguro si el feed no responde
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
                <a
                  className="btn btn--ghost"
                  href={LINKS.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Spotify
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Episodio destacado (el más reciente) */}
          <section className="section-p" data-accent="blue" style={{ paddingBottom: "clamp(50px,9vh,90px)" }}>
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
                  <h2 className="ep-featured__title">{featured.title}</h2>
                  {featured.description ? (
                    <p className="ep-desc ep-desc--long">
                      {featured.description}
                    </p>
                  ) : null}
                  <a
                    className="btn btn--ghost"
                    href={LINKS.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Escuchar en Spotify
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Resto de episodios */}
          {rest.length > 0 && (
            <section className="section-p" data-accent="blue" style={{ paddingTop: 0 }}>
              <div className="wrap">
                <div className="eyebrow reveal">
                  <span className="n">02</span>Anteriores
                </div>
                <div className="ep-grid" style={{ marginTop: "34px" }}>
                  {rest.map((ep) => (
                    <article className="ep-card reveal" key={ep.id}>
                      <EpisodePlayer
                        id={ep.id}
                        title={ep.title}
                        thumb={ep.thumb}
                      />
                      <div className="ep-card__info">
                        <div className="ep-date">{formatDate(ep.published)}</div>
                        <h3 className="ep-card__title">{ep.title}</h3>
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
