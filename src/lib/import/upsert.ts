/**
 * Import pipeline (ARCHITECTURE.md §2.4, M2): normalize → dedup → upsert.
 * The one place that writes listings + listing_sources from an intake.
 *
 * Decision tree per raw row:
 *   1. Same (source, source_external_id) already seen?
 *        → content changed:  update listing + bump last_seen  [updated]
 *        → identical:        bump last_seen only              [unchanged]
 *   2. Else dedup_key matches an existing listing (any source)?
 *        → attach a new listing_sources row to it            [deduped]
 *   3. Else create a new pending_review listing + source      [created]
 *
 * Re-running the same file therefore lands entirely in (1) → zero duplicates,
 * which is the M2 gate.
 */
import { and, eq } from "drizzle-orm";
import type { db as Db } from "../../db";
import {
  listingImages,
  listings,
  listingSources,
  locations,
} from "../../db/schema";
import { slugify } from "../slug";
import {
  contentHash as computeContentHash,
  dedupKey as computeDedupKey,
  makePublicId,
  toPriceUsd,
  canon,
} from "./normalize";
import type { ImportReport, RawListing } from "./types";

const LEVEL_RANK: Record<string, number> = {
  barrio: 4,
  ciudad: 3,
  departamento: 2,
  pais: 1,
};

/** In-memory location resolver built once per import run. */
async function buildLocationResolver(db: typeof Db) {
  const rows = await db
    .select({
      id: locations.id,
      fullSlug: locations.fullSlug,
      name: locations.name,
      level: locations.level,
    })
    .from(locations);

  const bySlug = new Map<string, number>();
  const byName = new Map<string, { id: number; rank: number }>();
  for (const r of rows) {
    bySlug.set(r.fullSlug, r.id);
    const key = canon(r.name);
    const rank = LEVEL_RANK[r.level] ?? 0;
    const prev = byName.get(key);
    // On duplicate names, keep the most specific level (barrio > ciudad …).
    if (!prev || rank > prev.rank) byName.set(key, { id: r.id, rank });
  }
  return (raw: RawListing): number | null => {
    if (raw.locationFullSlug) {
      const id = bySlug.get(raw.locationFullSlug);
      if (id) return id;
    }
    if (raw.locationName) {
      const hit = byName.get(canon(raw.locationName));
      if (hit) return hit.id;
    }
    return null;
  };
}

export interface ImportOptions {
  usdToPyg?: number;
  /** Publish new listings immediately instead of pending_review. Use for
   *  trusted white-glove batches / demo seeding; leave off for scraped sources. */
  publish?: boolean;
}

export async function importListings(
  db: typeof Db,
  rows: RawListing[],
  opts: ImportOptions = {},
): Promise<ImportReport> {
  const usdToPyg = opts.usdToPyg ?? Number(process.env.USD_TO_PYG ?? 7300);
  const resolveLocation = await buildLocationResolver(db);
  const report: ImportReport = {
    created: 0,
    updated: 0,
    unchanged: 0,
    deduped: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    try {
      const locationId = resolveLocation(raw);
      if (locationId === null) {
        report.skipped++;
        report.errors.push({
          row: i + 1,
          reason: `unresolved location '${raw.locationFullSlug ?? raw.locationName}'`,
        });
        continue;
      }

      const priceUsd = toPriceUsd(raw.priceAmount, raw.priceCurrency, usdToPyg);
      const cHash = computeContentHash(raw, priceUsd);
      const dKey = computeDedupKey(raw, priceUsd, locationId);
      const now = new Date();

      // (1) Have we seen this exact source row before?
      if (raw.sourceExternalId) {
        const [existing] = await db
          .select({
            id: listingSources.id,
            listingId: listingSources.listingId,
            contentHash: listingSources.contentHash,
          })
          .from(listingSources)
          .where(
            and(
              eq(listingSources.source, raw.source),
              eq(listingSources.sourceExternalId, raw.sourceExternalId),
            ),
          )
          .limit(1);

        if (existing) {
          if (existing.contentHash === cHash) {
            await db
              .update(listingSources)
              .set({ lastSeenAt: now })
              .where(eq(listingSources.id, existing.id));
            report.unchanged++;
          } else {
            await applyListingFields(db, existing.listingId, raw, priceUsd, locationId);
            await syncImages(db, existing.listingId, raw.imageUrls);
            await db
              .update(listingSources)
              .set({ contentHash: cHash, dedupKey: dKey, lastSeenAt: now })
              .where(eq(listingSources.id, existing.id));
            report.updated++;
          }
          continue;
        }
      }

      // (2) Does this property already exist under a different source?
      const [dup] = await db
        .select({ listingId: listingSources.listingId })
        .from(listingSources)
        .where(eq(listingSources.dedupKey, dKey))
        .limit(1);

      if (dup) {
        await db.insert(listingSources).values({
          listingId: dup.listingId,
          source: raw.source,
          sourceUrl: raw.sourceUrl,
          sourceExternalId: raw.sourceExternalId,
          contentHash: cHash,
          dedupKey: dKey,
          firstSeenAt: now,
          lastSeenAt: now,
        });
        report.deduped++;
        continue;
      }

      // (3) Brand new listing → pending_review (or published, if opts.publish).
      const listingId = await insertListing(
        db,
        raw,
        priceUsd,
        locationId,
        opts.publish ?? false,
      );
      await syncImages(db, listingId, raw.imageUrls);
      await db.insert(listingSources).values({
        listingId,
        source: raw.source,
        sourceUrl: raw.sourceUrl,
        sourceExternalId: raw.sourceExternalId,
        contentHash: cHash,
        dedupKey: dKey,
        firstSeenAt: now,
        lastSeenAt: now,
      });
      report.created++;
    } catch (e) {
      report.skipped++;
      report.errors.push({ row: i + 1, reason: String(e) });
    }
  }

  return report;
}

