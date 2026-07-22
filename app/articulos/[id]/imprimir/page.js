import Link from "next/link";
import { notFound } from "next/navigation";
import ArticuloCuerpo from "../../../components/ArticuloCuerpo";
import BotonImprimir from "../../../components/BotonImprimir";
import { getArticulo, formatFecha } from "../../../lib/articulos";
import { SITE } from "../../../lib/site";

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const art = getArticulo(params.id);
  if (!art) return { title: "Artículo" };
  return {
    title: `${art.titulo} — versión imprimible`,
    // Esta versión no se indexa: la que rankea es la página normal.
    robots: { index: false, follow: false },
  };
}

export default function Imprimir({ params }) {
  const art = getArticulo(params.id);
  if (!art) notFound();

  return (
    <main className="hoja-wrap">
      <div className="hoja-barra">
        <Link href={`/articulos/${art.id}`} className="ep-back">
          ← Volver al artículo
        </Link>
        <BotonImprimir>Guardar en PDF</BotonImprimir>
      </div>

      <article className="hoja">
        <header className="hoja__head">
          <div className="hoja__marca">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/isotipo.png" alt="" width="26" height="26" />
            <span>Mate y Eventos</span>
          </div>
          <div className="hoja__eje">{art.eje}</div>
          <h1>{art.titulo}</h1>
          <p className="hoja__bajada">{art.bajada}</p>
          <div className="hoja__fecha">
            {formatFecha(art.fecha)} · {art.lectura} min de lectura
          </div>
        </header>

        <ArticuloCuerpo markdown={art.cuerpo} />

        {art.preguntas.length ? (
          <section className="hoja__faq">
            <h2>Preguntas frecuentes</h2>
            {art.preguntas.map((q, i) => (
              <div className="hoja__q" key={i}>
                <h3>{q.pregunta}</h3>
                <p>{q.respuesta}</p>
              </div>
            ))}
          </section>
        ) : null}

        <footer className="hoja__pie">
          <p>
            <strong>Mate y Eventos</strong> — {SITE.tagline}.
          </p>
          <p>
            Este artículo profundiza un episodio del podcast.
            Escuchalo en {SITE.url}/episodios/{art.episodio}
          </p>
          <p>{SITE.url}</p>
        </footer>
      </article>
    </main>
  );
}
