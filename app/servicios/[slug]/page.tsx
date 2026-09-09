import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { dict } from "@/i18n/server";
import { currentVertical } from "@/lib/vertical-context";
import { rentalPagesEnabled } from "@/design/sections";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { languageAlternates } from "@/lib/alternates";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { RENTAL_SERVICES } from "@/config/rental-services";
import { RentalServicePage } from "@/components/RentalServicePage";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/** The config row for a URL segment, or null — the one lookup both halves use. */
function serviceFor(slug: string) {
  return RENTAL_SERVICES.find((s) => s.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceFor(slug);
  const [d, brand, vertical, origin] = await Promise.all([
    dict(),
    brandName(),
    currentVertical(),
    siteOrigin(),
  ]);
  if (!service) return { title: d.rental.servicesTitle };
  const c = d.rentalServices[service.dictKey];
  const path = `/servicios/${service.slug}`;
  return {
    title: c.metaTitle,
    description: c.metaDescription(brand),
    alternates: {
      canonical: `${origin}${path}`,
      languages: languageAlternates({
        path,
        scope: "site",
        family: vertical.family,
      }),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${c.metaTitle} — ${brand}`,
      description: c.metaDescription(brand),
    },
  };
}

/**
 * One service page. Two different "no" answers, deliberately: a door outside
 * the rental family redirects to `/` (the page is not theirs to show, exactly
 * as `/vender` is not the English door's), while an unknown slug on a rental
 * door is a 404 (the page really does not exist anywhere).
 */
export default async function ServicioPage({ params }: Params) {
  const { slug } = await params;
  const [vertical, d, origin] = await Promise.all([
    currentVertical(),
    dict(),
    siteOrigin(),
  ]);
  if (!rentalPagesEnabled(vertical.key)) redirect("/");

  const service = serviceFor(slug);
  if (!service) notFound();

  const c = d.rentalServices[service.dictKey];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: d.rental.chromeNav[0].label, url: "/" },
            { name: d.rental.servicesTitle, url: "/servicios" },
            { name: c.h1, url: `/servicios/${service.slug}` },
          ]),
          // Only when the page actually shows an FAQ — structured data that
          // describes markup the visitor cannot see is the kind of mismatch
          // Search Console reports.
          ...(c.faq.length > 0 ? [faqJsonLd([...c.faq])] : []),
        ]}
      />
      <RentalServicePage service={service} d={d} locale={vertical.locale} />
    </>
  );
}
