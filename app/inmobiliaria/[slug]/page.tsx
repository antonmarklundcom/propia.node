import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brandName } from "@/lib/brand-server";
import { currentLocale, dict } from "@/i18n/server";
import {
  getAgencyBySlug,
  getAgencyListings,
  countAgencyListings,
  listCities,
  locationChain,
} from "@/lib/queries";
import { listAgentsForDirectory } from "@/lib/directory-queries";
import { DirectoryLeadForm } from "@/components/DirectoryLeadForm";
import { directoryPagesEnabled } from "@/design/sections";
import { agentUrl } from "@/lib/urls";
import { agencyUrl } from "@/lib/urls";
import {
  directoryCanonicalOrigin,
  hostOwnsDirectory,
  listingCanonicalOrigin,
  siteOrigin,
} from "@/lib/origin";
import { languageAlternates } from "@/lib/alternates";
import { currentVertical } from "@/lib/vertical-context";
import { getIndexability, robotsFor } from "@/lib/indexability";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { listingUrl } from "@/lib/urls";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { waLink } from "@/lib/wa";
import { safeImageUrl } from "@/lib/external-image";

// Same shape as the listing detail page: DB-backed, so no static caching —
// this is the founder's inventory changing, not content that goes stale slowly.

type Params = { params: Promise<{ slug: string }> };

/** Shared resolution for metadata + page: the agency row + its listing count. */
const resolve = cache(async function resolve(slug: string) {
  const agency = await getAgencyBySlug(slug);
  if (!agency) return null;
  const listingCount = await countAgencyListings(agency.id);
  return { agency, listingCount };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const brand = await brandName();
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) return { title: `Inmobiliaria no encontrada` };
  const { agency, listingCount } = r;
  const ix = getIndexability({ listingCount });
  const [directoryOrigin, ownsDirectory, vertical] = await Promise.all([
    // See app/agente/[slug]/page.tsx: the directory page type has one owner
    // per locale, and it is not simply the host that served the request.
    directoryCanonicalOrigin(),
    hostOwnsDirectory(),
    currentVertical(),
  ]);
  const canonical = `${directoryOrigin}${agencyUrl(agency.slug)}`;
  return {
    title: `${agency.name} — Propiedades en venta y alquiler`,
    description: `${listingCount} ${listingCount === 1 ? "propiedad" : "propiedades"} publicadas por ${agency.name} en ${brand}.`,
    alternates: {
      canonical,
      languages: languageAlternates({
        path: agencyUrl(agency.slug),
        scope: "directory",
        family: vertical.family,
      }),
    },
    robots: { index: ownsDirectory && ix.state === "index", follow: true },
  };
}

