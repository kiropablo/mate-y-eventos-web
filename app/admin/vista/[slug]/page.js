import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../../components/SiteNav";
import Footer from "../../../components/Footer";
import CuerpoFicha from "../../../components/CuerpoFicha";
import { haySesion } from "../../../lib/admin";
import LoginAdmin from "../../LoginAdmin";
import { getInvitado } from "../../../lib/invitados";
import { getEpisodes } from "../../../lib/youtube";
import { getArticulos } from "../../../lib/articulos";
import { articulosQueNombran } from "../../../lib/menciones";

// Cómo se vería la ficha de un invitado si se publicara.
//
// Dibuja EL MISMO componente que la página pública —CuerpoFicha— y no una
// maqueta parecida. Es la única forma de que una vista previa sirva: una copia
// se desincroniza el día que se toca una de las dos, y entonces muestra algo
// distinto de lo que se publica, que es peor que no tenerla.
//
// Lo que esta página NO hace, a propósito:
//
// - No escribe schema. Un borrador no es una entidad publicada: declararlo en
//   schema.org sería afirmar que existe una persona en una dirección que
//   devuelve 404.
// - No se indexa, y la ruta vive bajo /admin, que ya está bloqueada en el
//   robots.txt.
// - No publica nada ni toca ningún archivo: solo mira.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false, nocache: true },
};

export default async function VistaPreviaInvitado({ params }) {
  // La ficha puede ser un borrador —de hecho ese es el caso para el que existe
  // esta página— así que se pide con los borradores incluidos. Por eso la
  // ruta está detrás de la sesión del panel.
  if (!haySesion()) return <LoginAdmin />;

  const i = getInvitado(params.slug, { incluirBorradores: true });
  if (!i) notFound();

  let episodios = [];
  try {
    const todos = await getEpisodes();
    episodios = i.episodios
      .map((id) => todos.find((e) => e.id === id))
      .filter(Boolean);
  } catch {
    // Igual que en la página pública: si YouTube no contesta se pierden los
    // títulos, no la ficha.
    episodios = [];
  }

  const nombradoEn = articulosQueNombran(i, getArticulos());

  // Lo que todavía le falta para poder publicarse. Es la misma regla que usa
  // el sitio (sePuedePublicar), dicha en castellano: ver la ficha linda y no
  // entender por qué el botón no la deja salir es exactamente lo que hace que
  // una vista previa no sirva.
  const falta = [];
  if (!i.nombre) falta.push("el nombre");
  if (!i.cuerpo) falta.push("el texto");
  if (!i.episodios.length) falta.push("al menos un episodio donde haya hablado");

  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <div className="wrap">
        <div className="vp-aviso">
          <div className="vp-aviso__t">
            {i.publicado ? "Esta ficha está publicada" : "Vista previa de un borrador"}
          </div>
          <p className="vp-aviso__p">
            {i.publicado ? (
              <>
                Así se ve hoy en el sitio. Su dirección pública es{" "}
                <Link href={`/invitados/${i.slug}`}>/invitados/{i.slug}</Link>.
              </>
            ) : (
              <>
                Así se va a ver cuando la publiques. Hoy{" "}
                <strong>/invitados/{i.slug} no existe</strong>: devuelve 404
                para todo el mundo, y tampoco está en el sitemap ni la ve
                Google.
              </>
            )}
          </p>
          {falta.length ? (
            <p className="vp-aviso__p vp-aviso__falta">
              No se puede publicar todavía: le falta {falta.join(", ")}.
            </p>
          ) : null}
          {!i.foto ? (
            <p className="vp-aviso__p">
              Sin foto. La ficha sale igual, pero una persona sin cara pesa
              distinto para Google y para una IA que la cite.
            </p>
          ) : null}
          <p className="vp-aviso__p">
            <Link href="/admin">← Volver al panel</Link>
          </p>
        </div>
      </div>

      <CuerpoFicha invitado={i} episodios={episodios} nombradoEn={nombradoEn} />

      <Footer />
    </>
  );
}
