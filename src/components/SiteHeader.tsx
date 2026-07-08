import Link from "next/link";
import { MobileNavMenu } from "@/components/MobileNavMenu";

/**
 * Global top bar (portal shell). Brand + primary category nav + a "publish"
 * CTA. Nav points at real category URLs (§4 URL scheme). The CTA opens a
 * WhatsApp chat — number comes from NEXT_PUBLIC_CONTACT_WHATSAPP when set,
 * otherwise falls back to email so the button is never a dead link.
 */
const NAV = [
  { label: "Comprar", href: "/venta/asuncion" },
  { label: "Alquilar", href: "/alquiler/asuncion" },
  { label: "Terrenos", href: "/venta/asuncion/terrenos" },
];

function publishHref(): string {
  const wa = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "");
  const text = encodeURIComponent(
    "Hola, quiero publicar una propiedad en Propia.",
  );
  return wa
    ? `https://wa.me/${wa}?text=${text}`
    : "mailto:hola@propia.com.py?subject=Quiero%20publicar%20una%20propiedad";
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" href="/">
          <span className="site-header__brand-mark" aria-hidden>
            🏡
          </span>
          Propia
        </Link>

        <nav className="site-header__nav" aria-label="Categorías">
          {NAV.map((item) => (
            <Link key={item.href} className="site-header__link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <a
          className="site-header__cta"
          href={publishHref()}
          target="_blank"
          rel="noopener noreferrer"
        >
          Publicar propiedad
        </a>

        <MobileNavMenu />
      </div>
    </header>
  );
}
