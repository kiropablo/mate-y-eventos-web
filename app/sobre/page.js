import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { SITE } from "../lib/site";

export const metadata = {
  title: "Sobre el podcast",
  description:
    "Qué es Mate y Eventos, su propósito y las personas detrás: Pablo Quiroga y Alexis Vidal, un medio audiovisual de la industria de eventos en LATAM.",
};

const VALORES = [
  ["Profesionalismo", "Los eventos merecen responsabilidad, criterio y excelencia."],
  ["Comunidad", "La industria crece cuando el conocimiento se comparte."],
  ["Autenticidad", "Hablamos desde la experiencia real, sin exageraciones."],
  ["Pasión", "Vivimos los eventos con entusiasmo genuino y compromiso."],
  ["Creatividad con propósito", "Las ideas valen más con estrategia y objetivos claros."],
  ["Cercanía", "Nos comunicamos desde un lugar humano y accesible."],
];

export default function Sobre() {
  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Sobre el proyecto
          </div>
          <h1>
            Un medio hecho<br />desde adentro.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            {SITE.name} nace de años viviendo los eventos desde el backstage, y
            de entender que gran parte de ese conocimiento nunca se comparte.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">01</span>Qué es
          </div>
          <h2 className="clip" style={{ margin: "14px 0 20px" }}>
            El podcast de la industria.
          </h2>
          <p className="body reveal">
            Un medio audiovisual argentino especializado en la industria de
            eventos de Latinoamérica, creado y conducido por Pablo Quiroga y
            Alexis Vidal. Cada semana, en episodios de unos 20 minutos,
            conversaciones sobre producción, estrategia, tendencias, tecnología
            y el lado humano del rubro.
          </p>

          <div className="grid" style={{ marginTop: "54px" }}>
            <article className="card reveal">
              <h3>Propósito</h3>
              <p>
                Aportar valor real a la industria: experiencias, conocimientos y
                conversaciones que ayuden a crecer y profesionalizarse.
              </p>
            </article>
            <article className="card reveal" style={{ transitionDelay: ".1s" }}>
              <h3>Misión</h3>
              <p>
                Crear contenido audiovisual de calidad que combine experiencia
                real, estrategia, actualidad y cercanía humana.
              </p>
            </article>
            <article className="card reveal" style={{ transitionDelay: ".2s" }}>
              <h3>Visión</h3>
              <p>
                Convertirse en el medio referente de la industria de eventos en
                Latinoamérica, con una comunidad sólida y apasionada.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">02</span>Lo que defendemos
          </div>
          <h2 className="clip" style={{ margin: "14px 0 20px" }}>
            Valores.
          </h2>
          <div className="grid">
            {VALORES.map(([t, d], i) => (
              <article
                className="card reveal"
                key={t}
                style={{ transitionDelay: `${(i % 3) * 0.1}s` }}
              >
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">03</span>Los creadores
          </div>
          <h2 className="clip" style={{ margin: "14px 0 20px" }}>
            Quiénes están detrás.
          </h2>

          <div className="hosts">
            <article className="reveal">
              {/* Cuando tengas la foto: reemplazar este div por
                  <div className="host__photo"><img src="/pablo.jpg" alt="Pablo Quiroga" /></div> */}
              <div className="host__photo is-empty">
                <span>Foto próximamente</span>
              </div>
              <h3 className="host__name">Pablo Quiroga</h3>
              <div className="host__role">Co-conductor · Visión editorial</div>
              <p className="host__bio">
                Pablo lleva más de 18 años en los eventos, y los conoce desde
                adentro. Empezó como productor técnico en shows masivos
                —recitales internacionales en estadios— y con los años pasó a la
                producción general, hasta enfocarse en el sector corporativo.
                Hoy dirige AV Eventos junto a Alexis Vidal. De todo ese recorrido
                le quedó una obsesión: profesionalizar la industria y compartir
                lo que casi nunca se cuenta. En Mate y Eventos lleva la visión
                editorial y estratégica.
              </p>
            </article>

            <article className="reveal" style={{ transitionDelay: ".1s" }}>
              <div className="host__photo is-empty">
                <span>Foto próximamente</span>
              </div>
              <h3 className="host__name">Alexis Vidal</h3>
              <div className="host__role">Co-conductor · Producción</div>
              <p className="host__bio">
                Alexis es productor y creativo, de cabeza práctica y resolutiva:
                de los que hacen que las cosas pasen. Su fuerte es la operación
                real, donde la creatividad y la técnica tienen que convivir todo
                el tiempo. Junto a Pablo dirige AV Eventos, y en Mate y Eventos
                aporta análisis, experiencia de cancha y una mirada honesta sobre
                los desafíos de cada día.
              </p>
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
