"use client";

import { useState } from "react";

const CSS = `
.adm{position:relative;z-index:2;max-width:1100px;margin:0 auto;padding:40px clamp(20px,4vw,40px) 90px}
.adm-top{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.adm-top h1{font-family:var(--font-display);font-weight:700;font-size:clamp(1.7rem,4vw,2.4rem)}
.adm-salir{background:none;border:none;color:rgba(245,245,245,.55);font-family:var(--font-ui);font-size:.85rem;cursor:pointer;text-decoration:underline}
.adm-resumen{font-family:var(--font-ui);font-size:.9rem;color:rgba(245,245,245,.55);margin-bottom:30px}
.adm-lista{display:flex;flex-direction:column;gap:12px}
.adm-item{background:#141418;border:1px solid rgba(245,245,245,.08);border-radius:14px;padding:20px 22px;cursor:pointer;transition:border-color .25s ease}
.adm-item:hover{border-color:rgba(90,160,255,.45)}
.adm-item[data-abierto="si"]{border-color:#5aa0ff;cursor:default}
.adm-item__top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}
.adm-chip{font-family:var(--font-ui);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;border-radius:999px;padding:5px 11px}
.adm-chip--borrador{color:#ea478a;border:1px solid rgba(234,71,138,.45)}
.adm-chip--publicado{color:#93d5f7;border:1px solid rgba(147,213,247,.45)}
.adm-chip--eje{color:rgba(245,245,245,.55);border:1px solid rgba(245,245,245,.14)}
.adm-item h2{font-family:var(--font-display);font-weight:700;font-size:1.25rem;line-height:1.2}
.adm-item p{font-family:var(--font-body);font-size:.92rem;line-height:1.55;color:rgba(245,245,245,.55);margin-top:8px}
.adm-ep{font-family:var(--font-ui);font-size:.72rem;color:rgba(245,245,245,.34);margin-top:10px}
.adm-editor{margin-top:22px;padding-top:22px;border-top:1px solid rgba(245,245,245,.1)}
.adm-campo{margin-bottom:18px}
.adm-campo label{display:block;font-family:var(--font-ui);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#5aa0ff;margin-bottom:8px}
.adm-campo input,.adm-campo textarea{width:100%;background:#0c0c0f;border:1px solid rgba(245,245,245,.12);border-radius:10px;padding:13px 15px;color:#f5f5f5;font-family:var(--font-body);font-size:.98rem;line-height:1.6;resize:vertical}
.adm-campo textarea{min-height:120px}
.adm-campo textarea.grande{min-height:460px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86rem;line-height:1.75}
.adm-ayuda{font-family:var(--font-ui);font-size:.76rem;color:rgba(245,245,245,.34);margin-top:6px;line-height:1.5}
.adm-acciones{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:22px}
.adm-btn{border:none;border-radius:999px;padding:13px 26px;font-family:var(--font-ui);font-weight:700;font-size:.9rem;cursor:pointer}
.adm-btn--pub{background:#ea478a;color:#fff}
.adm-btn--sec{background:transparent;color:#f5f5f5;border:1px solid rgba(245,245,245,.22)}
.adm-btn:disabled{opacity:.45;cursor:default}
.adm-msg{font-family:var(--font-ui);font-size:.86rem;line-height:1.5}
.adm-msg--ok{color:#93d5f7}
.adm-msg--mal{color:#ea478a}
.adm-vacio{background:#141418;border:1px solid rgba(245,245,245,.08);border-radius:14px;padding:30px;font-family:var(--font-body);color:rgba(245,245,245,.55);line-height:1.6}
`;

