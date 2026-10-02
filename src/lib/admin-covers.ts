/**
 * Cover photos for the rows an admin table shows: one query for all of them
 * (`listing_images` position 0), read through `imageThumbUrl()` — the same
 * thumb derivative ListingCard uses — so a sample photo, an R2 key and a
 * remote import URL all resolve the way the public cards do.
 */
import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { listingImages } from "@/db/schema";
import { imageThumbUrl } from "@/lib/format";

export async function getCoverThumbs(listingIds: readonly number[]): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  if (listingIds.length === 0) return out;
  const rows = await db
    .select({ listingId: listingImages.listingId, r2Key: listingImages.r2Key })
    .from(listingImages)
    .where(and(inArray(listingImages.listingId, [...listingIds]), eq(listingImages.position, 0)))
    .orderBy(listingImages.id);
  for (const r of rows) {
    const url = imageThumbUrl(r.r2Key);
    // The oldest position-0 row wins, like a cover chosen first.
    if (url && !out.has(r.listingId)) out.set(r.listingId, url);
  }
  return out;
}
