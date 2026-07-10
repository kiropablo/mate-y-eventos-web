import Link from "next/link";
import SiteNav from "./components/SiteNav";
import Footer from "./components/Footer";
import { getEpisodes } from "./lib/youtube";

export const revalidate = 3600;

export default async function Home() {
  const episodes = await getEpisodes();
  const latestHref =
    episodes.length > 0 ? `/episodios/${episodes[0].id}` : "/episodios";
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero" data-accent="blue">
        <div className="photo par" data-speed="0.16" aria-hidden="true" />
        <div className="hfade" aria-hidden="true" />
        <div className="ui">
          <SiteNav />
          <div className="hstage" id="hstage">
            <div
              className="eyebrow"
              style={{ color: "#fff", marginBottom: "26px" }}
            >
              Podcast · Industria de eventos · LATAM
            </div>
            <h1>
              Mate y<span className="l2">Eventos</span>
            </h1>
            <div className="hsub">
              El backstage de la industria, en voz alta. Nuevo episodio cada
              miércoles.
            </div>
            <Link href={latestHref} className="hplay" aria-label="Mirá el último episodio">
              <span className="hplay__disc" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="hplay__label">
                Mirá el
                <br />
                último episodio
              </span>
            </Link>
          </div>
        </div>
        <div className="scrollhint">Scrolleá</div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <div className="marq">
        <div className="track" id="mtrack">
          <span>Producción</span>
          <span>·</span>
          <span>Estrategia</span>
          <span>·</span>
          <span>
            <b>Tecnología</b>
          </span>
          <span>·</span>
          <span>Backstage</span>
          <span>·</span>
          <span>Creatividad</span>
          <span>·</span>
          <span>
            <b>Comunidad</b>
          </span>
          <span>·</span>
        </div>
      </div>

      {/* ---------- MANIFIESTO ---------- */}
      <section className="manif" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">01</span>Lo que defendemos
          </div>
          <h2 className="clip">
            Un medio hecho <em>desde adentro</em> de la industria.
          </h2>
          <p className="body reveal" style={{ transitionDelay: ".1s" }}>
            Mate y Eventos nace de años viviendo los eventos desde el backstage,
            y de entender que gran parte de ese conocimiento nunca se comparte.
            Lo transformamos en herramientas, ideas y conversaciones que ayudan a
            toda la industria a crecer.
          </p>
          <Link
            href="/sobre"
            className="btn btn--ghost reveal"
            style={{ transitionDelay: ".18s", marginTop: "34px" }}
          >
            Conocé el proyecto
          </Link>
        </div>
      </section>

      {/* ---------- MÉTRICAS ---------- */}
      <section className="nums" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">02</span>Alcance
          </div>
          <h2 className="clip">Una audiencia que decide.</h2>
          <div className="grid">
            <div className="stat reveal" style={{ transitionDelay: ".1s" }}>
              <div className="n">
                <span className="cnt" data-to="32513">0</span>
              </div>
              <div className="l">Vistas en YouTube</div>
              <div className="rule" />
            </div>
            <div className="stat reveal" style={{ transitionDelay: ".2s" }}>
              <div className="n">
                +<span className="cnt" data-to="5">0</span>
                <span className="suf">%</span>
              </div>
              <div className="l">Crecimiento mensual</div>
              <div className="rule" />
            </div>
            <div className="stat reveal" style={{ transitionDelay: ".3s" }}>
              <div className="n">
                <span className="cnt" data-to="17">0</span>
              </div>
              <div className="l">Países en la audiencia</div>
              <div className="rule" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA SPONSORS ---------- */}
      <section className="cta" data-accent="magenta">
        <div className="glowplate" aria-hidden="true" />
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">03</span>Para marcas
          </div>
          <h2 className="clip">Llegá a los que deciden en eventos.</h2>
          <p
            className="body reveal"
            style={{ transitionDelay: ".1s", marginTop: "18px" }}
          >
            Una comunidad específica de profesionales del rubro en Latinoamérica.
            Si tu marca vive de los eventos, están todos acá.
          </p>
          <Link
            href="/sponsors"
            className="btn reveal"
            style={{ transitionDelay: ".18s" }}
          >
            Quiero ser sponsor
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
