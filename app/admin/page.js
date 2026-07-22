import { haySesion } from "../lib/admin";
import { listarParaPanel } from "../lib/articulos-admin";
import LoginAdmin from "./LoginAdmin";
import PanelAdmin from "./PanelAdmin";

// Página interna: no se cachea y no se indexa.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

export default function Admin() {
  if (!haySesion()) return <LoginAdmin />;
  return <PanelAdmin articulos={listarParaPanel()} />;
}
