/**
 * Seller financing on one listing (plan-admin-next O8, `listing_financing`,
 * migration 0024) — the only module on that table.
 *
 * Off by default. The publisher (or /admin) switches it on from the listing's
 * edit page and types their own terms; the listing page then shows those
 * terms, labelled "Datos provistos por <publisher>, no por el portal", instead
 * of the site-wide estimated cuota. The cached `cuota_gs` is cleared when it
 * is switched on (so cards drop the estimate too) and `cron:cuotas` keeps it
 * cleared; switched off, the next `cron:cuotas` run brings the estimate back —
 * the same "cleared here, recomputed by the cron" rule as a price edit.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listingFinancing, listings } from "@/db/schema";
import { revalidateListings } from "@/lib/cache";
import { getEditableListing, type EditScope } from "@/lib/listing-edit";
import type { FinancingInput } from "@/lib/listing-financing-form";

export type ListingFinancingRow = typeof listingFinancing.$inferSelect;

/** The edit pages' current values (switched on or not), or null. */
export async function getListingFinancing(listingId: number): Promise<ListingFinancingRow | null> {
  const [row] = await db
    .select()
    .from(listingFinancing)
    .where(eq(listingFinancing.listingId, listingId))
    .limit(1);
  return row ?? null;
}

/**
 * The public listing page's read: the terms only while switched on. A failed
 * read (MySQL unwell, or the table missing on a database the migration has not
 * reached) is "no seller financing" — the page keeps the estimated cuota it
 * showed before this feature, never an error page.
 */
export async function getPublicListingFinancing(listingId: number): Promise<ListingFinancingRow | null> {
  try {
    const row = await getListingFinancing(listingId);
    return row?.enabled ? row : null;
  } catch {
    return null;
  }
}

/**
 * Save the form for one listing. The scope is checked by
 * `getEditableListing()` — the same WHERE every edit of that page already
 * goes through — so a forged id outside the editor's scope saves nothing.
 * Returns false when the listing is not theirs.
 */
export async function saveListingFinancing(p: {
  scope: EditScope;
  listingId: number;
  input: FinancingInput;
  userId: number;
}): Promise<boolean> {
  const listing = await getEditableListing(p.listingId, p.scope);
  if (!listing) return false;

  const values = {
    enabled: p.input.enabled,
    entity: p.input.entity,
    rate: p.input.rate,
    term: p.input.term,
    downPayment: p.input.downPayment,
    notes: p.input.notes,
    updatedByUserId: p.userId,
    updatedAt: new Date(),
  };
  await db.transaction(async (tx) => {
    await tx
      .insert(listingFinancing)
      .values({ listingId: listing.id, ...values })
      .onDuplicateKeyUpdate({ set: values });
    // The estimate goes as soon as the publisher's own terms are on, on the
    // cards too. Turning them off leaves it cleared until cron:cuotas runs.
    if (p.input.enabled) {
      await tx.update(listings).set({ cuotaGs: null }).where(eq(listings.id, listing.id));
    }
  });
  revalidateListings();
  return true;
}
