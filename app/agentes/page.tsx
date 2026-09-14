import { numberLocaleFor } from "@/i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { brandName } from "@/lib/brand-server";
import {
  directoryCanonicalOrigin,
  hostOwnsDirectory,
  siteOrigin,
} from "@/lib/origin";
import { languageAlternates } from "@/lib/alternates";
import { currentVertical } from "@/lib/vertical-context";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { Glyph } from "@/components/Glyph";
import { agentUrl } from "@/lib/urls";
import {
  listAgentsForDirectory,
  listDirectoryZones,
} from "@/lib/directory-queries";
import { DirectoryList } from "@/components/DirectoryList";
import { directoryPagesEnabled } from "@/design/sections";
import { dict, currentLocale } from "@/i18n/server";
import { CtaBand, PageHero, Section } from "@/components/MarketingUI";
import { safeImageUrl } from "@/lib/external-image";

export const dynamic = "force-dynamic";


export async function generateMetadata(): Promise<Metadata> {
  const c = (await dict()).agentsPage;
  const [brand, directoryOrigin, ownsDirectory, vertical] = await Promise.all([
    brandName(),
    // NOT siteOrigin(): every marketplace door renders this page, but only the
    // door named by `ownsDirectory` is canonical for it in its language
    // (src/config/verticals.ts). A door that self-canonicalised here would be
    // the second Spanish host publishing the same directory.
    directoryCanonicalOrigin(),
    hostOwnsDirectory(),
    currentVertical(),
  ]);
  return {
    title: c.metaTitle,
    description: c.description(brand),
    alternates: {
      canonical: `${directoryOrigin}/agentes`,
      languages: languageAlternates({
        path: "/agentes",
        scope: "directory",
        family: vertical.family,
      }),
    },
    // A door that canonicalises this page away does not ask for it to be
    // indexed either — the sitemap already drops it (`includeDirectory`), and
    // these two answers must not disagree.
    robots: { index: ownsDirectory, follow: true },
    openGraph: { title: `${c.title} — ${brand}`, description: c.description(brand) },
  };
}

export default async function AgentesPage({
  searchParams,
}: {
  searchParams: Promise<{ ciudad?: string }>;
}) {
  const numberLocale = numberLocaleFor(await currentLocale());
  const c = (await dict()).agentsPage;
  const [origin, agents, vertical, d, params] = await Promise.all([
    siteOrigin(),
    listAgentsForDirectory(),
    currentVertical(),
    dict(),
    searchParams,
  ]);

  /**
   * The directory door renders this page as a directory: a derived-zone city
   * filter, verified first, and its own CTAs. The marketplace rendering below
   * is unchanged — the same route, two audiences, one fork, exactly like
   * `app/page.tsx`.
   *
   * The filter is applied here rather than in the query on purpose: the cached
   * `listAgentsForDirectory()` already carries each professional's city list,
   * so filtering in memory keeps one cache entry for every filter state
   * instead of one query per city.
   */
  if (directoryPagesEnabled(vertical.key)) {
    const zones = await listDirectoryZones(vertical);
    const cityName = zones.find((z) => z.slug === params.ciudad)?.name ?? null;
    const rows = (cityName ? agents.filter((a) => a.cities.includes(cityName)) : agents)
      .map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        imageUrl: a.photoUrl,
        isVerified: a.isVerified,
        affiliation: a.agencyName,
        listingCount: a.listingCount,
        cities: a.cities,
        href: agentUrl(a.slug),
      }));
    return (
      <DirectoryList
        d={d}
        title={d.directory.listAgentsTitle}
        subtitle={d.directory.listAgentsSubtitle}
        rows={rows}
        zones={zones}
        activeCity={cityName ? (params.ciudad ?? null) : null}
        basePath="/agentes"
      />
    );
  }

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: c.home, url: "/" },
            { name: c.title, url: "/agentes" },
          ]),
          ...(agents.length > 0
            ? [
                itemListJsonLd(
                  origin,
                  agents.map((a) => ({ title: a.name, url: agentUrl(a.slug) })),
                ),
              ]
            : []),
        ]}
      />

      <PageHero
        kicker={c.kicker}
        title={c.heading}
        subtitle={c.subtitle}
      />

      <Section>
        {agents.length === 0 ? (
          <div className="mk-empty">
            <p>{c.empty}</p>
            <Link className="mk-btn mk-btn--accent" href="/para-inmobiliarias">
              {c.publish}</Link>
          </div>
        ) : (
          <div className="mk-agency-grid">
            {agents.map((a) => (
              <Link key={a.id} className="mk-agency" href={agentUrl(a.slug)}>
                <div className="mk-agency__head">
                  {safeImageUrl(a.photoUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="mk-agency__logo mk-agency__logo--round"
                      src={safeImageUrl(a.photoUrl) ?? undefined}
                      referrerPolicy="no-referrer"
                      alt={a.name}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="mk-agency__logo mk-agency__logo--fallback mk-agency__logo--round"
                      aria-hidden
                    >
                      <Glyph name="building" size={24} />
                    </div>
                  )}
                  <div>
                    <div className="mk-agency__name">
                      {a.name}
                      {a.isVerified && (
                        <span className="mk-agency__verified" title={c.verified}>
                          <Glyph name="check" />
                        </span>
                      )}
                    </div>
                    <div className="mk-agency__cities">
                      {a.agencyName ?? c.independent}
                    </div>
                  </div>
                </div>

                {a.cities.length > 0 && (
                  <div className="mk-chips">
                    {a.cities.map((c) => (
                      <span key={c} className="mk-chip">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mk-agency__meta">
                  <span>
                    {a.listingCount.toLocaleString(numberLocale)}{" "}
                    {a.listingCount === 1 ? c.property : c.properties}
                  </span>
                </div>

                <span className="mk-agency__cta">{c.portfolio}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {agents.some((a) => a.agencySlug) && (
        <Section tone="muted" width="narrow">
          <p className="mk-note">
            {c.directoryIntro}{" "}
            <Link href="/inmobiliarias">{c.directoryLink}</Link>{c.directoryOutro}</p>
        </Section>
      )}

      <CtaBand
        title={c.ctaHeading}
        text={c.ctaBody}
        primary={{ label: c.create, href: "/para-inmobiliarias" }}
        secondary={{ label: c.plans, href: "/planes" }}
      />
    </main>
  );
}
