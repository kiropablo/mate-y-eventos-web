"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV } from "../lib/site";

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Principal">
      <Link href="/" className="brand" onClick={() => setOpen(false)}>
        <span className="isn">
          <Image
            src="/isotipo.png"
            alt="Isotipo de Mate y Eventos"
            fill
            sizes="22px"
            style={{ objectFit: "contain" }}
            priority
          />
        </span>
        Mate y Eventos
      </Link>

      <div className={open ? "menu menu--open" : "menu"}>
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const cls = [
            item.label === "Para marcas" ? "is-cta" : "",
            active ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cls || undefined}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <button
        className="menu-btn"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "☰"}
      </button>
    </nav>
  );
}
