import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import Edicion from "./Edicion";
import { metaEdicion, schemaEdicion } from "./comun";
import { getEventos, edicionesImperdibles, mesLargo } from "../lib/agenda";
import { SITE } from "../lib/site";

export const revalidate = 3600;

export async function generateMetadata() {
  const [ultima] = edicionesImperdibles(await getEventos());
  if (!ultima) {
    return {
      alternates: { canonical: "/imperdibles" },
      title: "Los imperdibles del mes",
      description:
        "La selección editorial de eventos de la industria, mes a mes, con el motivo de cada elección.",
    };
  }
  return metaEdicion(ultima, { canonical: "/imperdibles" });
}

export default async function Imperdibles() {
  const ediciones = edicionesImperdibles(await getEventos());
  const [ultima, ...otras] = ediciones;

  return (
    <>
      {ultima && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              schemaEdicion(ultima, { canonical: "/imperdibles" })
            ),
          }}
        />
      )}

      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Imperdibles
          </div>
          <h1>
            Los imperdibles
            {ultima ? (
              <>
                <br />
                de {mesLargo(ultima.mes)}.
              </>
            ) : (
              " del mes."
            )}
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            {ultima ? (
              <>
                De todo lo que pasa este mes en la industria, estos son los que
                elegimos. Abajo está el motivo de cada uno, que es lo único que
                hace que una lista así valga algo.
              </>
            ) : (
              <>
                Cada mes elegimos unos pocos eventos de la agenda y contamos por
                qué. La primera edición está en camino.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          {ultima ? (
            <Edicion edicion={ultima} otras={otras} />
          ) : (
            <>
              <div className="hold reveal">
                <span className="tag">Muy pronto</span>
                <p>
                  Estamos preparando la primera selección. Mientras tanto, la
                  agenda completa tiene todo lo que viene.
                </p>
              </div>
              <div style={{ marginTop: "34px" }}>
                <Link className="btn" href="/agenda">
                  Ver la agenda completa
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
