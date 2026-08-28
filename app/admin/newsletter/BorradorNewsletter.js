"use client";

import { useState } from "react";
import Link from "next/link";

// El borrador del newsletter, listo para copiar y pegar en beehiiv.
//
// Los estilos van acá adentro y no en globals.css porque esta pantalla es
// interna: no comparte nada con el sitio público y no tiene por qué sumarle
// peso a las páginas que sí ve la gente.

const CSS = `
.nl{max-width:860px;margin:0 auto;padding:34px clamp(18px,4vw,40px) 90px}
.nl__volanta{font-family:var(--font-ui);font-size:.78rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--accent);font-weight:600}
.nl h1{font-family:var(--font-display);font-weight:700;text-transform:uppercase;
  font-size:clamp(1.8rem,4vw,2.6rem);line-height:1;margin:10px 0 6px}
.nl__rango{color:var(--mute);font-size:.94rem}
.nl__acciones{display:flex;flex-wrap:wrap;gap:10px;margin:26px 0 30px}
.nl__btn{font-family:var(--font-ui);font-size:.88rem;font-weight:600;cursor:pointer;
  border-radius:10px;padding:11px 20px;border:1px solid var(--line-2);
  background:var(--card);color:var(--blanco);transition:border-color .15s,color .15s}
.nl__btn:hover{border-color:var(--accent);color:var(--accent)}
.nl__btn--ok{border-color:#5fd39a;color:#5fd39a}
.nl__btn:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.nl__asunto{background:var(--panel);border:1px solid var(--line-2);border-radius:12px;
  padding:16px 18px;margin-bottom:26px}
.nl__asunto span{display:block;font-family:var(--font-ui);font-size:.72rem;
  letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-bottom:7px}
.nl__asunto p{font-size:1.08rem;font-weight:600}
.nl__bloque{margin-bottom:30px}
.nl__bloque h2{font-family:var(--font-display);font-weight:700;text-transform:uppercase;
  font-size:1.15rem;letter-spacing:.02em;margin-bottom:4px}
.nl__bloque h2 b{color:var(--faint);font-weight:700}
.nl__items{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);
  border-radius:12px;overflow:hidden;margin-top:12px}
.nl__i{background:var(--panel);padding:14px 17px}
.nl__i strong{display:block;font-size:1rem;line-height:1.35;margin-bottom:4px}
.nl__i p{color:var(--mute);font-size:.9rem;line-height:1.55}
.nl__i small{display:block;font-family:var(--font-ui);font-size:.74rem;
  letter-spacing:.04em;color:var(--faint);margin-top:6px}
.nl__sello{color:#5fd39a}
.nl__aviso{background:rgba(242,193,78,.08);border:1px solid rgba(242,193,78,.3);
  color:#f2c14e;border-radius:12px;padding:14px 17px;font-size:.9rem;
  line-height:1.55;margin-bottom:26px}
.nl__vacio{background:var(--panel);border:1px dashed var(--line-2);border-radius:12px;
  padding:26px 20px;color:var(--mute);font-size:.94rem;line-height:1.6}
.nl__volver{display:inline-block;margin-top:14px;color:var(--mute);font-size:.9rem}
.nl__nota{color:var(--faint);font-size:.84rem;line-height:1.6;margin-top:34px;
  padding-top:20px;border-top:1px solid var(--line)}
.nl__crudo{margin-top:26px}
.nl__crudo summary{cursor:pointer;font-family:var(--font-ui);font-size:.85rem;
  color:var(--mute);list-style:none;display:flex;gap:8px;align-items:center}
.nl__crudo summary::-webkit-details-marker{display:none}
.nl__crudo summary::before{content:"\u25b8";display:inline-block;transition:transform .18s}
.nl__crudo[open] summary::before{transform:rotate(90deg)}
.nl__crudo summary:hover{color:var(--blanco)}
.nl__crudo summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
.nl__crudo pre{margin-top:12px;background:var(--panel);border:1px solid var(--line);
  border-radius:10px;padding:15px 17px;overflow-x:auto;font-size:.8rem;line-height:1.65;
  color:var(--mute);white-space:pre-wrap;word-break:break-word}
`;

