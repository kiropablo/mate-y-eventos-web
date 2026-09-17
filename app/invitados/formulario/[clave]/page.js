import { notFound } from "next/navigation";
import SiteNav from "../../../components/SiteNav";
import Footer from "../../../components/Footer";
import { claveFormularioValida } from "../../../lib/firma";
import { CONTACTO, PREGUNTAS } from "../../../lib/formulario-invitados";
import FormularioInvitado from "./FormularioInvitado";

// El formulario que se le manda a alguien antes de entrevistarlo.
//
// Reemplaza al de Airtable. Vive en una dirección con clave: no está en el
// menú, no está en el sitemap y lleva noindex. La clave no protege un secreto
// —cuando se abre no hay ningún dato adentro— sino que la página no ande
// suelta ni la levante Google.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Antes de la entrevista",
  robots: { index: false, follow: false, nocache: true },
};

export default function PaginaFormulario({ params }) {
  if (!claveFormularioValida(params.clave)) notFound();

  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span> Antes de la entrevista
          </div>
          <h1>Contanos un poco</h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Esto lo leemos nosotros dos antes de grabar, para no hacerte
            preguntas obvias y aprovechar la charla. Nada de lo que escribas acá
            se publica: lo que sí va a salir es tu ficha en el sitio, y te la
            vamos a mandar para que la revises antes.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <FormularioInvitado
            clave={params.clave}
            contacto={CONTACTO}
            preguntas={PREGUNTAS}
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