/** Columns shared by insert and update (everything the source controls). */
function listingFields(raw: RawListing, priceUsd: number, locationId: number) {
  return {
    operation: raw.operation,
    propertyType: raw.propertyType,
    title: raw.title,
    descriptionEs: raw.descriptionEs,
    priceAmount: raw.priceAmount.toFixed(2),
    priceCurrency: raw.priceCurrency,
    priceUsd: priceUsd.toFixed(2),
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    parking: raw.parking,
    areaM2: raw.areaM2 != null ? raw.areaM2.toString() : undefined,
    landM2: raw.landM2 != null ? raw.landM2.toString() : undefined,
    propertyState: raw.propertyState,
    locationId,
    addressText: raw.addressText,
    lat: raw.lat != null ? raw.lat.toString() : undefined,
    lng: raw.lng != null ? raw.lng.toString() : undefined,
  };
}

async function insertListing(
  db: typeof Db,
  raw: RawListing,
  priceUsd: number,
  locationId: number,
  publish: boolean,
): Promise<number> {
  const publicId = makePublicId();
  const slug = slugify(raw.title);
  const [res] = await db.insert(listings).values({
    publicId,
    slug,
    status: publish ? "published" : "pending_review",
    publishedAt: publish ? new Date() : undefined,
    ...listingFields(raw, priceUsd, locationId),
  });
  // mysql2 returns insertId on the ResultSetHeader.
  return Number((res as unknown as { insertId: number }).insertId);
}

/** Update the source-controlled fields on an existing listing (no status change). */
async function applyListingFields(
  db: typeof Db,
  listingId: number,
  raw: RawListing,
  priceUsd: number,
  locationId: number,
) {
  await db
    .update(listings)
    .set(listingFields(raw, priceUsd, locationId))
    .where(eq(listings.id, listingId));
}

/**
 * Replace a listing's images from the source URLs. INTERIM: we store the
 * source URL in r2Key so photos render immediately (imageUrl() passes the key
 * through when R2_PUBLIC_BASE_URL is unset). The later R2 fetch pass (M6)
 * downloads these, watermark-scores them, and rewrites r2Key to real R2 keys.
 * Empty/absent list → leave existing images untouched.
 */
async function syncImages(
  db: typeof Db,
  listingId: number,
  urls: string[] | undefined,
) {
  if (!urls || urls.length === 0) return;
  await db.delete(listingImages).where(eq(listingImages.listingId, listingId));
  await db.insert(listingImages).values(
    urls.slice(0, 20).map((url, i) => ({
      listingId,
      r2Key: url,
      position: i,
    })),
  );
}
