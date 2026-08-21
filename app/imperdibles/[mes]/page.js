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
  return {
    edicion: ediciones.find((e) => e.mes === mes) || null,
    otras: ediciones.filter((e) => e.mes !== mes),
  };
}

export async function generateMetadata({ params }) {
  const { edicion } = await buscar(params.mes);
  if (!edicion) return { title: "Imperdibles" };
  return metaEdicion(edicion, { canonical: `/imperdibles/${edicion.mes}` });
}

export default async function EdicionDelMes({ params }) {
  const { edicion, otras } = await buscar(params.mes);
  if (!edicion) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            schemaEdicion(edicion, { canonical: `/imperdibles/${edicion.mes}` })
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
            Los imperdibles
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
