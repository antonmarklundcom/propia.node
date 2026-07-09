import Link from "next/link";
import { POPULAR_SEARCHES } from "@/config/popular-searches";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/property-types";
import { categoryUrl } from "@/lib/urls";

/**
 * Global footer (portal shell). Popular searches double as internal links for
 * SEO; the columns give the page a finished base instead of a floating grid.
 *
 * Locations are a fixed curated list (not a DB query) — the footer renders on
 * every page via the root layout, and a handful of known-good cities beats
 * coupling every page render to the locations table.
 */
const EXPLORE = [
  { label: "Comprar", href: "/venta/asuncion" },
  { label: "Alquilar", href: "/alquiler/asuncion" },
  { label: "Terrenos", href: "/venta/asuncion/terrenos" },
];

const LOCATIONS = [
  { label: "Casas en Asunción", slug: "asuncion" },
  { label: "Departamentos en Luque", slug: "luque" },
  { label: "Alquileres en Lambaré", slug: "lambare" },
  { label: "Terrenos en Encarnación", slug: "encarnacion" },
  { label: "Propiedades en Ciudad del Este", slug: "ciudad-del-este" },
];

const TYPE_LINKS = PROPERTY_TYPE_OPTIONS.slice(0, 5).map((t) => ({
  label: t.label,
  href: categoryUrl({ operation: "venta", citySlug: "asuncion", type: t.value }),
}));

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
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Link className="site-footer__link" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="site-footer__col-title">Ubicaciones</div>
          <ul className="site-footer__links">
            {LOCATIONS.map((l) => (
              <li key={l.slug}>
                <Link
                  className="site-footer__link"
                  href={categoryUrl({ operation: "venta", citySlug: l.slug })}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="site-footer__col-title">Por tipo de propiedad</div>
          <ul className="site-footer__links">
            {TYPE_LINKS.map((l) => (
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
