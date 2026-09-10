import { cache } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brandName } from "@/lib/brand-server";
import {
  getAgentBySlug,
  getAgentListings,
  countAgentListings,
  getAgencyById,
  listCities,
  locationChain,
} from "@/lib/queries";
import { DirectoryLeadForm } from "@/components/DirectoryLeadForm";
import { directoryPagesEnabled } from "@/design/sections";
import { agentUrl, agencyUrl } from "@/lib/urls";
import {
  directoryCanonicalOrigin,
  hostOwnsDirectory,
  listingCanonicalOrigin,
  siteOrigin,
} from "@/lib/origin";
import { languageAlternates } from "@/lib/alternates";
import { currentVertical } from "@/lib/vertical-context";
import { getIndexability } from "@/lib/indexability";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { listingUrl } from "@/lib/urls";
import { esAgentProfile, agentInquiryPrefillFor } from "@/i18n/es";
import { currentLocale, dict } from "@/i18n/server";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { ContactForm } from "@/components/ContactForm";
import { safeImageUrl } from "@/lib/external-image";

// Mirrors app/inmobiliaria/[slug]/page.tsx: DB-backed profile, no static
// caching — the founder's inventory changes, not slow-to-stale content.

type Params = { params: Promise<{ slug: string }> };

/** Shared resolution for metadata + page: the agent row + its listing count. */
const resolve = cache(async function resolve(slug: string) {
  const agent = await getAgentBySlug(slug);
  if (!agent) return null;
  const listingCount = await countAgentListings(agent.id);
  return { agent, listingCount };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const brand = await brandName();
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) return { title: esAgentProfile.notFoundTitle };
  const { agent, listingCount } = r;
  const ix = getIndexability({ listingCount });
  const [directoryOrigin, ownsDirectory, vertical] = await Promise.all([
    // The profile's canonical follows `ownsDirectory`, not the serving host:
    // every marketplace door renders this page and only one owns it per
    // language (src/config/verticals.ts).
    directoryCanonicalOrigin(),
    hostOwnsDirectory(),
    currentVertical(),
  ]);
  const canonical = `${directoryOrigin}${agentUrl(agent.slug)}`;
  return {
    title: esAgentProfile.metaTitle(agent.name),
    description: esAgentProfile.metaDescription(brand, agent.name, listingCount),
    alternates: {
      canonical,
      languages: languageAlternates({
        path: agentUrl(agent.slug),
        scope: "directory",
        family: vertical.family,
      }),
    },
    // Both gates, and the thin-page rule still wins: a profile this door
    // canonicalises away is noindex whatever its listing count says.
    robots: { index: ownsDirectory && ix.state === "index", follow: true },
  };
}

