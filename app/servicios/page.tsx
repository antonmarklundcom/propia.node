import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { dict } from "@/i18n/server";
import { currentVertical } from "@/lib/vertical-context";
import { rentalPagesEnabled } from "@/design/sections";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { languageAlternates } from "@/lib/alternates";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { RentalServicesHub } from "@/components/RentalServicesHub";

// Reads the request's host and locale, like every other public route here.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [d, brand, vertical, origin] = await Promise.all([
    dict(),
    brandName(),
    currentVertical(),
    siteOrigin(),
  ]);
  const t = d.rental;
  return {
    // The layout template appends " — <brand>"; OG titles do not inherit it,
    // so the brand is spelled out there.
    title: t.hubMetaTitle,
    description: t.hubMetaDescription(brand),
    alternates: {
      canonical: `${origin}/servicios`,
      languages: languageAlternates({
        path: "/servicios",
        scope: "site",
        family: vertical.family,
      }),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${t.hubMetaTitle} — ${brand}`,
      description: t.hubMetaDescription(brand),
    },
  };
}

/**
 * The rental family's services index. Every other door redirects to `/` —
 * the same rule `/vender` follows off the Spanish door: a route that renders
 * on a door whose sitemap, chrome and hreflang all say it does not exist there
 * is a duplicate-content surface nobody links to.
 */
export default async function ServiciosPage() {
  const [vertical, d, origin] = await Promise.all([
    currentVertical(),
    dict(),
    siteOrigin(),
  ]);
  if (!rentalPagesEnabled(vertical.key)) redirect("/");

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: d.rental.chromeNav[0].label, url: "/" },
            { name: d.rental.servicesTitle, url: "/servicios" },
          ]),
        ]}
      />
      <RentalServicesHub d={d} />
    </>
  );
}
