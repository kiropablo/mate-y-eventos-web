import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";
import CuerpoFicha from "../../components/CuerpoFicha";
import { getInvitado, getInvitados } from "../../lib/invitados";
import { getEpisodes, partirTitulo } from "../../lib/youtube";
import { getArticulos } from "../../lib/articulos";
import { articulosQueNombran } from "../../lib/menciones";
import { migas } from "../../lib/migas";
import { SITE } from "../../lib/site";
import { jsonLdSeguro } from "../../lib/jsonld";

// La ficha de cada persona que pasó por un episodio.
//
// Para qué existe: hasta ahora un invitado venía, dejaba media hora de material
// y desaparecía. Su nombre no estaba en ningún lado del sitio más que adentro
// del título de un video. Con esto cada uno tiene su página, sus episodios y
// sus redes, y para una máquina pasa a ser una entidad y no una cadena de
// texto. Le sirve al invitado y nos sirve a nosotros: un medio que entrevista
// gente real y verificable pesa distinto que uno que publica opiniones sueltas.
//
// Lo que NO lleva esta página, a propósito: mail ni teléfono. La persona vino a
// una charla, no a que le publiquemos una ficha de contacto. Van la web y las
// redes profesionales, que ya son públicas y las puso ella.

export const revalidate = 3600;

export async function generateStaticParams() {
  return getInvitados().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }) {
  const i = getInvitado(params.slug);
  if (!i) return {};
  const titulo = `${i.nombre}${i.rol ? ` — ${i.rol}` : ""}`;
  return {
    alternates: { canonical: `/invitados/${i.slug}` },
    title: { absolute: `${titulo} · ${SITE.name}` },
    description: i.bio,
    openGraph: {
      type: "profile",
      title: `${titulo} · ${SITE.name}`,
      description: i.bio,
      url: `${SITE.url}/invitados/${i.slug}`,
      siteName: SITE.name,
      locale: "es_AR",
      images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${titulo} · ${SITE.name}`,
      description: i.bio,
      images: ["/og-default.jpg"],
    },
  };
}

export default async function FichaInvitado({ params }) {
  const i = getInvitado(params.slug);
  if (!i) notFound();

  // Los episodios donde habló, con su título real. Si YouTube no responde, la
  // página sale igual: se pierde el título, no la ficha.
  let episodios = [];
  try {
    const todos = await getEpisodes();
    episodios = i.episodios
      .map((id) => todos.find((e) => e.id === id))
      .filter(Boolean);
  } catch {
    episodios = [];
  }

  // Los artículos que lo nombran. Es la vuelta del enlazado: desde el artículo
  // se llega a la ficha por el nombre escrito en el texto, y desde la ficha se
  // vuelve a los artículos donde se lo nombra.
  //
  // Esto se MUESTRA pero no se declara en el schema, y es a propósito. El
  // vínculo ya está declarado del otro lado —el artículo dice "mentions: esta
  // persona"— y ahí es donde es cierto. Ponerlo acá como "subjectOf" diría que
  // el artículo TRATA sobre esta persona, y un artículo que la nombra al pasar
  // no trata sobre ella. Es la regla 12 mirada del otro lado: no alcanza con
  // que el nombre esté escrito para declarar de qué habla el texto.
  const nombradoEn = articulosQueNombran(i, getArticulos());

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${SITE.url}/invitados/${i.slug}`,
        url: `${SITE.url}/invitados/${i.slug}`,
        name: `${i.nombre}${i.rol ? ` — ${i.rol}` : ""}`,
        isPartOf: { "@id": `${SITE.url}/#website` },
        mainEntity: { "@id": `${SITE.url}/invitados/${i.slug}#persona` },
      },
      {
        "@type": "Person",
        "@id": `${SITE.url}/invitados/${i.slug}#persona`,
        name: i.nombre,
        ...(i.rol ? { jobTitle: i.rol } : {}),
        ...(i.bio ? { description: i.bio } : {}),
        // La foto entra al schema: una Person con imagen pesa distinto que una
        // sin, tanto para Google como para una IA que la cite.
        ...(i.foto ? { image: `${SITE.url}/invitados/${i.slug}.jpg` } : {}),
        url: `${SITE.url}/invitados/${i.slug}`,
        mainEntityOfPage: { "@id": `${SITE.url}/invitados/${i.slug}` },
        // Sus perfiles públicos. Es lo que hace que esta persona del schema y
        // una persona real del rubro sean la misma para una máquina, y no dos
        // coincidencias de nombre.
        ...(i.redes.length || i.webUrl
          ? { sameAs: [...(i.webUrl ? [i.webUrl] : []), ...i.redes] }
          : {}),
        // En qué episodios habló. El vínculo va en los dos sentidos: el
        // episodio la declara como invitada y ella declara el episodio.
        ...(episodios.length
          ? {
              subjectOf: episodios.map((e) => ({
                "@type": "PodcastEpisode",
                name: partirTitulo(e.title).tema,
                url: `${SITE.url}/episodios/${e.id}`,
              })),
            }
          : {}),
      },
      migas([
        ["Invitados", "/invitados"],
        [i.nombre, `/invitados/${i.slug}`],
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLd) }}
      />

      <div className="wrap">
        <SiteNav />
      </div>

      {/* El cuerpo visible lo dibuja un componente compartido: la vista
          previa del panel usa exactamente este, asi que lo que se ve antes
          de publicar es lo que se publica. */}
      <CuerpoFicha invitado={i} episodios={episodios} nombradoEn={nombradoEn} />

      <Footer />
    </>
  );
}
