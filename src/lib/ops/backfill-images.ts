/**
 * Pull remote listing photos into R2 (ARCHITECTURE.md M0/M6).
 *
 * The CSV importer parks the *source URL* in `listing_images.r2_key` and defers
 * the fetch — so today the site hotlinks other people's servers. This walks every
 * row whose key is still a URL, downloads it, runs it through the same processing
 * the panel upload uses, stores it under a real R2 key and rewrites the row.
 *
 * Idempotent: rows already holding an R2 key are skipped, so a re-run only picks
 * up what failed or arrived since. Placeholder picsum rows are skipped by default
 * — copying fake stock photos into the bucket is not the point.
 *
 * **Blocked on the bucket, not on code** (CLAUDE.md backlog 1/5): without the
 * `R2_*` env vars a real run refuses, and the operations page keeps this card
 * disabled until `isR2Configured()`. The dry run works either way, which is what
 * makes "how much is still hotlinked?" answerable today.
 *
 * Sequential on purpose: sharp is CPU-bound and the source hosts are someone
 * else's. A backfill has all night; it must not look like a scrape.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listingImages, listings } from "@/db/schema";
import { isPlaceholderPhoto } from "@/lib/photos";
import {
  buildImageKey,
  processListingImage,
  STORED_CONTENT_TYPE,
  thumbKey,
} from "@/lib/images";
import { isR2Configured, putObject } from "@/lib/r2";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

export interface BackfillImagesOptions extends OpsOptions {
  /** Also copy the picsum.photos demo rows. Off by default. */
  includePlaceholders?: boolean;
}

const FETCH_TIMEOUT_MS = 20_000;
/** How many failures are named before collapsing to a count. */
const SAMPLE = 20;

/** A key that is still a URL has never been stored by us. */
function isRemoteUrl(key: string): boolean {
  return /^https?:\/\//i.test(key);
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // Some source sites 403 an unidentified client.
    headers: { "user-agent": "propia-image-backfill/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function runBackfillImages(
  opts: BackfillImagesOptions,
): Promise<OpsResult> {
  return opsRun("backfill:images", opts.dry, async (out) => {
    if (!opts.dry && !isR2Configured()) {
      throw new Error(
        "R2 is not configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
          "R2_SECRET_ACCESS_KEY and R2_BUCKET first (CLAUDE.md backlog 1).",
      );
    }
    if (!isR2Configured()) {
      out.note("R2 is not configured — a real run would refuse. Counts below are still real.");
    }

    const rows = await db
      .select({
        id: listingImages.id,
        r2Key: listingImages.r2Key,
        publicId: listings.publicId,
      })
      .from(listingImages)
      .innerJoin(listings, eq(listingImages.listingId, listings.id));

    const pending = rows.filter((row) => {
      if (!isRemoteUrl(row.r2Key)) return false; // already ours
      if (!opts.includePlaceholders && isPlaceholderPhoto(row.r2Key)) return false;
      return true;
    });

    const limit = opts.limit && opts.limit > 0 ? opts.limit : 0;
    const work = limit > 0 ? pending.slice(0, limit) : pending;

    out.count("filas_de_imagen", rows.length);
    out.count("aun_remotas", pending.length);
    out.count("en_esta_tanda", work.length);
    out.track("guardadas", "fallaron");

    if (opts.dry) {
      for (const row of work.slice(0, SAMPLE)) {
        out.note(`  would fetch ${row.r2Key} → listings/${row.publicId}/…`);
      }
      if (work.length > SAMPLE) out.note(`  … and ${work.length - SAMPLE} more`);
      out.note("--dry: nothing downloaded, nothing stored.");
      return;
    }

    let failures = 0;
    for (const row of work) {
      try {
        const processed = await processListingImage(await download(row.r2Key));
        const key = buildImageKey(row.publicId);

        await putObject(key, processed.full, STORED_CONTENT_TYPE);
        await putObject(thumbKey(key), processed.thumb, STORED_CONTENT_TYPE);

        // Rewrite last: if anything above threw, the row still points at the
        // source and the next run retries it.
        await db
          .update(listingImages)
          .set({ r2Key: key, width: processed.width, height: processed.height })
          .where(eq(listingImages.id, row.id));

        out.count("guardadas");
      } catch (err) {
        out.count("fallaron");
        failures++;
        if (failures <= SAMPLE) out.note(`  #${row.id} ${row.r2Key}: ${String(err)}`);
      }
    }
    if (failures > SAMPLE) out.note(`  … and ${failures - SAMPLE} more failures`);
    if (failures > 0) out.note("Failed rows still point at their source — safe to re-run.");
  });
}
