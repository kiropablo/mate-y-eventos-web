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
    "tipo" === "mes" ? cortesDeMes(vigentes) : cortesDe("tipo", vigentes);
  return lista.map((c) => ({ tipo: c.slug }));
}

export async function generateMetadata({ params }) {
  const { corte } = await corteDeLanding("tipo", params.tipo);
  if (!corte) return { title: "Agenda" };
  return metaDeCorte(corte);
}

export default async function Corte({ params }) {
  const { corte, eventos } = await corteDeLanding("tipo", params.tipo);
  if (!corte) notFound();

  // Los demás cortes del mismo tipo, para enlazarlos entre sí.
  const vigentes = eventos.filter((e) => !yaPaso(e));
  const hermanos = ("tipo" === "mes" ? cortesDeMes(vigentes) : cortesDe("tipo", vigentes))
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
