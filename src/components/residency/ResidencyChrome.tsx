import Link from "next/link";
import "./residency.css";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/config/contact";
import { waLink } from "@/lib/wa";
import {
  RESIDENCY_BRAND,
  RESIDENCY_NAV_SLUGS,
  residencyPageBySlug,
} from "@/content/residency";

/**
 * Header and footer of residenciaenparaguay.es. Chosen by `chromeVariant()`
 * ("residency") inside `SiteHeader` / `SiteFooter`, so the root layout stays
 * one layout. Spanish-only copy lives with the content (src/content/residency).
 */
const NAV = RESIDENCY_NAV_SLUGS.map((slug) => residencyPageBySlug(slug))
  .filter((p): p is NonNullable<typeof p> => p !== null)
  .map((p) => ({ label: p.label, href: `/${p.slug}` }));

export function ResidencyHeader({ brand }: { brand: string }) {
  return (
    <header className="rs-header">
      <div className="ds-container rs-header__inner">
        <Link href="/" className="rs-brand">
          {brand}
        </Link>
        <nav className="rs-nav" aria-label="Principal">
          <Link href="/requisitos-residencia-paraguay">Requisitos</Link>
          <Link href="/cuanto-cuesta-residencia-paraguay">Costos</Link>
          <Link href="/residencia-temporal-paraguay">Temporal</Link>
          <Link href="/residencia-permanente-paraguay">Permanente</Link>
          <Link href="/residencia-paraguay-para-espanoles">Desde España</Link>
          <Link href="/contacto" className="rs-nav__cta">
            Consultanos
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function ResidencyFooter({ brand }: { brand: string }) {
  const year = new Date().getFullYear();
  const waHref = waLink(CONTACT_WHATSAPP);
  return (
    <footer className="site-footer">
      <div className="site-footer__inner site-footer__inner--rental">
        <div className="site-footer__about">
          <div className="site-footer__brand">{brand}</div>
          <p className="site-footer__tagline">{RESIDENCY_BRAND.tagline}</p>
          <ul className="site-footer__contact">
            {waHref && (
              <li>
                <a className="site-footer__link" href={waHref} target="_blank" rel="noopener noreferrer">
                  WhatsApp {CONTACT_WHATSAPP}
                </a>
              </li>
            )}
            <li>
              {CONTACT_EMAIL ? (
                <a className="site-footer__link" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <Link className="site-footer__link" href="/contacto">
                  Escribinos
                </Link>
              )}
            </li>
          </ul>
        </div>
        <div>
          <div className="site-footer__col-title">Residencia en Paraguay</div>
          <ul className="site-footer__links">
            {NAV.map((l) => (
              <li key={l.href}>
                <Link className="site-footer__link" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="site-footer__col-title">Más guías</div>
          <ul className="site-footer__links">
            {[
              "residencia-mercosur-paraguay",
              "documentos-residencia-paraguay",
              "cedula-paraguaya-extranjeros",
              "como-sacar-residencia-paraguay",
              "preguntas-frecuentes-residencia-paraguay",
            ].map((slug) => {
              const p = residencyPageBySlug(slug);
              return p ? (
                <li key={slug}>
                  <Link className="site-footer__link" href={`/${slug}`}>
                    {p.label}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </div>
        <div>
          <div className="site-footer__col-title">Legal</div>
          <ul className="site-footer__links">
            <li><Link className="site-footer__link" href="/contacto">Contacto</Link></li>
            <li><Link className="site-footer__link" href="/terminos">Términos</Link></li>
            <li><Link className="site-footer__link" href="/privacidad">Privacidad</Link></li>
          </ul>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {year} {brand}</span>
      </div>
      <div className="site-footer__disclaimer">
        {brand} ofrece información y acompañamiento en trámites migratorios. No
        sustituye el asesoramiento legal individual; los requisitos los fija la
        Dirección Nacional de Migraciones y pueden cambiar.
      </div>
    </footer>
  );
}
