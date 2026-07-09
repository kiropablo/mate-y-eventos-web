"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function Motion() {
  const pathname = usePathname();
  const parsRef = useRef([]);
  const hstageRef = useRef(null);

  // Listeners que se montan una sola vez: scroll (progreso + parallax) y cursor.
  useEffect(() => {
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pbar = document.getElementById("pbar");
    let ih = window.innerHeight;
    let ticking = false;

    const onResize = () => {
      ih = window.innerHeight;
    };

    const frame = () => {
      const y = window.pageYOffset;
      const h = document.documentElement.scrollHeight - ih;
      if (pbar) pbar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      if (!rm) {
        parsRef.current.forEach((el) => {
          el.style.transform =
            "translate3d(0," + y * Number(el.dataset.speed || 0) + "px,0)";
        });
        const hstage = hstageRef.current;
        if (hstage) {
          const p = Math.min(y / ih, 1);
          hstage.style.opacity = String(1 - p * 1.15);
          hstage.style.transform = "translate3d(0," + p * 44 + "px,0)";
        }
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(frame);
        ticking = true;
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    frame();

    // Cursor con inercia (solo desktop, sin reduced-motion)
    let stop = () => {};
    if (!rm) {
      const c = document.getElementById("cursor");
      if (c) {
        let tx = window.innerWidth / 2;
        let ty = window.innerHeight / 2;
        let cx = tx;
        let cy = ty;
        let raf;
        const move = (e) => {
          tx = e.clientX;
          ty = e.clientY;
          c.style.opacity = "1";
        };
        const out = (e) => {
          if (!e.relatedTarget) c.style.opacity = "0";
        };
        const loop = () => {
          cx += (tx - cx) * 0.11;
          cy += (ty - cy) * 0.11;
          c.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
          raf = requestAnimationFrame(loop);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseout", out);
        loop();
        stop = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseout", out);
          cancelAnimationFrame(raf);
        };
      }
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      stop();
    };
  }, []);

  // Observers y marquee: se rehacen en cada cambio de página.
  useEffect(() => {
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // refs de parallax para el frame de scroll
    parsRef.current = [].slice.call(document.querySelectorAll(".par"));
    hstageRef.current = document.getElementById("hstage");

    // count-up
    const count = (el) => {
      const to = +el.dataset.to;
      if (rm) {
        el.textContent = to.toLocaleString("es-AR");
        return;
      }
      let t0 = null;
      const d = 1500;
      const step = (ts) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / d, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e).toLocaleString("es-AR");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    // reveal / clip
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            if (e.target.classList.contains("stat")) {
              e.target.querySelectorAll(".cnt").forEach(count);
            }
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    document
      .querySelectorAll(".reveal,.clip")
      .forEach((el) => io.observe(el));

    // acento por scroll (azul <-> magenta)
    const accIO = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting && e.target.dataset.accent) {
            document.body.dataset.accent = e.target.dataset.accent;
          }
        });
      },
      { threshold: 0.5 }
    );
    document
      .querySelectorAll("[data-accent]")
      .forEach((s) => accIO.observe(s));

    // marquee: duplicar el contenido una sola vez
    const mt = document.getElementById("mtrack");
    if (mt && !mt.dataset.dup) {
      mt.innerHTML += mt.innerHTML;
      mt.dataset.dup = "1";
    }

    return () => {
      io.disconnect();
      accIO.disconnect();
    };
  }, [pathname]);

  return null;
}
