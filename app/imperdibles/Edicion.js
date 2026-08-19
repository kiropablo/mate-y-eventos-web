import Link from "next/link";
import { formatRango, mesLargo, TIPO_COLOR } from "../lib/agenda";

// Una edición mensual de los imperdibles. La usan la página principal
// (que muestra la última) y la de cada mes del archivo.
//
// Van ordenados por fecha y sin numerar a propósito: no es un ranking del 1
// al 5. Numerarlos abriría una discusión que no queremos tener con los
// organizadores elegidos.

export default function Edicion({ edicion, otras = [] }) {
  const { mes, eventos } = edicion;

  return (
    <>
      <div className="imp-lista">
        {eventos.map((ev, i) => (
          <article
            className="imp-card reveal"
            key={ev.slug}
            style={{ transitionDelay: `${Math.min(i, 5) * 0.06}s` }}
          >
            <div className="imp-card__cab">
              <span
                className="dot"
                style={{ background: TIPO_COLOR[ev.tipo] || "#9aa3b2" }}
              />
              <span className="imp-card__tipo">{ev.tipo}</span>
              {ev.verificado ? (
                <span
                  className="sello-mini"
                  title="Datos verificados por el organizador"
                >
                  ✓
                </span>
              ) : null}
            </div>

            <h3 className="imp-card__nombre">
              <Link href={`/agenda/${ev.slug}`}>{ev.nombre}</Link>
            </h3>

            <p className="imp-card__cuando">
              {formatRango(ev)}
              {ev.estadoFechas !== "Confirmadas" ? " · a confirmar" : ""}
              {[ev.venue || ev.ciudad || ev.provincia, ev.pais]
                .filter(Boolean)
                .join(", ")
                ? ` · ${[ev.venue || ev.ciudad || ev.provincia, ev.pais].filter(Boolean).join(", ")}`
                : ""}
            </p>

            {(ev.porQueImperdible || ev.descCorta) && (
              <p className="imp-card__porque">
                {ev.porQueImperdible || ev.descCorta}
              </p>
            )}

            <Link className="imp-card__link" href={`/agenda/${ev.slug}`}>
              Ver la ficha completa →
            </Link>
          </article>
        ))}
      </div>

      <section className="sem-bloque reveal" style={{ marginTop: "44px" }}>
        <h2 className="ag-mes">Cómo elegimos estos</h2>
        <p className="sem-nota">
          De los eventos del mes elegimos unos pocos y contamos por qué. No es
          un ranking ni están ordenados por importancia: van por fecha. Miramos
          qué mueve producción de verdad, qué le sirve a alguien que trabaja en
          el rubro y qué vale el viaje si no sos de la ciudad donde pasa.
        </p>
        <p className="sem-nota">
          <strong>Esto no se compra.</strong> Los espacios comerciales de la
          agenda están rotulados como tales y viven en{" "}
          <Link href="/sponsors">Para marcas</Link>. Los imperdibles son
          criterio editorial: por eso explicamos el motivo de cada uno.
        </p>
      </section>

      {otras.length > 0 && (
        <section className="sem-bloque reveal">
          <h2 className="ag-mes">Ediciones anteriores</h2>
          <div className="imp-archivo">
            {otras.map((e) => (
              <Link
                className="chip"
                key={e.mes}
                href={`/imperdibles/${e.mes}`}
              >
                {mesLargo(e.mes)} ({e.eventos.length})
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="sem-cierre reveal">
        <p className="sem-nota">
          Los imperdibles salen del mismo lugar que toda la agenda. Si querés
          verlos venir con tiempo, suscribite al calendario.
        </p>
        <div className="sus-botones">
          <Link className="btn" href="/agenda/calendario">
            Suscribirme al calendario
          </Link>
          <Link className="btn btn--ghost" href="/agenda">
            Ver la agenda completa
          </Link>
          <Link className="btn btn--ghost" href="/agenda/sugerir">
            + Sugerir evento
          </Link>
        </div>
      </div>
    </>
  );
}
