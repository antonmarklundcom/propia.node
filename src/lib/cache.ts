import { revalidateTag } from "next/cache";

/**
 * Data-cache tags and TTLs for the public site.
 *
 * The public pages are all `force-dynamic` — they read the Host header for
 * the per-host brand and canonical, so no route can hold a full route cache
 * (PLAN.md F17). That makes the *data* cache the only cache the portal has:
 * a page still renders per request, but a cached payload means it renders
 * without touching MySQL. Under a crawl burst or a share spike that is the
 * difference between a template render and N queries per visitor, which is
 * the shape the 503s took.
 *
 * Two rules keep this honest:
 *
 * 1. **Every tag has a writer.** A TTL alone means an operator saves a change
 *    and the public page keeps showing the old one until the timer expires —
 *    which reads as "the save didn't work". Each tag below names the actions
 *    that must call its `revalidate*()` helper. `revalidatePath()` does NOT
 *    clear `unstable_cache` entries; the two caches are separate.
 * 2. **Dates do not survive the cache.** Entries are serialized, so a `Date`
 *    comes back as an ISO string and `string > Date` is silently false (see
 *    ListingCard's featuredUntil re-wrap). A cached query that returns Dates
 *    re-wraps them on the way out, at the call site of the cached function.
 */
export const CACHE_TAGS = {
  /** Published listing rows: home rail, sitemap, cards. */
  listings: "listings",
  /** Agency / agent / developer / project directories, financing and portal counts. */
  directory: "directory",
  /** /guias index and post detail. */
  guides: "guides",
  /** Location rows; seed:locations in the operations panel invalidates these. */
  locations: "locations",
  /** Computed prices and valuation; cron:medians in the panel invalidates these. */
  marketMedians: "market-medians",
  /** Latest USD-to-PYG rate; cron:fx in the panel invalidates this. */
  fx: "fx",
};

/** Seconds. Short enough that a missed writer is a blip, not a bug report. */
export const CACHE_TTL = {
  listings: 600,
  directory: 300,
  guides: 300,
  /** Backstop for location seeding performed outside the Next.js runtime. */
  locations: 3600,
  marketMedians: 21_600,
  /** open.er-api.com's free tier refreshes daily; this is a safety margin, not the cadence. */
  fx: 3600,
} as const;

/**
 * Call after any write that changes which listings are published, or what a
 * published listing says: approve/reject, panel status changes, listing edits,
 * publish-wizard submits, photo changes, import commit and import rollback.
 */
export function revalidateListings(): void {
  revalidateTag(CACHE_TAGS.listings);
  // The directories are derived from published listings — an agency's card
  // shows its listing count and its top three cities — so a listing write
  // moves them too. One extra tag drop beats a second call every writer has
  // to remember.
  revalidateTag(CACHE_TAGS.directory);
}

/** Call after agency / agent / developer / project profile writes or financing seeding. */
export function revalidateDirectory(): void {
  revalidateTag(CACHE_TAGS.directory);
}

/** Call after any post create / update / publish / delete. */
export function revalidateGuides(): void {
  revalidateTag(CACHE_TAGS.guides);
}

/** Call after a successful real cron:medians run in the operations panel. */
export function revalidateMarketMedians(): void {
  revalidateTag(CACHE_TAGS.marketMedians);
  // The home payload and sitemap embed price-city results under listings.
  revalidateTag(CACHE_TAGS.listings);
}

/** Call after a successful real cron:fx run in the operations panel. */
export function revalidateFx(): void {
  revalidateTag(CACHE_TAGS.fx);
}

/** Call after a successful real seed:locations run in the operations panel. */
export function revalidateLocations(): void {
  revalidateTag(CACHE_TAGS.locations);
  // Location names/hierarchies also feed cards, directories, prices and valuation.
  revalidateListings();
  revalidateTag(CACHE_TAGS.marketMedians);
}
