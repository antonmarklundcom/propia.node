"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FOOTER_COMPANY, type NavGroup } from "@/config/site-nav";

/**
 * Phone navigation. Below 900px the desktop nav is hidden (globals.css) and
 * this drawer carries every menu entry — previously the header simply dropped
 * its links on mobile, which on a portal where most traffic is a phone meant
 * the whole site was one CTA wide.
 *
 * Client component because it holds open/closed state; the links come from
 * `SiteHeader` as a prop rather than importing `HEADER_NAV` directly — that
 * server component already resolved the vertical's extra nav entry (e.g.
 * "Vender") and the registry-driven CTA, and this drawer must show the same
 * list rather than a second, un-extended copy of it (review finding: the
 * "Vender" link was reaching the desktop nav but not this drawer).
 */
export function MobileMenu({
  nav,
  ctaHref,
  ctaLabel,
}: {
  nav: NavGroup[];
  /** null = no sell-side CTA in this drawer (realestateinparaguay.com —
   *  no login/newsletter/publicar entry points in this domain's chrome,
   *  guide §8 / build-prompt.md PR3). The "Sobre nosotros" company-links
   *  group below stays for every vertical — Company/Legal links are not
   *  one of the three forbidden entry points. */
  ctaHref: string | null;
  ctaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Route change closes the drawer — otherwise it stays over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock the page behind the drawer so scrolling moves the menu, not the page.
  useEffect(() => {
    if (!open) return;
    // The drawer starts just below the header, whose height depends on the
    // viewport — measure it rather than hard-coding a value that drifts.
    const header = buttonRef.current?.closest("header");
    setTop(header ? Math.round(header.getBoundingClientRect().bottom) : 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="site-header__burger"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>{open ? "✕" : "☰"}</span>
      </button>

      {/* Portalled to <body>: the header sets `backdrop-filter`, which makes it
          a containing block for fixed-position descendants — a drawer rendered
          inside it would be clipped to the header's own 60-odd pixels. */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="mobile-menu"
            role="dialog"
            aria-label="Menú principal"
            style={{ top }}
          >
            <div className="mobile-menu__inner">
            {nav.map((group) => (
              <div key={group.label} className="mobile-menu__group">
                <Link className="mobile-menu__group-title" href={group.href}>
                  {group.label}
                </Link>
                {/* A group with no children is a destination, not a section:
                    its title above is already the link. */}
                {group.links.length > 0 && (
                  <ul className="mobile-menu__list">
                    {group.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link className="mobile-menu__link" href={l.href}>
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="mobile-menu__group">
              <span className="mobile-menu__group-title">
                {"Sobre nosotros"}
              </span>
              <ul className="mobile-menu__list">
                {FOOTER_COMPANY.map((l) => (
                  <li key={l.href}>
                    <Link className="mobile-menu__link" href={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {ctaHref && (
              <Link className="mobile-menu__cta" href={ctaHref}>
                {ctaLabel}
              </Link>
            )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
