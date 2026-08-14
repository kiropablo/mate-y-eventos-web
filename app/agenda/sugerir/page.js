import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import FormSugerir from "./FormSugerir";

export const metadata = {
  alternates: { canonical: "/agenda/sugerir" },
  title: "Sugerir un evento",
  description:
    "¿Falta un evento en la agenda de Mate y Eventos? Sugerilo: el equipo editorial lo revisa y lo publica.",
};

export default function Sugerir() {
  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Agenda
          </div>
          <h1>Sugerí un evento.</h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            ¿Falta un congreso, una expo, un festival? Contanos cuál. El equipo
            editorial lo revisa, lo completa y lo publica en la agenda.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          <FormSugerir />
        </div>
      </section>

      <Footer />
    </>
  );
}
