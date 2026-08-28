import { notFound } from "next/navigation";
import SiteNav from "../../../components/SiteNav";
import Footer from "../../../components/Footer";
import Landing from "../../Landing";
import {
  corteDeLanding,
  cortesDe,
  cortesDeMes,
  metaDeCorte,
  schemaDeCorte,
} from "../../cortes";
import { getEventos, yaPaso, edicionesImperdibles, mesLargo } from "../../../lib/agenda";

export const revalidate = 3600;

export async function generateStaticParams() {
  const vigentes = (await getEventos()).filter((e) => !yaPaso(e));
  const lista =
    "mes" === "mes" ? cortesDeMes(vigentes) : cortesDe("mes", vigentes);
  return lista.map((c) => ({ mes: c.slug }));
}

export async function generateMetadata({ params }) {
  const { corte } = await corteDeLanding("mes", params.mes);
  if (!corte) return { title: "Agenda" };
  return metaDeCorte(corte);
}

export default async function Corte({ params }) {
  const { corte, eventos } = await corteDeLanding("mes", params.mes);
  if (!corte) notFound();

  // Los demás cortes del mismo tipo, para enlazarlos entre sí.
  const vigentes = eventos.filter((e) => !yaPaso(e));
  const hermanos = ("mes" === "mes" ? cortesDeMes(vigentes) : cortesDe("mes", vigentes))
    .filter((c) => c.slug !== corte.slug)
    .slice(0, 8);

  // Si ese mes tiene selección de imperdibles, se la ofrecemos.
  const hayImperdibles = edicionesImperdibles(eventos).some(
    (e) => e.mes === corte.valor
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaDeCorte(corte)) }}
      />
      <div className="wrap">
        <SiteNav />
      </div>
      <Landing
        corte={corte}
        otros={hermanos}
        recíproco={
          hayImperdibles
            ? {
                href: `/imperdibles/${corte.valor}`,
                texto: `¿Poco tiempo? Mirá los imperdibles de ${mesLargo(corte.valor)} →`,
              }
            : null
        }
      />
      <Footer />
    </>
  );
}
