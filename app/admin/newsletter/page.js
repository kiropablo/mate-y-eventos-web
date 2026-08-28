import { haySesion } from "../../lib/admin";
import LoginAdmin from "../LoginAdmin";
import { borradorNewsletter } from "../../lib/newsletter";
import { contarSuscriptores } from "../../lib/beehiiv";
import BorradorNewsletter from "./BorradorNewsletter";

// Página interna: no se cachea y no se indexa.
//
// Va acá y no como pestaña del panel a propósito: PanelAdmin.js es un archivo
// grande que se toca seguido, y esto no necesita nada de lo que hay ahí.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Newsletter de la semana",
  robots: { index: false, follow: false, nocache: true },
};

export default async function NewsletterAdmin() {
  if (!haySesion()) return <LoginAdmin />;

  // El borrador y el padrón se piden a la vez: son dos servicios distintos y
  // no tiene sentido esperar uno para pedir el otro.
  const [b, suscriptores] = await Promise.all([
    borradorNewsletter(),
    contarSuscriptores(),
  ]);

  // El HTML y el texto ya no se arman acá: los arma la pantalla, que es la
  // que sabe qué bloques dejó prendidos.
  return <BorradorNewsletter borrador={b} suscriptores={suscriptores} />;
}
