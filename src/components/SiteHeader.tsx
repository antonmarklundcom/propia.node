import Link from "next/link";
import { BRAND_KICKER } from "@/lib/brand";
import { brandName } from "@/lib/brand-server";
import { HEADER_NAV } from "@/config/site-nav";
import { MobileMenu } from "@/components/MobileMenu";
import { currentVertical } from "@/lib/vertical-context";
import {
  headerExtraNavHref,
  sellerCtaHref,
  chromeVariant,
  chromeShowLogin,
  chromeShowPublishCta,
} from "@/design/sections";
import { dict } from "@/i18n/server";

/**
 * Global top bar (portal shell). Brand + grouped nav + a "publish" CTA.
 *
 * The nav is grouped rather than flat: a portal has more entry points than fit
 * in a row (categories, projects, price data, valuation, the professional
 * lane), and burying /precios or /para-inmobiliarias in the footer is how they
 * stay unvisited. Dropdowns are pure CSS (:hover / :focus-within) so this stays
 * a server component; the phone drawer is the one client piece.
 *
 * The CTA opens the publish wizard (/publicar); requireUser there bounces
 * guests to /login with next=/publicar, so the button lands everyone in the
 * right place.
 */
export async function SiteHeader() {
  // The wordmark IS the domain, so it has to follow the host rather than a
  // build-time constant — see src/lib/brand.ts.
  const [brand, vertical, d] = await Promise.all([
    brandName(),
    currentVertical(),
    dict(),
  ]);
  // No `vertical.key === ...` here — the registry decides both whether there
  // is an extra nav entry and where the CTA points; the *label* comes from
  // the i18n dictionary (never a hardcoded Spanish literal), so this
  // component reads both rather than branching on the vertical itself.
  const extraNavHref = headerExtraNavHref(vertical.key);
  const ctaHref = sellerCtaHref(vertical.key);
  const nordicoCta = extraNavHref ? d.nordico : null;
  const isGuideEn = chromeVariant(vertical.key) === "guide-en";
  const showLogin = chromeShowLogin(vertical.key);
  const showPublishCta = chromeShowPublishCta(vertical.key);
  // realestateinparaguay.com guide §5 "Header": Buy · Rent · Land · New
  // developments · How it works · Guides — a flat nav with no dropdown
  // panels, sourced from the i18n dictionary rather than HEADER_NAV (which
  // is Spanish-only and shaped for the Spanish door's dropdowns). No login,
  // newsletter or publicar entry point on this domain's chrome (guide §8 /
  // build-prompt.md PR3 — see chromeShowLogin/chromeShowPublishCta).
  const guideEnNav = d.guideEn.chromeNav.map((l) => ({ ...l, links: [] as never[] }));
  // §5 "Header" (Nórdico): Comprar · Alquilar · Vender · Proyectos ·
  // Inmobiliarias — the extra entry (when the registry adds one) sits right
  // after "Proyectos".
  const nav = isGuideEn
    ? guideEnNav
    : extraNavHref
      ? [
          ...HEADER_NAV.slice(0, 3),
          { label: d.nordico.headerVender, href: extraNavHref, links: [] },
          ...HEADER_NAV.slice(3),
        ]
      : HEADER_NAV;
  const ctaLabelFull = nordicoCta ? nordicoCta.headerVenderCtaFull : "Publicar propiedad";
  const ctaLabelShort = nordicoCta ? nordicoCta.headerVenderCtaShort : "Publicar";
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" href="/">
          {/* Architectural line icon, 0.95–1.15 stroke, no fill, square corners
              — the icon rule from the design system. */}
          <svg
            className="site-header__brand-mark"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.15"
            aria-hidden
          >
            <path d="M3.2 10.4L12 3.6l8.8 6.8" />
            <path d="M5.6 9.8v10.6h12.8V9.8" />
            <path d="M10 20.4v-5.6h4v5.6" />
          </svg>
          <span>
            <span className="site-header__brand-name">{brand}</span>
            <span className="site-header__brand-sub">{BRAND_KICKER}</span>
          </span>
        </Link>

        <nav className="site-header__nav" aria-label="Principal">
          {nav.map((group) => (
            <div key={group.label} className="site-header__group">
              <Link className="site-header__link" href={group.href}>
                {group.label}
                {group.links.length > 0 && (
                  <span className="site-header__caret" aria-hidden>
                    ▾
                  </span>
                )}
              </Link>
              {group.links.length > 0 && (
              <div className="site-header__panel">
                {group.links.map((l) => (
                  <Link
                    key={l.href + l.label}
                    className="site-header__panel-link"
                    href={l.href}
                  >
                    <span className="site-header__panel-label">{l.label}</span>
                    {l.desc && (
                      <span className="site-header__panel-desc">{l.desc}</span>
                    )}
                  </Link>
                ))}
              </div>
              )}
            </div>
          ))}
        </nav>

        <div className="site-header__actions">
          {showLogin && (
            <Link className="site-header__login" href="/login">
              Ingresar
            </Link>
          )}
          {/* Two labels, one shown at a time — on a 320px screen the full label
              plus the brand no longer fit on one line (globals.css @560px).
              No CTA at all on the English door — no login, newsletter or
              publicar entry point in this domain's chrome (guide §8 /
              build-prompt.md PR3). */}
          {showPublishCta && (
            <Link className="site-header__cta" href={ctaHref}>
              <span className="site-header__cta-full">{ctaLabelFull}</span>
              <span className="site-header__cta-short">{ctaLabelShort}</span>
            </Link>
          )}
          <MobileMenu
            nav={nav}
            ctaHref={showPublishCta ? ctaHref : null}
            ctaLabel={ctaLabelFull}
          />
        </div>
      </div>
    </header>
  );
}
