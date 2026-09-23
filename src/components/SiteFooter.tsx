import Link from "next/link";
import {
  FOOTER_BUY,
  FOOTER_COMPANY,
  FOOTER_LOCATIONS,
  FOOTER_PRO,
  FOOTER_TOOLS,
  FOOTER_TYPES,
} from "@/config/site-nav";
import { brandName } from "@/lib/brand-server";
import { dict } from "@/i18n/server";
import { currentVertical } from "@/lib/vertical-context";
import { chromeVariant, rentalPath } from "@/design/sections";
import { RENTAL_SERVICES } from "@/config/rental-services";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/config/contact";
import { waLink } from "@/lib/wa";
import { stockedPathsOrNull, withoutEmptyCategoryLinks } from "@/lib/queries";

/** Same envelope/pin paths and stroke as the home's contact rows. */
function FooterGlyph({ kind }: { kind: "mail" | "pin" | "chat" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle" }}
      aria-hidden
      focusable="false"
    >
      {kind === "mail" ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="1" />
          <path d="m3 6 9 7 9-7" />
        </>
      ) : kind === "pin" ? (
        <>
          <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.6" />
        </>
      ) : (
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H3l2-4a8.5 8.5 0 1 1 16-4.5Z" />
      )}
    </svg>
  );
}

/**
 * Global footer (portal shell). Two jobs at once: it is the site's second
 * navigation (every hand-authored page is reachable from here, so nothing is
 * orphaned) and it is the "is this a real business?" answer — contact details,
 * company pages and legal links, which a marketplace asking people to hand
 * over a property listing has to show.
 *
 * Locations are a fixed curated list (not a DB query) — the footer renders on
 * every page via the root layout, and a handful of known-good cities beats
 * coupling every page render to the locations table. The one read it does is
 * the cached navigation inventory, to drop a city or city/type link that has
 * no stock on this door (it would 404 or redirect); if that read fails, every
 * link stays.
 */
