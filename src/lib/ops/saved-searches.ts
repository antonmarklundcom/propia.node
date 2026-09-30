/**
 * Email alerts for saved searches (`src/lib/saved-searches.ts`): each confirmed
 * search is mailed the listings published since its cursor
 * (`coalesce(last_sent_at, confirmed_at)`), at most one message per search per
 * run, and the cursor moves only when the mail was accepted — so a run that
 * fails or an address that bounces re-offers the same listings next time, and a
 * second run right after finds nothing new. That is the idempotency; nothing
 * else is written.
 *
 * One pass, the same in both modes (AGENTS.md §4): a dry run counts the
 * searches with news and the mail that would go, and stops before sending and
 * before moving any cursor. Without email configured the job does nothing and
 * says so (a cursor must never advance past mail nobody received).
 *
 * The match is `publishedFacetWhere()` — the same WHERE the grid uses — with the
 * door's own filters (`VerticalConfig.filters`) applied, so an alert saved on
 * `terreno.com.py` only ever carries land. Location slugs are resolved here,
 * uncached (a job has no Next.js runtime; `queries.ts`' readers may not run).
 *
 * Scheduled once a day by `/api/cron/tick`; also `npm run cron:saved-searches`
 * and a card on /admin/operaciones. No cache tag: nothing a visitor reads changes.
 */
import "server-only";
import { and, asc, count, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, locations, savedSearches } from "@/db/schema";
import { VERTICALS, type VerticalConfig } from "@/config/verticals";
import { isEmailConfigured } from "@/lib/email";
import { publishedFacetWhere } from "@/lib/facet-sql";
import { formatPrice } from "@/lib/format";
import { listingUrl } from "@/lib/urls";
import type { Locale } from "@/i18n";
import {
  alertsPageUrl,
  describeSearch,
  emailSearchAlert,
  placeNames,
  rowCriteria,
  searchUrl,
  type AlertListing,
} from "@/lib/saved-searches";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

/** Searches handled per run when no limit is given; the rest wait for tomorrow. */
const DEFAULT_LIMIT = 500;
/** Listings named in one message; the rest are "and N more". */
const LISTINGS_PER_MAIL = 5;
/** A search mailed in the last 20 h is skipped, so a second run the same day is a no-op. */
const MIN_GAP_HOURS = 20;

function doorFor(key: string): { host: string; door: VerticalConfig } | null {
  for (const [host, door] of Object.entries(VERTICALS)) {
    if (door.key === key && door.enabled) return { host, door };
  }
  return null;
}

/** City (+ its barrios) or one barrio, by slug. Null = the place is gone. */
async function locationIdsFor(citySlug?: string, barrioSlug?: string): Promise<number[] | null | undefined> {
  if (!citySlug) return undefined;
  const [city] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.slug, citySlug), eq(locations.level, "ciudad")))
    .limit(1);
  if (!city) return null;
  if (barrioSlug) {
    const [barrio] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.slug, barrioSlug), eq(locations.level, "barrio"), eq(locations.parentId, city.id)))
      .limit(1);
    return barrio ? [barrio.id] : null;
  }
  const kids = await db.select({ id: locations.id }).from(locations).where(eq(locations.parentId, city.id));
  return [city.id, ...kids.map((k) => k.id)];
}

export async function runSavedSearches(opts: OpsOptions): Promise<OpsResult> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`invalid limit '${opts.limit}'`);

  return opsRun("cron:saved-searches", opts.dry, async (out) => {
    out.track("busquedas", "con_novedades", "enviados", "sin_puerta", "sin_lugar");
    if (!isEmailConfigured()) {
      out.note("email is not configured (CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_EMAIL_TOKEN): nothing sent, no cursor moved.");
      return;
    }

    const due = await db
      .select()
      .from(savedSearches)
      .where(
        and(
          isNotNull(savedSearches.confirmedAt),
          sql`(${savedSearches.lastSentAt} is null or ${savedSearches.lastSentAt} < now() - interval ${sql.raw(String(MIN_GAP_HOURS))} hour)`,
        ),
      )
      .orderBy(asc(savedSearches.id))
      .limit(limit);

    for (const row of due) {
      out.count("busquedas");
      const criteria = rowCriteria(row);
      const found = doorFor(row.vertical);
      if (!criteria || !found) {
        out.count("sin_puerta");
        continue;
      }
      const locationIds = await locationIdsFor(criteria.citySlug, criteria.barrioSlug);
      if (locationIds === null) {
        out.count("sin_lugar");
        continue;
      }
      const since = row.lastSentAt ?? row.confirmedAt!;
      const where = and(
        publishedFacetWhere(
          {
            operation: criteria.operation,
            propertyType: criteria.propertyType,
            locationIds,
            priceMin: criteria.priceMin,
            priceMax: criteria.priceMax,
            minBedrooms: criteria.minBedrooms,
          },
          found.door,
        ),
        gt(listings.publishedAt, since),
      );
      const [{ n }] = await db.select({ n: count() }).from(listings).where(where);
      const total = Number(n);
      if (total === 0) continue;
      out.count("con_novedades");
      if (opts.dry) continue;

      const rows = await db
        .select({
          title: listings.title,
          titleEn: listings.titleEn,
          slug: listings.slug,
          publicId: listings.publicId,
          priceAmount: listings.priceAmount,
          priceCurrency: listings.priceCurrency,
        })
        .from(listings)
        .where(where)
        .orderBy(desc(listings.publishedAt))
        .limit(LISTINGS_PER_MAIL);

      const origin = `https://${found.host}`;
      const locale = (row.locale === "en" ? "en" : "es") as Locale;
      const items: AlertListing[] = rows.map((l) => ({
        title: locale === "en" ? (l.titleEn ?? l.title) : l.title,
        price: formatPrice({ priceAmount: l.priceAmount, priceCurrency: l.priceCurrency }),
        url: `${origin}${listingUrl(l)}`,
      }));
      const names = await placeNames(criteria);
      const res = await emailSearchAlert({
        to: row.email,
        locale,
        brand: found.door.brand,
        summary: describeSearch(criteria, locale, names),
        total,
        listings: items,
        searchUrl: searchUrl(origin, criteria),
        unsubscribeUrl: alertsPageUrl(origin, row.token),
      });
      // Accepted by the provider — not attempted. Only then does the cursor move.
      if (res.sent) {
        await db.update(savedSearches).set({ lastSentAt: new Date() }).where(eq(savedSearches.id, row.id));
        out.count("enviados");
      }
    }
    if (opts.dry) out.note("--dry: nothing sent, no cursor moved.");
  });
}
