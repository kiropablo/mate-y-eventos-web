import Link from "next/link";
import SiteNav from "../../../components/SiteNav";
import Footer from "../../../components/Footer";
import { getEvento, formatRango } from "../../../lib/agenda";
import { filasDe } from "../../../lib/campos-ficha";
import { firmaValida } from "../../../lib/firma";
import { llegamosADifundir, DIAS_PARA_DIFUNDIR } from "../../../lib/semana";
import { SITE } from "../../../lib/site";
import Confirmar from "./Confirmar";

// La página donde el organizador confirma su ficha.
//
// Se llega solo desde el link firmado que va en el mail. No se indexa ni se
// linkea desde ningún lado: no es una página del sitio, es el final de un
// trámite.

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: `Confirmar los datos · ${SITE.name}` },
  robots: { index: false, follow: false },
};

export default async function ConfirmarFicha({ params, searchParams }) {
  const slug = String(params?.slug || "");
  const firma = String(searchParams?.f || "");
  const ev = firmaValida(slug, firma) ? await getEvento(slug) : null;

  if (!ev) {
    return (
      <>
        <div className="wrap">
          <SiteNav />
        </div>
        <section className="section-p">
          <div className="wrap">
            <h1>Este link no sirve</h1>
            <p className="lead">
              Puede que esté cortado por el programa de correo, o que sea de un
              evento que ya no está en la agenda. Escribinos a{" "}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a> y te pasamos uno
              nuevo.
            </p>
            <Link className="btn btn--ghost" href="/agenda">
              Ver la agenda
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const aTiempo = llegamosADifundir(ev);

  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="section-p">
        <div className="wrap">
          <div className="eyebrow">
            <span className="n">—</span>Confirmación del organizador
          </div>

          <h1>¿Están bien los datos de {ev.nombre}?</h1>

          <p className="lead">
            Así está publicado hoy en la agenda de {SITE.name}. Repasá cada
            dato: marcá los que están bien y corregí los que no. Con eso
            encendemos el sello <strong>Verificado</strong> en la ficha.
          </p>

          {ev.verificado ? (
            <p className="cf-yaesta">
              Esta ficha ya figura como verificada
              {ev.fechaVerificacion ? ` desde el ${ev.fechaVerificacion}` : ""}.
              Si algo cambió, podés corregirlo igual.
            </p>
          ) : null}

          <Confirmar
            slug={ev.slug}
            firma={firma}
            nombre={ev.nombre}
            filas={filasDe(ev)}
          />

          {/* La ayuda con las redes solo se ofrece si todavía da el tiempo.
              Con el evento encima no se llega a armar nada, y prometerlo
              igual sería quedar mal a propósito. */}
          {aTiempo ? (
            <p className="cf-difusion">
              <strong>Y te damos una mano con la difusión.</strong> Nos interesa
              que los eventos de la industria se conozcan, así que los que están
              verificados los publicamos en las redes de {SITE.name}. Cuando hay
              varios en la misma semana, van juntos en un listado.
            </p>
          ) : (
            <p className="cf-difusion">
              <strong>Sobre la difusión:</strong> para poder darte una mano
              desde nuestras redes necesitamos la confirmación con al menos{" "}
              {DIAS_PARA_DIFUNDIR} días de anticipación, y para este evento ya
              estamos sobre la fecha. Igual verificamos la ficha, que queda para
              siempre.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
