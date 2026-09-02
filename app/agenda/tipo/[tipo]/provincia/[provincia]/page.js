import { notFound } from "next/navigation";
import SiteNav from "../../../../../components/SiteNav";
import Footer from "../../../../../components/Footer";
import Landing from "../../../../Landing";
import {
  cruceDeLanding,
  cortesCruzados,
  metaDeCorte,
  schemaDeCorte,
} from "../../../../cortes";
import { getEventos, yaPaso } from "../../../../../lib/agenda";

// Un tipo de evento dentro de una provincia: "Congresos en Ciudad de Buenos Aires".
//
// Ni /agenda/tipo/congreso-conferencia ni
// /agenda/provincia/ciudad-de-buenos-aires contestan esa búsqueda: el primero
// mezcla todos los lugares y el segundo todos los tipos. Las
// combinaciones que existen salen de la base y son pocas —el inventario está
// contado en cortes.js—, así que esto no genera páginas flacas.

export const revalidate = 3600;

export async function generateStaticParams() {
  const vigentes = (await getEventos()).filter((e) => !yaPaso(e));
  return cortesCruzados(vigentes)
    .filter((c) => c.donde === "provincia")
    .map((c) => ({ tipo: c.slugTipo, provincia: c.slug }));
}

export async function generateMetadata({ params }) {
  const { corte } = await cruceDeLanding(params.tipo, "provincia", params.provincia);
  if (!corte) return { title: "Agenda" };
  return metaDeCorte(corte);
}

export default async function Cruce({ params }) {
  const { corte, eventos } = await cruceDeLanding(params.tipo, "provincia", params.provincia);
  if (!corte) notFound();

  // Las otras provincias donde se hace este mismo tipo de evento.
  const vigentes = eventos.filter((e) => !yaPaso(e));
  const hermanos = cortesCruzados(vigentes)
    .filter(
      (c) =>
        c.donde === "provincia" &&
        c.slugTipo === corte.slugTipo &&
        c.slug !== corte.slug
    )
    .slice(0, 8);

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
        recíproco={{
          href: corte.urlTipo,
          texto: `Ver todos los eventos de ${corte.valorTipo.toLowerCase()} en Latinoamérica →`,
        }}
      />
      <Footer />
    </>
  );
}
