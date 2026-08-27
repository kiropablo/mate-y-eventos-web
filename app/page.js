import Link from "next/link";
import Image from "next/image";
import SiteNav from "./components/SiteNav";
import Footer from "./components/Footer";
import NewsletterForm from "./components/NewsletterForm";
import { getEpisodes } from "./lib/youtube";
import { getArticulos, formatFecha } from "./lib/articulos";
import {
  getEventos,
  formatRango,
  hoyISO,
  enCurso,
  yaPaso,
} from "./lib/agenda";
import { STATS, fechaCorta } from "./lib/site";
import CarruselEpisodios from "./components/CarruselEpisodios";

export const revalidate = 3600;

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const episodes = await getEpisodes();
  // Lo que se viene y lo último escrito, para que la home mande tráfico a las
  // dos secciones que hoy no linkea desde ningún lado.
  const hoy = hoyISO();
  const eventos = await getEventos();
  const proximos = eventos
    .filter((e) => e.fechaInicio && !yaPaso(e))
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    .slice(0, 4);
  // Los que faltan, que es lo que muestra la agenda. Se redondea para abajo a
  // la centena: el número se mueve todos los días y "+300" envejece mucho
  // mejor que una cifra exacta que mañana es otra.
  const eventosEnAgenda = Math.floor(
    eventos.filter((e) => !yaPaso(e)).length / 100
  ) * 100;
  // Se guarda la lista entera además de los tres que se muestran: el texto
  // de la sección dice cuántos hay publicados, y ese número tiene que salir
  // del contenido y no escrito a mano, para que no envejezca solo.
  const todosLosArticulos = getArticulos();
  const ultimosArticulos = todosLosArticulos.slice(0, 3);

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
      q: "¿Quiénes son Pablo Quiroga y Alexis Vidal?",
      a: "Son los dos productores que hacen Mate y Eventos. Pablo lleva más de 18 años en la industria: empezó como productor técnico en shows masivos y hoy trabaja en el sector corporativo; en el medio lleva la visión editorial. Alexis es productor y creativo, especializado en la operación real de los eventos, donde la técnica y la creatividad conviven todo el tiempo.",
    },
    {
      q: "¿Qué es la agenda de Mate y Eventos y quién la mantiene?",
      a: "Es una agenda pública con más de 300 congresos, expos, festivales y grandes producciones de Argentina y Latinoamérica, cada uno con su fecha, sede, organizador y sitio oficial. La mantiene el equipo de Mate y Eventos, y los organizadores pueden confirmar los datos de su propio evento: cuando lo hacen, la ficha lleva el sello Verificado con el mes en que se confirmó.",
    },
    {
      q: "¿Cómo se sugiere un evento para la agenda?",
      a: "Desde mateyeventos.com/agenda/sugerir, completando el formulario con el nombre, la fecha y el sitio oficial del evento. No hace falta pagar nada ni ser sponsor: la agenda es gratuita y abierta a cualquier evento de la industria de la región.",
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
              {/* El descriptor va ADENTRO del h1, como tercera línea chica.
                  El h1 es la etiqueta más fuerte de la página y hasta ahora
                  decía solo el nombre de la marca: el único dato que el que
                  entra ya tenía, porque está en el logo, en el menú, en la
                  pestaña y en la URL. El logo gigante queda igual. */}
              {/* Los espacios entre las líneas son explícitos: el salto de
                  línea del JSX no aporta ninguno y los <span> son bloques por
                  CSS, cosa que un extractor de texto no sabe. Sin esto el
                  textContent del h1 sale "Mate yEventosEl medio de la…", que
                  es justamente lo que leen Google y los asistentes. */}
              <h1>
                Mate y{" "}
                <span className="l2">Eventos</span>{" "}
                <span className="l3">
                  &mdash; El medio de la industria de eventos en Latinoamérica
                </span>
              </h1>
            </div>
            <div className="hsub">
              <span>El backstage de la industria, en voz alta.</span>
              <span>
                Un episodio nuevo cada miércoles, la agenda de la región y
                artículos para aplicar el lunes.
              </span>
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
          {/* El párrafo que faltaba: qué es esto, en castellano llano y sin
              depender del resto de la página. Hasta ahora la única definición
              del sitio estaba en la primera pregunta del FAQ, al pie. Un
              lector nuevo y un modelo tienen el mismo problema: leen los
              títulos primero, y los títulos no decían nada. */}
          <p className="body reveal" style={{ transitionDelay: ".06s" }}>
            <strong>Mate y Eventos</strong> es un medio audiovisual argentino
            especializado en la industria de eventos de Latinoamérica. Lo hacen
            Pablo Quiroga y Alexis Vidal, productores con más de 18 años en el
            rubro. Cada miércoles publican un episodio de unos 20 minutos;
            además mantienen la agenda de eventos de la región —más de 300
            fichas con fecha, sede y organizador—, un glosario del oficio y
            artículos que amplían cada conversación.
          </p>
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
              <span className="n">—</span>La agenda
            </div>
            <h2 className="clip" style={{ margin: "14px 0 18px" }}>
              La agenda de la industria, actualizada todos los días.
            </h2>
            <p className="body reveal" style={{ marginBottom: "26px" }}>
              Congresos, expos, festivales y grandes producciones de Argentina y
              Latinoamérica, con fecha, sede, organizador y link para comprar
              entradas. Hoy hay más de 300 eventos cargados, y los organizadores
              validan su propia ficha.
            </p>
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
            <h2 className="clip" style={{ margin: "14px 0 18px" }}>
              Artículos que amplían cada episodio.
            </h2>
            <p className="body reveal" style={{ marginBottom: "26px" }}>
              Cada conversación del podcast se convierte en un análisis con
              preguntas frecuentes al final. Ya hay {todosLosArticulos.length}{" "}
              publicados sobre presupuestos, proveedores, producción, liderazgo
              y tecnología.
            </p>
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

            {/* Tres secciones hechas para ser encontradas que la home ignoraba:
                desde acá no se llegaba a ninguna salvo por el menú. */}
            <div className="home-otros reveal">
              <Link href="/glosario">
                Glosario del rubro
                <span>Qué quiere decir cada palabra del oficio</span>
              </Link>
              <Link href="/imperdibles">
                Los imperdibles del mes
                <span>Los pocos que elegimos, con el motivo de cada uno</span>
              </Link>
              <Link href="/agenda/esta-semana">
                Esta semana en eventos
                <span>Qué pasa en la industria en los próximos días</span>
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
          {/* Las tres cifras cambian de criterio. Antes acá iban las vistas de
              YouTube: el número de un canal chico, puesto justo en el bloque
              donde el proyecto se presenta como medio. La agenda y los
              artículos son propios, no los tiene nadie más en la región y
              crecen todas las semanas. Las métricas de audiencia siguen
              teniendo todo el sentido en /sponsors, que es donde las mira
              quien las tiene que mirar.

              Los dos primeros se cuentan del contenido, así que no envejecen
              solos; el tercero es de STATS y por eso lleva la fecha de corte
              abajo. Un número sin fecha es un pasivo: una IA que lo cite lo va
              a citar viejo y no tiene cómo saber que envejeció. */}
          <div className="grid">
            <div className="stat reveal" style={{ transitionDelay: ".1s" }}>
              <div className="n">
                +<span className="cnt" data-to={eventosEnAgenda}>
                  {eventosEnAgenda}
                </span>
              </div>
              <div className="l">Eventos en la agenda</div>
              <div className="rule" />
            </div>
            <div className="stat reveal" style={{ transitionDelay: ".2s" }}>
              <div className="n">
                <span className="cnt" data-to={todosLosArticulos.length}>
                  {todosLosArticulos.length}
                </span>
              </div>
              <div className="l">Artículos publicados</div>
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
          <p className="sem-nota" style={{ marginTop: "18px" }}>
            Eventos y artículos, al día de hoy. Países en la audiencia, dato al{" "}
            {fechaCorta(STATS.actualizado)}.
          </p>
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

      {/* El mail es el único canal que no depende de un algoritmo, y la home
          nunca lo pedía. */}
      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Newsletter
          </div>
          <h2 className="clip" style={{ margin: "14px 0 18px" }}>
            Lo de la semana, en tu mail.
          </h2>
          <p className="body reveal" style={{ marginBottom: "26px" }}>
            El episodio nuevo, los artículos y los eventos que se vienen. Sin
            spam y con un click para darte de baja.
          </p>
          <NewsletterForm />
        </div>
      </section>

      <section className="faq" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Preguntas frecuentes
          </div>
          <h2 className="clip">Preguntas frecuentes sobre Mate y Eventos.</h2>
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