export default async function AgentProfilePage({ params }: Params) {
  const brand = await brandName();
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  const { agent, listingCount } = r;
  const [d, locale] = await Promise.all([dict(), currentLocale()]);

  // A brand-new agent with zero listings has nothing to show — same
  // gone-or-noindex rule every other thin page in the site follows
  // (src/lib/indexability.ts), so this page and the sitemap can never disagree.
  const ix = getIndexability({ listingCount });
  if (ix.state === "gone") notFound();

  const vertical = await currentVertical();
  const isDirectory = directoryPagesEnabled(vertical.key);
  const [listings, agency, zoneCities] = await Promise.all([
    getAgentListings({ agentId: agent.id, limit: 24, vertical }),
    agent.agencyId ? getAgencyById(agent.agencyId) : Promise.resolve(null),
    // Only the directory rendering has a form with a city select; every other
    // door skips the query entirely rather than loading a list it will not
    // render.
    isDirectory ? listCities() : Promise.resolve([] as { slug: string; name: string }[]),
  ]);
  // Where this professional actually has inventory, in portfolio order, at most
  // four. Derived from the listings already loaded above: `agents` has no zones
  // column and D1b adds no schema.
  const coverage = isDirectory ? await coverageCities(listings) : [];
  const origin = await siteOrigin();
  // ItemList entries are listing detail URLs — canonical host may differ (F9).
  const listingOrigin = await listingCanonicalOrigin();
  const canonical = `${origin}${agentUrl(agent.slug)}`;
  const photo = safeImageUrl(agent.photoUrl) ?? undefined;
  const initials = agent.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // The directory door's own breadcrumb gets one intermediate — Inicio ›
  // Inmobiliarios › name — labels from `directory.chromeNav` (P3 decision 5).
  // The marketplace branch's crumbs are unchanged.
  const dirCrumb = isDirectory ? d.directory.chromeNav[1] : null;
  const crumbs = [
    { name: d.listing.breadcrumbHome, url: "/" },
    ...(dirCrumb ? [{ name: dirCrumb.label, url: dirCrumb.href }] : []),
    { name: agent.name, url: agentUrl(agent.slug) },
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
        {crumbs.map((crumb, i) => (
          <span key={crumb.url} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span aria-hidden>›</span>}
            {i === crumbs.length - 1 ? (
              <span className="breadcrumb-nav__current" aria-current="page">
                {crumb.name}
              </span>
            ) : (
              <Link className="breadcrumb-nav__link" href={crumb.url}>
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {isDirectory ? (
        <div className="dir-profile">
          {/**
           * The directory door's profile body (D1b), restyled to the "Paso a
           * Paso" look (P3): the header as a card, two columns from 960px
           * (rail left, sticky form right), form directly under the header
           * on mobile. What a property owner needs to decide and nothing
           * else — no raw WhatsApp or mailto link, no invented figures.
           */}
          <header className="dir-profile__header">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="dir-profile__photo" src={photo} alt={agent.name} referrerPolicy="no-referrer" />
            ) : (
              <div className="dir-profile__avatar" aria-hidden>
                {initials || "A"}
              </div>
            )}
            <div>
              <h1 className="dir-profile__name">
                {agent.name}
                {agent.isVerified && (
                  <span className="dir-profile__verified">{d.directory.listVerified}</span>
                )}
              </h1>
              <p className="dir-profile__meta">
                {d.directory.profileKindAgent} ·{" "}
                {listingCount > 0
                  ? d.directory.listListingCount(listingCount)
                  : d.directory.profileEmpty}
              </p>
              {agency && (
                <p className="dir-profile__meta">
                  <Link href={agencyUrl(agency.slug)}>{agency.name}</Link>
                </p>
              )}
              {coverage.length > 0 && (
                <p className="dir-profile__meta">
                  {d.directory.profileCoverage(coverage)}
                </p>
              )}
            </div>
          </header>

          <div className="dir-profile__grid">
            {/* DOM order matches mobile order (P3 decision 3): form directly
                under the header, then the rail. On desktop the grid places
                this panel in the right column via `grid-column`, not by
                reordering the markup. */}
            <section className="contact-panel dir-profile__side" id="contacto">
              <h2 className="contact-panel__title">
                {d.directory.profileFormTitle(agent.name)}
              </h2>
              <p className="contact-panel__subtitle">{d.directory.heroSubtitle}</p>
              <DirectoryLeadForm
                cities={zoneCities}
                idPrefix="dir-profile"
                locale={locale}
                agentSlug={agent.slug}
                source="directory:profile"
              />
            </section>

            <div className="dir-profile__main">
              {listings.length > 0 ? (
                <section className="similar-listings dir-profile__rail" style={{ borderTop: "none", paddingTop: 0 }}>
                  <h2 className="similar-listings__title">
                    {d.directory.profilePortfolioTitle}
                  </h2>
                  <div className="similar-listings__grid dir-profile__rail-grid">
                    {listings.map((card) => (
                      <ListingCard key={card.id} card={card} />
                    ))}
                  </div>
                </section>
              ) : (
                <p className="dir-profile__empty">{d.directory.profileEmpty}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
        <header className="agent-profile__header">
          {safeImageUrl(agent.photoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="agent-profile__logo" src={safeImageUrl(agent.photoUrl) ?? undefined} alt={agent.name} referrerPolicy="no-referrer" />
          ) : (
            <div className="agent-profile__avatar" aria-hidden>
              {initials || "A"}
            </div>
          )}
          <div>
            <h1 className="agent-profile__name">
              {agent.name}
              {agent.isVerified && (
                <span className="agent-profile__verified" title={esAgentProfile.verified}>
                  ✓
                </span>
              )}
            </h1>
            <p className="agent-profile__meta">
              {esAgentProfile.kind} ·{" "}
              {listingCount > 0
                ? esAgentProfile.listingCount(listingCount)
                : esAgentProfile.noListings}
            </p>
            {agency && (
              <p className="agent-profile__agency">
                {esAgentProfile.agencyPrefix}{" "}
                <Link href={agencyUrl(agency.slug)}>{agency.name}</Link>
              </p>
            )}
            {agent.whatsapp && (
              <div className="agent-profile__contact">
                <a className="contact-form__altlink" href="#contacto">
                  {esAgentProfile.whatsappLink}
                </a>
              </div>
            )}
          </div>
        </header>

        {listings.length > 0 ? (
          <section className="similar-listings" style={{ borderTop: "none", paddingTop: 0 }}>
            <h2 className="similar-listings__title">{esAgentProfile.listingsTitle}</h2>
            <div className="similar-listings__grid">
              {listings.map((card) => (
                <ListingCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        ) : (
          <p className="agent-profile__empty">{esAgentProfile.empty}</p>
        )}

        {/* The marketplace's contact block: a buyer enquiry handed off to the
            agent's own number, so it still gates on having one. The directory
            door's form is the branch above. */}
        {agent.whatsapp && (
          <section className="contact-panel" id="contacto">
            <h2 className="contact-panel__title">{esAgentProfile.contactTitle}</h2>
            <p className="contact-panel__subtitle">{esAgentProfile.contactSubtitle}</p>
            <ContactForm
              contactWhatsapp={agent.whatsapp}
              leadType="buyer"
              prefillMessage={agentInquiryPrefillFor(brand, agent.name, canonical)}
              variant="panel"
              locale={locale}
            />
          </section>
        )}

        </>
      )}
    </main>
  );
}

/**
 * Distinct city names behind a set of listing cards, in card order, capped at
 * four. `locationChain()` reads the per-request map of the whole `locations`
 * table (tens of rows), so this adds no query of its own.
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
