import Link from "next/link";
import type { Dictionary } from "@/i18n";
import type { DirectoryZone } from "@/lib/directory-queries";
import { safeImageUrl } from "@/lib/external-image";

/**
 * The directory door's rendering of `/agentes` and `/inmobiliarias`
 * (fable-plan-realtor-terreno-rental.md Stage 1 D item 3).
 *
 * One component for both because the two pages differ only in their rows and
 * their copy. What it changes versus the marketplace rendering of the same
 * routes:
 *
 * - **A city filter**, whose options are derived from published inventory
 *   (`listDirectoryZones`) rather than from a `zones` column that does not
 *   exist. A city with no supply is not offered, so the filter can never
 *   produce an empty page from a link the page itself rendered.
 * - **Verified first.** Verification is one of only two honest signals this
 *   door has (the other is live inventory), so it orders the list rather than
 *   decorating it.
 * - **Its own CTAs.** The marketplace rendering points at `/para-inmobiliarias`
 *   and `/planes`; both 301 off this door, so a card that linked there would be
 *   a redirect the page put in front of the visitor.
 *
 * Listing count is a secondary line, never the headline: this door introduces
 * people, and "most listings" is not the same question as "right for me".
 */
export interface DirectoryListRow {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  isVerified: boolean;
  /** The office behind a person, or null. Agencies pass null. */
  affiliation: string | null;
  listingCount: number;
  cities: string[];
  href: string;
}

export function DirectoryList({
  d,
  title,
  subtitle,
  rows,
  zones,
  activeCity,
  basePath,
}: {
  d: Dictionary;
  title: string;
  subtitle: string;
  rows: DirectoryListRow[];
  zones: DirectoryZone[];
  /** The `?ciudad=` slug currently applied, or null for "all". */
  activeCity: string | null;
  /** "/agentes" or "/inmobiliarias" — where the filter chips link. */
  basePath: string;
}) {
  const t = d.directory;
  // Verified first, then by live inventory. Both halves keep their own order
  // from the query, so the list is deterministic between renders.
  const ordered = [...rows].sort(
    (a, b) =>
      Number(b.isVerified) - Number(a.isVerified) ||
      b.listingCount - a.listingCount,
  );

  return (
    <main>
      <section className="ds-section ds-container">
        <h1 className="nh-hero__title">{title}</h1>
        <p className="home-projects__subtitle">{subtitle}</p>

        {zones.length > 0 && (
          <nav className="mk-chips" aria-label={t.listFilterTitle}>
            <Link
              className={`mk-chip${activeCity ? "" : " panel-chip--active"}`}
              href={basePath}
            >
              {t.listFilterAll}
            </Link>
            {zones.map((z) => (
              <Link
                key={z.slug}
                className={`mk-chip${activeCity === z.slug ? " panel-chip--active" : ""}`}
                href={`${basePath}?ciudad=${z.slug}`}
              >
                {z.name}
              </Link>
            ))}
          </nav>
        )}
      </section>

      <section className="ds-section ds-container">
        {ordered.length === 0 ? (
          <div className="mk-empty">
            <p>{t.listEmpty}</p>
            <Link className="mk-btn mk-btn--accent" href="/#form">
              {t.listCtaButton}
            </Link>
          </div>
        ) : (
          <div className="mk-agency-grid">
            {ordered.map((r) => (
              <Link key={r.id} className="mk-agency" href={r.href}>
                <div className="mk-agency__head">
                  {safeImageUrl(r.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="mk-agency__logo mk-agency__logo--round"
                      src={safeImageUrl(r.imageUrl) ?? undefined}
                      referrerPolicy="no-referrer"
                      alt={r.name}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="mk-agency__logo mk-agency__logo--fallback mk-agency__logo--round"
                      aria-hidden
                    >
                      {r.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="mk-agency__name">
                      {r.name}
                      {r.isVerified && (
                        <span
                          className="mk-agency__verified"
                          title={t.listVerified}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    {r.affiliation && (
                      <div className="mk-agency__cities">{r.affiliation}</div>
                    )}
                  </div>
                </div>

                {r.cities.length > 0 && (
                  <div className="mk-chips">
                    {r.cities.map((c) => (
                      <span key={c} className="mk-chip">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mk-agency__meta">
                  {/* Secondary, deliberately: a count is not a recommendation.
                      The helper takes the number rather than a formatted
                      string because it also decides singular vs plural; one
                      professional's published portfolio never reaches the
                      thousands separator this would otherwise need to localise
                      (CLAUDE.md: numbers are not copy). */}
                  <span>{t.listListingCount(r.listingCount)}</span>
                </div>

                <span className="mk-agency__cta">{t.listProfileCta} →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="ds-section ds-container">
        <div className="mk-empty">
          <h2 className="home-section__title">{t.listCtaTitle}</h2>
          <p>{t.listCtaText}</p>
          <Link className="mk-btn mk-btn--accent" href="/#form">
            {t.listCtaButton}
          </Link>
        </div>
      </section>
    </main>
  );
}
