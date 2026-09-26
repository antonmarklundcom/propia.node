/**
 * Copy leads that are already in MySQL into VenderCRM (`npm run crm:backfill`).
 *
 * Live leads are pushed by `deliverLead()` the moment they are saved; this is
 * for the rows that predate the VenderCRM keys, and for any push that failed.
 * It is safe to re-run over the same rows: every body carries
 * `idempotency_key = portal-lead-<leads.id>`, and VenderCRM answers a repeat
 * with 200 instead of creating a second contact or deal.
 *
 * The dry run is the same pass over the same rows: it builds every body and
 * counts which doors have a key, and only skips the HTTP call.
 *
 * Paced at one request per ~1.1 s because VenderCRM allows 60 per minute per
 * site key, and several doors may one day share one site.
 */
import "server-only";
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { leads, listings } from "@/db/schema";
import { CANONICAL_HOST, VERTICALS } from "@/config/verticals";
import { listingUrl } from "@/lib/urls";
import {
  pushLeadToVenderCrm,
  venderCrmBody,
  venderCrmKeyFor,
  type LeadPayload,
} from "@/lib/crm";
import { opsRun, type OpsOptions, type OpsResult } from "./types";
import { isNotReportLead } from "@/lib/report-queries";

const PACE_MS = 1_100;

export interface CrmBackfillOptions extends OpsOptions {
  /** Start at this `leads.id` (inclusive) — to resume after a partial run. */
  fromId?: number;
}

/**
 * The host that owns /propiedad pages in a door's language — the same rule as
 * `detailOwnerForLocale()` in origin.ts, which cannot be imported here because
 * that module reads request headers.
 */
function detailOrigin(vertical: string): string {
  const locale = Object.values(VERTICALS).find((v) => v.key === vertical)?.locale ?? "es";
  for (const [host, v] of Object.entries(VERTICALS)) {
    const served = v.enabled || host === CANONICAL_HOST;
    const owns = host === CANONICAL_HOST || v.ownsListingDetail;
    if (served && owns && v.locale === locale) return `https://${host}`;
  }
  return `https://${CANONICAL_HOST}`;
}

function parseUtm(value: unknown): Record<string, string> | undefined {
  const obj = typeof value === "string" ? safeJson(value) : value;
  if (!obj || typeof obj !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export async function runCrmBackfill(opts: CrmBackfillOptions): Promise<OpsResult> {
  return opsRun("crm:backfill", opts.dry, async (out) => {
    out.track("leads", "no_key", opts.dry ? "would_push" : "pushed", "failed");
    if (!process.env.VENDERCRM_BASE_URL?.trim()) {
      out.note("VENDERCRM_BASE_URL is not set: nothing can be pushed. Export it and the VENDERCRM_KEY_* keys first.");
      return;
    }

    const rows = await db
      .select({
        id: leads.id,
        leadType: leads.leadType,
        vertical: leads.vertical,
        name: leads.name,
        whatsapp: leads.whatsapp,
        email: leads.email,
        message: leads.message,
        utm: leads.utm,
        routedTo: leads.routedTo,
        listingPublicId: listings.publicId,
        listingSlug: listings.slug,
        listingTitle: listings.title,
        listingPriceUsd: listings.priceUsd,
        listingOperation: listings.operation,
      })
      .from(leads)
      .leftJoin(listings, eq(listings.id, leads.listingId))
      // Listing reports (A3) are not sales leads; the live path never sends them.
      .where(and(opts.fromId ? gte(leads.id, opts.fromId) : undefined, isNotReportLead()))
      .orderBy(asc(leads.id))
      .limit(opts.limit && opts.limit > 0 ? Math.floor(opts.limit) : 100_000);

    const missing = new Set<string>();
    let first = true;
    for (const r of rows) {
      out.count("leads");
      if (!venderCrmKeyFor(r.vertical)) {
        out.count("no_key");
        missing.add(r.vertical);
        continue;
      }

      const lead: LeadPayload & { leadId: number } = {
        leadId: r.id,
        leadType: r.leadType as LeadPayload["leadType"],
        vertical: r.vertical,
        name: r.name ?? undefined,
        whatsapp: r.whatsapp,
        email: r.email ?? undefined,
        message: r.message ?? undefined,
        utm: parseUtm(r.utm),
        routedTo: r.routedTo,
        listing:
          r.listingPublicId && r.listingSlug && r.listingTitle
            ? {
                publicId: r.listingPublicId,
                title: r.listingTitle,
                url: `${detailOrigin(r.vertical)}${listingUrl({ slug: r.listingSlug, publicId: r.listingPublicId })}`,
                priceUsd: Number(r.listingPriceUsd),
                operation: r.listingOperation ?? "",
              }
            : undefined,
      };

      if (opts.dry) {
        venderCrmBody(lead); // build it exactly as the real run would
        out.count("would_push");
        continue;
      }

      if (!first) await new Promise((res) => setTimeout(res, PACE_MS));
      first = false;
      const result = await pushLeadToVenderCrm(lead);
      if (result?.ok) out.count("pushed");
      else {
        out.count("failed");
        out.note(`  lead #${r.id} (${r.vertical}): ${result?.error ?? "not sent"}`);
      }
    }

    if (missing.size > 0) {
      out.note(
        `No key for: ${[...missing].sort().join(", ")} — set VENDERCRM_KEY_<DOOR> to include them (those leads stay local).`,
      );
    }
  });
}
