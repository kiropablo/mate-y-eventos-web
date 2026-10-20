import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import {
  CONTACTO,
  PREGUNTAS,
  FOTO,
  FOTO_ANCHO,
  FOTO_ALTO,
} from "../lib/formulario-invitados";
import FormularioInvitado from "./FormularioInvitado";

// El formulario que se le manda a alguien antes de entrevistarlo.
//
// Reemplaza al de Airtable. La dirección es corta y pública A PROPÓSITO: este
// link se manda por WhatsApp, y un link que termina en veinte caracteres de
// hexadecimal parece phishing. Nadie lo abre.
//
// POR QUÉ YA NO LLEVA CLAVE. Antes vivía en /invitados/formulario/<clave>, con
// una clave derivada de AGENDA_FIRMA_SECRET, y el comentario decía que eso
// mantenía la página fuera de internet. No era cierto: el contador de visitas
// manda la dirección COMPLETA de cada página al panel (datos.mateyeventos.com),
// que es público a propósito, y ahí la dirección queda publicada. Se comprobó
// con la clave de /equipo, que estaba listada en /api/data a la vista de
// cualquiera. Una clave que el propio sitio publica no es una clave, y sostener
// que lo era es peor que no tenerla: hace creer que la puerta está cerrada.
//
// Lo que frena el abuso ahora está donde se puede comprobar: las guardas de
// app/api/invitados/formulario/route.js (tope de tamaño, tope del día, foto
// validada por sus bytes) y la regla de rate limit del firewall de Vercel.
//
// El noindex se queda. Pública no quiere decir indexada: esta página no tiene
// nada que buscar en Google, y no está en el sitemap ni en el menú.
//
// A propósito NO se agrega a robots.txt: un Disallow le impide a Google leer
// justamente el noindex, y entonces si alguien linkea la página igual puede
// terminar indexada, solo con la dirección y sin contenido. Las dos cosas
// juntas se pelean; la que saca una página del índice es el noindex.

export const metadata = {
  title: "Antes de la entrevista",
  robots: { index: false, follow: false, nocache: true },
};

export default function PaginaFormulario() {
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
            preguntas obvias y aprovechar la charla. Nada de lo que escribas aquí
            se publica: lo que sí va a salir es tu ficha en el sitio, y te la
            vamos a mandar para que la revises antes.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <FormularioInvitado
            contacto={CONTACTO}
            preguntas={PREGUNTAS}
            foto={FOTO}
            fotoAncho={FOTO_ANCHO}
            fotoAlto={FOTO_ALTO}
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
