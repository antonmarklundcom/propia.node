import Link from "next/link";
import { POPULAR_SEARCHES } from "@/config/popular-searches";

/**
 * Global footer (portal shell). Popular searches double as internal links for
 * SEO; the columns give the page a finished base instead of a floating grid.
 */
const ABOUT = [
  { label: "Comprar", href: "/venta/asuncion" },
  { label: "Alquilar", href: "/alquiler/asuncion" },
  { label: "Terrenos", href: "/venta/asuncion/terrenos" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <div className="site-footer__brand">Propia</div>
          <p className="site-footer__tagline">
            Casas, departamentos y terrenos en venta y alquiler en todo
            Paraguay — con cuota estimada y financiamiento.
          </p>
        </div>

        <div>
          <div className="site-footer__col-title">Búsquedas populares</div>
          <ul className="site-footer__links">
            {POPULAR_SEARCHES.map((l) => (
              <li key={l.href}>
                <Link className="site-footer__link" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="site-footer__col-title">Explorar</div>
          <ul className="site-footer__links">
            {ABOUT.map((l) => (
              <li key={l.href}>
                <Link className="site-footer__link" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        © {year} Propia · propia.com.py — Encontrá tu propiedad en Paraguay.
      </div>
    </footer>
  );
}
