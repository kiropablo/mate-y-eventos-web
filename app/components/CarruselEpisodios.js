"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// Los últimos episodios, sobre un cilindro.
//
// Cómo está armado y por qué: el HTML es una tira de links con su miniatura y
// su título, que sin JavaScript funciona como un carrusel horizontal común y
// corriente. El 3D se enciende encima, después de montar. Así Google, los
// lectores de pantalla y cualquiera con JS caído ven episodios de verdad y no
// un lienzo vacío, que es lo que pasa cuando esto se hace con WebGL.
//
// El giro NO secuestra la rueda del mouse hacia abajo: scrollear tiene que
// seguir bajando la página, que es lo que espera cualquiera al entrar. Se mueve
// arrastrando, con las flechas del teclado, con los botones, o con un gesto
// horizontal de trackpad —que es intencional y no se confunde con bajar.

const PASO = 26; // grados entre un panel y el siguiente
const SEPARACION = 22; // px de aire entre panel y panel, medidos sobre el arco

// Dónde descansa la cinta al abrir.
//
// No en cero. Con la cinta en cero queda un panel exactamente de frente, y un
// panel de frente no se deforma: las dos mitades se van para atrás por igual y
// se ve plano. Corrida un tercio de panel aparece de entrada lo que se ve en
// la referencia — lo de la izquierda cerca de la cara, lo de la derecha
// yéndose al fondo— sin que haga falta tocar nada.
const ARRANQUE = 0.34;

// En cuántas tajadas verticales se corta cada miniatura.
//
// CSS no sabe doblar una imagen. Para que el panel se flexione como una cinta
// —y no quede una chapa plana girada, que es lo que se veía— se lo parte en
// tajadas y cada una se gira un poquito: la suma de las tajadas dibuja la
// curva. Nueve alcanza para que el ojo lea una superficie continua; con más,
// se multiplican las capas que tiene que componer el navegador.
const TAJADAS = 9;
const SUAVE = 0.11; // cuánto se acerca por cuadro a su destino

// Cuánto se corre la tira de un panel al siguiente. Se mide del DOM y no se
// calcula: el ancho del panel no alcanza, porque entre uno y otro hay una
// separación, y suponiéndola el contador se iba desfasando.
function pasoDeLaTira(items) {
  const a = items[0];
  const b = items[1];
  if (!a) return 0;
  return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
}

// La distancia de un panel al centro, dando la vuelta por el lado más corto.
// Con esto el carrusel es un anillo: nunca hay un costado vacío, que es lo
// que le da el aire de la referencia.
function distancia(i, pos, cuantos) {
  let d = (((i - pos) % cuantos) + cuantos) % cuantos;
  if (d > cuantos / 2) d -= cuantos;
  return d;
}

