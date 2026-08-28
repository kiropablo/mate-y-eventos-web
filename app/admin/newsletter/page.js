import { haySesion } from "../../lib/admin";
import LoginAdmin from "../LoginAdmin";
import {
  borradorNewsletter,
  borradorHTML,
  borradorTexto,
} from "../../lib/newsletter";
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

  const b = await borradorNewsletter();

  return (
    <BorradorNewsletter
      borrador={b}
      html={borradorHTML(b)}
      texto={borradorTexto(b)}
    />
  );
}
