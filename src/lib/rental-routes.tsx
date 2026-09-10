/**
 * The rental business's own pages, once — served under two sets of URLs.
 *
 * Since R2 (plan §5.1 / Stage 1 C2) `rentparaguay.com` publishes these pages
 * at English paths (`/services/airbnb-management`, `/about`, `/contact`) and
 * `alquiler.com.py` at the Spanish ones it always had. Next needs a route file
 * per URL, so there are two of each — and two route files rendering "the same
 * page" is exactly how one of them quietly grows a different canonical, a
 * different breadcrumb or a stale hreflang map. So the route files hold only
 * the gate (is this door allowed to serve this language's URL?) and everything
 * with a decision in it lives here, called by both.
 *
 * Three rules the helpers encode:
 *
 * - **The canonical is the door's own URL**, built with `rentalPath()` from
 *   `vertical.locale` — never from the route file's language. A door only ever
 *   renders the route file that matches its locale (the gate redirects the
 *   other), so the two agree; deriving from the vertical is what makes that a
 *   fact rather than a coincidence.
 * - **hreflang names each version's own canonical**, via `rentalPathsByLocale()`.
 *   A map that pointed at the other door's Spanish path would be naming a URL
 *   that 301s, which Google discards.
 * - **Two different "no" answers.** A door outside the rental family redirects
 *   to `/` (the page is not theirs to show — the rule `/vender` follows off the
 *   Spanish door); a rental door asked for the *other* language's URL 301s to
 *   its own; an unknown service slug is a 404, because that page exists
 *   nowhere.
 */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { dict } from "@/i18n/server";
import type { Locale } from "@/i18n";
import { currentVertical } from "@/lib/vertical-context";
import {
  rentalPagesEnabled,
  rentalPath,
  rentalPathsByLocale,
  type RentalPageKind,
} from "@/design/sections";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { languageAlternates } from "@/lib/alternates";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import {
  rentalServiceBySlug,
  type RentalService,
} from "@/config/rental-services";
import { RentalServicesHub } from "@/components/RentalServicesHub";
import { RentalServicePage } from "@/components/RentalServicePage";
import type { VerticalConfig } from "@/config/verticals";

/**
 * Let this request through, or send it where it belongs.
 *
 * `routeLocale` is the language of the *route file* calling it. Returns the
 * vertical only when the door is a rental door speaking that language; every
 * other case redirects and never returns.
 */
export async function rentalRouteGate(
  page: RentalPageKind,
  routeLocale: Locale,
  service?: RentalService,
): Promise<VerticalConfig> {
  const vertical = await currentVertical();
  if (!rentalPagesEnabled(vertical.key)) redirect("/");
  if (vertical.locale !== routeLocale) {
    redirect(rentalPath(vertical.locale, page, service));
  }
  return vertical;
}

/** Canonical + hreflang for one of these pages, on the door that served it. */
async function rentalAlternates(
  page: RentalPageKind,
  vertical: VerticalConfig,
  service?: RentalService,
): Promise<Metadata["alternates"]> {
  const origin = await siteOrigin();
  return {
    canonical: `${origin}${rentalPath(vertical.locale, page, service)}`,
    languages: languageAlternates({
      path: rentalPath(vertical.locale, page, service),
      pathByLocale: rentalPathsByLocale(page, service),
      scope: "site",
      family: vertical.family,
    }),
  };
}

// ---------------------------------------------------------------- hub

export async function rentalHubMetadata(): Promise<Metadata> {
  const [d, brand, vertical] = await Promise.all([
    dict(),
    brandName(),
    currentVertical(),
  ]);
  const t = d.rental;
  return {
    // The layout template appends " — <brand>"; OG titles do not inherit it,
    // so the brand is spelled out there.
    title: t.hubMetaTitle,
    description: t.hubMetaDescription(brand),
    alternates: await rentalAlternates("services", vertical),
    robots: { index: true, follow: true },
    openGraph: {
      title: `${t.hubMetaTitle} — ${brand}`,
      description: t.hubMetaDescription(brand),
    },
  };
}

