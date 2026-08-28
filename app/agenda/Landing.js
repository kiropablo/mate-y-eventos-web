import Link from "next/link";
import Destaque from "./Destaque";
import { formatRango, TIPO_COLOR } from "../lib/agenda";
import { textosDe } from "./cortes";

// El cuerpo de una landing de la agenda. Lo comparten los cuatro cortes
// (país, tipo, provincia y mes) para que se vean y digan lo mismo.

export default function Landing({ corte, otros = [], recíproco = null }) {
  const t = textosDe(corte);
  const n = corte.eventos.length;

  return (
    <>
      <section className="page-top" data-accent="blue">
        <div className="wrap">
          <div className="eyebrow reveal">
            <span className="n">—</span>
            <Link href="/agenda">Agenda</Link> / {t.etiqueta}
          </div>
          {/* Un punto de corte invisible después de cada barra.
              "Congreso/Conferencia" es una sola palabra para el navegador, y a
              41,6px no entra en un teléfono de 390: sin esto el título se
              partía al medio y quedaba "CONGRESO/CONFER · ENCIA". El carácter
              no se ve, no se copia como espacio y no cambia el texto: solo le
              dice al navegador que ahí puede cortar si no le queda otra. */}
          <h1>{t.h1.replace(/\//g, "/\u200B")}</h1>
          <p className="lead reveal" style={{ transitionDelay: ".1s" }}>
            {n} {n === 1 ? "evento" : "eventos"} en la agenda, con fecha, sede y
            el link a la ficha de cada uno.
          </p>
          {/* El puente con la curaduría: esta página es el listado completo,
              la otra es la selección con criterio. Que se linkeen evita que
              compitan por la misma búsqueda. */}
          {recíproco ? (
            <p className="lead reveal" style={{ transitionDelay: ".15s" }}>
              <Link href={recíproco.href}>{recíproco.texto}</Link>
            </p>
          ) : null}
        </div>
      </section>

      <section className="section-p" data-accent="blue">
        <div className="wrap">
          <div className="ag-tabla">
            {corte.eventos.map((ev) => (
              <Link
                href={`/agenda/${ev.slug}`}
                key={ev.slug}
                className="ag-fila"
              >
                <span className="ag-fila__fecha">
                  {ev.fechaInicio ? Number(ev.fechaInicio.slice(8, 10)) : "—"}
                </span>
                <span className="ag-fila__cuerpo">
                  <span className="ag-fila__nombre">
                    <span
                      className="dot"
                      style={{ background: TIPO_COLOR[ev.tipo] || "#9aa3b2" }}
                    />
                    <Destaque destacado={ev.destacado} pago={ev.destacadoPago} />
                    {ev.nombre}
                    {ev.verificado ? (
                      <span
                        className="sello-mini"
                        title="Datos verificados por el organizador"
                      >
                        ✓
                      </span>
                    ) : null}
                  </span>
                  <span className="ag-fila__meta">
                    {formatRango(ev)}
                    {[ev.ciudad || ev.provincia, ev.pais]
                      .filter(Boolean)
                      .join(", ")
                      ? ` · ${[ev.ciudad || ev.provincia, ev.pais].filter(Boolean).join(", ")}`
                      : ""}
                    {ev.estadoFechas !== "Confirmadas" ? " · a confirmar" : ""}
                  </span>
                </span>
                <span className="ag-fila__flecha" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>

          {otros.length > 0 && (
            <section className="sem-bloque reveal" style={{ marginTop: "44px" }}>
              <h2 className="ag-mes">Otros cortes de la agenda</h2>
              <div className="imp-archivo">
                {otros.map((c) => (
                  <Link className="chip" href={c.url} key={c.url}>
                    {textosDe(c).etiqueta} ({c.eventos.length})
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="sem-cierre reveal">
            <div className="sus-botones">
              <Link className="btn" href="/agenda">
                Ver la agenda completa
              </Link>
              <Link className="btn btn--ghost" href="/agenda/calendario">
                Suscribirme al calendario
              </Link>
              <Link className="btn btn--ghost" href="/agenda/sugerir">
                + Sugerir evento
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