export default async function AgencyProfilePage({ params }: Params) {
  const brand = await brandName();
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  const { agency, listingCount } = r;
  const d = await dict();

  // A brand-new agency with zero listings has nothing to show — same
  // gone-or-noindex rule every other thin page in the site follows
  // (src/lib/indexability.ts), so this page and the sitemap can never disagree.
  const ix = getIndexability({ listingCount });
  if (ix.state === "gone") notFound();

  const vertical = await currentVertical();
  const isDirectory = directoryPagesEnabled(vertical.key);
  const locale = await currentLocale();
  const [listings, zoneCities, directoryAgents] = await Promise.all([
    getAgencyListings({ agencyId: agency.id, limit: 24, vertical }),
    // Only the directory rendering has a form with a city select, and only it
    // shows a team list — every other door skips both queries entirely.
    isDirectory
      ? listCities()
      : Promise.resolve([] as { slug: string; name: string }[]),
    isDirectory
      ? listAgentsForDirectory()
      : Promise.resolve([] as Awaited<ReturnType<typeof listAgentsForDirectory>>),
  ]);
  // The team list reuses the /agentes query rather than adding one of its own
  // (D1b decision 3): same cached, `directory`-tagged read, filtered to this
  // office. It therefore lists only agents with published inventory, which is
  // the same honesty rule the directory index already applies.
  const team = directoryAgents.filter((a) => a.agencySlug === agency.slug);
  // Where this office actually has inventory, in portfolio order, at most four.
  // Derived from the listings already loaded above — `agencies` has no zones
  // column and D1b adds no schema.
  const coverage = isDirectory ? await coverageCities(listings) : [];
  const origin = await siteOrigin();
  // The ItemList's entries are listing detail URLs, which may be canonical on
  // a different host than the one serving this profile (audit F9).
  const listingOrigin = await listingCanonicalOrigin();
  const logo = safeImageUrl(agency.logoUrl) ?? undefined;
  const initials = agency.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const crumbs = [
    { name: d.listing.breadcrumbHome, url: "/" },
    { name: agency.name, url: agencyUrl(agency.slug) },
  ];

  return (
    <main className="listing-main">
      {ix.state === "index" && (
        <JsonLd
          data={[
            breadcrumbJsonLd(origin, crumbs),
            itemListJsonLd(
              listingOrigin,
              listings.map((l) => ({ title: l.title, url: listingUrl(l) })),
            ),
          ]}
        />
      )}

      <nav className="breadcrumb-nav" aria-label={d.profile.navAriaLabel}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link className="breadcrumb-nav__link" href="/">
            {d.listing.breadcrumbHome}
          </Link>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden>›</span>
          <span className="breadcrumb-nav__current" aria-current="page">
            {agency.name}
          </span>
        </span>
      </nav>

      {isDirectory ? (
        <>
          {/**
           * The directory door's agency body (D1b), the mirror of
           * /agente/[slug]'s: who this office is, where it works, a form that
           * reaches it through the operator, then its portfolio. No raw
           * WhatsApp and no mailto — a directory lead the operator never sees
           * is one this door cannot follow up (D1 "Leads").
           */}
          <header className="agency-profile__header">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="agency-profile__logo" src={logo} alt={agency.name} referrerPolicy="no-referrer" />
            ) : (
              <div className="agency-profile__avatar" aria-hidden>
                {initials || "I"}
              </div>
            )}
            <div>
              <h1 className="agency-profile__name">
                {agency.name}
                {agency.isVerified && (
                  <span className="agency-profile__verified" title={d.directory.listVerified}>
                    ✓
                  </span>
                )}
              </h1>
              <p className="agency-profile__meta">
                {d.directory.profileKindAgency} ·{" "}
                {listingCount > 0
                  ? d.directory.listListingCount(listingCount)
                  : d.directory.profileEmpty}
              </p>
              {coverage.length > 0 && (
                <p className="agency-profile__meta">
                  {d.directory.profileCoverage(coverage)}
                </p>
              )}
            </div>
          </header>

          {/* The form comes before the portfolio: on this door it is the
              product, not an afterthought under the listings. */}
          <section className="contact-panel" id="contacto">
            <h2 className="contact-panel__title">
              {d.directory.profileFormTitle(agency.name)}
            </h2>
            <p className="contact-panel__subtitle">{d.directory.heroSubtitle}</p>
            <DirectoryLeadForm
              cities={zoneCities}
              idPrefix="dir-profile"
              locale={locale}
              agencySlug={agency.slug}
              source="directory:profile"
            />
          </section>

          {team.length > 0 && (
            <section className="similar-listings" style={{ borderTop: "none", paddingTop: 0 }}>
              <h2 className="similar-listings__title">
                {d.directory.profileTeamTitle}
              </h2>
              <ul className="agency-profile__team">
                {team.map((member) => (
                  <li key={member.slug}>
                    <Link href={agentUrl(member.slug)}>{member.name}</Link>{" "}
                    <span className="agency-profile__meta">
                      {d.directory.listListingCount(member.listingCount)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {listings.length > 0 ? (
            <section className="similar-listings" style={{ borderTop: "none", paddingTop: 0 }}>
              <h2 className="similar-listings__title">
                {d.directory.profilePortfolioTitle}
              </h2>
              <div className="similar-listings__grid">
                {listings.map((card) => (
                  <ListingCard key={card.id} card={card} />
                ))}
              </div>
            </section>
          ) : (
            <p className="agency-profile__empty">{d.directory.profileEmpty}</p>
          )}
        </>
      ) : (
        <>
        <header className="agency-profile__header">
          {safeImageUrl(agency.logoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="agency-profile__logo" src={safeImageUrl(agency.logoUrl) ?? undefined} alt={agency.name} referrerPolicy="no-referrer" />
          ) : (
            <div className="agency-profile__avatar" aria-hidden>
              {initials || "I"}
            </div>
          )}
          <div>
            <h1 className="agency-profile__name">
              {agency.name}
              {agency.isVerified && (
                <span className="agency-profile__verified" title={d.listing.sellerVerified}>
                  ✓
                </span>
              )}
            </h1>
            <p className="agency-profile__meta">
              Inmobiliaria ·{" "}
              {listingCount > 0
                ? `${listingCount} ${listingCount === 1 ? "propiedad publicada" : "propiedades publicadas"}`
                : d.profile.emptyState}
            </p>
            {(agency.whatsapp || agency.email) && (
              <div className="agency-profile__contact">
                {waLink(agency.whatsapp) && (
                  <a
                    className="contact-form__altlink"
                    href={waLink(agency.whatsapp)!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 WhatsApp
                  </a>
                )}
                {agency.email && (
                  <a className="contact-form__altlink" href={`mailto:${agency.email}`}>
                    ✉️ {agency.email}
                  </a>
                )}
              </div>
            )}
          </div>
        </header>

        {listings.length > 0 ? (
          <section className="similar-listings" style={{ borderTop: "none", paddingTop: 0 }}>
            <h2 className="similar-listings__title">Propiedades publicadas</h2>
            <div className="similar-listings__grid">
              {listings.map((card) => (
                <ListingCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        ) : (
          <p className="agency-profile__empty">
            Esta inmobiliaria todavía no tiene propiedades publicadas.
          </p>
        )}

        </>
      )}
    </main>
  );
}

/**
 * Distinct city names behind a set of listing cards, in card order, capped at
 * four. `locationChain()` reads the per-request map of the whole `locations`
 * table (tens of rows), so this adds no query of its own. Same helper shape as
 * app/agente/[slug]/page.tsx's.
 */
async function coverageCities(
  cards: { locationId: number | null }[],
): Promise<string[]> {
  const names: string[] = [];
  for (const card of cards) {
    if (card.locationId == null) continue;
    const city = (await locationChain(card.locationId)).find(
      (l) => l.level === "ciudad",
    );
    if (city && !names.includes(city.name)) names.push(city.name);
    if (names.length === 4) break;
  }
  return names;
}
