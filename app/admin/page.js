import { haySesion } from "../lib/admin";
import { listarParaPanel } from "../lib/articulos-admin";
import { listarGlosarioParaPanel } from "../lib/glosario-admin";
import {
  listarInvitadosParaPanel,
  unirConAirtable,
  respuestasSinFicha,
} from "../lib/invitados-admin";
import {
  getInvitadosAirtable,
  registroDeFicha,
  TABLA_URL,
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
  //
  // Airtable se lee UNA sola vez y se reparte: las dos listas salen del mismo
  // pedido. Leerlo dos veces sería pagar dos lecturas de la base para armar una
  // pantalla.
  const fichas = listarInvitadosParaPanel();
  const registros = await getInvitadosAirtable();
  const invitados = unirConAirtable(fichas, registros, registroDeFicha);
  return (
    <PanelAdmin
      articulos={listarParaPanel()}
      glosario={listarGlosarioParaPanel()}
      invitados={invitados}
      // Los que contestaron y todavía no tienen ficha: sin esto no aparecen en
      // ninguna pantalla, y es lo que pasa entre que alguien llena el
      // formulario y sale su episodio.
      sinFicha={respuestasSinFicha(fichas, registros, registroDeFicha)}
      tablaUrl={TABLA_URL}
      linkFormulario={hayClave() ? linkDelFormulario() : ""}
      organizadores={organizadores}
    />
  );
}
