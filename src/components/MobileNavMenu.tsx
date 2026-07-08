"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Chip";
import { POPULAR_SEARCHES } from "@/config/popular-searches";

const NAV = [
  { label: "Comprar", href: "/venta/asuncion" },
  { label: "Alquilar", href: "/alquiler/asuncion" },
  { label: "Terrenos", href: "/venta/asuncion/terrenos" },
];

/**
 * Mobile-only hamburger + nav sheet (§6.6) — reuses the §6.5 Modal (bottom
 * sheet on mobile) rather than a bespoke overlay. Desktop nav
 * (.site-header__nav) covers the same links above 640px; this is hidden
 * there via .mobile-nav-toggle's media query.
 */
export function MobileNavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-label="Abrir menú"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden>☰</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Menú">
        <nav aria-label="Categorías" className="mobile-nav-menu__links">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-nav-menu__link"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mobile-nav-menu__section-title">Búsquedas populares</div>
        <div className="mobile-nav-menu__chips">
          {POPULAR_SEARCHES.map((s) => (
            <Chip key={s.href} href={s.href}>
              {s.label}
            </Chip>
          ))}
        </div>
      </Modal>
    </>
  );
}
