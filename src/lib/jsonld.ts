/**
 * Structured data (ARCHITECTURE.md §4). RealEstateListing + Offer on detail
 * pages, BreadcrumbList everywhere, ItemList on categories. Emitted as a
 * <script type="application/ld+json"> the templates inline. Grounded only in
 * DB fields — never invented values.
 *
 * `origin` is passed in rather than read from the environment: with one
 * deployment behind several domains it is a per-request value (src/lib/origin.ts),
 * and JSON-LD that disagrees with the page's own canonical is a crawl error.
 */
import type { ListingDetail, LocationRow } from "./queries";
import { imageUrl } from "./format";
import { listingUrl } from "./urls";

export function breadcrumbJsonLd(
  origin: string,
  items: { name: string; url: string }[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${origin}${it.url}`,
    })),
  };
}

export function listingJsonLd(origin: string, detail: ListingDetail): object {
  const { listing, images, chain } = detail;
  const isLand = listing.propertyType === "terreno";

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.descriptionEs ?? undefined,
    url: `${origin}${listingUrl(listing)}`,
    image: images
      .map((im) => imageUrl(im.r2Key))
      .filter((u): u is string => !!u),
    datePosted: listing.publishedAt?.toISOString(),
    offers: {
      "@type": "Offer",
      price: Number(listing.priceUsd),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: chain.find((c) => c.level === "ciudad")?.name,
      addressRegion: chain.find((c) => c.level === "departamento")?.name,
      addressCountry: "PY",
    },
    ...(listing.lat && listing.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: Number(listing.lat),
            longitude: Number(listing.lng),
          },
        }
      : {}),
    ...(isLand
      ? {
          about: {
            "@type": "LandParcel",
            ...(listing.landM2
              ? { area: { "@type": "QuantitativeValue", value: Number(listing.landM2), unitCode: "MTK" } }
              : {}),
          },
        }
      : {
          about: {
            "@type": "Residence",
            ...(listing.bedrooms != null
              ? { numberOfRooms: listing.bedrooms }
              : {}),
            ...(listing.areaM2
              ? { floorSize: { "@type": "QuantitativeValue", value: Number(listing.areaM2), unitCode: "MTK" } }
              : {}),
          },
        }),
  };
}

export function itemListJsonLd(
  origin: string,
  urls: { title: string; url: string }[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: urls.length,
    itemListElement: urls.map((u, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: u.title,
      url: `${origin}${u.url}`,
    })),
  };
}

/** Breadcrumb items from a location chain + operation label. */
export function locationBreadcrumb(
  chain: LocationRow[],
  tail?: { name: string; url: string },
): { name: string; url: string }[] {
  const items = [{ name: "Inicio", url: "/" }];
  // location chain contributes names; category/listing pages append the tail.
  for (const loc of chain) {
    items.push({ name: loc.name, url: `/venta/${loc.slug}` });
  }
  if (tail) items.push(tail);
  return items;
}
