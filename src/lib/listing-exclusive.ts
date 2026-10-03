/**
 * Exclusive listings (plan-admin-next O1, `listing_exclusives`, migration
 * 0026) — the only module on that table. **Admin only** (founder decision
 * 2026-10-02): no public page, card, sitemap or JSON-LD reads it.
 *
 * Every read degrades to "not exclusive" so /admin keeps working on a database
 * the migration has not reached yet.
 */
import "server-only";
import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { listingExclusives, listings } from "@/db/schema";
import { recordAdminEvent } from "@/lib/admin-events";
import type { ExclusiveInput } from "@/lib/listing-exclusive-state";

export type ListingExclusiveRow = typeof listingExclusives.$inferSelect;

export async function getListingExclusive(listingId: number): Promise<ListingExclusiveRow | null> {
  try {
    const [row] = await db.select().from(listingExclusives).where(eq(listingExclusives.listingId, listingId)).limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

/** The exclusive rows among these listings, keyed by listing id. */
export async function exclusivesFor(listingIds: number[]): Promise<Map<number, ListingExclusiveRow>> {
  if (listingIds.length === 0) return new Map();
  try {
    const rows = await db.select().from(listingExclusives).where(inArray(listingExclusives.listingId, listingIds));
    return new Map(rows.map((r) => [r.listingId, r]));
  } catch {
    return new Map();
  }
}

export async function countExclusives(): Promise<number> {
  try {
    const [r] = await db
      .select({ n: count() })
      .from(listingExclusives)
      .innerJoin(listings, eq(listings.id, listingExclusives.listingId));
    return Number(r?.n ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Mark or unmark one listing. The caller has already checked the role; the
 * listing must exist. Logged as `listing.exclusive` with before/after.
 * Returns false when the listing does not exist.
 */
export async function saveListingExclusive(p: {
  listingId: number;
  input: ExclusiveInput;
  userId: number;
}): Promise<boolean> {
  const [listing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, p.listingId)).limit(1);
  if (!listing) return false;
  const before = await getListingExclusive(listing.id);
  if (p.input.on) {
    const values = { until: p.input.until, note: p.input.note, setByUserId: p.userId, setAt: new Date() };
    await db
      .insert(listingExclusives)
      .values({ listingId: listing.id, ...values })
      .onDuplicateKeyUpdate({ set: values });
  } else {
    await db.delete(listingExclusives).where(eq(listingExclusives.listingId, listing.id));
  }
  if (Boolean(before) !== p.input.on || (p.input.on && before?.until !== p.input.until)) {
    await recordAdminEvent(p.userId, "listing.exclusive", "listing", listing.id, {
      from: before ? (before.until ?? "sin fecha") : "no",
      to: p.input.on ? (p.input.until ?? "sin fecha") : "no",
    });
  }
  return true;
}
