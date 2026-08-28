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
.adm-campo input,.adm-campo textarea,.adm-campo select{width:100%;background:#0c0c0f;border:1px solid rgba(245,245,245,.12);border-radius:10px;padding:13px 15px;color:#f5f5f5;font-family:var(--font-body);font-size:.98rem;line-height:1.6;resize:vertical}
.adm-campo textarea{min-height:120px}
.adm-campo textarea.grande{min-height:460px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86rem;line-height:1.75}
.adm-ayuda{font-family:var(--font-ui);font-size:.76rem;color:rgba(245,245,245,.34);margin-top:6px;line-height:1.5}
.adm-acciones{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:22px}
.adm-btn{border:none;border-radius:999px;padding:13px 26px;font-family:var(--font-ui);font-weight:700;font-size:.9rem;cursor:pointer}
.adm-btn--pub{background:#ea478a;color:#fff}
.adm-btn--sec{background:transparent;color:#f5f5f5;border:1px solid rgba(245,245,245,.22)}
/* El único que saca algo de la web. Va apagado hasta que le pasás el mouse:
   tiene que verse distinto, pero no invitar a apretarlo. */
.adm-btn--peligro{background:transparent;color:rgba(255,138,138,.75);border:1px solid rgba(255,138,138,.28)}
.adm-btn--peligro:hover{background:rgba(255,138,138,.1);color:#ff8a8a;border-color:rgba(255,138,138,.55)}
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
.org-editor{margin-top:18px;padding-top:20px;border-top:1px solid rgba(245,245,245,.1)}
.org-aviso{margin-bottom:18px;padding:12px 15px;border-radius:10px;background:rgba(242,193,78,.08);border:1px solid rgba(242,193,78,.3);color:#f2c14e;font-size:.86rem;line-height:1.5}
.org-propuestas{margin-bottom:24px;padding:16px 18px;background:rgba(234,71,138,.06);border:1px solid rgba(234,71,138,.22);border-radius:12px}
.org-prop{padding:12px 0;border-top:1px solid rgba(245,245,245,.07)}
.org-prop:first-of-type{border-top:none;padding-top:2px}
.org-prop__que{font-family:var(--font-ui);font-weight:700;font-size:.9rem;margin-bottom:5px}
.org-prop__dice{white-space:pre-wrap;color:rgba(245,245,245,.4);font-size:.84rem;line-height:1.5;text-decoration:line-through}
.org-prop__nuevo{white-space:pre-wrap;color:#93d5f7;font-size:.9rem;line-height:1.55;margin:3px 0 9px}
.org-prop .adm-btn{padding:7px 17px;font-size:.8rem}
.org-mas{color:rgba(245,245,245,.4);font-style:italic}
.adm-btn[data-inerte="si"]{opacity:.45;cursor:default;pointer-events:none}
.adm-tab--link{text-decoration:none;display:inline-flex;align-items:center}
.org-invitar{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-top:16px;padding:14px 16px;background:rgba(90,160,255,.06);border:1px solid rgba(90,160,255,.2);border-radius:10px}
.org-mail{flex:1 1 220px;background:#0c0c0f;border:1px solid rgba(245,245,245,.14);color:#f5f5f5;border-radius:999px;padding:10px 18px;font-family:var(--font-ui);font-size:.88rem}
.org-mail:focus{outline:none;border-color:#5aa0ff}
.org-enviado{color:rgba(245,245,245,.45);font-size:.8rem}
.org-mails{display:flex;flex-wrap:wrap;gap:6px;width:100%;margin-top:2px}
.org-chip{background:none;border:1px solid rgba(245,245,245,.16);color:rgba(245,245,245,.6);border-radius:999px;padding:5px 12px;font-family:var(--font-ui);font-size:.76rem;cursor:pointer}
.org-chip[data-on="si"]{border-color:#5aa0ff;color:#f5f5f5}
.org-contactos{width:100%;margin-top:4px;color:rgba(245,245,245,.4);font-size:.78rem;line-height:1.5}
.org-contactos span{color:rgba(245,245,245,.55)}
.org-invitar[data-sinmail="si"]{background:rgba(245,245,245,.03);border-color:rgba(245,245,245,.1)}
.org-estado[data-estado="espera"]{color:#f2c14e;border-color:rgba(242,193,78,.5)}
.adm-exportar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:16px;padding:14px 18px;background:rgba(90,160,255,.07);border:1px solid rgba(90,160,255,.22);border-radius:12px}
.adm-exportar span{color:rgba(245,245,245,.65);font-size:.88rem}
.adm-buscador{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:22px}
.adm-busca{flex:1 1 260px;background:#0c0c0f;border:1px solid rgba(245,245,245,.14);color:#f5f5f5;border-radius:999px;padding:11px 20px;font-family:var(--font-ui);font-size:.9rem}
.adm-busca::placeholder{color:rgba(245,245,245,.34)}
.adm-busca:focus{outline:none;border-color:#5aa0ff}
.adm-filtros{display:flex;gap:6px;flex-wrap:wrap}
.adm-filtro{background:none;border:1px solid rgba(245,245,245,.12);color:rgba(245,245,245,.5);border-radius:999px;padding:7px 15px;font-family:var(--font-ui);font-size:.78rem;cursor:pointer}
.adm-filtro[data-on="si"]{border-color:#ea478a;color:#f5f5f5}
.adm-cols{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:14px;padding:14px 16px;background:rgba(245,245,245,.03);border:1px solid rgba(245,245,245,.08);border-radius:12px}
.adm-col{display:flex;flex-direction:column;gap:5px;min-width:132px}
.adm-col span{font-family:var(--font-ui);font-size:.66rem;letter-spacing:.13em;text-transform:uppercase;color:rgba(245,245,245,.42)}
.adm-col select{background:#0c0c0f;border:1px solid rgba(245,245,245,.14);color:#f5f5f5;border-radius:9px;padding:9px 11px;font-family:var(--font-ui);font-size:.84rem}
.adm-col select:focus{outline:none;border-color:#5aa0ff}
.adm-cols .adm-btn{padding:9px 18px;font-size:.8rem}
.adm-conteo{font-family:var(--font-ui);font-size:.82rem;color:rgba(245,245,245,.45);margin-bottom:14px}
.org-badge{display:inline-block;margin-right:8px;padding:2px 9px;border-radius:999px;font-family:var(--font-ui);font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:#ffb35a;border:1px solid rgba(255,179,90,.42)}
.adm-chip--falta{color:#ffb35a;border:1px solid rgba(255,179,90,.45)}
.adm-aviso{background:rgba(255,179,90,.08);border:1px solid rgba(255,179,90,.3);border-radius:10px;padding:12px 15px;font-family:var(--font-body);font-size:.86rem;line-height:1.55;color:rgba(245,245,245,.75);margin-bottom:18px}
`;

// Cuántas tarjetas se dibujan de una. Con la base entera son más de
// cuatrocientas, y cada una trae botones, mails y el bloque de correcciones.
const POR_TANDA = 60;

export default function PanelAdmin({ articulos, glosario, organizadores }) {
  const [seccion, setSeccion] = useState("articulos");
  const [orgs, setOrgs] = useState(organizadores?.eventos || []);
  const hayFirma = organizadores?.hayFirma !== false;
  const linkEquipo = organizadores?.linkEquipo || "";
  const [copiado, setCopiado] = useState("");
  const [difundiendo, setDifundiendo] = useState("");
  const [aprobando, setAprobando] = useState("");
  const [sacando, setSacando] = useState("");
  // El editor de ficha: cuál está abierto, lo que trajo el servidor, lo que hay
  // escrito ahora en el formulario, y el cartel de resultado.
  const [fichaAbierta, setFichaAbierta] = useState("");
  const [ficha, setFicha] = useState(null);
  const [fichaValores, setFichaValores] = useState({});
  const [fichaCargando, setFichaCargando] = useState(false);
  const [fichaGuardando, setFichaGuardando] = useState(false);
  const [fichaMsj, setFichaMsj] = useState(null);
  // Los mensajes editables: cuál se está editando, sus textos, la vista previa
  // y si hay algo sin guardar. Se cargan recién al entrar a la pestaña.
  const [cualMsj, setCualMsj] = useState("primer-contacto");
  const [listaMsj, setListaMsj] = useState([]);
  const [msj, setMsj] = useState(null);
  const [msjOriginal, setMsjOriginal] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [cargandoMsj, setCargandoMsj] = useState(false);
  const [guardandoMsj, setGuardandoMsj] = useState(false);
  const [avisoMsj, setAvisoMsj] = useState("");
  const [conQue, setConQue] = useState("");

  // Un conjunto y no un solo slug: con uno solo, el primer envío que
  // terminaba le devolvía el botón a TODOS los que estuvieran en curso, y el
  // segundo se podía apretar de nuevo mientras seguía andando.
  const [invitando, setInvitando] = useState(() => new Set());
  const [confirmando, setConfirmando] = useState(() => new Set());
  const marcarConfirmando = (slug, activo) =>
    setConfirmando((previa) => {
      const copia = new Set(previa);
      if (activo) copia.add(slug);
      else copia.delete(slug);
      return copia;
    });
  const marcarInvitando = (slug, activo) =>
    setInvitando((previa) => {
      const copia = new Set(previa);
      if (activo) copia.add(slug);
      else copia.delete(slug);
      return copia;
    });
  const [paraQuien, setParaQuien] = useState({});
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  // Los filtros de la pestaña de eventos, uno por columna, como en Airtable.
  // Vacío quiere decir "cualquiera". "cuando" arranca en próximos porque la
  // pestaña se usa sobre todo para saber a quién escribirle, y los que ya
  // pasaron son la mitad de la base.
  const [fEstado, setFEstado] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fPais, setFPais] = useState("");
  const [fProvincia, setFProvincia] = useState("");
  const [fFechas, setFFechas] = useState("");
  const [fCuando, setFCuando] = useState("proximos");
  const [orden, setOrden] = useState("fecha");
  const [tope, setTope] = useState(POR_TANDA);
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
  // Los tres contadores de arriba son del circuito con organizadores, así que
  // se cuentan sobre los que se pueden escribir: publicados y por delante. La
  // lista ahora trae también borradores, archivados y los que ya pasaron, y
  // contar sobre todo eso daría un "listos para escribir" que incluye eventos
  // de 2024 y fichas que nadie aprobó.
  const escribibles = orgs.filter((e) => e.estado === "Aprobado" && !e.paso);
  const sinContactar = escribibles.filter((e) => !e.verificado).length;
  // Los que se pueden escribir hoy: con mail y con tiempo.
  const listos = escribibles.filter(
    (e) => !e.fechaContacto && !e.verificado && e.emailSugerido && e.aTiempo
  ).length;
  // Mismo criterio que el filtro «Para difundir»: si el contador dijera 0 y
  // el filtro mostrara uno, no se sabría a cuál creerle.
  const paraDifundir = escribibles.filter(
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
    setDifundiendo(ev.id || ev.slug);
    try {
      const res = await fetch("/api/admin/difundido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ev.id, slug: ev.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      setOrgs((previa) =>
        previa.map((e) =>
          (e.id || e.slug) === (ev.id || ev.slug) ? { ...e, difundido: true } : e
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

  // Sacar un evento de la agenda. No lo borra: lo manda a "Archivado", que es
  // de donde se lo puede traer de vuelta. Se pide un motivo porque la nota que
  // queda en Airtable es lo único que va a explicar, dentro de seis meses, por
  // qué ese evento no está.
  async function sacarDeLaAgenda(ev) {
    if (
      !confirm(
        `¿Sacar "${ev.nombre}" de la agenda?\n\n` +
          "Deja de publicarse en el sitio ahora mismo. NO se borra: queda " +
          "archivado en Airtable con todos sus datos, y se puede volver a " +
          "poner cuando quieras."
      )
    )
      return;
    const motivo = prompt(
      "¿Por qué lo sacás? (opcional, queda anotado en Airtable)\n\n" +
        "Por ejemplo: duplicado, se canceló, no es de la industria.",
      ""
    );
    // Cancelar el segundo cartel cancela todo: si alguien llegó hasta acá y se
    // arrepintió, lo esperable es que no pase nada.
    if (motivo === null) return;

    setSacando(ev.id || ev.slug);
    try {
      const res = await fetch("/api/admin/descartar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ev.id, slug: ev.slug, motivo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data?.error || "No se pudo guardar.");
      // Se va de la lista: la pestaña muestra solo lo que está publicado, así
      // que dejarlo ahí diría que sigue en la agenda cuando ya no está.
      setOrgs((previa) => previa.filter((e) => (e.id || e.slug) !== (ev.id || ev.slug)));
    } catch (e) {
      alert(e.message);
    } finally {
      setSacando("");
    }
  }

  // Abrir y cerrar el editor de una ficha. Los datos se piden recién acá y no
  // vienen con la lista: son quince campos por evento y la pestaña trae más de
  // cien. Traerlos todos por si acaso haría lenta la pantalla que se usa
  // siempre, para una que se usa de a una ficha por vez.
  async function abrirFicha(ev) {
    if (fichaAbierta === (ev.id || ev.slug)) {
      setFichaAbierta("");
      setFicha(null);
      setFichaMsj(null);
      return;
    }
    setFichaAbierta(ev.id || ev.slug);
    setFicha(null);
    setFichaMsj(null);
    setFichaCargando(true);
    try {
      const res = await fetch(
        `/api/admin/ficha?id=${encodeURIComponent(ev.id)}&slug=${encodeURIComponent(ev.slug)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok)
        throw new Error(data?.error || "No se pudo leer la ficha.");
      setFicha(data);
      setFichaValores(data.valores);
    } catch (e) {
      setFichaMsj({ ok: false, texto: e.message });
    } finally {
      setFichaCargando(false);
    }
  }

  // "Aplicar" no guarda: mete lo que propuso el organizador en el campo, para
  // poder leerlo y corregirlo antes. Muchas correcciones vienen escritas como
  // se las dice por teléfono ("es en el Konex, no en Costa Salguero") y no como
  // tienen que quedar en la ficha.
  function aplicarPropuesta(destino, valor) {
    setFichaValores((previos) => ({ ...previos, [destino]: valor }));
    setFichaMsj(null);
  }

  async function guardarFicha(ev) {
    setFichaGuardando(true);
    setFichaMsj(null);
    try {
      const res = await fetch("/api/admin/ficha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ev.id,
          slug: ev.slug,
          valores: fichaValores,
          // La foto de cómo estaba la ficha cuando se abrió el editor. El
          // servidor la usa para darse cuenta si alguien más tocó un campo
          // mientras estaba abierto.
          originales: ficha?.valores || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok)
        throw new Error(data?.error || "No se pudo guardar.");
      setFichaMsj({ ok: true, texto: data.mensaje });
      // El encabezado de la tarjeta muestra estos dos: si no se actualizan,
      // queda diciendo el nombre viejo abajo del cartel de "guardado".
      setOrgs((previa) =>
        previa.map((e) =>
          (e.id || e.slug) === (ev.id || ev.slug)
            ? {
                ...e,
                nombre: fichaValores.nombre || e.nombre,
                organizador: fichaValores.organizador ?? e.organizador,
              }
            : e
        )
      );
    } catch (e) {
      setFichaMsj({ ok: false, texto: e.message });
    } finally {
      setFichaGuardando(false);
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

  // El sello a mano, sin que el organizador haya usado el link. Es el caso
  // normal: confirman por mail o por teléfono.
  async function marcarVerificado(ev, encender) {
    if (
      !confirm(
        encender
          ? `¿Confirmó el organizador los datos de ${ev.nombre}? El sello dice eso, así que conviene que sea cierto.`
          : `¿Le saco el sello a ${ev.nombre}?`
      )
    )
      return;
    setAprobando(ev.id || ev.slug);
    try {
      const res = await fetch("/api/admin/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ev.id, slug: ev.slug, quitar: !encender }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      setOrgs((previa) =>
        previa.map((e) =>
          (e.id || e.slug) === (ev.id || ev.slug) ? { ...e, verificado: encender } : e
        )
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setAprobando("");
    }
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
    setAprobando(ev.id || ev.slug);
    try {
      const res = await fetch("/api/admin/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ev.id, slug: ev.slug, aprueba: si }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar.");
      setOrgs((previa) =>
        previa.map((e) =>
          (e.id || e.slug) === (ev.id || ev.slug)
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
  async function cargarMensaje(cual = cualMsj) {
    setCargandoMsj(true);
    setAvisoMsj("");
    // La previa es del mensaje anterior: si no se limpia, al cambiar de
    // mensaje se queda mostrando el mail que no es.
    setPrevia(null);
    try {
      const res = await fetch(`/api/admin/mensaje?cual=${encodeURIComponent(cual)}`);
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d?.error || "No se pudo leer el mensaje.");
      setCualMsj(d.cual);
      setListaMsj(d.mensajes || []);
      setMsj(d.campos.map((c) => ({ ...c, valor: d.valores[c.id] ?? c.porDefecto })));
      setMsjOriginal(d.valores);
      if (!d.guardadoAlgunaVez) {
        setAvisoMsj("Nunca se editó: estos son los textos con los que sale hoy.");
      }
    } catch (e) {
      setAvisoMsj(e.message);
    } finally {
      setCargandoMsj(false);
    }
  }

  function valoresDelMensaje() {
    const out = {};
    for (const c of msj || []) out[c.id] = c.valor;
    return out;
  }

  const hayCambios =
    msj && msjOriginal && msj.some((c) => (c.valor || "") !== (msjOriginal[c.id] || ""));

  async function verPrevia(slug) {
    setAvisoMsj("");
    try {
      const res = await fetch("/api/admin/mensaje/previsualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cual: cualMsj,
          valores: valoresDelMensaje(),
          slug: slug || conQue,
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d?.error || "No se pudo armar la vista previa.");
      setPrevia(d);
      setConQue(d.slug);
    } catch (e) {
      setAvisoMsj(e.message);
    }
  }

  async function guardarMensaje() {
    if (!confirm("¿Guardo estos textos? El próximo mail que mandes sale así.")) return;
    setGuardandoMsj(true);
    setAvisoMsj("");
    try {
      const res = await fetch("/api/admin/mensaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cual: cualMsj, valores: valoresDelMensaje() }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d?.error || "No se pudo guardar.");
      setMsjOriginal(valoresDelMensaje());
      setAvisoMsj(d.mensaje || "Guardado.");
    } catch (e) {
      setAvisoMsj(e.message);
    } finally {
      setGuardandoMsj(false);
    }
  }

  async function invitar(ev) {
    const para = (paraQuien[ev.id || ev.slug] ?? ev.emailSugerido ?? "").trim();
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

    marcarInvitando(ev.id || ev.slug, true);
    try {
      // El servidor corta el reenvío por su cuenta y devuelve 409: la fecha
      // que ve el panel puede tener una hora de atraso, la de él no.
      let res = await mandarInvitacion(ev, para, false);
      let data = await res.json().catch(() => ({}));

      // El servidor frena por dos motivos y los dos se preguntan igual: se
      // avisa qué pasa y se deja decidir.
      if (res.status === 409 && (data?.yaContactado || data?.yaPaso)) {
        const pregunta = data.yaPaso
          ? `${data.error}\n\n¿Mandarlo igual?`
          : `Según Airtable ya se le escribió el ${data.yaContactado}.\n\n¿Mandarlo igual?`;
        if (!confirm(pregunta)) return;
        res = await mandarInvitacion(ev, para, true);
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) throw new Error(data?.error || "No se pudo enviar.");
      const hoy = new Date().toLocaleDateString("en-CA");
      setOrgs((previa) =>
        previa.map((e) =>
          (e.id || e.slug) === (ev.id || ev.slug) ? { ...e, fechaContacto: hoy, email: para } : e
        )
      );
      if (!data.anotado) {
        alert("El mail salió, pero no se pudo anotar la fecha en Airtable.");
      }
    } catch (e) {
      alert(e.message);
    } finally {
      marcarInvitando(ev.id || ev.slug, false);
    }
  }

  // El segundo mail: "listo, tu ficha quedó verificada".
  async function confirmar(ev) {
    const para = (paraQuien[ev.id || ev.slug] ?? ev.emailSugerido ?? "").trim();
    if (!para) return alert("Escribí a qué mail se lo mando.");
    if (
      !confirm(
        `¿Le aviso a ${para} que ${ev.nombre} quedó verificado?` +
          (ev.fechaConfirmacion
            ? `\n\nOJO: ya se lo avisaste el ${ev.fechaConfirmacion}.`
            : "")
      )
    )
      return;

    marcarConfirmando(ev.id || ev.slug, true);
    try {
      let res = await mandarConfirmacion(ev, para, false);
      let data = await res.json().catch(() => ({}));

      if (res.status === 409 && data?.yaConfirmado) {
        if (
          !confirm(
            `Según Airtable ya se le avisó el ${data.yaConfirmado}.\n\n¿Mandarlo igual?`
          )
        )
          return;
        res = await mandarConfirmacion(ev, para, true);
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) throw new Error(data?.error || "No se pudo enviar.");
      const hoy = new Date().toLocaleDateString("en-CA");
      setOrgs((previa) =>
        previa.map((e) =>
          (e.id || e.slug) === (ev.id || ev.slug) ? { ...e, fechaConfirmacion: hoy, email: para } : e
        )
      );
      if (!data.anotado) {
        alert("El mail salió, pero no se pudo anotar la fecha en Airtable.");
      }
    } catch (e) {
      alert(e.message);
    } finally {
      marcarConfirmando(ev.id || ev.slug, false);
    }
  }

  // Reciben el evento entero y no el slug: el id del registro es lo único que
  // distingue un archivado de su gemelo publicado, y acá se manda un mail.
  function mandarConfirmacion(ev, para, forzar) {
    return fetch("/api/admin/confirmacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ev.id, slug: ev.slug, para, forzar }),
    });
  }

  function mandarInvitacion(ev, para, forzar) {
    return fetch("/api/admin/invitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ev.id, slug: ev.slug, para, forzar }),
    });
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
  // Los desplegables se arman con lo que hay de verdad en la base, no con una
  // lista escrita a mano: si mañana entra un evento de Ecuador, el país aparece
  // solo. Una lista fija se desactualiza y nadie se entera hasta que un filtro
  // deja de encontrar algo que sí está.
  const opcionesDe = (campo) =>
    [...new Set(orgs.map((e) => e[campo]).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "es")
    );

  const orgsFiltrados = orgs.filter(
    (e) =>
      coincide(
        e.nombre,
        e.organizador,
        e.email,
        e.ciudad,
        e.venue,
        e.provincia
      ) &&
      (fEstado === "" || e.estado === fEstado) &&
      (fTipo === "" || e.tipo === fTipo) &&
      (fPais === "" || e.pais === fPais) &&
      (fProvincia === "" || e.provincia === fProvincia) &&
      (fFechas === "" || e.estadoFechas === fFechas) &&
      (fCuando === "todos" ||
        (fCuando === "proximos" ? !e.paso : e.paso)) &&
      (filtro === "todos" ||
        (filtro === "conmail"
          ? Boolean(e.emailSugerido)
          : filtro === "listos"
          ? // Los que se pueden escribir hoy mismo: nadie les escribió, no
            // están verificados, les sacamos un mail del campo Contactos y
            // todavía da el tiempo para ofrecerles la difusión.
            !e.fechaContacto && !e.verificado && e.emailSugerido && e.aTiempo
          : filtro === "sincontactar"
          ? !e.fechaContacto && !e.verificado
          : filtro === "pendientes"
          ? e.revisionPendiente
          : filtro === "sinverificar"
            ? !e.verificado && !e.revisionPendiente
            : filtro === "paradifundir"
              ? e.verificado && !e.difundido && !e.revisionPendiente
              : filtro === "paraconfirmar"
                ? e.verificado && !e.revisionPendiente && !e.fechaConfirmacion
                : true))
  );

  // El orden. "fecha" es el de siempre y sigue siendo el de arranque: la
  // pestaña se usa para saber a quién hay que escribirle antes.
  const orgsOrdenados = [...orgsFiltrados].sort((a, b) => {
    const texto = (x, y) => String(x || "").localeCompare(String(y || ""), "es");
    // Los que no tienen fecha van al final en los órdenes por fecha: son los
    // que hay que completar, no los más urgentes.
    const porFecha = (x, y) =>
      x.fechaInicio && y.fechaInicio
        ? x.fechaInicio.localeCompare(y.fechaInicio)
        : x.fechaInicio
          ? -1
          : y.fechaInicio
            ? 1
            : texto(x.nombre, y.nombre);
    if (orden === "fecha-desc") return porFecha(b, a);
    if (orden === "nombre") return texto(a.nombre, b.nombre);
    if (orden === "organizador") return texto(a.organizador, b.organizador);
    if (orden === "pais") return texto(a.pais, b.pais) || porFecha(a, b);
    if (orden === "estado") return texto(a.estado, b.estado) || porFecha(a, b);
    return porFecha(a, b);
  });

  // No se dibujan los cuatrocientos de una. Cada tarjeta trae botones, mails y
  // el bloque de correcciones; con la base entera la pantalla tarda en abrir y
  // el buscador se pone lento al tipear.
  const orgsVisibles = orgsOrdenados.slice(0, tope);

  // Los filtros que tienen sentido en cada pestaña.
  const filtros =
    seccion === "organizadores"
      ? [
          ["todos", "Todos"],
          ["listos", "Listos para escribir"],
          ["conmail", "Con mail"],
          ["pendientes", "Esperan tu OK"],
          ["sincontactar", "Sin escribir"],
          ["paraconfirmar", "Avisarles del sello"],
          ["paradifundir", "Para difundir"],
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
              : seccion === "mensaje"
                ? "Mensaje de primer contacto"
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
            : seccion === "mensaje"
              ? "El mail que sale la primera vez que le escribimos a un organizador"
              : `${orgs.length} eventos en la base · ${listos} con mail listos para escribir · ${sinContactar} sin verificar`}
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
          {listos ? <span>{listos} para escribir</span> : null}
        </button>
        <button
          type="button"
          className="adm-tab"
          data-on={seccion === "mensaje" ? "si" : "no"}
          onClick={() => {
            setSeccion("mensaje");
            if (!msj) cargarMensaje();
          }}
        >
          Mensaje
          {hayCambios ? <span>sin guardar</span> : null}
        </button>
        {/* El newsletter es una pagina aparte y no una pestaña: no comparte
            nada con estas y este archivo se toca seguido. Pero tenia que
            poder llegarse desde acá, que es donde uno está los miércoles. */}
        <a className="adm-tab adm-tab--link" href="/admin/newsletter">
          Newsletter<span>de la semana</span>
        </a>
      </div>

      {/* El link para el equipo. Va arriba de todo en esta pestaña porque es
          lo que se pega una vez en el grupo y después no se toca más. */}
      {seccion === "organizadores" && linkEquipo ? (
        <div className="adm-exportar">
          <span>
            Vista para el equipo: los verificados que faltan publicar.
          </span>
          <button
            type="button"
            onClick={() => copiar(linkEquipo, "equipo")}
          >
            {copiado === "equipo" ? "Copiado" : "Copiar el link"}
          </button>
          <a
            className="adm-btn adm-btn--sec"
            href={linkEquipo}
            target="_blank"
            rel="noopener"
          >
            Abrirla
          </a>
        </div>
      ) : null}

      {seccion === "organizadores" && listos > 0 ? (
        <div className="adm-exportar">
          <span>
            {listos} evento{listos === 1 ? "" : "s"} con mail y con tiempo.
          </span>
          <button
            type="button"
            className="adm-btn"
            onClick={() =>
              copiar(
                JSON.stringify(
                  orgs
                    .filter(
                      (e) =>
                        !e.fechaContacto &&
                        !e.verificado &&
                        e.emailSugerido &&
                        e.aTiempo
                    )
                    .map((e) => ({
                      nombre: e.nombre,
                      email: e.emailSugerido,
                      link: e.link,
                      ficha: e.ficha,
                      fechas: e.fechas,
                      organizador: e.organizador,
                      semana: e.semana,
                    })),
                  null,
                  1
                ),
                "exportar"
              )
            }
          >
            {copiado === "exportar"
              ? "Copiado"
              : "Copiar los datos para armar los borradores"}
          </button>
        </div>
      ) : null}

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
      ) : seccion === "mensaje" ? (
        <>
          {/* Cuál de los dos mails se está editando. Son circuitos distintos:
              el primero pide que revisen la ficha, el segundo avisa que el
              sello quedó puesto. */}
          {listaMsj.length > 1 ? (
            <div className="adm-filtros">
              {listaMsj.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className="chip"
                  data-on={cualMsj === m.id ? "si" : "no"}
                  title={m.ayuda}
                  onClick={() => {
                    if (
                      hayCambios &&
                      !confirm(
                        "Hay cambios sin guardar en este mensaje. ¿Cambiar igual y perderlos?"
                      )
                    )
                      return;
                    cargarMensaje(m.id);
                  }}
                >
                  {m.titulo}
                </button>
              ))}
            </div>
          ) : null}
          {avisoMsj ? <div className="adm-vacio">{avisoMsj}</div> : null}
          {cargandoMsj || !msj ? (
            <div className="adm-vacio">Cargando el mensaje…</div>
          ) : (
            <>
              <div className="adm-msj">
                {msj.map((c, i) => (
                  <label className="adm-campo" key={c.id}>
                    <span className="adm-campo__tit">{c.titulo}</span>
                    <span className="adm-campo__ayuda">{c.ayuda}</span>
                    <textarea
                      className="adm-campo__caja"
                      rows={c.valor.length > 120 ? 4 : 2}
                      value={c.valor}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMsj((prev) =>
                          prev.map((x, j) => (j === i ? { ...x, valor: v } : x))
                        );
                      }}
                    />
                    <span className="adm-campo__pie">
                      {c.marcas.length ? (
                        <>
                          Se reemplazan solas:{" "}
                          {c.marcas.map((m) => (
                            <code key={m}>{m}</code>
                          ))}
                        </>
                      ) : (
                        "Sin datos automáticos."
                      )}
                      {c.valor.trim() !== c.porDefecto.trim() ? (
                        <button
                          type="button"
                          className="adm-volver"
                          onClick={() =>
                            setMsj((prev) =>
                              prev.map((x, j) =>
                                j === i ? { ...x, valor: x.porDefecto } : x
                              )
                            )
                          }
                        >
                          volver al original
                        </button>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>

              <div className="adm-exportar">
                <span>
                  {hayCambios
                    ? "Hay cambios sin guardar."
                    : "Sin cambios sin guardar."}
                </span>
                <button type="button" onClick={() => verPrevia()}>
                  Ver cómo queda
                </button>
                <button
                  type="button"
                  onClick={guardarMensaje}
                  disabled={!hayCambios || guardandoMsj}
                >
                  {guardandoMsj ? "Guardando…" : "Guardar"}
                </button>
              </div>

              {previa ? (
                <div className="adm-previa">
                  <div className="adm-previa__barra">
                    <span>Así le llega a</span>
                    <select
                      value={conQue}
                      onChange={(e) => verPrevia(e.target.value)}
                    >
                      {previa.opciones.map((o) => (
                        <option value={o.slug} key={o.slug}>
                          {o.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-previa__asunto">
                    <strong>Asunto:</strong> {previa.asunto}
                    <span className="adm-campo__ayuda">
                      {previa.asunto.length} caracteres
                      {previa.asunto.length > 78
                        ? " — se va a cortar en la bandeja de entrada"
                        : ""}
                    </span>
                  </div>
                  {/* El mail de verdad, no una aproximacion: lo arma la misma
                      funcion que lo manda. Va en un iframe para que sus
                      estilos no se mezclen con los del panel. */}
                  <iframe
                    className="adm-previa__mail"
                    title="Vista previa del mail"
                    srcDoc={previa.html}
                  />
                  <details className="adm-previa__texto">
                    <summary>Ver la versión sin formato</summary>
                    <pre>{previa.texto}</pre>
                  </details>
                </div>
              ) : null}
            </>
          )}
        </>
      ) : seccion === "organizadores" ? (
        <>
          {!hayFirma ? (
            <div className="adm-vacio">
              Falta cargar AGENDA_FIRMA_SECRET en Vercel: sin esa clave no se
              pueden armar los links de confirmación.
            </div>
          ) : null}
          <div className="adm-cols">
            {[
              ["Cuándo", fCuando, setFCuando, [
                ["proximos", "Próximos"],
                ["pasados", "Ya pasaron"],
                ["todos", "Todos"],
              ], false],
              ["Estado", fEstado, setFEstado, opcionesDe("estado"), true],
              ["Tipo", fTipo, setFTipo, opcionesDe("tipo"), true],
              ["País", fPais, setFPais, opcionesDe("pais"), true],
              ["Provincia", fProvincia, setFProvincia, opcionesDe("provincia"), true],
              ["Fechas", fFechas, setFFechas, opcionesDe("estadoFechas"), true],
            ].map(([rotulo, valor, poner, opciones, conTodos]) => (
              <label className="adm-col" key={rotulo}>
                <span>{rotulo}</span>
                <select
                  value={valor}
                  onChange={(e) => {
                    poner(e.target.value);
                    // Al cambiar un filtro se vuelve al principio: si no, se
                    // queda mostrando "60 de 3" y parece que faltan.
                    setTope(POR_TANDA);
                  }}
                >
                  {conTodos ? <option value="">Todos</option> : null}
                  {opciones.map((o) =>
                    Array.isArray(o) ? (
                      <option key={o[0]} value={o[0]}>
                        {o[1]}
                      </option>
                    ) : (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    )
                  )}
                </select>
              </label>
            ))}
            <label className="adm-col">
              <span>Ordenar por</span>
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="fecha">Fecha, la más cercana arriba</option>
                <option value="fecha-desc">Fecha, la más lejana arriba</option>
                <option value="nombre">Nombre</option>
                <option value="organizador">Organizador</option>
                <option value="pais">País</option>
                <option value="estado">Estado</option>
              </select>
            </label>
            {fEstado || fTipo || fPais || fProvincia || fFechas || fCuando !== "proximos" || filtro !== "todos" || busca ? (
              <button
                type="button"
                className="adm-btn adm-btn--sec"
                onClick={() => {
                  setFEstado("");
                  setFTipo("");
                  setFPais("");
                  setFProvincia("");
                  setFFechas("");
                  setFCuando("proximos");
                  setFiltro("todos");
                  setBusca("");
                  setTope(POR_TANDA);
                }}
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>

          <p className="adm-conteo">
            {orgsOrdenados.length === orgs.length
              ? `${orgs.length} eventos`
              : `${orgsOrdenados.length} de ${orgs.length} eventos`}
            {orgsVisibles.length < orgsOrdenados.length
              ? ` · mostrando los primeros ${orgsVisibles.length}`
              : ""}
          </p>

          {orgsOrdenados.length === 0 ? (
            <div className="adm-vacio">
              {orgs.length === 0
                ? "No hay eventos en la agenda. Si Airtable no responde, probá «Actualizar desde Airtable» acá arriba."
                : "Ningún evento coincide con los filtros. Probá «Limpiar filtros»."}
            </div>
          ) : (
            <div className="adm-lista">
              {orgsVisibles.map((ev) => {
                const estado = ev.revisionPendiente
                  ? "espera"
                  : ev.difundido
                    ? "difundido"
                    : ev.verificado
                      ? "verificado"
                      : "pendiente";
                return (
                  <article className="adm-item org" key={ev.id || ev.slug}>
                    <div className="org-cab">
                      <div>
                        <h3>{ev.nombre}</h3>
                        <div className="org-meta">
                          {/* El estado solo se nombra cuando NO es el normal:
                              con la base entera a la vista hay que poder
                              distinguir de un vistazo un borrador que nadie
                              miró de un evento publicado. */}
                          {ev.estado && ev.estado !== "Aprobado" ? (
                            <span className="org-badge">{ev.estado}</span>
                          ) : null}
                          {ev.fechas}
                          {ev.organizador ? ` · ${ev.organizador}` : ""}
                          {/* La cuenta regresiva sabe contar para atrás.
                              Decía "en -12 días" desde que el panel muestra
                              también los eventos que ya pasaron. */}
                          {typeof ev.dias === "number"
                            ? ev.dias > 0
                              ? ` · en ${ev.dias} día${ev.dias === 1 ? "" : "s"}`
                              : ev.dias === 0
                                ? " · es hoy"
                                : ` · hace ${-ev.dias} día${ev.dias === -1 ? "" : "s"}`
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
                        <strong>
                          {ev.correccionesRecortadas
                            ? "Lo último que pidió corregir:"
                            : "Pidió corregir:"}
                        </strong>{" "}
                        {ev.correcciones}
                        {ev.correccionesRecortadas ? (
                          <span className="org-mas">
                            {" "}
                            Hay respuestas anteriores; el historial completo
                            está en el editor.
                          </span>
                        ) : null}
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
                              `semana-${ev.id || ev.slug}`
                            )
                          }
                        >
                          {copiado === `semana-${ev.id || ev.slug}`
                            ? "Copiado"
                            : "Copiar la lista"}
                        </button>
                      </div>
                    ) : null}

                    {!ev.verificado && !ev.revisionPendiente ? (
                      <div
                        className="org-invitar"
                        data-sinmail={ev.emailSugerido ? "no" : "si"}
                      >
                        <input
                          type="email"
                          className="org-mail"
                          value={paraQuien[ev.id || ev.slug] ?? ev.emailSugerido ?? ""}
                          onChange={(e) =>
                            setParaQuien((p) => ({ ...p, [ev.id || ev.slug]: e.target.value }))
                          }
                          placeholder="mail del organizador"
                        />
                        <button
                          type="button"
                          className="adm-btn"
                          disabled={invitando.has(ev.id || ev.slug)}
                          onClick={() => invitar(ev)}
                        >
                          {invitando.has(ev.id || ev.slug)
                            ? "Enviando…"
                            : ev.fechaContacto
                              ? "Volver a enviar"
                              : "Enviar la invitación"}
                        </button>
                        {ev.fechaContacto ? (
                          <span className="org-enviado">
                            Enviado el {ev.fechaContacto}
                          </span>
                        ) : !ev.emailSugerido ? (
                          <span className="org-enviado">
                            No tenemos su mail: buscalo y pegalo acá
                          </span>
                        ) : null}

                        {/* Si en la ficha hay más de un mail, se ofrecen
                            todos: el primero no siempre es el que sirve. */}
                        {ev.emailsSugeridos && ev.emailsSugeridos.length > 1 ? (
                          <div className="org-mails">
                            {ev.emailsSugeridos.map((m) => (
                              <button
                                key={m}
                                type="button"
                                className="org-chip"
                                data-on={
                                  (paraQuien[ev.id || ev.slug] ?? ev.emailSugerido) === m
                                    ? "si"
                                    : "no"
                                }
                                onClick={() =>
                                  setParaQuien((p) => ({ ...p, [ev.id || ev.slug]: m }))
                                }
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        {ev.contactos ? (
                          <div className="org-contactos">
                            <span>Contactos de la ficha:</span> {ev.contactos}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="org-acciones">
                      {ev.link ? (
                        <button
                          type="button"
                          className="adm-btn adm-btn--sec"
                          onClick={() => copiar(ev.link, `link-${ev.id || ev.slug}`)}
                        >
                          {copiado === `link-${ev.id || ev.slug}`
                            ? "Copiado"
                            : "Copiar link de confirmación"}
                        </button>
                      ) : null}

                      {ev.revisionPendiente ? (
                        <>
                          <button
                            type="button"
                            className="adm-btn"
                            disabled={aprobando === (ev.id || ev.slug)}
                            onClick={() => aprobar(ev, true)}
                          >
                            {aprobando === (ev.id || ev.slug) ? "Guardando…" : "Dar el OK"}
                          </button>
                          {/* Saca el "espera tu OK" sin encender el sello: ya
                              lo miramos y no hay nada que aplicar. Se llamaba
                              "Descartar", que se confundía con sacar el evento
                              de la agenda, que es otra cosa y está más abajo. */}
                          <button
                            type="button"
                            className="adm-btn adm-btn--sec"
                            disabled={aprobando === (ev.id || ev.slug)}
                            onClick={() => aprobar(ev, false)}
                          >
                            Marcar como visto
                          </button>
                        </>
                      ) : null}

                      {/* El sello a mano. El botón de arriba solo aparece si el
                          organizador respondió por el link, y la mayoría
                          confirma por mail, por teléfono o por WhatsApp: sin
                          esto había que entrar a Airtable cada vez. Se puede
                          apagar, así un click de más se arregla acá. */}
                      {!ev.revisionPendiente ? (
                        <button
                          type="button"
                          className={ev.verificado ? "adm-btn adm-btn--sec" : "adm-btn"}
                          disabled={aprobando === (ev.id || ev.slug)}
                          onClick={() => marcarVerificado(ev, !ev.verificado)}
                        >
                          {aprobando === (ev.id || ev.slug)
                            ? "Guardando…"
                            : ev.verificado
                              ? "Sacar el sello"
                              : "Marcar verificado"}
                        </button>
                      ) : null}

                      {/* El segundo mail. Va antes del de difusión porque es
                          antes en el circuito: primero se le avisa que el
                          sello quedó puesto, y días después que ya salió en
                          las redes. Sin esto, el que confirma sus datos no
                          recibe nada hasta que posteamos. */}
                      {ev.verificado && !ev.revisionPendiente ? (
                        <button
                          type="button"
                          className={
                            ev.fechaConfirmacion
                              ? "adm-btn adm-btn--sec"
                              : "adm-btn"
                          }
                          disabled={confirmando.has(ev.id || ev.slug)}
                          onClick={() => confirmar(ev)}
                        >
                          {confirmando.has(ev.id || ev.slug)
                            ? "Mandando…"
                            : ev.fechaConfirmacion
                              ? `Avisado el ${ev.fechaConfirmacion}`
                              : "Avisarle del sello"}
                        </button>
                      ) : null}

                      {ev.verificado && !ev.difundido && !ev.revisionPendiente ? (
                        <button
                          type="button"
                          className="adm-btn adm-btn--sec"
                          disabled={difundiendo === (ev.id || ev.slug)}
                          onClick={() => marcarDifundido(ev)}
                        >
                          {difundiendo === (ev.id || ev.slug)
                            ? "Guardando…"
                            : "Ya lo difundimos"}
                        </button>
                      ) : null}

                      {/* Editar los datos sin salir del panel. Antes de esto,
                          aplicar lo que pedía el organizador era ir a Airtable,
                          buscar el registro y traducir a mano su respuesta a
                          los campos de la base. */}
                      <button
                        type="button"
                        className="adm-btn adm-btn--sec"
                        onClick={() => abrirFicha(ev)}
                      >
                        {fichaAbierta === (ev.id || ev.slug)
                          ? "Cerrar los datos"
                          : ev.correcciones
                            ? "Editar los datos ✏️"
                            : "Editar los datos"}
                      </button>

                      {/* La ficha pública existe recién cuando el evento
                          está aprobado. En un borrador o un archivado el botón
                          llevaba a un 404. */}
                      {ev.ficha ? (
                        <a
                          className="adm-btn adm-btn--sec"
                          href={ev.ficha}
                          target="_blank"
                          rel="noopener"
                        >
                          Ver la ficha
                        </a>
                      ) : (
                        <span className="adm-btn adm-btn--sec" data-inerte="si">
                          Sin ficha pública ({ev.estado || "sin estado"})
                        </span>
                      )}

                      {/* Va último y en rojo porque es el único botón de esta
                          tarjeta que saca algo de la web. No borra: archiva. */}
                      <button
                        type="button"
                        className="adm-btn adm-btn--peligro"
                        disabled={sacando === (ev.id || ev.slug)}
                        onClick={() => sacarDeLaAgenda(ev)}
                      >
                        {sacando === (ev.id || ev.slug) ? "Sacando…" : "Sacar de la agenda"}
                      </button>
                    </div>

                    {fichaAbierta === (ev.id || ev.slug) ? (
                      <div className="org-editor">
                        {fichaCargando ? (
                          <p className="org-nota">Trayendo los datos…</p>
                        ) : !ficha ? (
                          <p className="adm-msg adm-msg--mal">
                            {fichaMsj?.texto || "No se pudo abrir la ficha."}
                          </p>
                        ) : (
                          <>
                            {ficha.verificado ? (
                              <p className="org-aviso">
                                Ojo: esta ficha ya tiene el sello. Si cambiás
                                algo que el organizador no pidió, el sello queda
                                diciendo que confirmó un dato que nunca vio.
                              </p>
                            ) : null}

                            {ficha.propuestas?.length ? (
                              <div className="org-propuestas">
                                <span className="org-rotulo">
                                  Lo que pidió corregir
                                  {ficha.fecha ? ` · ${ficha.fecha}` : ""}
                                </span>
                                {ficha.propuestas.map((p, i) => (
                                  <div className="org-prop" key={`${p.rotulo}-${i}`}>
                                    <div className="org-prop__que">{p.rotulo}</div>
                                    {p.dice ? (
                                      <div className="org-prop__dice">{p.dice}</div>
                                    ) : null}
                                    <div className="org-prop__nuevo">{p.propuesto}</div>
                                    {p.destino ? (
                                      <button
                                        type="button"
                                        className="adm-btn adm-btn--sec"
                                        onClick={() =>
                                          aplicarPropuesta(p.destino, p.propuesto)
                                        }
                                      >
                                        Aplicar
                                      </button>
                                    ) : (
                                      <span className="org-nota">
                                        Este no se puede aplicar solo: cargalo a
                                        mano en los campos de abajo.
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {ficha.confirmados?.length ? (
                                  <p className="org-nota">
                                    Confirmó que están bien:{" "}
                                    {ficha.confirmados.join(", ")}.
                                  </p>
                                ) : null}
                              </div>
                            ) : ficha.correccionesTexto ? (
                              // Si el formato no se pudo leer, se muestra crudo:
                              // es lo que se veía antes y no se pierde nada.
                              <div className="org-correcciones">
                                <strong>Respondió esto:</strong>{" "}
                                {ficha.correccionesTexto}
                              </div>
                            ) : null}

                            {ficha.campos.map((c) => {
                              const id = `f-${ev.id || ev.slug}-${c.clave}`;
                              const valor = fichaValores[c.clave] ?? "";
                              return (
                                <div className="adm-campo" key={c.clave}>
                                  <label htmlFor={id}>{c.rotulo}</label>
                                  {c.tipo === "select" ? (
                                    <select
                                      id={id}
                                      value={valor}
                                      onChange={(e) =>
                                        aplicarPropuesta(c.clave, e.target.value)
                                      }
                                    >
                                      <option value="">— sin cargar —</option>
                                      {c.opciones.map((o) => (
                                        <option key={o} value={o}>
                                          {o}
                                        </option>
                                      ))}
                                    </select>
                                  ) : c.tipo === "area" ? (
                                    <textarea
                                      id={id}
                                      value={valor}
                                      onChange={(e) =>
                                        aplicarPropuesta(c.clave, e.target.value)
                                      }
                                    />
                                  ) : (
                                    <input
                                      id={id}
                                      type={c.tipo === "fecha" ? "date" : "text"}
                                      value={valor}
                                      onChange={(e) =>
                                        aplicarPropuesta(c.clave, e.target.value)
                                      }
                                    />
                                  )}
                                  {c.ayuda ? (
                                    <p className="adm-ayuda">{c.ayuda}</p>
                                  ) : null}
                                </div>
                              );
                            })}

                            <div className="adm-acciones">
                              <button
                                type="button"
                                className="adm-btn adm-btn--pub"
                                disabled={fichaGuardando}
                                onClick={() => guardarFicha(ev)}
                              >
                                {fichaGuardando
                                  ? "Guardando…"
                                  : "Guardar los cambios"}
                              </button>
                              <button
                                type="button"
                                className="adm-btn adm-btn--sec"
                                onClick={() => abrirFicha(ev)}
                              >
                                Cerrar
                              </button>
                              {fichaMsj ? (
                                <span
                                  className={`adm-msg ${fichaMsj.ok ? "adm-msg--ok" : "adm-msg--mal"}`}
                                >
                                  {fichaMsj.texto}
                                </span>
                              ) : null}
                            </div>
                            <p className="adm-ayuda">
                              El logo no se edita acá: es una imagen y va cargada
                              en Airtable.
                            </p>
                          </>
                        )}
                      </div>
                    ) : null}

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
              {orgsVisibles.length < orgsOrdenados.length ? (
                <button
                  type="button"
                  className="adm-btn adm-btn--sec"
                  onClick={() => setTope((t) => t + POR_TANDA)}
                >
                  Ver {Math.min(POR_TANDA, orgsOrdenados.length - orgsVisibles.length)} más
                  {" "}(quedan {orgsOrdenados.length - orgsVisibles.length})
                </button>
              ) : null}
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
