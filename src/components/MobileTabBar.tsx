"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { SearchBar, type CityOption } from "@/components/SearchBar";

/**
 * Global mobile bottom tab bar (§6.6) — Inicio / Buscar / Publicar /
 * WhatsApp. Hidden on listing detail pages, where the sticky contact bar
 * (.listing-detail__aside) already owns that screen real estate — two
 * stacked bottom bars would be worse than either alone.
 *
 * WhatsApp slot becomes Mensajes (and a 5th Cuenta tab appears) once M5'
 * accounts ship.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [cities, setCities] = useState<CityOption[] | null>(null);
  const [sendingWa, setSendingWa] = useState(false);

  const onListingDetail = pathname?.startsWith("/propiedad/");

  useEffect(() => {
    if (searchOpen && cities === null) {
      fetch("/api/cities")
        .then((r) => r.json())
        .then(setCities)
        .catch(() => setCities([]));
    }
  }, [searchOpen, cities]);

  if (onListingDetail) return null;

  async function onWhatsApp() {
    setSendingWa(true);
    const wa = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "");
    const text = encodeURIComponent(
      "Hola, quiero más información sobre Propia.",
    );
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadType: "buyer",
          whatsapp: wa ?? "unknown",
          message: "Hola, quiero más información sobre Propia.",
        }),
      });
    } catch {
      // A capture failure must not block the visitor reaching us.
    } finally {
      setSendingWa(false);
      if (wa) window.open(`https://wa.me/${wa}?text=${text}`, "_blank");
    }
  }

  return (
    <>
      <div className="mobile-tab-bar-spacer" aria-hidden />
      <nav className="mobile-tab-bar" aria-label="Navegación principal">
        <Link
          href="/"
          className={`mobile-tab-bar__tab${pathname === "/" ? " mobile-tab-bar__tab--active" : ""}`}
        >
          <span className="mobile-tab-bar__icon" aria-hidden>🏠</span>
          Inicio
        </Link>

        <button
          type="button"
          className="mobile-tab-bar__tab"
          onClick={() => setSearchOpen(true)}
        >
          <span className="mobile-tab-bar__icon" aria-hidden>🔍</span>
          Buscar
        </button>

        <a
          href="#"
          className="mobile-tab-bar__tab mobile-tab-bar__tab--accent"
          onClick={(e) => {
            e.preventDefault();
            const wa = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "");
            const text = encodeURIComponent(
              "Hola, quiero publicar una propiedad en Propia.",
            );
            window.open(
              wa
                ? `https://wa.me/${wa}?text=${text}`
                : "mailto:hola@propia.com.py?subject=Quiero%20publicar%20una%20propiedad",
              "_blank",
            );
          }}
        >
          <span className="mobile-tab-bar__icon" aria-hidden>➕</span>
          Publicar
        </a>

        <button
          type="button"
          className="mobile-tab-bar__tab"
          onClick={onWhatsApp}
          disabled={sendingWa}
        >
          <span className="mobile-tab-bar__icon" aria-hidden>💬</span>
          WhatsApp
        </button>
      </nav>

      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Buscar">
        {cities === null ? (
          <p style={{ color: "var(--color-ink-secondary)" }}>Cargando…</p>
        ) : (
          <SearchBar
            cities={cities}
            onSubmitOverride={(href) => {
              setSearchOpen(false);
              router.push(href);
            }}
          />
        )}
      </Modal>
    </>
  );
}
