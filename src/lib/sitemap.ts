/**
 * Sitemap builder (ARCHITECTURE.md §4). Emits listing detail URLs + every
 * INDEXABLE category page — using the SAME getIndexability() rule the page
 * templates use, so the sitemap and the pages can never disagree (that
 * agreement is what keeps this out of doorway-page territory).
 *
 * One query for listings + one for locations, aggregated in memory. At 15k
 * listings this is trivial; chunked child sitemaps (Next generateSitemaps)
 * are an M6 scale concern, not a launch one.
 */
import { eq } from "drizzle-orm";
import { db } from "../db";
import { listings, locations } from "../db/schema";
import { getIndexability } from "./indexability";
import { categoryUrl } from "./urls";
import { listingUrl } from "./urls";
import type { Operation, PropertyType } from "./import/types";

export interface SitemapEntry {
  path: string;
  lastmod?: Date;
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const locs = await db
    .select({
      id: locations.id,
      slug: locations.slug,
      level: locations.level,
      parentId: locations.parentId,
    })
    .from(locations);
  const locById = new Map(locs.map((l) => [l.id, l]));

  const pub = await db
    .select({
      slug: listings.slug,
      publicId: listings.publicId,
      updatedAt: listings.updatedAt,
      locationId: listings.locationId,
      operation: listings.operation,
      propertyType: listings.propertyType,
    })
    .from(listings)
    .where(eq(listings.status, "published"));

  const entries: SitemapEntry[] = [];

  // 1. Listing detail pages — always indexable when published.
  for (const l of pub) {
    entries.push({
      path: listingUrl({ slug: l.slug, publicId: l.publicId }),
      lastmod: l.updatedAt,
    });
  }

  // 2. Aggregate category counts (city, city-type, barrio-type).
  const cityCount = new Map<string, number>();
  const cityTypeCount = new Map<string, number>();
  const barrioTypeCount = new Map<string, number>();

  const cityOf = (locationId: number) => {
    const loc = locById.get(locationId);
    if (!loc) return null;
    if (loc.level === "ciudad") return loc;
    if (loc.level === "barrio" && loc.parentId)
      return locById.get(loc.parentId) ?? null;
    return null;
  };

  for (const l of pub) {
    const loc = locById.get(l.locationId);
    const city = cityOf(l.locationId);
    if (!city) continue;
    const op = l.operation as Operation;
    const type = l.propertyType as PropertyType;

    cityCount.set(`${op}|${city.id}`, (cityCount.get(`${op}|${city.id}`) ?? 0) + 1);
    cityTypeCount.set(
      `${op}|${city.id}|${type}`,
      (cityTypeCount.get(`${op}|${city.id}|${type}`) ?? 0) + 1,
    );
    if (loc && loc.level === "barrio") {
      barrioTypeCount.set(
        `${op}|${loc.id}|${type}`,
        (barrioTypeCount.get(`${op}|${loc.id}|${type}`) ?? 0) + 1,
      );
    }
  }

  const cityIndexable = new Set<string>();
  for (const [key, n] of cityCount) {
    const [op, cityId] = key.split("|");
    const city = locById.get(Number(cityId));
    if (!city) continue;
    if (getIndexability({ listingCount: n }).state === "index") {
      cityIndexable.add(key);
      entries.push({
        path: categoryUrl({ operation: op as Operation, citySlug: city.slug }),
      });
    }
  }

  for (const [key, n] of cityTypeCount) {
    const [op, cityId, type] = key.split("|");
    const city = locById.get(Number(cityId));
    if (!city) continue;
    if (getIndexability({ listingCount: n }).state === "index") {
      entries.push({
        path: categoryUrl({
          operation: op as Operation,
          citySlug: city.slug,
          type: type as PropertyType,
        }),
      });
    }
  }

  for (const [key, n] of barrioTypeCount) {
    const [op, barrioId, type] = key.split("|");
    const barrio = locById.get(Number(barrioId));
    if (!barrio || !barrio.parentId) continue;
    const city = locById.get(barrio.parentId);
    if (!city) continue;
    // Barrio pages require an indexable parent city page.
    const parentIndexable = cityIndexable.has(`${op}|${city.id}`);
    if (
      getIndexability({ listingCount: n, parentIndexable }).state === "index"
    ) {
      entries.push({
        path: categoryUrl({
          operation: op as Operation,
          citySlug: city.slug,
          barrioSlug: barrio.slug,
          type: type as PropertyType,
        }),
      });
    }
  }

  return entries;
}
