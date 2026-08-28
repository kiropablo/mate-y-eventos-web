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
import { getEventos, yaPaso } from "../../../lib/agenda";

export const revalidate = 3600;

export async function generateStaticParams() {
  const vigentes = (await getEventos()).filter((e) => !yaPaso(e));
  const lista =
    "pais" === "mes" ? cortesDeMes(vigentes) : cortesDe("pais", vigentes);
  return lista.map((c) => ({ pais: c.slug }));
}

export async function generateMetadata({ params }) {
  const { corte } = await corteDeLanding("pais", params.pais);
  if (!corte) return { title: "Agenda" };
  return metaDeCorte(corte);
}

export default async function Corte({ params }) {
  const { corte, eventos } = await corteDeLanding("pais", params.pais);
  if (!corte) notFound();

  // Los demás cortes del mismo tipo, para enlazarlos entre sí.
  const vigentes = eventos.filter((e) => !yaPaso(e));
  const hermanos = ("pais" === "mes" ? cortesDeMes(vigentes) : cortesDe("pais", vigentes))
    .filter((c) => c.slug !== corte.slug)
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
      <Landing corte={corte} otros={hermanos} />
      <Footer />
    </>
  );
}
