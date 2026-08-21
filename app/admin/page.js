import { haySesion } from "../lib/admin";
import { listarParaPanel } from "../lib/articulos-admin";
import { listarGlosarioParaPanel } from "../lib/glosario-admin";
import { listarOrganizadoresParaPanel } from "../lib/organizadores-admin";
import LoginAdmin from "./LoginAdmin";
import PanelAdmin from "./PanelAdmin";

// Página interna: no se cachea y no se indexa.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

export default async function Admin() {
  if (!haySesion()) return <LoginAdmin />;
  // La agenda sale de Airtable, así que este trae datos de red; los otros dos
  // leen archivos del repo.
  const organizadores = await listarOrganizadoresParaPanel();
  return (
    <PanelAdmin
      articulos={listarParaPanel()}
      glosario={listarGlosarioParaPanel()}
      organizadores={organizadores}
    />
  );
}
