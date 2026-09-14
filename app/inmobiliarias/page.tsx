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
import { agencyUrl } from "@/lib/urls";
import {
  listAgenciesForDirectory,
  listDirectoryZones,
} from "@/lib/directory-queries";
import { DirectoryList } from "@/components/DirectoryList";
import { directoryPagesEnabled } from "@/design/sections";
import { dict, currentLocale } from "@/i18n/server";
import { CtaBand, PageHero, Section } from "@/components/MarketingUI";
import { safeImageUrl } from "@/lib/external-image";

export const dynamic = "force-dynamic";


export async function generateMetadata(): Promise<Metadata> {
  const c = (await dict()).agenciesPage;
  const [brand, directoryOrigin, ownsDirectory, vertical] = await Promise.all([
    brandName(),
    // See app/agentes/page.tsx: the directory page type has its own owner per
    // locale, and it is not simply the host that served the request.
    directoryCanonicalOrigin(),
    hostOwnsDirectory(),
    currentVertical(),
  ]);
  return {
    title: c.metaTitle,
    description: c.description(brand),
    alternates: {
      canonical: `${directoryOrigin}/inmobiliarias`,
      languages: languageAlternates({
        path: "/inmobiliarias",
        scope: "directory",
        family: vertical.family,
      }),
    },
    robots: { index: ownsDirectory, follow: true },
    openGraph: { title: `${c.title} — ${brand}`, description: c.description(brand) },
  };
}

export default async function InmobiliariasPage({
  searchParams,
}: {
  searchParams: Promise<{ ciudad?: string }>;
}) {
  const numberLocale = numberLocaleFor(await currentLocale());
  const c = (await dict()).agenciesPage;
  const [origin, agencies, vertical, d, params] = await Promise.all([
    siteOrigin(),
    listAgenciesForDirectory(),
    currentVertical(),
    dict(),
    searchParams,
  ]);

  // The directory door's rendering — see app/agentes/page.tsx for why the city
  // filter is applied in memory over the cached row set rather than in SQL.
  if (directoryPagesEnabled(vertical.key)) {
    const zones = await listDirectoryZones(vertical);
    const cityName = zones.find((z) => z.slug === params.ciudad)?.name ?? null;
    const rows = (
      cityName ? agencies.filter((a) => a.cities.includes(cityName)) : agencies
    ).map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      imageUrl: a.logoUrl,
      isVerified: a.isVerified,
      affiliation: null,
      listingCount: a.listingCount,
      cities: a.cities,
      href: agencyUrl(a.slug),
    }));
    return (
      <DirectoryList
        d={d}
        title={d.directory.listAgenciesTitle}
        subtitle={d.directory.listAgenciesSubtitle}
        rows={rows}
        zones={zones}
        activeCity={cityName ? (params.ciudad ?? null) : null}
        basePath="/inmobiliarias"
      />
    );
  }

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: c.home, url: "/" },
            { name: c.title, url: "/inmobiliarias" },
          ]),
          ...(agencies.length > 0
            ? [
                itemListJsonLd(
                  origin,
                  agencies.map((a) => ({
                    title: a.name,
                    url: agencyUrl(a.slug),
                  })),
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
        {agencies.length === 0 ? (
          <div className="mk-empty">
            <p>
              {c.empty}</p>
            <Link className="mk-btn mk-btn--accent" href="/para-inmobiliarias">
              {c.join}</Link>
          </div>
        ) : (
          <div className="mk-agency-grid">
            {agencies.map((a) => (
              <Link
                key={a.id}
                className="mk-agency"
                href={agencyUrl(a.slug)}
              >
                <div className="mk-agency__head">
                  {safeImageUrl(a.logoUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="mk-agency__logo"
                      src={safeImageUrl(a.logoUrl) ?? undefined}
                      referrerPolicy="no-referrer"
                      alt={a.name}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="mk-agency__logo mk-agency__logo--fallback"
                      aria-hidden
                    >
                      {a.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="mk-agency__name">
                      {a.name}
                      {a.isVerified && (
                        <span className="mk-agency__verified" title={c.verified}>
                          ✓
                        </span>
                      )}
                    </div>
                    {a.cities.length > 0 && (
                      <div className="mk-agency__cities">
                        {a.cities.join(" · ")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mk-agency__meta">
                  <span>
                    {a.listingCount.toLocaleString(numberLocale)}{" "}
                    {a.listingCount === 1 ? c.property : c.properties}
                  </span>
                  {a.agentCount > 0 && (
                    <span>
                      {a.agentCount} {a.agentCount === 1 ? c.agent : c.agents}
                    </span>
                  )}
                </div>

                <span className="mk-agency__cta">{c.portfolio}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <CtaBand
        title={c.ctaHeading}
        text={c.ctaBody}
        primary={{ label: c.joinCta, href: "/para-inmobiliarias" }}
        secondary={{ label: c.plans, href: "/planes" }}
      />
    </main>
  );
}