export async function RentalHubBody({ routeLocale }: { routeLocale: Locale }) {
  const vertical = await rentalRouteGate("services", routeLocale);
  const [d, origin] = await Promise.all([dict(), siteOrigin()]);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: d.rental.chromeNav[0].label, url: "/" },
            {
              name: d.rental.servicesTitle,
              url: rentalPath(vertical.locale, "services"),
            },
          ]),
        ]}
      />
      <RentalServicesHub d={d} locale={vertical.locale} />
    </>
  );
}

// ------------------------------------------------------------- service

export async function rentalServiceMetadata(
  slug: string,
  routeLocale: Locale,
): Promise<Metadata> {
  const [d, brand, vertical] = await Promise.all([
    dict(),
    brandName(),
    currentVertical(),
  ]);
  const service = rentalServiceBySlug(slug, routeLocale);
  if (!service) return { title: d.rental.servicesTitle };
  const c = d.rentalServices[service.dictKey];
  return {
    title: c.metaTitle,
    description: c.metaDescription(brand),
    alternates: await rentalAlternates("services", vertical, service),
    robots: { index: true, follow: true },
    openGraph: {
      title: `${c.metaTitle} — ${brand}`,
      description: c.metaDescription(brand),
    },
  };
}

export async function RentalServiceBody({
  slug,
  routeLocale,
}: {
  slug: string;
  routeLocale: Locale;
}) {
  // Resolve the slug in the route file's own language first: on the wrong door
  // the gate below sends it to the same service's other URL, and it can only
  // do that if it knows which service was asked for.
  const service = rentalServiceBySlug(slug, routeLocale);
  const vertical = await rentalRouteGate(
    "services",
    routeLocale,
    service ?? undefined,
  );
  if (!service) notFound();

  const [d, origin] = await Promise.all([dict(), siteOrigin()]);
  const c = d.rentalServices[service.dictKey];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: d.rental.chromeNav[0].label, url: "/" },
            {
              name: d.rental.servicesTitle,
              url: rentalPath(vertical.locale, "services"),
            },
            {
              name: c.h1,
              url: rentalPath(vertical.locale, "services", service),
            },
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

// ------------------------------------------------------ about / contact

/**
 * The rental branch's metadata for `/nosotros` ↔ `/about` and `/contacto` ↔
 * `/contact`. Shared with the marketplace route files, which call it only
 * inside their existing `rentalPagesEnabled()` fork — those two routes keep
 * their marketplace half, so unlike the hub they are not thin wrappers.
 */
export async function rentalAboutMetadata(): Promise<Metadata> {
  const [d, brand, vertical] = await Promise.all([
    dict(),
    brandName(),
    currentVertical(),
  ]);
  const a = d.rental.about;
  return {
    title: a.metaTitle,
    description: a.metaDescription(brand),
    alternates: await rentalAlternates("about", vertical),
    openGraph: {
      title: `${a.metaTitle} — ${brand}`,
      description: a.metaDescription(brand),
    },
  };
}

export async function rentalContactMetadata(): Promise<Metadata> {
  const [d, brand, vertical] = await Promise.all([
    dict(),
    brandName(),
    currentVertical(),
  ]);
  const c = d.rental.contact;
  return {
    title: c.metaTitle,
    description: c.metaDescription(brand),
    alternates: await rentalAlternates("contact", vertical),
    openGraph: {
      title: `${c.metaTitle} — ${brand}`,
      description: c.metaDescription(brand),
    },
  };
}

/**
 * The one line the Spanish `/nosotros` and `/contacto` route files need: an
 * English rental door asked for a Spanish rental URL is sent to its own. Every
 * other door — including `realestateinparaguay.com`, which is English but
 * *marketplace*, and whose `/nosotros` is its own page — falls straight
 * through.
 */
export function redirectRentalToEnglish(
  vertical: VerticalConfig,
  page: RentalPageKind,
  service?: RentalService,
): void {
  if (rentalPagesEnabled(vertical.key) && vertical.locale === "en") {
    redirect(rentalPath("en", page, service));
  }
}
