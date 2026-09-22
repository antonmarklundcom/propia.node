/**
 * Attach demo photos to published listings without real photos.
 * Like backfill-images, cache invalidation belongs to a Next.js caller;
 * the CLI has no incremental cache runtime.
 */
import "server-only";
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { listingImages, listings } from "@/db/schema";
import { isPlaceholderPhoto } from "@/lib/photos";
import manifest from "../../../docs/imagery-manifest.json";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

export interface SamplePhotosOptions extends OpsOptions {
  baseUrl: string;
  replacePlaceholders?: boolean;
}

export async function runSamplePhotos(opts: SamplePhotosOptions): Promise<OpsResult> {
  return opsRun("seed:sample-photos", opts.dry, async (out) => {
    const base = new URL(opts.baseUrl);
    if (!/^https?:$/.test(base.protocol) || base.username || base.password ||
        base.search || base.hash || opts.baseUrl.endsWith("/")) {
      throw new Error("--base must be an absolute HTTP(S) URL without credentials, query, hash or trailing slash.");
    }
    const photos = manifest.images;
    if (photos.length !== 10 || photos.some((photo) =>
      !/^[a-z0-9-]+\.webp$/.test(photo.file) ||
      `${opts.baseUrl}/img/sample/listings/${photo.file}`.length > 500)) {
      throw new Error("Expected ten sample WebP filenames and image URLs of at most 500 characters.");
    }
    const limit = opts.limit && opts.limit > 0 ? Math.floor(opts.limit) : Infinity;
    let cursor = 0;
    let changed = 0;
    out.track("listings", "images", "saved");
    while (changed < limit) {
      const rows = await db.select({ id: listings.id, title: listings.title })
        .from(listings)
        .where(and(eq(listings.status, "published"), gt(listings.id, cursor)))
        .orderBy(asc(listings.id)).limit(100);
      if (!rows.length) break;
      for (const row of rows) {
        cursor = row.id;
        // Use the same eligibility pass in both modes. Lock only on writes,
        // then re-read images so a concurrent change cannot be overwritten.
        const eligible = await db.transaction(async (tx) => {
          const query = tx.select({ id: listings.id }).from(listings)
            .where(and(eq(listings.id, row.id), eq(listings.status, "published")));
          const current = opts.dry ? await query : await query.for("update");
          if (!current.length) return false;
          const imagesQuery = tx.select({ r2Key: listingImages.r2Key })
            .from(listingImages).where(eq(listingImages.listingId, row.id));
          const images = opts.dry ? await imagesQuery : await imagesQuery.for("update");
          if (images.length && (!opts.replacePlaceholders ||
              !images.every((image) => isPlaceholderPhoto(image.r2Key)))) return false;
          if (!opts.dry) {
            if (images.length) await tx.delete(listingImages)
              .where(eq(listingImages.listingId, row.id));
            await tx.insert(listingImages).values([0, 1, 2].map((position) => ({
              listingId: row.id,
              r2Key: `${opts.baseUrl}/img/sample/listings/${photos[(row.id + position) % photos.length].file}`,
              position, width: 1168, height: 880, watermarkScore: 0,
            })));
          }
          return true;
        });
        if (!eligible) continue;
        changed++;
        out.count("listings");
        out.count("images", 3);
        if (opts.dry && changed <= 10) out.note(`  would update #${row.id}: ${row.title}`);
        if (!opts.dry) out.count("saved");
        if (changed >= limit) break;
      }
    }
    if (opts.dry) {
      if (changed > 10) out.note(`  ... and ${changed - 10} more`);
      out.note("--dry: nothing written.");
    }
  });
}
