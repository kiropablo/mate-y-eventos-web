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

// Un tipo de evento dentro de un país: "Ferias en Argentina".
//
// Ni /agenda/tipo/expo-feria ni /agenda/pais/argentina contestan esa búsqueda:
// el primero mezcla los siete países y el segundo los ocho tipos. Las
// combinaciones que existen salen de la base y son pocas —el inventario está
// contado en cortes.js—, así que esto no genera páginas flacas.

export const revalidate = 3600;

export async function generateStaticParams() {
  const vigentes = (await getEventos()).filter((e) => !yaPaso(e));
  return cortesCruzados(vigentes)
    .filter((c) => c.donde === "pais")
    .map((c) => ({ tipo: c.slugTipo, pais: c.slug }));
}

export async function generateMetadata({ params }) {
  const { corte } = await cruceDeLanding(params.tipo, "pais", params.pais);
  if (!corte) return { title: "Agenda" };
  return metaDeCorte(corte);
}

export default async function Cruce({ params }) {
  const { corte, eventos } = await cruceDeLanding(params.tipo, "pais", params.pais);
  if (!corte) notFound();

  // Los otros países donde se hace este mismo tipo de evento.
  const vigentes = eventos.filter((e) => !yaPaso(e));
  const hermanos = cortesCruzados(vigentes)
    .filter(
      (c) => c.donde === "pais" && c.slugTipo === corte.slugTipo && c.slug !== corte.slug
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
