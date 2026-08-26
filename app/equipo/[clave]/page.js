import Link from "next/link";
import { notFound } from "next/navigation";
import { claveEquipoValida } from "../../lib/firma";
import { getEventos, yaPaso, formatRango, nombreConAnio } from "../../lib/agenda";
import { diasHasta } from "../../lib/semana";
import { SITE } from "../../lib/site";

// La cola de difusión, para compartirle al equipo.
//
// Es una vista de trabajo, no una página del sitio: muestra qué eventos
// confirmaron sus datos y todavía no publicamos en las redes. Va con noindex
// —no tiene por qué aparecer en Google— y sin nada que se pueda tocar: quien
// tilda es Pablo desde el panel. Así el link se puede pegar en el grupo sin
// que nadie pueda cambiar el estado de nada por error.
//
// La dirección lleva una clave derivada de AGENDA_FIRMA_SECRET. No identifica
// a nadie ni sirve para entrar a otro lado.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Para publicar",
  robots: { index: false, follow: false, nocache: true },
};

// El orden de trabajo: primero lo que arranca antes, que es lo que se pasa.
function porFecha(a, b) {
  return String(a.fechaInicio || "9").localeCompare(String(b.fechaInicio || "9"));
}

function Ficha({ ev, hecho }) {
  const dias = diasHasta(ev.fechaInicio);
  const donde = [ev.venue, ev.ciudad, ev.pais].filter(Boolean).join(" · ");
  const urgente = dias !== null && dias <= 7;

  return (
    <article className="eq-item" data-hecho={hecho ? "si" : "no"}>
      <div className="eq-item__cab">
        <h3>{nombreConAnio(ev)}</h3>
        {hecho ? (
          <span className="eq-sello eq-sello--hecho">Publicado</span>
        ) : urgente ? (
          <span className="eq-sello eq-sello--ya">
            {dias <= 0 ? "Empieza hoy" : dias === 1 ? "Falta 1 día" : `Faltan ${dias} días`}
          </span>
        ) : dias !== null ? (
          <span className="eq-sello">Faltan {dias} días</span>
        ) : null}
      </div>

      <p className="eq-dato">{formatRango(ev)}</p>
      {donde ? <p className="eq-dato eq-dato--tenue">{donde}</p> : null}
      {ev.organizador ? (
        <p className="eq-dato eq-dato--tenue">Organiza: {ev.organizador}</p>
      ) : null}

      <div className="eq-links">
        <Link href={`/agenda/${ev.slug}`} className="eq-link">
          Ver la ficha
        </Link>
        {ev.web ? (
          <a href={ev.web} target="_blank" rel="noopener noreferrer" className="eq-link">
            Sitio oficial
          </a>
        ) : null}
        {ev.imagen ? (
          <a href={ev.imagen} target="_blank" rel="noopener noreferrer" className="eq-link">
            Logo
          </a>
        ) : null}
      </div>

      {/* Las redes del evento: son las cuentas a etiquetar en el posteo, que
          es el dato que más se busca a mano y el que más se olvida. */}
      {ev.redes?.length ? (
        <ul className="eq-redes">
          {ev.redes.map((r) => {
            const url = (r.match(/https?:\/\/\S+/) || [])[0];
            // El nombre es lo que está ANTES del link. Después del link suele
            // venir una aclaración entre paréntesis ("del organizador ADRHA
            // nacional") que no es el nombre de la red y quedaba pegada.
            const nombre = (url ? r.slice(0, r.indexOf(url)) : r)
              .replace(/[:·\-–\s]+$/, "")
              .trim();
            return (
              <li key={r}>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {nombre || url.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                ) : (
                  r
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="eq-dato eq-dato--tenue">Sin redes cargadas en la ficha.</p>
      )}

      {hecho && ev.fechaDifusion ? (
        <p className="eq-dato eq-dato--tenue">Publicado el {ev.fechaDifusion}</p>
      ) : null}
    </article>
  );
}

export default async function Equipo({ params }) {
  if (!claveEquipoValida(params.clave)) notFound();

  const todos = await getEventos();
  const vigentes = todos.filter((e) => !yaPaso(e) && e.verificado);
  const pendientes = vigentes.filter((e) => !e.difundido).sort(porFecha);
  const hechos = vigentes.filter((e) => e.difundido).sort(porFecha);

  return (
    <main className="eq">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="eq-top">
        <div>
          <span className="eq-marca">{SITE.name}</span>
          <h1>Para publicar</h1>
          <p>
            Eventos cuyos datos confirmó el organizador y que todavía no
            publicamos en las redes. Se ordenan por fecha: los de arriba son los
            que están más cerca.
          </p>
        </div>
      </header>

      <section className="eq-bloque">
        <h2>
          Pendientes <span>{pendientes.length}</span>
        </h2>
        {pendientes.length === 0 ? (
          <p className="eq-vacio">
            Nada pendiente. Todos los eventos verificados ya están publicados.
          </p>
        ) : (
          <div className="eq-grilla">
            {pendientes.map((ev) => (
              <Ficha ev={ev} key={ev.slug} />
            ))}
          </div>
        )}
      </section>

      {hechos.length > 0 ? (
        <section className="eq-bloque">
          <h2>
            Ya publicados <span>{hechos.length}</span>
          </h2>
          <div className="eq-grilla">
            {hechos.map((ev) => (
              <Ficha ev={ev} hecho key={ev.slug} />
            ))}
          </div>
        </section>
      ) : null}

      <footer className="eq-pie">
        El tilde de &laquo;publicado&raquo; lo pone Pablo desde el panel. Esta
        vista es solo para mirar: si algo está mal, avisale.
      </footer>
    </main>
  );
}

const CSS = `
.eq{max-width:1100px;margin:0 auto;padding:34px 20px 70px;color:#f5f5f5;font-family:var(--font-ui),system-ui,sans-serif}
.eq-top{border-bottom:1px solid rgba(245,245,245,.12);padding-bottom:22px;margin-bottom:30px}
.eq-marca{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:#ea478a}
.eq-top h1{font-family:var(--font-display),sans-serif;font-size:2.3rem;margin:8px 0 10px;line-height:1.06}
.eq-top p{color:rgba(245,245,245,.55);font-size:.95rem;line-height:1.6;max-width:62ch;margin:0}
.eq-bloque{margin-bottom:44px}
.eq-bloque h2{font-family:var(--font-ui),sans-serif;font-size:.82rem;letter-spacing:.16em;text-transform:uppercase;color:rgba(245,245,245,.5);margin:0 0 16px}
.eq-bloque h2 span{color:#93d5f7;margin-left:8px}
.eq-vacio{color:rgba(245,245,245,.45);font-size:.95rem}
.eq-grilla{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(310px,1fr))}
.eq-item{border:1px solid rgba(245,245,245,.13);border-radius:11px;padding:17px 18px;background:rgba(255,255,255,.025)}
.eq-item[data-hecho="si"]{opacity:.55}
.eq-item__cab{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:9px}
.eq-item h3{font-size:1.04rem;line-height:1.3;margin:0;color:#f5f5f5}
.eq-sello{flex:none;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(245,245,245,.5);border:1px solid rgba(245,245,245,.2);border-radius:999px;padding:3px 9px;white-space:nowrap}
.eq-sello--ya{color:#ea478a;border-color:rgba(234,71,138,.5)}
.eq-sello--hecho{color:#93d5f7;border-color:rgba(147,213,247,.45)}
.eq-dato{margin:0 0 4px;font-size:.9rem;line-height:1.5;color:rgba(245,245,245,.8)}
.eq-dato--tenue{color:rgba(245,245,245,.45);font-size:.85rem}
.eq-links{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 10px}
.eq-link{font-size:.78rem;color:#93d5f7;border:1px solid rgba(147,213,247,.28);border-radius:999px;padding:5px 11px;text-decoration:none}
.eq-link:hover{border-color:#93d5f7}
.eq-redes{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px 12px}
.eq-redes li{font-size:.82rem;color:rgba(245,245,245,.55)}
.eq-redes a{color:rgba(245,245,245,.72);text-decoration:none;border-bottom:1px solid rgba(245,245,245,.2)}
.eq-pie{border-top:1px solid rgba(245,245,245,.12);padding-top:18px;font-size:.85rem;color:rgba(245,245,245,.4);line-height:1.6}
@media(max-width:560px){.eq-top h1{font-size:1.8rem}}
`;
