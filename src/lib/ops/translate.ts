/**
 * Fill `listings.title_en` / `description_en` from the Spanish source (PLAN.md
 * D6, Batch 3 layer 3).
 *
 * Provider order: DeepL, then Gemini, then Claude — any subset of the three keys
 * may be set; a row falls through to the next configured provider if one throws.
 * See `src/lib/translate.ts` for why that order (DeepL's free "Developer" tier is
 * a ONE-TIME character credit, not a recurring monthly one).
 *
 * **Always pass a `limit`.** Every row is a paid API call against a credit that
 * does not refill on its own, which is why `/admin/operaciones` makes the field
 * mandatory (§1.8 of `fable-plan-ops.md`) even though the CLI allows an unbounded
 * run.
 *
 * **What needs translating** is decided by `translation_hash`: the sha256 of the
 * title and Spanish description the stored English was made from. A row needs
 * work when the hash is missing (never translated) or no longer matches (the
 * seller rewrote something). That is why the job can run on a schedule and cost
 * nothing on a quiet day, and why an edit is picked up without any hook in the
 * publish path — `src/lib/translate.ts` explains why there must not be one.
 *
 * Only `published` rows are translated: a draft is still being written, and a
 * removed listing is not on the English door either.
 *
 * **Failure is per row and never fatal.** A row that throws keeps its old hash,
 * so the next run tries it again; every failure is reported in `notes` and
 * counted under `fallaron`, and the caller decides what a partial run means (the
 * CLI exits non-zero, so a cron that mails its output says something went wrong
 * without pretending the whole batch died).
 */
import "server-only";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import {
  isTranslationConfigured,
  translateListing,
  translationSourceHash,
} from "@/lib/translate";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

/** Rows fetched per round trip. The API call dominates; this is just paging. */
const PAGE = 500;

export interface TranslateOptions extends OpsOptions {
  /** One listing, ignoring its hash. */
  id?: number | null;
  /** Re-translate every published row even when the hash still matches. */
  force?: boolean;
}

interface Candidate {
  id: number;
  title: string;
  descriptionEs: string | null;
  translationHash: string | null;
}

/**
 * Published rows that need work, paged by id.
 *
 * The hash comparison happens here rather than in SQL on purpose: hashing in the
 * database means `SHA2()`, which is MySQL's spelling and not Postgres's, and
 * ARCHITECTURE.md keeps that escape hatch open. Four columns over the published
 * set is a cron-shaped cost, not a request-shaped one.
 */
async function* candidates(
  onlyId: number | null,
  force: boolean,
): AsyncGenerator<Candidate> {
  let after = 0;
  for (;;) {
    const rows = await db
      .select({
        id: listings.id,
        title: listings.title,
        descriptionEs: listings.descriptionEs,
        translationHash: listings.translationHash,
      })
      .from(listings)
      .where(
        and(
          eq(listings.status, "published"),
          gt(listings.id, after),
          onlyId ? eq(listings.id, onlyId) : undefined,
        ),
      )
      .orderBy(asc(listings.id))
      .limit(PAGE);

    if (rows.length === 0) return;
    after = rows[rows.length - 1].id;

    for (const row of rows) {
      const wanted = translationSourceHash(row);
      if (force || onlyId || row.translationHash !== wanted) yield row;
    }
    if (rows.length < PAGE) return;
  }
}

export async function runTranslate(opts: TranslateOptions): Promise<OpsResult> {
  return opsRun("cron:translate", opts.dry, async (out) => {
    if (!isTranslationConfigured() && !opts.dry) {
      throw new Error(
        "None of DEEPL_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY is set — nothing was " +
          "translated. This is a disabled feature, not a failure: the English door reads " +
          "title_en/description_en straight from the row and simply shows the Spanish " +
          "text until they are filled.",
      );
    }
    if (!isTranslationConfigured()) {
      out.note(
        "No translation provider key is set — a real run would refuse. The candidate " +
          "list below is still accurate.",
      );
    }

    const onlyId = opts.id ?? null;
    const limit = opts.limit && opts.limit > 0 ? opts.limit : Infinity;
    if (limit === Infinity) {
      out.note(
        "No limit given — every candidate is translated. DeepL's Developer credit is " +
          "one-time; prefer a bounded run.",
      );
    }

    out.track("pendientes", "traducidos", "fallaron", "postergados");

    let done = 0;
    for await (const row of candidates(onlyId, opts.force ?? false)) {
      out.count("pendientes");
      if (done >= limit) {
        out.count("postergados"); // keep counting so the tail is reported
        continue;
      }

      if (opts.dry) {
        out.note(`  would translate #${row.id}  ${row.title.slice(0, 60)}`);
        done++;
        out.count("traducidos");
        continue;
      }

      try {
        const t = await translateListing(row);
        /**
         * The hash is written from the same row we translated, in the same
         * statement as the text. If the seller edits the description while this
         * call is in flight, the hash we store is the *old* source's — which is
         * exactly right: it no longer matches, so the next run redoes it. The
         * opposite (hash the row as it is now) would silently keep a translation
         * of text nobody can see any more.
         */
        await db
          .update(listings)
          .set({
            titleEn: t.titleEn,
            descriptionEn: t.descriptionEn,
            translationHash: translationSourceHash(row),
          })
          .where(eq(listings.id, row.id));
        done++;
        out.count("traducidos");
        out.note(`  #${row.id}  ${t.titleEn.slice(0, 60)}`);
      } catch (err) {
        out.count("fallaron");
        out.note(`  #${row.id} FAILED: ${(err as Error).message}`);
      }
    }

    /**
     * Coverage, because the flip decision in PLAN.md D6 is "only once translation
     * coverage looks solid" and that should be a number someone can read rather
     * than a feeling.
     */
    const [cov] = await db
      .select({
        total: sql<number>`count(*)`,
        translated: sql<number>`sum(case when ${listings.titleEn} is not null then 1 else 0 end)`,
      })
      .from(listings)
      .where(eq(listings.status, "published"));

    const total = Number(cov?.total ?? 0);
    const translated = Number(cov?.translated ?? 0);
    out.count("con_ingles", translated);
    out.count("publicados", total);
    out.note(
      `coverage: ${translated}/${total} published listings have English copy ` +
        `(${total === 0 ? 0 : Math.round((translated / total) * 100)}%).`,
    );

    if (opts.dry) out.note("--dry: no API calls, nothing written.");
  });
}
