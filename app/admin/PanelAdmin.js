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
.adm-bloque{background:#141418;border:1px solid rgba(245,245,245,.08);border-radius:14px;padding:24px 22px;margin-bottom:30px}
.adm-bloque h2{font-family:var(--font-display);font-weight:700;font-size:1.15rem;margin-bottom:6px}
.adm-bloque p{font-family:var(--font-body);font-size:.9rem;line-height:1.55;color:rgba(245,245,245,.55)}
.adm-bloque .adm-acciones{margin-top:18px}
.adm-btn--agenda{background:#93d5f7;color:#0c0c0f}
.adm-tabs{display:flex;gap:8px;margin-bottom:26px;flex-wrap:wrap}
.adm-tab{background:none;border:1px solid rgba(245,245,245,.14);color:rgba(245,245,245,.55);border-radius:999px;padding:9px 20px;font-family:var(--font-ui);font-size:.84rem;cursor:pointer}
.adm-tab[data-on="si"]{border-color:#5aa0ff;color:#f5f5f5}
.adm-tab span{color:rgba(245,245,245,.34);margin-left:7px}
.org{cursor:default}
.org-cab{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
.org-cab h3{margin:0 0 5px;font-family:var(--font-display);font-size:1.18rem}
.org-meta{color:rgba(245,245,245,.55);font-size:.86rem}
.org-estado{font-family:var(--font-ui);font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;padding:4px 11px;border-radius:999px;white-space:nowrap;border:1px solid}
.org-estado[data-estado="pendiente"]{color:rgba(245,245,245,.5);border-color:rgba(245,245,245,.16)}
.org-estado[data-estado="verificado"]{color:#93d5f7;border-color:rgba(147,213,247,.45)}
.org-estado[data-estado="difundido"]{color:#ea478a;border-color:rgba(234,71,138,.5)}
.org-semana{margin-top:16px;padding:14px 16px;background:rgba(245,245,245,.03);border-radius:10px}
.org-rotulo{display:block;font-family:var(--font-ui);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:#93d5f7;margin-bottom:8px}
.org-semana ul{margin:0 0 12px;padding-left:18px;color:rgba(245,245,245,.7);font-size:.88rem;line-height:1.6}
.org-correcciones{white-space:pre-wrap;margin-top:14px;padding:12px 15px;border-left:2px solid #ea478a;background:rgba(234,71,138,.06);border-radius:0 8px 8px 0;font-size:.9rem;line-height:1.6}
.org-acciones{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px;align-items:center}
.org-acciones .adm-btn{text-decoration:none;display:inline-flex;align-items:center}
.org-nota{margin-top:11px;color:rgba(245,245,245,.4);font-size:.82rem}
.org-invitar{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-top:16px;padding:14px 16px;background:rgba(90,160,255,.06);border:1px solid rgba(90,160,255,.2);border-radius:10px}
.org-mail{flex:1 1 220px;background:#0c0c0f;border:1px solid rgba(245,245,245,.14);color:#f5f5f5;border-radius:999px;padding:10px 18px;font-family:var(--font-ui);font-size:.88rem}
.org-mail:focus{outline:none;border-color:#5aa0ff}
.org-enviado{color:rgba(245,245,245,.45);font-size:.8rem}
.org-estado[data-estado="espera"]{color:#f2c14e;border-color:rgba(242,193,78,.5)}
.adm-buscador{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:22px}
.adm-busca{flex:1 1 260px;background:#0c0c0f;border:1px solid rgba(245,245,245,.14);color:#f5f5f5;border-radius:999px;padding:11px 20px;font-family:var(--font-ui);font-size:.9rem}
.adm-busca::placeholder{color:rgba(245,245,245,.34)}
.adm-busca:focus{outline:none;border-color:#5aa0ff}
.adm-filtros{display:flex;gap:6px;flex-wrap:wrap}
.adm-filtro{background:none;border:1px solid rgba(245,245,245,.12);color:rgba(245,245,245,.5);border-radius:999px;padding:7px 15px;font-family:var(--font-ui);font-size:.78rem;cursor:pointer}
.adm-filtro[data-on="si"]{border-color:#ea478a;color:#f5f5f5}
.adm-chip--falta{color:#ffb35a;border:1px solid rgba(255,179,90,.45)}
.adm-aviso{background:rgba(255,179,90,.08);border:1px solid rgba(255,179,90,.3);border-radius:10px;padding:12px 15px;font-family:var(--font-body);font-size:.86rem;line-height:1.55;color:rgba(245,245,245,.75);margin-bottom:18px}
`;

export default function PanelAdmin({ articulos, glosario, organizadores }) {
  const [seccion, setSeccion] = useState("articulos");
  const [orgs, setOrgs] = useState(organizadores?.eventos || []);
  const hayFirma = organizadores?.hayFirma !== false;
  const [copiado, setCopiado] = useState("");
  const [difundiendo, setDifundiendo] = useState("");
  const [aprobando, setAprobando] = useState("");
  const [invitando, setInvitando] = useState("");
  const [paraQuien, setParaQuien] = useState({});
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [lista, setLista] = useState(articulos);
  const [glo, setGlo] = useState(glosario || []);
  const [abiertoGlo, setAbiertoGlo] = useState(null);
  const [camposGlo, setCamposGlo] = useState({
    termino: "",
    definicionCorta: "",
    minuto: "",
    cuerpo: "",
  });
  const [guardandoGlo, setGuardandoGlo] = useState(false);
  const [msgGlo, setMsgGlo] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [campos, setCampos] = useState({ titulo: "", bajada: "", cuerpo: "" });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [agenda, setAgenda] = useState(null);
  const [agendaOcupada, setAgendaOcupada] = useState("");

  const borradores = lista.filter((a) => !a.publicado).length;
  const borradoresGlo = glo.filter((t) => !t.publicado).length;

  // Dónde está cada evento del circuito.
  const sinContactar = orgs.filter((e) => !e.verificado).length;
  // Mismo criterio que el filtro «Para difundir»: si el contador dijera 0 y
  // el filtro mostrara uno, no se sabría a cuál creerle.
  const paraDifundir = orgs.filter(
    (e) => e.verificado && !e.difundido && !e.revisionPendiente
  ).length;

  async function copiar(texto, clave) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(""), 2000);
    } catch {
      // Si el navegador no deja copiar, el link igual está a la vista.
    }
  }

  // Se tilda después de subir la historia. Le avisa al organizador si dejó
  // su mail al confirmar.
  async function marcarDifundido(ev) {
    if (
      !confirm(
        `¿Ya publicaste ${ev.nombre} en las redes?` +
          (ev.email
            ? `\n\nSe le va a avisar a ${ev.email}.`
            : "\n\nNo dejó mail, así que solo queda marcado.")
      )
    )
      return;
    setDifundiendo(ev.slug);
    try {
      const res = await fetch("/api/admin/difundido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: ev.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      setOrgs((previa) =>
        previa.map((e) =>
          e.slug === ev.slug ? { ...e, difundido: true } : e
        )
      );
      if (data.aviso && data.aviso.startsWith("falló")) {
        alert(`Quedó marcado, pero el aviso al organizador ${data.aviso}.`);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setDifundiendo("");
    }
  }

  function abrirTermino(t) {
    setAbiertoGlo(t.id);
    setCamposGlo({
      termino: t.termino,
      definicionCorta: t.definicionCorta,
      minuto: t.minuto || "",
      cuerpo: t.cuerpo,
    });
    setMsgGlo(null);
  }

  async function guardarTermino(t, publicar) {
    setGuardandoGlo(true);
    setMsgGlo(null);
    try {
      const res = await fetch("/api/admin/glosario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: t.id,
          termino: camposGlo.termino,
          definicionCorta: camposGlo.definicionCorta,
          minuto: camposGlo.minuto,
          cuerpo: camposGlo.cuerpo,
          publicado: publicar,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setGlo((prev) =>
          prev.map((x) =>
            x.id === t.id
              ? {
                  ...x,
                  termino: camposGlo.termino,
                  definicionCorta: camposGlo.definicionCorta,
                  minuto: camposGlo.minuto,
                  cuerpo: camposGlo.cuerpo,
                  publicado: publicar,
                }
              : x
          )
        );
        setMsgGlo({
          tipo: "ok",
          texto: data.sinCambios
            ? "No había nada para cambiar."
            : publicar
              ? "Publicado. En un minuto está online."
              : "Guardado como borrador.",
        });
      } else {
        setMsgGlo({ tipo: "mal", texto: data.error || "No se pudo guardar." });
      }
    } catch {
      setMsgGlo({ tipo: "mal", texto: "No se pudo conectar." });
    }
    setGuardandoGlo(false);
  }

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

  // Le damos el OK definitivo. Ver app/api/admin/verificar.
  async function aprobar(ev, si) {
    if (
      !confirm(
        si
          ? `¿Ya aplicaste lo que pidió y le encendemos el sello a ${ev.nombre}?`
          : `¿Descartar la revisión de ${ev.nombre}? Lo que escribió queda guardado igual.`
      )
    )
      return;
    setAprobando(ev.slug);
    try {
      const res = await fetch("/api/admin/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: ev.slug, aprueba: si }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      setOrgs((previa) =>
        previa.map((e) =>
          e.slug === ev.slug
            ? { ...e, revisionPendiente: false, verificado: si ? true : e.verificado }
            : e
        )
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setAprobando("");
    }
  }

  // Manda el mail de invitación. El link firmado lo arma el servidor.
  async function invitar(ev) {
    const para = (paraQuien[ev.slug] ?? ev.emailSugerido ?? "").trim();
    if (!para) return alert("Escribí a qué mail se lo mando.");
    if (
      !confirm(
        `¿Le mando la invitación de ${ev.nombre} a ${para}?` +
          (ev.fechaContacto
            ? `\n\nOJO: ya le escribiste el ${ev.fechaContacto}.`
            : "")
      )
    )
      return;
    setInvitando(ev.slug);
    try {
      const res = await fetch("/api/admin/invitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: ev.slug, para }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar.");
      const hoy = new Date().toLocaleDateString("en-CA");
      setOrgs((previa) =>
        previa.map((e) =>
          e.slug === ev.slug ? { ...e, fechaContacto: hoy, email: para } : e
        )
      );
      if (!data.anotado) {
        alert("El mail salió, pero no se pudo anotar la fecha en Airtable.");
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setInvitando("");
    }
  }

  // Un solo buscador para las tres pestañas. Sin acentos ni mayúsculas, para
  // que "produccion" encuentre "Producción".
  const pelar = (t) =>
    String(t || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const q = pelar(busca).trim();
  const coincide = (...campos) => !q || pelar(campos.join(" ")).includes(q);

  const listaFiltrada = lista.filter(
    (a) =>
      coincide(a.titulo, a.eje, (a.etiquetas || []).join(" "), a.episodioTitulo) &&
      (filtro === "todos" ||
        (filtro === "borradores" ? !a.publicado : a.publicado))
  );
  const gloFiltrado = glo.filter(
    (t) =>
      coincide(t.termino, t.definicionCorta, t.eje) &&
      (filtro === "todos" ||
        (filtro === "borradores" ? !t.publicado : t.publicado))
  );
  const orgsFiltrados = orgs.filter(
    (e) =>
      coincide(e.nombre, e.organizador, e.email) &&
      (filtro === "todos" ||
        (filtro === "sincontactar"
          ? !e.fechaContacto && !e.verificado
          : filtro === "pendientes"
          ? e.revisionPendiente
          : filtro === "sinverificar"
            ? !e.verificado && !e.revisionPendiente
            : filtro === "paradifundir"
              ? e.verificado && !e.difundido && !e.revisionPendiente
              : true))
  );

  // Los filtros que tienen sentido en cada pestaña.
  const filtros =
    seccion === "organizadores"
      ? [
          ["todos", "Todos"],
          ["pendientes", "Esperan tu OK"],
          ["sincontactar", "Sin escribir"],
          ["paradifundir", "Para difundir"],
          ["sinverificar", "Sin verificar"],
        ]
      : [
          ["todos", "Todos"],
          ["borradores", "Sin revisar"],
          ["publicados", "Publicados"],
        ];

  // Los dos botones de la agenda. "refrescar" trae lo de Airtable al
  // instante; "buscar" dispara la Action que rastrea internet.
  async function accionAgenda(accion) {
    if (accion === "buscar") {
      const seguro = window.confirm(
        "Va a buscar eventos nuevos en los diez rubros y repasar los que ya están cargados. Tarda entre 10 y 30 minutos y todo entra a Airtable como Borrador IA. ¿Arranco?"
      );
      if (!seguro) return;
    }
    setAgendaOcupada(accion);
    setAgenda(null);
    try {
      const res = await fetch("/api/admin/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const data = await res.json();
      setAgenda(
        data.ok
          ? { ok: true, texto: data.mensaje }
          : { ok: false, texto: data.error || "No se pudo." }
      );
    } catch {
      setAgenda({ ok: false, texto: "No se pudo conectar." });
    }
    setAgendaOcupada("");
  }

  async function salir() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <main className="adm">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="adm-top">
        <h1>
          {seccion === "articulos"
            ? "Artículos"
            : seccion === "glosario"
              ? "Glosario"
              : "Organizadores"}
        </h1>
        <button className="adm-salir" type="button" onClick={salir}>
          Cerrar sesión
        </button>
      </div>

      <div className="adm-resumen">
        {seccion === "articulos"
          ? `${lista.length} artículos · ${borradores} sin revisar`
          : seccion === "glosario"
            ? `${glo.length} términos · ${borradoresGlo} sin revisar`
            : `${orgs.length} eventos próximos · ${sinContactar} sin verificar · ${paraDifundir} listos para difundir`}
      </div>

      <div className="adm-tabs">
        <button
          type="button"
          className="adm-tab"
          data-on={seccion === "articulos" ? "si" : "no"}
          onClick={() => setSeccion("articulos")}
        >
          Artículos{borradores ? <span>{borradores} sin revisar</span> : null}
        </button>
        <button
          type="button"
          className="adm-tab"
          data-on={seccion === "glosario" ? "si" : "no"}
          onClick={() => setSeccion("glosario")}
        >
          Glosario{borradoresGlo ? <span>{borradoresGlo} sin revisar</span> : null}
        </button>
        <button
          type="button"
          className="adm-tab"
          data-on={seccion === "organizadores" ? "si" : "no"}
          onClick={() => setSeccion("organizadores")}
        >
          Organizadores
          {paraDifundir ? <span>{paraDifundir} para difundir</span> : null}
        </button>
      </div>

      <div className="adm-buscador">
        <input
          type="search"
          className="adm-busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={
            seccion === "articulos"
              ? "Buscar por título, eje o etiqueta…"
              : seccion === "glosario"
                ? "Buscar un término…"
                : "Buscar por evento u organizador…"
          }
        />
        <div className="adm-filtros">
          {filtros.map(([clave, rotulo]) => (
            <button
              key={clave}
              type="button"
              className="adm-filtro"
              data-on={filtro === clave ? "si" : "no"}
              onClick={() => setFiltro(clave)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <section className="adm-bloque">
        <h2>Agenda de eventos</h2>
        <p>
          La web se actualiza sola cada hora y todos los días a la mañana
          busca novedades. Estos botones son para no esperar.
        </p>
        <div className="adm-acciones">
          <button
            type="button"
            className="adm-btn adm-btn--agenda"
            disabled={agendaOcupada !== ""}
            onClick={() => accionAgenda("refrescar")}
          >
            {agendaOcupada === "refrescar"
              ? "Actualizando…"
              : "Actualizar desde Airtable"}
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--sec"
            disabled={agendaOcupada !== ""}
            onClick={() => accionAgenda("buscar")}
          >
            {agendaOcupada === "buscar"
              ? "Lanzando…"
              : "Buscar novedades en internet"}
          </button>
          {agenda ? (
            <span className={agenda.ok ? "adm-msg adm-msg--ok" : "adm-msg adm-msg--mal"}>
              {agenda.texto}
            </span>
          ) : null}
        </div>
      </section>

      {seccion === "articulos" && listaFiltrada.length === 0 ? (
        <div className="adm-vacio">
          {lista.length === 0
            ? "Todavía no hay artículos. Corré la Action de Artículos en GitHub y volvé a entrar acá."
            : "Ningún artículo coincide con lo que buscás."}
        </div>
      ) : seccion === "articulos" ? (
        <div className="adm-lista">
          {listaFiltrada.map((art) => {
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
      ) : seccion === "organizadores" ? (
        <>
          {!hayFirma ? (
            <div className="adm-vacio">
              Falta cargar AGENDA_FIRMA_SECRET en Vercel: sin esa clave no se
              pueden armar los links de confirmación.
            </div>
          ) : null}
          {orgsFiltrados.length === 0 ? (
            <div className="adm-vacio">
              {orgs.length === 0
                ? "No hay eventos próximos en la agenda. Si Airtable no responde, probá «Actualizar desde Airtable» acá arriba."
                : "Ningún evento coincide con lo que buscás."}
            </div>
          ) : (
            <div className="adm-lista">
              {orgsFiltrados.map((ev) => {
                const estado = ev.revisionPendiente
                  ? "espera"
                  : ev.difundido
                    ? "difundido"
                    : ev.verificado
                      ? "verificado"
                      : "pendiente";
                return (
                  <article className="adm-item org" key={ev.slug}>
                    <div className="org-cab">
                      <div>
                        <h3>{ev.nombre}</h3>
                        <div className="org-meta">
                          {ev.fechas}
                          {ev.organizador ? ` · ${ev.organizador}` : ""}
                          {typeof ev.dias === "number"
                            ? ` · en ${ev.dias} día${ev.dias === 1 ? "" : "s"}`
                            : ""}
                        </div>
                      </div>
                      <span className="org-estado" data-estado={estado}>
                        {estado === "espera"
                          ? "Espera tu OK"
                          : estado === "difundido"
                            ? "Difundido"
                            : estado === "verificado"
                              ? "Verificado"
                              : "Sin verificar"}
                      </span>
                    </div>

                    {ev.correcciones ? (
                      <div className="org-correcciones">
                        <strong>Pidió corregir:</strong> {ev.correcciones}
                      </div>
                    ) : null}

                    {ev.semana.length ? (
                      <div className="org-semana">
                        <span className="org-rotulo">
                          Esa semana también
                        </span>
                        <ul>
                          {ev.semana.map((o) => (
                            <li key={o.nombre}>
                              {o.nombre}
                              {o.fechas ? ` — ${o.fechas}` : ""}
                              {o.ciudad ? `, ${o.ciudad}` : ""}
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="adm-btn adm-btn--sec"
                          onClick={() =>
                            copiar(
                              ev.semana
                                .map(
                                  (o) =>
                                    `- ${o.nombre}${o.fechas ? ` — ${o.fechas}` : ""}${o.ciudad ? `, ${o.ciudad}` : ""}`
                                )
                                .join("\n"),
                              `semana-${ev.slug}`
                            )
                          }
                        >
                          {copiado === `semana-${ev.slug}`
                            ? "Copiado"
                            : "Copiar la lista"}
                        </button>
                      </div>
                    ) : null}

                    {!ev.verificado && !ev.revisionPendiente ? (
                      <div className="org-invitar">
                        <input
                          type="email"
                          className="org-mail"
                          value={paraQuien[ev.slug] ?? ev.emailSugerido ?? ""}
                          onChange={(e) =>
                            setParaQuien((p) => ({ ...p, [ev.slug]: e.target.value }))
                          }
                          placeholder="mail del organizador"
                        />
                        <button
                          type="button"
                          className="adm-btn"
                          disabled={invitando === ev.slug}
                          onClick={() => invitar(ev)}
                        >
                          {invitando === ev.slug
                            ? "Enviando…"
                            : ev.fechaContacto
                              ? "Volver a enviar"
                              : "Enviar la invitación"}
                        </button>
                        {ev.fechaContacto ? (
                          <span className="org-enviado">
                            Enviado el {ev.fechaContacto}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="org-acciones">
                      {ev.link ? (
                        <button
                          type="button"
                          className="adm-btn adm-btn--sec"
                          onClick={() => copiar(ev.link, `link-${ev.slug}`)}
                        >
                          {copiado === `link-${ev.slug}`
                            ? "Copiado"
                            : "Copiar link de confirmación"}
                        </button>
                      ) : null}

                      {ev.revisionPendiente ? (
                        <>
                          <button
                            type="button"
                            className="adm-btn"
                            disabled={aprobando === ev.slug}
                            onClick={() => aprobar(ev, true)}
                          >
                            {aprobando === ev.slug ? "Guardando…" : "Dar el OK"}
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn--sec"
                            disabled={aprobando === ev.slug}
                            onClick={() => aprobar(ev, false)}
                          >
                            Descartar
                          </button>
                        </>
                      ) : null}

                      {ev.verificado && !ev.difundido && !ev.revisionPendiente ? (
                        <button
                          type="button"
                          className="adm-btn adm-btn--sec"
                          disabled={difundiendo === ev.slug}
                          onClick={() => marcarDifundido(ev)}
                        >
                          {difundiendo === ev.slug
                            ? "Guardando…"
                            : "Ya lo difundimos"}
                        </button>
                      ) : null}

                      <a
                        className="adm-btn adm-btn--sec"
                        href={ev.ficha}
                        target="_blank"
                        rel="noopener"
                      >
                        Ver la ficha
                      </a>
                    </div>

                    {ev.verificado && !ev.aTiempo && !ev.difundido ? (
                      <div className="org-nota">
                        Ya no llegamos a difundirlo con tiempo: faltan menos de
                        cinco días.
                      </div>
                    ) : null}
                    {ev.email ? (
                      <div className="org-nota">Contacto: {ev.email}</div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : gloFiltrado.length === 0 ? (
        <div className="adm-vacio">
          {glo.length === 0
            ? "Todavía no hay términos. Corré la Action de Glosario en GitHub y volvé a entrar acá."
            : "Ningún término coincide con lo que buscás."}
        </div>
      ) : (
        <div className="adm-lista">
          {gloFiltrado.map((t) => {
            const estaAbierto = abiertoGlo === t.id;
            return (
              <article
                className="adm-item"
                data-abierto={estaAbierto ? "si" : "no"}
                key={t.id}
                onClick={() => {
                  if (!estaAbierto) abrirTermino(t);
                }}
              >
                <div className="adm-item__top">
                  <span
                    className={
                      t.publicado
                        ? "adm-chip adm-chip--publicado"
                        : "adm-chip adm-chip--borrador"
                    }
                  >
                    {t.publicado ? "Publicado" : "Borrador"}
                  </span>
                  {t.eje ? (
                    <span className="adm-chip adm-chip--eje">{t.eje}</span>
                  ) : null}
                  {!t.listoParaPublicar ? (
                    <span className="adm-chip adm-chip--falta">
                      Sin episodio
                    </span>
                  ) : null}
                </div>

                <h2>{estaAbierto ? camposGlo.termino : t.termino}</h2>
                {!estaAbierto ? <p>{t.definicionCorta}</p> : null}
                <div className="adm-ep">
                  episodio: {t.episodioTitulo || t.episodio || "—"}
                </div>

                {estaAbierto ? (
                  <div className="adm-editor">
                    {!t.listoParaPublicar ? (
                      <div className="adm-aviso">
                        Este término no tiene episodio cargado. Podés guardarlo
                        como borrador, pero para publicarlo hay que completar el
                        campo <code>episodio</code> en el archivo: sin eso, la
                        web no lo muestra igual.
                      </div>
                    ) : null}

                    <div className="adm-campo">
                      <label>Término</label>
                      <input
                        value={camposGlo.termino}
                        onChange={(e) =>
                          setCamposGlo({ ...camposGlo, termino: e.target.value })
                        }
                      />
                    </div>

                    <div className="adm-campo">
                      <label>Definición corta</label>
                      <textarea
                        value={camposGlo.definicionCorta}
                        onChange={(e) =>
                          setCamposGlo({
                            ...camposGlo,
                            definicionCorta: e.target.value,
                          })
                        }
                      />
                      <div className="adm-ayuda">
                        Una o dos oraciones. Es lo que se ve en el listado, lo
                        que se comparte y lo que lee un asistente de IA: tiene
                        que entenderse sola, sin el resto de la página.
                      </div>
                    </div>

                    <div className="adm-campo">
                      <label>Minuto del episodio (opcional)</label>
                      <input
                        value={camposGlo.minuto}
                        placeholder="12:40"
                        onChange={(e) =>
                          setCamposGlo({ ...camposGlo, minuto: e.target.value })
                        }
                      />
                    </div>

                    <div className="adm-campo">
                      <label>Explicación</label>
                      <textarea
                        className="grande"
                        value={camposGlo.cuerpo}
                        onChange={(e) =>
                          setCamposGlo({ ...camposGlo, cuerpo: e.target.value })
                        }
                      />
                      <div className="adm-ayuda">
                        Escribí normal. Las líneas que empiezan con ## son los
                        subtítulos. Si borrás esos signos, se pierde el formato.
                      </div>
                    </div>

                    <div className="adm-acciones">
                      <button
                        className="adm-btn adm-btn--pub"
                        type="button"
                        disabled={guardandoGlo || !t.listoParaPublicar}
                        onClick={() => guardarTermino(t, true)}
                      >
                        {guardandoGlo ? "Guardando…" : "Publicar"}
                      </button>
                      <button
                        className="adm-btn adm-btn--sec"
                        type="button"
                        disabled={guardandoGlo}
                        onClick={() => guardarTermino(t, false)}
                      >
                        {t.publicado ? "Despublicar" : "Guardar borrador"}
                      </button>
                      <button
                        className="adm-btn adm-btn--sec"
                        type="button"
                        disabled={guardandoGlo}
                        onClick={() => {
                          setAbiertoGlo(null);
                          setMsgGlo(null);
                        }}
                      >
                        Cerrar
                      </button>
                      {msgGlo ? (
                        <span
                          className={
                            msgGlo.tipo === "ok"
                              ? "adm-msg adm-msg--ok"
                              : "adm-msg adm-msg--mal"
                          }
                        >
                          {msgGlo.texto}
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