function Column({
  title,
  links,
  stocked,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
  stocked: Set<string> | null;
}) {
  const shown = withoutEmptyCategoryLinks(links, stocked);
  if (shown.length === 0) return null;
  return (
    <div>
      <div className="site-footer__col-title">{title}</div>
      <ul className="site-footer__links">
        {shown.map((l) => (
          <li key={l.href + l.label}>
            <Link className="site-footer__link" href={l.href}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  // Per-host wordmark: the domain is the brand (src/lib/brand.ts).
  const [brand, vertical, d] = await Promise.all([
    brandName(),
    currentVertical(),
    dict(),
  ]);
  const stocked = await stockedPathsOrNull(vertical);
  const year = new Date().getFullYear();
  const whatsapp = CONTACT_WHATSAPP;
  const waHref = waLink(whatsapp);
  const variant = chromeVariant(vertical.key);
  const isGuideEn = variant === "guide-en";

  /**
   * The rental family's footer (docs/style/rentparaguay.com.md §chrome): the
   * brand, one line of what the business does, the seven services, the company
   * and legal links, and WhatsApp only when the env var is actually set. No
   * newsletter, no publish CTA, no marketplace columns — the doors do not link
   * to /venta, /proyectos or /para-inmobiliarias anywhere, so the footer must
   * not be the exception that does.
   */
  if (variant === "rental") {
    const t = d.rental;
    const services = RENTAL_SERVICES.map((s) => ({
      label: t.services[s.dictKey].title,
      href: rentalPath(vertical.locale, "services", s),
    }));
    return (
      <footer className="site-footer">
        <div className="site-footer__inner site-footer__inner--rental">
          <div className="site-footer__about">
            <div className="site-footer__brand">{brand}</div>
            <p className="site-footer__tagline">{t.footerTagline}</p>
            <ul className="site-footer__contact">
              {waHref && (
                <li>
                  <a
                    className="site-footer__link"
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FooterGlyph kind="chat" /> WhatsApp {whatsapp}
                  </a>
                </li>
              )}
              <li>
                {/* No mailbox exists for these doors either — the form is the
                    contact path until one does (CLAUDE.md: never a
                    placeholder address). */}
                {CONTACT_EMAIL ? (
                  <a className="site-footer__link" href={`mailto:${CONTACT_EMAIL}`}>
                    <FooterGlyph kind="mail" /> {CONTACT_EMAIL}
                  </a>
                ) : (
                  <Link
                    className="site-footer__link"
                    href={rentalPath(vertical.locale, "contact")}
                  >
                    <FooterGlyph kind="mail" /> {t.footerContactUs}
                  </Link>
                )}
              </li>
              <li>
                <span className="site-footer__muted"><FooterGlyph kind="pin" /> {t.footerAddress}</span>
              </li>
            </ul>
          </div>

          <Column stocked={stocked} title={t.footerServicesTitle} links={services} />
          <Column stocked={stocked} title={t.footerCompanyTitle} links={t.footerCompanyLinks} />
          <Column stocked={stocked} title={t.footerLegalTitle} links={t.footerLegalLinks} />
        </div>

        <div className="site-footer__bottom">
          <span>
            © {year} {brand}
          </span>
        </div>

        <div className="site-footer__disclaimer">{t.footerLegalLine(brand)}</div>
      </footer>
    );
  }

  /**
   * The directory door's footer (inmobiliarios.com.py). Same shape as the
   * rental one and for the same reason: this door is not a narrowed
   * marketplace, so none of the marketplace columns — /venta, /proyectos,
   * /publicar, the city and property-type link farms — belong here. What is
   * left is the brand, what the door does, the directory itself, and the legal
   * pages.
   *
   * No newsletter and no "Ingresar": the chrome flags say this door has
   * neither (`chromeShowLogin` / `chromeShowNewsletter`), and a footer that
   * quietly reintroduces them is how a door's promise and its markup drift
   * apart.
   */
  if (variant === "directory") {
    const t = d.directory;
    return (
      <footer className="site-footer">
        <div className="site-footer__inner site-footer__inner--rental">
          <div className="site-footer__about">
            <div className="site-footer__brand">{brand}</div>
            <p className="site-footer__tagline">{t.footerTagline(brand)}</p>
            <ul className="site-footer__contact">
              {waHref && (
                <li>
                  <a
                    className="site-footer__link"
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FooterGlyph kind="chat" /> WhatsApp {whatsapp}
                  </a>
                </li>
              )}
              <li>
                {/* There is no portal mailbox and this door does not invent
                    one (CLAUDE.md: never a placeholder address). */}
                {CONTACT_EMAIL ? (
                  <a className="site-footer__link" href={`mailto:${CONTACT_EMAIL}`}>
                    <FooterGlyph kind="mail" /> {CONTACT_EMAIL}
                  </a>
                ) : (
                  <Link className="site-footer__link" href="/contacto">
                    <FooterGlyph kind="mail" /> {t.footerContactUs}
                  </Link>
                )}
              </li>
            </ul>
          </div>

          <Column stocked={stocked} title={t.footerOwnersTitle} links={t.footerOwnersLinks} />
          <Column stocked={stocked} title={t.footerDirectoryTitle} links={t.footerDirectoryLinks} />
          <Column stocked={stocked} title={t.footerCompanyTitle} links={t.footerCompanyLinks} />
        </div>

        <div className="site-footer__bottom">
          <span>
            © {year} {brand}
          </span>
        </div>

        <div className="site-footer__disclaimer">{t.footerLegalLine(brand)}</div>
      </footer>
    );
  }

  if (isGuideEn) {
    const t = d.guideEn;
    return (
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__about">
            <div className="site-footer__brand">{brand}</div>
            <p className="site-footer__tagline">{t.footerTagline}</p>
            <ul className="site-footer__contact">
              {waHref && (
                <li>
                  <a
                    className="site-footer__link"
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FooterGlyph kind="chat" /> WhatsApp {whatsapp}
                  </a>
                </li>
              )}
              <li>
                {CONTACT_EMAIL ? (
                  <a className="site-footer__link" href={`mailto:${CONTACT_EMAIL}`}>
                    <FooterGlyph kind="mail" /> {CONTACT_EMAIL}
                  </a>
                ) : (
                  <Link className="site-footer__link" href="/contacto">
                    <FooterGlyph kind="mail" /> {t.footerContactUs}
                  </Link>
                )}
              </li>
              <li>
                <span className="site-footer__muted"><FooterGlyph kind="pin" /> {t.footerAddress}</span>
              </li>
            </ul>
          </div>

          <Column stocked={stocked} title={t.footerBuyTitle} links={t.footerBuyLinks} />
          <Column stocked={stocked} title={t.footerGuidesTitle} links={t.footerGuidesLinks} />
          <Column stocked={stocked} title={t.footerAreasTitle} links={t.footerAreasLinks} />
          <Column stocked={stocked} title={t.footerCompanyTitle} links={t.footerCompanyLinks} />
          <Column stocked={stocked} title={t.footerLegalTitle} links={t.footerLegalLinks} />
        </div>

        <div className="site-footer__bottom">
          <span>
            © {year} {brand}
          </span>
          <span className="site-footer__legal">
            <Link className="site-footer__link" href="https://inmobiliaria.com.py">
              {t.footerVersionEs}
            </Link>
          </span>
        </div>

        <div className="site-footer__disclaimer">{t.footerLegalLine(brand)}</div>
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__about">
          <div className="site-footer__brand">{brand}</div>
          <p className="site-footer__tagline">
            El portal inmobiliario de Paraguay. Casas, departamentos, terrenos y
            proyectos nuevos en venta y alquiler — con precios de referencia por
            zona y cuota estimada en cada aviso.
          </p>

          <ul className="site-footer__contact">
            {waHref && (
              <li>
                <a
                  className="site-footer__link"
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FooterGlyph kind="chat" /> WhatsApp {whatsapp}
                </a>
              </li>
            )}
            {/* No portal mailbox exists yet, so the form is the contact path —
                showing a mailto: to an address nobody reads is worse than
                sending people somewhere that actually reaches us. */}
            <li>
              {CONTACT_EMAIL ? (
                <a className="site-footer__link" href={`mailto:${CONTACT_EMAIL}`}>
                  <FooterGlyph kind="mail" /> {CONTACT_EMAIL}
                </a>
              ) : (
                <Link className="site-footer__link" href="/contacto">
                  <FooterGlyph kind="mail" /> Escribinos
                </Link>
              )}
            </li>
            <li>
              <span className="site-footer__muted"><FooterGlyph kind="pin" /> Asunción, Paraguay</span>
            </li>
          </ul>
        </div>

        <Column stocked={stocked} title="Comprar y alquilar" links={FOOTER_BUY} />
        <Column stocked={stocked} title="Herramientas" links={FOOTER_TOOLS} />
        <Column stocked={stocked} title="Para profesionales" links={FOOTER_PRO} />
        <Column stocked={stocked} title="Ubicaciones" links={FOOTER_LOCATIONS} />
        <Column stocked={stocked} title="Por tipo" links={FOOTER_TYPES} />
      </div>

      <div className="site-footer__bottom">
        <span>
          © {year} {brand} — Encontrá tu propiedad en Paraguay.
        </span>
        <span className="site-footer__legal">
          {FOOTER_COMPANY.map((l) => (
            <Link key={l.href} className="site-footer__link" href={l.href}>
              {l.label}
            </Link>
          ))}
        </span>
      </div>

      <div className="site-footer__disclaimer">
        Los precios de referencia, las cuotas estimadas y las tasaciones
        publicadas son cálculos orientativos elaborados a partir de los avisos
        del portal y de las condiciones vigentes de los programas de
        financiamiento. No constituyen una tasación oficial, una oferta de
        crédito ni asesoramiento financiero. {brand} no participa de las
        negociaciones entre las partes ni verifica de forma independiente la
        titularidad de cada inmueble publicado.
      </div>
    </footer>
  );
}
