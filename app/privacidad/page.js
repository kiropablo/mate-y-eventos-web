import SiteNav from "../components/SiteNav";
import Footer from "../components/Footer";
import { SITE } from "../lib/site";

export const metadata = {
  alternates: { canonical: "/privacidad" },
  title: "Política de privacidad",
  description:
    "Qué datos recoge mateyeventos.com, cuáles no, y qué hacemos con ellos. En castellano y sin letra chica.",
};

// Última revisión del texto. Si se cambia algo de fondo, actualizar la fecha.
const ACTUALIZADO = "12 de octubre de 2026";

const S = { maxWidth: "70ch", lineHeight: 1.75, margin: "0 0 18px" };

export default function Privacidad() {
  return (
    <>
      <div className="wrap">
        <SiteNav />
      </div>

      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>Privacidad
          </div>
          <h1>
            Política de <br />privacidad.
          </h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            La versión corta: no usamos cookies de seguimiento, no te
            identificamos y no vendemos datos de nadie. Acá abajo, la versión
            completa, en castellano.
          </p>
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <h2 className="ag-mes">Quiénes somos</h2>
          <p style={S}>
            Mate y Eventos es un medio sobre la industria de eventos en
            Latinoamérica: un podcast, artículos, un glosario y una agenda de
            eventos. Lo hacemos Pablo Quiroga y Alexis Vidal (AV Eventos). Para
            cualquier consulta sobre tus datos:{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>

          <h2 className="ag-mes">Lo que no hacemos</h2>
          <p style={S}>
            Este sitio no usa cookies de seguimiento ni identificadores
            publicitarios, y por eso no te pide aceptar ningún banner. No hay
            publicidad programática, no se arma ningún perfil tuyo y no se
            venden ni ceden datos personales a nadie.
          </p>

          <h2 className="ag-mes">Cómo medimos las visitas</h2>
          <p style={S}>
            Usamos un contador propio. Cuando mirás una página, anota: qué
            página fue, desde dónde llegaste (por ejemplo, &quot;desde
            Google&quot;), el país y la fecha. Eso es todo. No guarda tu
            dirección IP, no instala cookies y no hay forma de saber quién sos
            ni de seguirte entre visitas. Esos conteos se guardan en una base
            de datos propia alojada en Estados Unidos (Neon) y alimentan un
            panel de estadísticas que, por transparencia, es público en{" "}
            <a href="https://datos.mateyeventos.com" rel="noopener" target="_blank">
              datos.mateyeventos.com
            </a>
            . Los videos se reproducen con la versión sin cookies de YouTube
            (youtube-nocookie.com): YouTube no instala cookies por mirar un
            episodio acá.
          </p>

          <h2 className="ag-mes">Los datos que nos das vos</h2>
          <p style={S}>
            <strong>Newsletter.</strong> Si te suscribís, tu correo se guarda
            en beehiiv (la plataforma desde la que enviamos). Se usa solo para
            mandarte el newsletter y te podés dar de baja con el enlace que va
            en cada correo.
          </p>
          <p style={S}>
            <strong>&quot;Avisame cuando confirmen la fecha&quot;.</strong> Si
            dejás tu correo en la ficha de un evento sin fecha, lo usamos para
            eso y nada más: un solo aviso, por ese evento, cuando la fecha se
            anuncie. No entra a ninguna lista ni al newsletter.
          </p>
          <p style={S}>
            <strong>Sugerencias de eventos.</strong> Lo que escribas en el
            formulario lo lee nuestro equipo para evaluar si el evento entra a
            la agenda.
          </p>
          <p style={S}>
            <strong>Organizadores e invitados del podcast.</strong> Los datos
            de contacto que nos dan organizadores de eventos e invitados
            (correo, teléfono) se guardan en una base privada (Airtable) y se
            usan únicamente para el circuito de verificación de fichas y la
            coordinación de entrevistas. Nunca se publican: la ficha pública de
            un invitado no muestra contacto aunque lo haya dicho al aire, y su
            foto solo se muestra si él mismo la mandó y autorizó.
          </p>

          <h2 className="ag-mes">Nuestras redes y sus métricas</h2>
          <p style={S}>
            Para nuestro panel de estadísticas usamos las APIs oficiales de
            plataformas como YouTube, Meta (Instagram) y TikTok. Esas
            conexiones leen métricas de nuestras propias cuentas —cuántas
            personas vieron nuestros videos, por ejemplo—. No acceden a tus
            cuentas, a tus datos ni a los de ningún visitante de este sitio.
          </p>

          <h2 className="ag-mes">Proveedores que usamos</h2>
          <p style={S}>
            El sitio corre sobre servicios de terceros que pueden procesar
            datos en Estados Unidos: Vercel (alojamiento), Neon (base de
            datos), Airtable (agenda e invitados), beehiiv (newsletter) y
            Resend (envío de correos transaccionales). Cada uno tiene su propia
            política de privacidad.
          </p>

          <h2 className="ag-mes">Tus derechos</h2>
          <p style={S}>
            Si querés ver, corregir o borrar cualquier dato tuyo que tengamos
            (un correo, una sugerencia, una ficha), escribinos a{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a> y lo resolvemos.
            Sin formularios ni vueltas.
          </p>

          <h2 className="ag-mes">Cambios</h2>
          <p style={S}>
            Si esta política cambia, se actualiza esta página y su fecha.
            Última actualización: {ACTUALIZADO}.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