export default function PanelAdmin({ articulos }) {
  const [lista, setLista] = useState(articulos);
  const [abierto, setAbierto] = useState(null);
  const [campos, setCampos] = useState({ titulo: "", bajada: "", cuerpo: "" });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  const borradores = lista.filter((a) => !a.publicado).length;

  function abrir(art) {
    setAbierto(art.id);
    setCampos({ titulo: art.titulo, bajada: art.bajada, cuerpo: art.cuerpo });
    setMsg(null);
  }

  async function guardar(art, publicar) {
    setGuardando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: art.id,
          titulo: campos.titulo,
          bajada: campos.bajada,
          cuerpo: campos.cuerpo,
          publicado: publicar,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setLista((prev) =>
          prev.map((a) =>
            a.id === art.id
              ? {
                  ...a,
                  titulo: campos.titulo,
                  bajada: campos.bajada,
                  cuerpo: campos.cuerpo,
                  publicado: publicar,
                }
              : a
          )
        );
        setMsg({
          tipo: "ok",
          texto: data.sinCambios
            ? "No había nada para cambiar."
            : publicar
            ? "Publicado. En un minuto está online."
            : "Guardado como borrador.",
        });
      } else {
        setMsg({ tipo: "mal", texto: data.error || "No se pudo guardar." });
      }
    } catch {
      setMsg({ tipo: "mal", texto: "No se pudo conectar." });
    }
    setGuardando(false);
  }

  async function salir() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <main className="adm">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="adm-top">
        <h1>Artículos</h1>
        <button className="adm-salir" type="button" onClick={salir}>
          Cerrar sesión
        </button>
      </div>

      <div className="adm-resumen">
        {lista.length} artículos · {borradores} sin revisar
      </div>

      {lista.length === 0 ? (
        <div className="adm-vacio">
          Todavía no hay artículos. Corré la Action de Artículos en GitHub y
          volvé a entrar acá.
        </div>
      ) : (
        <div className="adm-lista">
          {lista.map((art) => {
            const estaAbierto = abierto === art.id;
            return (
              <article
                className="adm-item"
                data-abierto={estaAbierto ? "si" : "no"}
                key={art.id}
                onClick={() => {
                  if (!estaAbierto) abrir(art);
                }}
              >
                <div className="adm-item__top">
                  <span
                    className={
                      art.publicado
                        ? "adm-chip adm-chip--publicado"
                        : "adm-chip adm-chip--borrador"
                    }
                  >
                    {art.publicado ? "Publicado" : "Borrador"}
                  </span>
                  {art.eje ? (
                    <span className="adm-chip adm-chip--eje">{art.eje}</span>
                  ) : null}
                </div>

                <h2>{estaAbierto ? campos.titulo : art.titulo}</h2>
                {!estaAbierto ? <p>{art.bajada}</p> : null}
                <div className="adm-ep">
                  {art.fecha} · episodio: {art.episodioTitulo || art.id}
                </div>

                {estaAbierto ? (
                  <div className="adm-editor">
                    <div className="adm-campo">
                      <label>Título</label>
                      <input
                        value={campos.titulo}
                        onChange={(e) =>
                          setCampos({ ...campos, titulo: e.target.value })
                        }
                      />
                    </div>

                    <div className="adm-campo">
                      <label>Bajada</label>
                      <textarea
                        value={campos.bajada}
                        onChange={(e) =>
                          setCampos({ ...campos, bajada: e.target.value })
                        }
                      />
                    </div>

                    <div className="adm-campo">
                      <label>Artículo y preguntas</label>
                      <textarea
                        className="grande"
                        value={campos.cuerpo}
                        onChange={(e) =>
                          setCampos({ ...campos, cuerpo: e.target.value })
                        }
                      />
                      <div className="adm-ayuda">
                        Escribí normal. Las líneas que empiezan con ## son los
                        subtítulos y las que empiezan con ### son las preguntas.
                        El bloque entre ::: es el recuadro destacado. Si borrás
                        esos signos, se pierde el formato.
                      </div>
                    </div>

                    <div className="adm-acciones">
                      <button
                        className="adm-btn adm-btn--pub"
                        type="button"
                        disabled={guardando}
                        onClick={() => guardar(art, true)}
                      >
                        {guardando ? "Guardando…" : "Publicar"}
                      </button>
                      <button
                        className="adm-btn adm-btn--sec"
                        type="button"
                        disabled={guardando}
                        onClick={() => guardar(art, false)}
                      >
                        {art.publicado ? "Despublicar" : "Guardar borrador"}
                      </button>
                      <button
                        className="adm-btn adm-btn--sec"
                        type="button"
                        disabled={guardando}
                        onClick={() => {
                          setAbierto(null);
                          setMsg(null);
                        }}
                      >
                        Cerrar
                      </button>
                      {msg ? (
                        <span
                          className={
                            msg.tipo === "ok"
                              ? "adm-msg adm-msg--ok"
                              : "adm-msg adm-msg--mal"
                          }
                        >
                          {msg.texto}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
