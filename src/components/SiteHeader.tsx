import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

/**
 * Global top bar (portal shell). Brand + primary category nav + a "publish"
 * CTA. Nav points at real category URLs (§4 URL scheme). The CTA opens the
 * publish wizard (/publicar); requireUser there bounces guests to /login with
 * next=/publicar, so the button lands everyone in the right place.
 */
const NAV = [
  { label: "Comprar", href: "/venta/asuncion" },
  { label: "Alquilar", href: "/alquiler/asuncion" },
  { label: "Terrenos", href: "/venta/asuncion/terrenos" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" href="/">
          <span className="site-header__brand-mark" aria-hidden>
            🏡
          </span>
          {BRAND_NAME}
        </Link>

        <nav className="site-header__nav" aria-label="Categorías">
          {NAV.map((item) => (
            <Link key={item.href} className="site-header__link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Two labels, one shown at a time — on a 320px screen the full label
            plus the brand no longer fit on one line (globals.css @560px). */}
        <Link className="site-header__cta" href="/publicar">
          <span className="site-header__cta-full">Publicar propiedad</span>
          <span className="site-header__cta-short">Publicar</span>
        </Link>
      </div>
    </header>
  );
}
