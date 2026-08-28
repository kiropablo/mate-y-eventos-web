import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import Edicion from "../Edicion";
import { metaEdicion, schemaEdicion } from "../comun";
import { getEventos, edicionesImperdibles, mesLargo } from "../../lib/agenda";

export const revalidate = 3600;

export async function generateStaticParams() {
  const ediciones = edicionesImperdibles(await getEventos());
  return ediciones.map((e) => ({ mes: e.mes }));
}

async function buscar(mes) {
  const ediciones = edicionesImperdibles(await getEventos());
  const [ultima] = ediciones;
  return {
    edicion: ediciones.find((e) => e.mes === mes) || null,
    otras: ediciones.filter((e) => e.mes !== mes),
    // Si este mes es el más nuevo, esta página y /imperdibles son la misma.
    esLaVigente: Boolean(ultima && ultima.mes === mes),
  };
}

export async function generateMetadata({ params }) {
  const { edicion, esLaVigente } = await buscar(params.mes);
  if (!edicion) return { title: "Imperdibles" };
  // La edición más nueva es exactamente lo que muestra /imperdibles: mismo H1,
  // mismo title, los mismos eventos. Dos direcciones para una sola página es
  // una duplicada, así que la del mes apunta a la portada, que es la que tiene
  // los links y la que está en el footer. Cuando pase el mes y deje de ser la
  // última, vuelve a ser autocanónica: ahí ya es archivo y contenido propio.
  return metaEdicion(edicion, {
    canonical: esLaVigente ? "/imperdibles" : `/imperdibles/${edicion.mes}`,
  });
}

export default async function EdicionDelMes({ params }) {
  const { edicion, otras, esLaVigente } = await buscar(params.mes);
  if (!edicion) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            schemaEdicion(edicion, {
              // La misma URL que el canonical. Si esta edición es la vigente,
              // la página canónica es /imperdibles: declarar acá un @id propio
              // era marcar como entidad una dirección que la propia cabecera
              // acababa de descartar, y dejaba la misma edición declarada como
              // dos entidades distintas con contenido idéntico.
              canonical: esLaVigente
                ? "/imperdibles"
                : `/imperdibles/${edicion.mes}`,
            })
          ),
        }}
      />

      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="magenta">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>
            <Link href="/imperdibles">Imperdibles</Link> /{" "}
            {mesLargo(edicion.mes)}
          </div>
          <h1>
            Los imperdibles{" "}
            <br />
            de {mesLargo(edicion.mes)}.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            De todo lo que pasó ese mes en la industria, estos son los que
            elegimos, con el motivo de cada uno.
          </p>
          {/* El puente con el listado completo: acá va la selección, allá
              están todos. Que se linkeen evita que compitan por la misma
              búsqueda. */}
          <p className="lead reveal" style={{ transitionDelay: ".15s" }}>
            <Link href={`/agenda/mes/${edicion.mes}`}>
              Ver todos los eventos de {mesLargo(edicion.mes)} →
            </Link>
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="magenta">
        <div className="wrap">
          <Edicion edicion={edicion} otras={otras} />
        </div>
      </section>

      <Footer />
    </>
  );
}
