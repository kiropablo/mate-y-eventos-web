import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { SITE } from "../lib/site";

export const metadata = {
  alternates: { canonical: "/terminos" },
  title: "Términos de uso",
  description:
    "Las condiciones de uso de mateyeventos.com: qué podés hacer con el contenido, qué prometemos y qué no.",
};

const ACTUALIZADO = "12 de octubre de 2026";

const S = { maxWidth: "70ch", lineHeight: 1.75, margin: "0 0 18px" };

export default function Terminos() {
  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Términos
          </div>
          <h1>
            Términos <br />de uso.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Usar mateyeventos.com implica aceptar estas condiciones. Son
            cortas y están escritas para leerse.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <h2 className="ag-mes">Qué es este sitio</h2>
          <p style={S}>
            Mate y Eventos es un medio informativo sobre la industria de
            eventos en Latinoamérica, hecho por Pablo Quiroga y Alexis Vidal
            (AV Eventos). Todo el contenido tiene fines informativos y
            editoriales.
          </p>

          <h2 className="ag-mes">El contenido</h2>
          <p style={S}>
            Los artículos, el glosario y el resto del contenido editorial son
            nuestros. Podés citarlos con atribución y enlace a la página
            original; no está permitido republicarlos enteros sin permiso. Los
            datos abiertos de la{" "}
            <a href="/agenda/radiografia">radiografía de la agenda</a> se
            publican bajo licencia Creative Commons BY 4.0: usalos libremente
            citando la fuente. Las marcas, nombres y logos de eventos y
            empresas mencionados pertenecen a sus dueños.
          </p>

          <h2 className="ag-mes">La agenda de eventos</h2>
          <p style={S}>
            La agenda se construye con información pública, herramientas
            automáticas y revisión humana. Las fechas, sedes y datos de los
            eventos pueden cambiar o contener errores ajenos a nosotros:{" "}
            <strong>
              confirmá siempre con el organizador antes de comprar un pasaje o
              una entrada
            </strong>
            . El sello Verificado indica que el propio organizador confirmó los
            datos de su ficha en una fecha determinada; no es una garantía
            sobre la realización ni la calidad del evento.
          </p>

          <h2 className="ag-mes">Lo editorial no se vende</h2>
          <p style={S}>
            El sello Verificado y las selecciones editoriales (como los
            imperdibles del mes) no se compran ni se canjean. El único espacio
            pago es el Destacado de la agenda, y se declara como tal en todos
            los listados donde aparece.
          </p>

          <h2 className="ag-mes">Formularios</h2>
          <p style={S}>
            Al usar nuestros formularios te comprometés a cargar información
            real y propia (o de tu organización), y a no cargar datos de otras
            personas sin su permiso. Podemos rechazar o retirar contenido
            enviado por formularios sin obligación de justificarlo.
          </p>

          <h2 className="ag-mes">Enlaces a terceros</h2>
          <p style={S}>
            El sitio enlaza a sitios de organizadores, plataformas y otros
            terceros que no controlamos. No somos responsables por su contenido
            ni sus prácticas.
          </p>

          <h2 className="ag-mes">Sin garantías</h2>
          <p style={S}>
            El contenido se ofrece &quot;tal cual&quot;, de buena fe y sin
            garantías. No nos hacemos responsables por decisiones comerciales o
            personales tomadas en base a lo publicado.
          </p>

          <h2 className="ag-mes">Ley aplicable y contacto</h2>
          <p style={S}>
            Estos términos se rigen por las leyes de la República Argentina.
            Cualquier consulta:{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. Última
            actualización: {ACTUALIZADO}.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
