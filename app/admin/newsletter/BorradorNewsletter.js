"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BLOQUES,
  cuanto,
  borradorHTML,
  borradorTexto,
} from "../../lib/newsletter-armar";

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
.nl__padron{display:flex;flex-wrap:wrap;gap:9px;align-items:baseline;margin-top:16px}
.nl__num{font-family:var(--font-display);font-weight:700;font-size:2.1rem;line-height:1;
  color:#5fd39a;font-variant-numeric:tabular-nums}
.nl__num-txt{color:var(--mute);font-size:.92rem}
.nl__num-txt b{color:var(--blanco);font-weight:600}
.nl__acciones{display:flex;flex-wrap:wrap;gap:10px;margin:26px 0 30px}
.nl__btn{font-family:var(--font-ui);font-size:.88rem;font-weight:600;cursor:pointer;
  border-radius:10px;padding:11px 20px;border:1px solid var(--line-2);
  background:var(--card);color:var(--blanco);transition:border-color .15s,color .15s}
.nl__btn:hover{border-color:var(--accent);color:var(--accent)}
.nl__btn--ok{border-color:#5fd39a;color:#5fd39a}
.nl__btn:disabled{opacity:.4;cursor:not-allowed}
.nl__btn:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.nl__asunto{background:var(--panel);border:1px solid var(--line-2);border-radius:12px;
  padding:16px 18px;margin-bottom:26px}
.nl__asunto span{display:block;font-family:var(--font-ui);font-size:.72rem;
  letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin-bottom:7px}
.nl__asunto p{font-size:1.08rem;font-weight:600}
.nl__bloque{margin-bottom:30px}
.nl__bloque--off{opacity:.42}
.nl__cab{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.nl__bloque h2{font-family:var(--font-display);font-weight:700;text-transform:uppercase;
  font-size:1.15rem;letter-spacing:.02em;margin:0}
.nl__bloque h2 b{color:var(--faint);font-weight:700}
.nl__sw{margin-left:auto;display:inline-flex;align-items:center;gap:8px;cursor:pointer;
  font-family:var(--font-ui);font-size:.78rem;color:var(--mute);user-select:none}
.nl__sw input{position:absolute;opacity:0;width:0;height:0}
.nl__pista{width:38px;height:21px;border-radius:999px;background:#2a2a33;
  border:1px solid var(--line-2);position:relative;transition:background .15s,border-color .15s}
.nl__pista::after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;
  border-radius:50%;background:var(--mute);transition:transform .15s,background .15s}
.nl__sw input:checked + .nl__pista{background:rgba(95,211,154,.22);border-color:#5fd39a}
.nl__sw input:checked + .nl__pista::after{transform:translateX(17px);background:#5fd39a}
.nl__sw input:focus-visible + .nl__pista{outline:2px solid var(--accent);outline-offset:3px}
.nl__items{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);
  border-radius:12px;overflow:hidden;margin-top:12px}
.nl__i{background:var(--panel);padding:14px 17px}
.nl__i strong{display:block;font-size:1rem;line-height:1.35;margin-bottom:4px}
.nl__i p{color:var(--mute);font-size:.9rem;line-height:1.55}
.nl__i small{display:block;font-family:var(--font-ui);font-size:.74rem;
  letter-spacing:.04em;color:var(--faint);margin-top:6px}
.nl__ep{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
.nl__ep img{width:200px;max-width:100%;border-radius:8px;border:1px solid var(--line-2);
  display:block;background:#0c0c0f}
.nl__ep-txt{flex:1 1 260px;min-width:0}
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
.nl__crudo summary::before{content:"▸";display:inline-block;transition:transform .18s}
.nl__crudo[open] summary::before{transform:rotate(90deg)}
.nl__crudo summary:hover{color:var(--blanco)}
.nl__crudo summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
.nl__crudo pre{margin-top:12px;background:var(--panel);border:1px solid var(--line);
  border-radius:10px;padding:15px 17px;overflow-x:auto;font-size:.8rem;line-height:1.65;
  color:var(--mute);white-space:pre-wrap;word-break:break-word}
`;

const GUARDADO = "mye.newsletter.bloques";

function fechaCorta(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${Number(d)} de ${meses[Number(m) - 1]}`;
}

export default function BorradorNewsletter({ borrador: b, suscriptores }) {
  const [copiado, setCopiado] = useState("");

  // Qué bloques entran. Arrancan todos prendidos y la elección queda guardada
  // en este navegador: si una semana no querés el glosario, es probable que la
  // siguiente tampoco.
  const [activos, setActivos] = useState(() =>
    Object.fromEntries(BLOQUES.map((x) => [x.id, true]))
  );

  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(GUARDADO) || "{}");
      if (g && typeof g === "object") setActivos((a) => ({ ...a, ...g }));
    } catch {
      // Navegador sin storage o con datos rotos: quedan todos prendidos.
    }
  }, []);

  function alternar(id) {
    setActivos((a) => {
      const nuevo = { ...a, [id]: !a[id] };
      try {
        localStorage.setItem(GUARDADO, JSON.stringify(nuevo));
      } catch {
        // Si no se puede guardar, igual funciona en esta sesión.
      }
      return nuevo;
    });
  }

  // El HTML y el texto se rearman con cada cambio de interruptor. Son dos
  // funciones puras sobre datos que ya están en memoria: no hace falta ir al
  // servidor ni recargar.
  const html = useMemo(() => borradorHTML(b, activos), [b, activos]);
  const texto = useMemo(() => borradorTexto(b, activos), [b, activos]);

  // Cuántos bloques quedaron prendidos Y tienen contenido.
  const conAlgo = BLOQUES.filter((x) => cuanto(b, x.id) > 0);
  const prendidos = conAlgo.filter((x) => activos[x.id]);

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

  // La cabecera de un bloque, con su interruptor. El interruptor solo aparece
  // si el bloque tiene algo: ofrecer apagar algo que ya está vacío confunde.
  function Cabecera({ id, titulo, cuenta }) {
    return (
      <div className="nl__cab">
        <h2>
          {titulo} {cuenta > 1 && <b>· {cuenta}</b>}
        </h2>
        <label className="nl__sw">
          {/* El nombre accesible tiene que decir QUÉ entra. La etiqueta
              visible dice solo "entra"/"afuera", que al lado del título se
              entiende, pero quien lo escucha oye cuatro casillas iguales. */}
          <input
            type="checkbox"
            aria-label={`Incluir el bloque "${titulo}" en el newsletter`}
            checked={!!activos[id]}
            onChange={() => alternar(id)}
          />
          <span className="nl__pista" />
          <span>{activos[id] ? "entra" : "afuera"}</span>
        </label>
      </div>
    );
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

        {/* El padrón. Va arriba porque es lo primero que uno quiere saber
            antes de decidir si esta semana manda algo. */}
        <div className="nl__padron">
          {suscriptores?.activos != null ? (
            <>
              <span className="nl__num">
                {suscriptores.activos.toLocaleString("es-AR")}
              </span>
              <span className="nl__num-txt">
                <b>suscriptores activos</b>
                {suscriptores.todos != null &&
                  suscriptores.todos !== suscriptores.activos &&
                  ` · ${suscriptores.todos.toLocaleString("es-AR")} en el padrón contando bajas y rebotes`}
              </span>
            </>
          ) : (
            <span className="nl__num-txt" style={{ color: "#f2c14e" }}>
              No se pudo leer el padrón de beehiiv
              {suscriptores?.error ? `: ${suscriptores.error}` : "."}
            </span>
          )}
        </div>

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
            Esta semana no salió episodio, no se publicó ningún artículo, no hay
            términos nuevos y no hay eventos en los próximos días. No hay
            newsletter que mandar, y mandar uno vacío es peor que no mandarlo.
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
                disabled={prendidos.length === 0}
              >
                {copiado === "html" ? "✓ Copiado" : "Copiar para beehiiv"}
              </button>
              <button
                className={`nl__btn${copiado === "texto" ? " nl__btn--ok" : ""}`}
                onClick={() => copiar("texto")}
                disabled={prendidos.length === 0}
              >
                {copiado === "texto" ? "✓ Copiado" : "Copiar como texto"}
              </button>
              {copiado === "error" && (
                <span style={{ color: "#f2c14e", fontSize: ".86rem", alignSelf: "center" }}>
                  El navegador no dejó copiar. Seleccioná el texto a mano.
                </span>
              )}
              {prendidos.length === 0 && (
                <span style={{ color: "#f2c14e", fontSize: ".86rem", alignSelf: "center" }}>
                  Apagaste todos los bloques: no queda nada para copiar.
                </span>
              )}
            </div>

            <div className="nl__asunto">
              <span>Asunto sugerido</span>
              <p>{b.asunto}</p>
            </div>

            {b.episodio && (
              <section
                className={`nl__bloque${activos.episodio ? "" : " nl__bloque--off"}`}
              >
                <Cabecera id="episodio" titulo="El episodio de la semana" cuenta={1} />
                <div className="nl__items">
                  <div className="nl__i">
                    <div className="nl__ep">
                      {/* Sin next/image a propósito: es una miniatura de
                          YouTube en una pantalla interna, y pasarla por el
                          optimizador solo suma un rodeo. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.episodio.miniatura} alt="" width="200" />
                      <div className="nl__ep-txt">
                        <strong>{b.episodio.titulo}</strong>
                        {b.episodio.resumen && <p>{b.episodio.resumen}</p>}
                        <small>
                          {b.episodio.resumenDe
                            ? `El texto sale de ${b.episodio.resumenDe}`
                            : "Sin texto: no hay artículo ni descripción"}
                          {b.episodio.articuloUrl ? " · tiene artículo" : " · todavía sin artículo"}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {b.articulos.length > 0 && (
              <section
                className={`nl__bloque${activos.articulos ? "" : " nl__bloque--off"}`}
              >
                <Cabecera id="articulos" titulo="Para leer" cuenta={b.articulos.length} />
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
              <section
                className={`nl__bloque${activos.eventos ? "" : " nl__bloque--off"}`}
              >
                <Cabecera
                  id="eventos"
                  titulo="La agenda de los próximos días"
                  cuenta={b.eventos.length}
                />
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
              <section
                className={`nl__bloque${activos.terminos ? "" : " nl__bloque--off"}`}
              >
                <Cabecera
                  id="terminos"
                  titulo="Nuevo en el glosario"
                  cuenta={b.terminos.length + b.terminosDeMas}
                />
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
                        con el link al glosario. Entran las cuatro que más
                        nombran los artículos publicados: una semana de aprobar
                        en tanda deja diecinueve, y eso ya no es un newsletter.
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
              <pre>{html || "(no queda ningún bloque prendido)"}</pre>
            </details>

            <p className="nl__nota">
              El envío se hace a mano desde beehiiv: mandar campañas por su API
              —el endpoint «Create post» y la Send API— pide el plan Max, y la
              Send API además está en beta y se habilita a pedido solo para
              Enterprise. Con el plan actual se pueden dar de alta suscriptores
              (es lo que hace el formulario del sitio) y contarlos, que es de
              donde sale el número de arriba, pero no enviar. Lo que se
              automatiza acá es juntar y ordenar, que es lo que lleva tiempo.
              {b.episodio && (
                <>
                  {" "}
                  Ojo con la miniatura: si beehiiv la descarta al pegar, la
                  dirección de la imagen está en la versión de texto para
                  ponerla a mano.
                </>
              )}
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
