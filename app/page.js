import Link from "next/link";
import Image from "next/image";
import SiteNav from "./components/SiteNav";
import Footer from "./components/Footer";
import { getEpisodes } from "./lib/youtube";
import { getArticulos, formatFecha } from "./lib/articulos";
import {
  getEventos,
  formatRango,
  hoyISO,
  enCurso,
  yaPaso,
} from "./lib/agenda";
import { STATS } from "./lib/site";
import CarruselEpisodios from "./components/CarruselEpisodios";

export const revalidate = 3600;

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const episodes = await getEpisodes();
  // Vistas en vivo desde YouTube; si la API no contesta, el número
  // cargado a mano.
  // Congelado: antes salía en vivo de la API de YouTube. Ver STATS en
  // lib/site.js.
  const vistas = STATS.vistasYouTube;

  // Lo que se viene y lo último escrito, para que la home mande tráfico a las
  // dos secciones que hoy no linkea desde ningún lado.
  const hoy = hoyISO();
  const eventos = await getEventos();
  const proximos = eventos
    .filter((e) => e.fechaInicio && !yaPaso(e))
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    .slice(0, 4);
  const ultimosArticulos = getArticulos().slice(0, 3);

  const latestHref =
    episodes.length > 0 ? `/episodios/${episodes[0].id}` : "/episodios";

  // Los que van al carrusel de arriba. Dieciséis: el anillo nunca se ve
  // entero —los que quedan a más de tres lugares del centro se ocultan— así
  // que sumar episodios no recarga la pantalla, solo da más para girar.
  const paraElCarrusel = episodes.slice(0, 16);

  const faqItems = [
    {
      q: "¿Qué es Mate y Eventos?",
      a: "Mate y Eventos es un medio audiovisual y podcast argentino especializado en la industria de eventos de Latinoamérica, creado y conducido por Pablo Quiroga y Alexis Vidal. Cada semana comparte conversaciones sobre producción, estrategia, tecnología y el lado humano del rubro.",
    },
    {
      q: "¿Cada cuánto sale un episodio nuevo?",
      a: "Publicamos un episodio nuevo cada miércoles, con una duración aproximada de 20 minutos.",
    },
    {
      q: "¿Dónde puedo escuchar o ver el podcast?",
      a: "Está disponible en YouTube, Spotify y Apple Podcasts. Además publicamos clips y contenido complementario en Instagram, TikTok y LinkedIn.",
    },
    {
      q: "¿De qué temas habla Mate y Eventos?",
      a: "Cada episodio gira en torno a cuatro ejes: el lado humano de los eventos, estrategia y negocio, técnica y producción, y tendencias y tecnología aplicadas a la industria.",
    },
    {
      q: "¿Cómo puedo sponsorear el podcast o ser invitado?",
      a: "Podés escribirnos a mateyeventos@gmail.com o desde las páginas Para marcas y Contacto del sitio. Buscamos marcas alineadas con la comunidad y voces con experiencia real en la industria.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero" data-accent="blue">
        <div className="photo par" data-speed="0.16" aria-hidden="true" />
        <div className="hfade" aria-hidden="true" />
        <div className="ui">
          <SiteNav />
          <div className="hstage hstage--corto" id="hstage">
            <div
              className="eyebrow"
              style={{ color: "#fff", marginBottom: "16px" }}
            >
              Podcast · Industria de eventos · LATAM
            </div>
            {/* El logo nítido, al lado del nombre. El del fondo está fuera de
                foco a propósito: es atmósfera, no identidad. */}
            <div className="hmarca">
              <Image
                className="hmarca__logo"
                src="/isotipo.png"
                alt=""
                width={132}
                height={132}
                priority
              />
              <h1>
                Mate y<span className="l2">Eventos</span>
              </h1>
            </div>
            <div className="hsub">
              <span>El backstage de la industria, en voz alta.</span>
              <span>Nuevo episodio cada miércoles.</span>
            </div>
          </div>

          {/* Los últimos episodios, arriba de todo: es lo primero que se ve
              al entrar. Abajo del carrusel queda el link a la sección, que es
              adonde va el que quiere verlos todos. */}
          {paraElCarrusel.length > 0 ? (
            <div className="hcarr">
              <CarruselEpisodios episodios={paraElCarrusel} />
              <div className="hcarr__pie">
                <Link href="/episodios" className="hcarr__todos">
                  Ver todos los episodios
                </Link>
              </div>
            </div>
          ) : (
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
          )}
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

      {/* ---------- PRÓXIMOS EVENTOS ---------- */}
      {proximos.length > 0 && (
        <section className="section-p" data-accent="blue">
          <div className="wrap">
            <div className="eyebrow reveal">
              <span className="n">—</span>Próximos eventos
            </div>
            <h2 className="clip" style={{ margin: "14px 0 26px" }}>
              Lo que se viene.
            </h2>
            <div className="ag-tabla">
              {proximos.map((ev) => (
                <Link
                  href={`/agenda/${ev.slug}`}
                  key={ev.slug}
                  className="ag-fila"
                >
                  <span className="ag-fila__fecha">
                    {Number(ev.fechaInicio.slice(8, 10))}
                  </span>
                  <span className="ag-fila__cuerpo">
                    <span className="ag-fila__nombre">
                      {enCurso(ev, hoy) ? (
                        <span className="ev-star">● </span>
                      ) : null}
                      {ev.nombre}
                    </span>
                    <span className="ag-fila__meta">
                      {formatRango(ev)}
                      {[ev.ciudad || ev.provincia, ev.pais]
                        .filter(Boolean)
                        .join(", ")
                        ? ` · ${[ev.ciudad || ev.provincia, ev.pais].filter(Boolean).join(", ")}`
                        : ""}
                    </span>
                  </span>
                  <span className="ag-fila__flecha" aria-hidden>
                    →
                  </span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: "26px" }}>
              <Link className="btn" href="/agenda">
                Ver la agenda completa
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------- ÚLTIMOS ARTÍCULOS ---------- */}
      {ultimosArticulos.length > 0 && (
        <section className="section-p" data-accent="magenta">
          <div className="wrap">
            <div className="eyebrow reveal">
              <span className="n">—</span>Últimos artículos
            </div>
            <h2 className="clip" style={{ margin: "14px 0 26px" }}>
              Para leer.
            </h2>
            <div className="home-arts">
              {ultimosArticulos.map((art, i) => (
                <Link
                  className="home-art reveal"
                  href={`/articulos/${art.id}`}
                  key={art.id}
                  style={{ transitionDelay: `${i * 0.06}s` }}
                >
                  <span className="home-art__eje">{art.eje}</span>
                  <h3 className="home-art__tit">{art.titulo}</h3>
                  <p className="home-art__baj">{art.bajada}</p>
                  <span className="home-art__pie">
                    {formatFecha(art.fecha)} · {art.lectura} min
                  </span>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: "26px" }}>
              <Link className="btn" href="/articulos">
                Ver todos los artículos
              </Link>
            </div>
          </div>
        </section>
      )}

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
                <span className="cnt" data-to={vistas}>
                  {vistas.toLocaleString("es-AR")}
                </span>
              </div>
              <div className="l">Vistas en YouTube</div>
              <div className="rule" />
            </div>
            <div className="stat reveal" style={{ transitionDelay: ".2s" }}>
              <div className="n">
                +<span className="cnt" data-to={STATS.crecimientoMensual}>
                  {STATS.crecimientoMensual}
                </span>
                <span className="suf">%</span>
              </div>
              <div className="l">Crecimiento mensual</div>
              <div className="rule" />
            </div>
            <div className="stat reveal" style={{ transitionDelay: ".3s" }}>
              <div className="n">
                <span className="cnt" data-to={STATS.paises}>
                  {STATS.paises}
                </span>
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

      <section className="faq" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Preguntas frecuentes
          </div>
          <h2 className="clip">Lo que solés preguntar.</h2>
          <div className="faq-list" style={{ marginTop: "34px" }}>
            {faqItems.map((item, i) => (
              <div className="faq-item reveal" key={i}>
                <h3 className="faq-q">{item.q}</h3>
                <p className="faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Footer />
    </>
  );
}