export default function CarruselEpisodios({ episodios = [] }) {
  const cajaRef = useRef(null);
  const pistaRef = useRef(null);
  const panelRef = useRef(null);

  // La posición es continua (2.4 = entre el tercero y el cuarto) para que el
  // movimiento sea fluido; el destino es al que tiende.
  const pos = useRef(ARRANQUE);
  const destino = useRef(ARRANQUE);
  const cuadro = useRef(0);
  const arrastre = useRef(null);
  const quieto = useRef(null);
  const items = useRef([]);

  const [activo, setActivo] = useState(false);
  const [centro, setCentro] = useState(0);
  // El mismo dato en un ref, para poder leerlo desde los manejadores sin
  // rearmarlos en cada cambio.
  const activoRef = useRef(false);
  activoRef.current = activo;

  const cuantos = episodios.length;

  const irA = useCallback(
    (n) => {
      destino.current = n;
      const cual = (((Math.round(n) % cuantos) + cuantos) % cuantos) || 0;
      setCentro(cual);
      // En modo tira no hay cilindro que girar: se corre el scroll horizontal,
      // que si no las flechas cambiaban el contador y nada más. Se mueve la
      // pista y no scrollIntoView, que además de la tira empuja la página.
      if (!activoRef.current && pistaRef.current) {
        const paso = pasoDeLaTira(items.current);
        if (paso) {
          pistaRef.current.scrollTo({ left: cual * paso, behavior: "smooth" });
        }
      }
    },
    [cuantos]
  );

  // El radio del cilindro sale del ancho real del panel: con paso fijo, si el
  // radio no acompaña al ancho los paneles se encinan o se separan. Se recalcula
  // al cambiar el tamaño de la ventana.
  // Cuánto se dobla el panel en la tira, donde no hay cilindro del que sacar
  // el arco. Es una flexión suave: la cinta se nota sin que el video se
  // deforme al punto de molestar.
  const ARCO_TIRA = 16;

  const medir = useCallback(() => {
    const caja = cajaRef.current;
    const panel = panelRef.current;
    if (!caja || !panel) return;
    // offsetWidth y no getBoundingClientRect: el panel ya tiene el giro 3D
    // encima, y el rect devuelve la caja PROYECTADA, no el ancho real. Con el
    // rect el radio salía 645px en vez de 1390 y los paneles se encimaban.
    const ancho = panel.offsetWidth;
    if (!ancho) return;

    // El arco de la cinta. Con cilindro sale de la propia curva del cilindro,
    // para que los paneles se lean como una sola tira continua; sin cilindro
    // —en celular— es una flexión suave y fija.
    let arco = ARCO_TIRA;

    if (activoRef.current) {
      // El radio que hace que dos paneles vecinos queden separados por
      // SEPARACION. Sin el aire quedaban pegados y parecían una tira sola.
      const radio = (ancho + SEPARACION) / 2 / Math.tan((PASO * Math.PI) / 360);
      caja.style.setProperty("--radio", `${Math.round(radio)}px`);
      // Cuanto más cerca está el ojo, más se acuestan los paneles de los
      // costados. Con 0.85 quedaban casi de frente y no se leía la curva.
      caja.style.setProperty("--perspectiva", `${Math.round(radio * 0.7)}px`);
      // El 2.3 exagera: con el arco justo la flexión casi no se nota, y lo
      // que se quiere es que se lea.
      arco = (ancho / radio) * (180 / Math.PI) * 2.8;
      // Una perspectiva suave: en la referencia los paneles se acuestan sin
      // llegar a deformarse. Con 0.7 quedaba demasiado teatral.
      caja.style.setProperty("--perspectiva", `${Math.round(radio * 0.95)}px`);
    }

    // Las tajadas se calculan SIEMPRE. Cuando no se calculaban en la tira,
    // quedaban con los valores de respaldo del CSS y el video salía con las
    // costuras a la vista, partido en nueve pedazos mal pegados.
    const pasoTajada = arco / TAJADAS;
    const radioTajada =
      ancho / TAJADAS / 2 / Math.tan((pasoTajada * Math.PI) / 360);
    caja.style.setProperty("--tajadas", String(TAJADAS));
    caja.style.setProperty("--paso-tajada", `${pasoTajada.toFixed(3)}deg`);
    caja.style.setProperty("--radio-tajada", `${Math.round(radioTajada)}px`);
  }, []);

  useEffect(() => {
    if (episodios.length === 0) return undefined;

    // El 3D solo con mouse y pantalla grande. En celular el scroll horizontal
    // nativo se siente mejor que un arrastre hecho a mano, y encima no pelea
    // con el gesto de bajar la página.
    const puede = window.matchMedia(
      "(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    const decidir = () => setActivo(puede.matches);
    decidir();
    puede.addEventListener("change", decidir);
    return () => puede.removeEventListener("change", decidir);
  }, [episodios.length]);

  // La medición corre en los dos modos: la cinta se dobla también en celular.
  useEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [medir, activo]);

  useEffect(() => {
    if (!activo) return undefined;

    const dibujar = () => {
      pos.current += (destino.current - pos.current) * SUAVE;
      if (Math.abs(destino.current - pos.current) < 0.0004) {
        pos.current = destino.current;
      }
      // Cada panel se ubica por su distancia al centro y no por un índice
      // fijo: así el que se va por un lado reaparece por el otro.
      for (let i = 0; i < items.current.length; i++) {
        const el = items.current[i];
        if (!el) continue;
        const d = distancia(i, pos.current, cuantos);
        const lejos = Math.abs(d);
        el.style.transform = `rotateY(${(d * PASO).toFixed(3)}deg) translateZ(var(--radio))`;
        el.style.opacity = lejos < 0.5 ? "1" : String(Math.max(0.12, 1 - (lejos - 0.5) * 0.34));
        // Los que quedan atrás del todo no se dibujan: son una astilla de
        // canto y encima se pueden tabular sin verse.
        el.style.visibility = lejos > 3.4 ? "hidden" : "visible";
        el.dataset.centro = lejos < 0.5 ? "si" : "no";
      }
      cuadro.current = requestAnimationFrame(dibujar);
    };
    cuadro.current = requestAnimationFrame(dibujar);

    return () => {
      cancelAnimationFrame(cuadro.current);
      // El bucle escribe transform, opacity y visibility en cada panel. Si el
      // 3D se apaga —al achicar la ventana a celular— esos estilos quedan
      // pegados y la tira sale con los paneles girados y algunos invisibles.
      for (const el of items.current) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.visibility = "";
        delete el.dataset.centro;
      }
    };
  }, [activo, medir, cuantos]);

  // La cinta queda donde se la suelta.
  //
  // Antes se acomodaba sola al panel más cercano, y ese imán es justo lo que
  // arruinaba el efecto: dejaba siempre un panel de frente al centro y la
  // cinta se leía simétrica, como una calesita. Sin imán, la cinta descansa
  // en cualquier punto y aparece lo que se ve en la referencia: lo que está a
  // la izquierda más cerca de la cara y lo de la derecha yéndose al fondo.
  //
  // El contador sí redondea, porque un "3,4 / 08" no le dice nada a nadie.
  const acomodar = useCallback(() => {
    clearTimeout(quieto.current);
  }, []);

  const alArrastrar = {
    onPointerDown: (e) => {
      if (!activo || e.button !== 0) return;
      arrastre.current = { x: e.clientX, desde: destino.current, movio: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e) => {
      const a = arrastre.current;
      if (!a) return;
      const corrido = e.clientX - a.x;
      if (Math.abs(corrido) > 4) a.movio = true;
      const ancho = panelRef.current?.offsetWidth || 400;
      irA(a.desde - corrido / ancho);
    },
    onPointerUp: (e) => {
      const a = arrastre.current;
      arrastre.current = null;
      // Si arrastró, el click no tiene que abrir el episodio de abajo.
      if (a?.movio) e.preventDefault();
    },
    onPointerCancel: () => {
      arrastre.current = null;
    },
    // Solo el gesto horizontal. El vertical baja la página, como corresponde.
    onWheel: (e) => {
      if (!activo) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      irA(destino.current + e.deltaX / 260);
      acomodar();
    },
    onKeyDown: (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        irA(Math.round(destino.current) + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        irA(Math.round(destino.current) - 1);
      }
    },
  };

  if (episodios.length === 0) return null;

  return (
    <div
      className="carr"
      data-modo={activo ? "3d" : "tira"}
      ref={cajaRef}
      role="group"
      aria-roledescription="carrusel"
      aria-label="Últimos episodios"
    >
      {/* El piso. Es lo que más hace por la sensación de 3D: sin él los
          paneles flotan en la nada y el giro se lee como un carrusel plano. */}
      <div className="carr__piso" aria-hidden="true">
        <span />
      </div>

      <div className="carr__escena" tabIndex={activo ? 0 : -1} {...alArrastrar}>
        <ul
          className="carr__pista"
          ref={pistaRef}
          onScroll={
            activo
              ? undefined
              : (e) => {
                  const paso = pasoDeLaTira(items.current) || 1;
                  const cual = Math.min(
                    Math.max(Math.round(e.currentTarget.scrollLeft / paso), 0),
                    cuantos - 1
                  );
                  setCentro(cual);
                  // El dedo también manda: si no, la flecha siguiente
                  // arrancaba desde donde había quedado antes de scrollear.
                  destino.current = cual;
                  pos.current = cual;
                }
          }
        >
          {episodios.map((ep, i) => (
            <li
              className="carr__item"
              key={ep.id}
              ref={(el) => {
                items.current[i] = el;
                if (i === 0) panelRef.current = el;
              }}
              data-centro={activo && i === centro ? "si" : "no"}
              aria-hidden={
                activo && Math.abs(distancia(i, centro, cuantos)) > 3
                  ? "true"
                  : undefined
              }
            >
              <Link
                href={`/episodios/${ep.id}`}
                className="carr__panel"
                draggable={false}
                tabIndex={
                  activo && Math.abs(distancia(i, centro, cuantos)) > 3 ? -1 : undefined
                }
                onClick={(e) => {
                  // Un arrastre no es un click.
                  if (arrastre.current?.movio) e.preventDefault();
                }}
              >
                {/* El resplandor: la misma miniatura, desenfocada y por
                    detrás. Toma los colores del propio episodio, así cada
                    recuadro tiñe el negro con lo suyo en vez de llevar todos
                    el mismo halo puesto a mano. */}
                <span
                  className="carr__glow"
                  aria-hidden="true"
                  style={{
                    "--foto": `url(https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg)`,
                  }}
                />
                <span className="carr__foto">
                  {/* La imagen de verdad, para que exista en el HTML y la lean
                      los buscadores. En pantalla la tapan las tajadas. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="carr__plana"
                    src={`https://i.ytimg.com/vi/${ep.id}/maxresdefault.jpg`}
                    alt={`Miniatura del episodio: ${ep.title}`}
                    draggable={false}
                    loading={i < 3 ? "eager" : "lazy"}
                    // maxresdefault no existe para todos los videos: cuando
                    // falta, YouTube devuelve una imagen de 120px que se ve
                    // como una mancha. Se cae a hqdefault, que está siempre.
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.cayo) return;
                      img.dataset.cayo = "si";
                      img.src = `https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg`;
                      const curva = img.parentElement?.querySelector(".carr__curva");
                      if (curva) {
                        curva.style.setProperty(
                          "--foto",
                          `url(https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg)`
                        );
                      }
                    }}
                  />
                  <span
                    className="carr__curva"
                    aria-hidden="true"
                    style={{
                      "--foto": `url(https://i.ytimg.com/vi/${ep.id}/maxresdefault.jpg)`,
                    }}
                  >
                    {Array.from({ length: TAJADAS }, (_, k) => (
                      <span className="carr__tajada" key={k} style={{ "--k": k }} />
                    ))}
                  </span>
                  <span className="carr__play" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
                <span className="carr__tit">{ep.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="carr__mando">
        <span className="carr__cuenta" aria-live="polite">
          {String(centro + 1).padStart(2, "0")}
          <i>/</i>
          {String(episodios.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          className="carr__flecha"
          onClick={() => irA(Math.round(destino.current) - 1)}
          aria-label="Episodio anterior"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          className="carr__flecha"
          onClick={() => irA(Math.round(destino.current) + 1)}
          aria-label="Episodio siguiente"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
