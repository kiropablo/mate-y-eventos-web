"use client";

import { useEffect, useMemo, useState } from "react";
import { SITE } from "../../lib/site";
import { pasaFiltros, pelado } from "../../lib/agenda";

// Armador de la suscripción: elegís qué querés recibir y te da la URL,
// el botón de Google y el de Apple/Outlook, todo actualizado en vivo.
//
// Los filtros son acumulativos, igual que en /agenda: podés suscribirte a
// varios países o varios tipos de evento a la vez.

const HOST = SITE.url.replace(/^https?:\/\//, "");

export default function SuscribirCalendario({ eventos, tipos: tiposDisponibles, paises: paisesDisponibles }) {
  const [tipos, setTipos] = useState([]);
  const [paises, setPaises] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [copiado, setCopiado] = useState(false);

  // Las provincias que se ofrecen dependen de los países elegidos.
  const provinciasDisponibles = useMemo(
    () =>
      unicos(
        eventos
          .filter((e) => paises.length === 0 || estaEn(e.pais, paises))
          .map((e) => e.provincia)
      ),
    [eventos, paises]
  );

  const seleccion = { tipos, paises, provincias };
  const cuantos = eventos.filter((e) => pasaFiltros(e, seleccion)).length;

  // Un identificador al azar POR SUSCRIPCIÓN, generado en el navegador de
  // quien se suscribe. No identifica a una persona: identifica a una
  // suscripción, como el número de un abono. No sale de ningún dato del
  // visitante y no se guarda nada del lado de él.
  //
  // Existe por dos razones concretas:
  //
  // 1. Sin esto no hay forma de contar suscripciones. El feed se cachea una
  //    hora en el CDN, así que dos personas suscritas al mismo filtro
  //    comparten una sola respuesta y la segunda nunca llega al servidor. Lo
  //    único medible serían "consultas", que no es lo mismo que "cuánta gente
  //    tiene esto en su calendario".
  // 2. Permite saber cuáles siguen vivas: un calendario que dejó de consultar
  //    hace un mes es alguien que se dio de baja.
  //
  // Se genera una vez por sesión del armador: si tocás otro filtro la URL
  // cambia, pero el identificador queda, porque sigue siendo la misma persona
  // armando la misma suscripción.
  // ARRANCA VACÍO Y SE LLENA AL MONTAR, y esto no es un detalle de estilo.
  //
  // Generarlo en el inicializador de useState parecía alcanzar y no alcanzaba:
  // ese inicializador también corre en el servidor, y esta página se sirve
  // desde una copia cacheada. El identificador quedaba escrito DENTRO del HTML
  // y era el mismo para todos. Comprobado en producción el 23/10/2026: tres
  // pedidos seguidos devolvieron s=2r6d3p2om7i9. El panel cuenta suscripciones
  // por sid distinto, así que todas las personas que se suscribieran en una
  // misma hora contaban como una sola. El número daba chico y creíble, que es
  // la peor forma de estar mal.
  //
  // Arrancar vacío además evita que el primer dibujo del cliente difiera del
  // del servidor: hasta que monta, el link es la suscripción sin identificar,
  // que funciona igual, solo que no se cuenta.
  const [sid, setSid] = useState("");

  useEffect(() => {
    // Sin prefijo, a propósito: los que salen de una ficha llevan "f-" y así
    // un LIKE 'f-%' separa los dos orígenes sin tocar el panel.
    setSid(Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4));
  }, []);

  const ruta = useMemo(() => {
    const q = new URLSearchParams();
    tipos.forEach((t) => q.append("tipo", t));
    paises.forEach((p) => q.append("pais", p));
    provincias.forEach((p) => q.append("provincia", p));
    // Mientras no montó todavía no hay identificador: se manda sin él antes
    // que mandar uno vacío, que el panel guardaría como un sid más.
    if (sid) q.append("s", sid);
    return `/api/agenda/ics?${q.toString()}`;
  }, [tipos, paises, provincias, sid]);

  const urlHttps = `${SITE.url}${ruta}`;
  const urlWebcal = `webcal://${HOST}${ruta}`;
  const urlGoogle = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(urlWebcal)}`;

  const hayFiltros = tipos.length || paises.length || provincias.length;

  // Suma o saca un valor de una lista de filtros. Siempre con la forma
  // funcional: si leyera la lista del render actual, dos clics seguidos
  // antes de que React vuelva a dibujar perderían uno.
  const alternar = (poner) => (valor) => {
    if (!valor) return;
    poner((previa) =>
      previa.some((v) => pelado(v) === pelado(valor))
        ? previa.filter((v) => pelado(v) !== pelado(valor))
        : [...previa, valor]
    );
  };

  const alternarTipo = alternar(setTipos);
  const alternarPais = alternar(setPaises);
  const alternarProvincia = alternar(setProvincias);

  // Si cambian los países, se caen solas las provincias que ya no
  // corresponden.
  useEffect(() => {
    setProvincias((previas) => {
      const validas = previas.filter((p) =>
        provinciasDisponibles.some((d) => pelado(d) === pelado(p))
      );
      return validas.length === previas.length ? previas : validas;
    });
  }, [provinciasDisponibles]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(urlHttps);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <>
      <div className="sus-caja reveal">
        <h2 className="ev-h2" style={{ marginTop: 0 }}>
          1. Elegí qué querés seguir
        </h2>
        <p className="sus-ayuda">
          Si no tocás nada, te suscribís a la agenda completa. Podés marcar
          varios tipos, países y provincias a la vez: se suman entre ellos.
        </p>

        <div className="ag-chips" style={{ marginTop: "18px" }} role="group" aria-label="Filtrar por tipo de evento">
          {tiposDisponibles.map((t) => {
            const puesto = tipos.some((v) => pelado(v) === pelado(t));
            return (
              <button
                key={t}
                className={puesto ? "chip chip--on" : "chip"}
                aria-pressed={puesto}
                onClick={() => alternarTipo(t)}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="ag-selects" style={{ marginTop: "14px" }}>
          <select
            className="ag-select"
            value=""
            aria-label="Agregar un país al filtro"
            onChange={(e) => alternarPais(e.target.value)}
          >
            <option value="">
              {paises.length ? "Agregar otro país…" : "Todos los países"}
            </option>
            {paisesDisponibles
              .filter((p) => !paises.some((v) => pelado(v) === pelado(p)))
              .map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>
          <select
            className="ag-select"
            value=""
            aria-label="Agregar una provincia o región al filtro"
            onChange={(e) => alternarProvincia(e.target.value)}
          >
            <option value="">
              {provincias.length
                ? "Agregar otra provincia…"
                : "Todas las provincias"}
            </option>
            {provinciasDisponibles
              .filter((p) => !provincias.some((v) => pelado(v) === pelado(p)))
              .map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
          </select>
          {hayFiltros ? (
            <button
              className="chip chip--limpiar"
              onClick={() => {
                setTipos([]);
                setPaises([]);
                setProvincias([]);
              }}
            >
              ✕ Borrar filtros
            </button>
          ) : null}
        </div>

        {paises.length > 0 || provincias.length > 0 ? (
          <div className="ag-elegidos" role="group" aria-label="Filtros de lugar puestos">
            {paises.map((p) => (
              <button
                key={`pa-${p}`}
                className="chip chip--on"
                aria-label={`Quitar el país ${p}`}
                onClick={() => alternarPais(p)}
              >
                {p} ✕
              </button>
            ))}
            {provincias.map((p) => (
              <button
                key={`pr-${p}`}
                className="chip chip--on"
                aria-label={`Quitar la provincia ${p}`}
                onClick={() => alternarProvincia(p)}
              >
                {p} ✕
              </button>
            ))}
          </div>
        ) : null}

        <p className="sus-cuenta">
          {cuantos === 0
            ? "Ningún evento con estos filtros — probá con menos."
            : `${cuantos} ${cuantos === 1 ? "evento" : "eventos"} en tu calendario`}
        </p>
      </div>

      <div className="sus-caja reveal" style={{ transitionDelay: ".05s" }}>
        <h2 className="ev-h2" style={{ marginTop: 0 }}>
          2. Agregalo a tu calendario
        </h2>

        <div className="sus-botones">
          <a
            className="btn"
            href={urlGoogle}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Calendar
          </a>
          <a className="btn btn--ghost" href={urlWebcal}>
            Apple Calendario / Outlook
          </a>
        </div>

        <p className="sus-ayuda" style={{ marginTop: "22px" }}>
          ¿Preferís hacerlo a mano? Copiá esta dirección y pegala donde tu
          calendario pida “agregar desde una URL”.
        </p>

        <div className="sus-url">
          <code>{urlHttps}</code>
          <button className="chip" onClick={copiar}>
            {copiado ? "✓ Copiada" : "Copiar"}
          </button>
        </div>
      </div>
    </>
  );
}

function unicos(lista) {
  return [...new Set(lista.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function estaEn(valor, elegidos) {
  if (!elegidos || elegidos.length === 0) return true;
  return elegidos.some((e) => pelado(e) === pelado(valor));
}
