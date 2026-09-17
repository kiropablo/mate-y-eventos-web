import { haySesion } from "../lib/admin";
import { listarParaPanel } from "../lib/articulos-admin";
import { listarGlosarioParaPanel } from "../lib/glosario-admin";
import {
  listarInvitadosParaPanel,
  unirConAirtable,
} from "../lib/invitados-admin";
import {
  getInvitadosAirtable,
  registroDeFicha,
} from "../lib/invitados-airtable";
import { hayClave, linkDelFormulario } from "../lib/firma";
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
  // Las fichas de invitados salen del repo; su contacto y el estado del
  // circuito, de Airtable. Se unen acá para que el panel reciba una sola lista.
  const invitados = unirConAirtable(
    listarInvitadosParaPanel(),
    await getInvitadosAirtable(),
    registroDeFicha
  );
  return (
    <PanelAdmin
      articulos={listarParaPanel()}
      glosario={listarGlosarioParaPanel()}
      invitados={invitados}
      linkFormulario={hayClave() ? linkDelFormulario() : ""}
      organizadores={organizadores}
    />
  );
}