function fechaCorta(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${Number(d)} de ${meses[Number(m) - 1]}`;
}

export default function BorradorNewsletter({ borrador: b, html, texto }) {
  const [copiado, setCopiado] = useState("");

  // Se copia con formato y como texto plano a la vez: beehiiv pega lo primero
  // y cualquier otro editor lo segundo. Si el navegador no deja escribir
  // HTML —pasa en algunos—, cae al texto y avisa igual.
  async function copiar(tipo) {
    try {
      if (tipo === "html" && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([texto], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(tipo === "html" ? html : texto);
      }
      setCopiado(tipo);
      setTimeout(() => setCopiado(""), 2600);
    } catch {
      setCopiado("error");
      setTimeout(() => setCopiado(""), 3400);
    }
  }


  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="nl">
        <div className="nl__volanta">Panel interno · Newsletter</div>
        <h1>La semana, lista para mandar</h1>
        <p className="nl__rango">
          Lo publicado entre el {fechaCorta(b.desde)} y el {fechaCorta(b.hasta)}.
        </p>

        {/* El aviso va afuera de las dos ramas: si la agenda no se pudo leer,
            hay que decirlo tanto cuando hay contenido como cuando no. */}
        {!b.agendaCompleta && (
          <div className="nl__aviso" style={{ marginTop: "26px" }}>
            No se pudo leer la agenda de Airtable, así que el bloque de
            eventos queda afuera y no sabemos qué se viene. Recargá en un
            rato antes de decidir si esta semana hay newsletter.
          </div>
        )}

        {b.vacio ? (
          <div className="nl__vacio" style={{ marginTop: "26px" }}>
            Esta semana no se publicó ningún artículo, ningún término nuevo, y
            no hay eventos en los próximos días. No hay newsletter que mandar,
            y mandar uno vacío es peor que no mandarlo.
            <Link className="nl__volver" href="/admin">
              ← Volver al panel
            </Link>
          </div>
        ) : (
          <>
            <div className="nl__acciones">
              <button
                className={`nl__btn${copiado === "html" ? " nl__btn--ok" : ""}`}
                onClick={() => copiar("html")}
              >
                {copiado === "html" ? "✓ Copiado" : "Copiar para beehiiv"}
              </button>
              <button
                className={`nl__btn${copiado === "texto" ? " nl__btn--ok" : ""}`}
                onClick={() => copiar("texto")}
              >
                {copiado === "texto" ? "✓ Copiado" : "Copiar como texto"}
              </button>
              {copiado === "error" && (
                <span style={{ color: "#f2c14e", fontSize: ".86rem", alignSelf: "center" }}>
                  El navegador no dejó copiar. Seleccioná el texto a mano.
                </span>
              )}
            </div>

            <div className="nl__asunto">
              <span>Asunto sugerido</span>
              <p>{b.asunto}</p>
            </div>

            {b.articulos.length > 0 && (
              <section className="nl__bloque">
                <h2>
                  Para leer <b>· {b.articulos.length}</b>
                </h2>
                <div className="nl__items">
                  {b.articulos.map((a) => (
                    <div className="nl__i" key={a.url}>
                      <strong>{a.titulo}</strong>
                      <p>{a.bajada}</p>
                      <small>{a.eje}</small>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {b.eventos.length > 0 && (
              <section className="nl__bloque">
                <h2>
                  La agenda de los próximos días <b>· {b.eventos.length}</b>
                </h2>
                <div className="nl__items">
                  {b.eventos.map((e) => (
                    <div className="nl__i" key={e.url}>
                      <strong>{e.nombre}</strong>
                      <p>
                        {e.cuando}
                        {e.donde ? ` · ${e.donde}` : ""}
                      </p>
                      {e.verificado && (
                        <small className="nl__sello">
                          ✓ datos confirmados por el organizador
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {b.terminos.length > 0 && (
              <section className="nl__bloque">
                <h2>
                  Nuevo en el glosario{" "}
                  <b>· {b.terminos.length + b.terminosDeMas}</b>
                </h2>
                <div className="nl__items">
                  {b.terminos.map((t) => (
                    <div className="nl__i" key={t.url}>
                      <strong>{t.termino}</strong>
                      <p>{t.definicionCorta}</p>
                    </div>
                  ))}
                  {b.terminosDeMas > 0 && (
                    <div className="nl__i">
                      <p>
                        Y {b.terminosDeMas}{" "}
                        {b.terminosDeMas === 1 ? "palabra más" : "palabras más"},
                        con el link al glosario. Entran las primeras cuatro: una
                        semana de publicar en tanda deja diecinueve, y eso ya no
                        es un newsletter.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Lo que se copia, a la vista. Un botón que copia algo que no se
                puede mirar antes obliga a pegar a ciegas en beehiiv y darse
                cuenta ahí. */}
            <details className="nl__crudo">
              <summary>Ver exactamente lo que se copia</summary>
              <pre>{html}</pre>
            </details>

            <p className="nl__nota">
              El envío se hace a mano desde beehiiv: mandar campañas por su API
              —y también su RSS-to-Send— piden el plan Max, US$96 por mes. Con
              el plan actual se pueden dar de alta suscriptores, que es lo que
              hace el formulario del sitio, pero no enviar. Lo que se automatiza
              acá es juntar y ordenar, que es lo que lleva tiempo.
            </p>
            <Link className="nl__volver" href="/admin">
              ← Volver al panel
            </Link>
          </>
        )}
      </div>
    </>
  );
}
