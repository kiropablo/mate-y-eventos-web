import { notFound } from "next/navigation";
import SiteNav from "../../../components/SiteNav";
import Footer from "../../../components/Footer";
import { getInvitado } from "../../../lib/invitados";
import { firmaInvitadoValida } from "../../../lib/firma";
import { filasDe } from "../../../lib/campos-invitado";
import ConfirmarInvitado from "./ConfirmarInvitado";

// Donde el invitado revisa su ficha antes de que se publique.
//
// Llega acá por un link firmado que le mandamos a su mail. La firma no es una
// contraseña y no identifica a nadie: lo único que habilita es marcar ESA ficha
// como revisada. Si se la reenvía a un socio y contesta el socio, para nosotros
// es lo mismo.
//
// La ficha que se muestra es la que está escrita, incluso si todavía es
// borrador. Es al revés que el resto del sitio a propósito: el sentido de esta
// página es justamente ver lo que va a salir ANTES de que salga.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Revisá tu ficha",
  robots: { index: false, follow: false, nocache: true },
};

export default function PaginaConfirmar({ params, searchParams }) {
  if (!firmaInvitadoValida(params.slug, searchParams?.f)) notFound();

  const inv = getInvitado(params.slug, { incluirBorradores: true });
  if (!inv) notFound();

  const filas = filasDe(inv);

  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span> Antes de publicarla
          </div>
          <h1>Tu ficha en Mate y Eventos</h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            Armamos esto con lo que dijiste en el episodio. Antes de publicarlo
            queremos que lo leas: marcá lo que esté bien y corregí lo que no.
            Nada sale a la web hasta que nos contestes.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <ConfirmarInvitado
            slug={inv.slug}
            firma={String(searchParams?.f || "")}
            nombre={inv.nombre}
            filas={filas}
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
