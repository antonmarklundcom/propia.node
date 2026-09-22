/**
 * Give the demo listings a seller, so the seller card and the mobile contact
 * bar show the WhatsApp button while every listing is still demo data.
 *
 * Creates (idempotently, by slug) one agency, `Inmobiliaria Paraguay (muestra)`,
 * with the WhatsApp number the caller passes, and attaches every published
 * listing that has no agency, agent or owner to it. `remove` is the inverse:
 * it detaches every listing from that agency, and never touches a listing the
 * agency does not hold.
 *
 * Side effect worth knowing: `/api/leads` routes a form lead on an attached
 * listing to `agency` instead of `internal`, so the staff role (internal leads
 * only) no longer sees those leads; `/admin` still lists every lead.
 *
 * Like sample-photos, cache invalidation belongs to a Next.js caller; the CLI
 * has no incremental cache runtime, so the public pages catch up at the TTL.
 */
import "server-only";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { agencies, listings } from "@/db/schema";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

export const DEMO_AGENCY_NAME = "Inmobiliaria Paraguay (muestra)";
export const DEMO_AGENCY_SLUG = "inmobiliaria-paraguay-muestra";

export interface DemoSellerOptions extends OpsOptions {
  /** Digits only, Paraguayan country code first (595…). Required unless `remove`. */
  whatsapp?: string;
  remove?: boolean;
}

export async function runDemoSeller(opts: DemoSellerOptions): Promise<OpsResult> {
  return opsRun("seed:demo-seller", opts.dry, async (out) => {
    const whatsapp = opts.whatsapp?.replace(/[\s+()-]/g, "");
    if (!opts.remove && (!whatsapp || !/^595\d{8,10}$/.test(whatsapp))) {
      throw new Error("--whatsapp is required: digits only with the 595 country code, e.g. 595981123456.");
    }
    const limit = opts.limit && opts.limit > 0 ? Math.floor(opts.limit) : Infinity;
    out.track("listings");

    const [existing] = await db.select({ id: agencies.id, whatsapp: agencies.whatsapp })
      .from(agencies).where(eq(agencies.slug, DEMO_AGENCY_SLUG)).limit(1);

    if (opts.remove) {
      if (!existing) {
        out.note("No demo agency exists: nothing to detach.");
        return;
      }
      const held = await db.select({ id: listings.id, title: listings.title })
        .from(listings).where(eq(listings.agencyId, existing.id))
        .orderBy(asc(listings.id));
      const rows = held.slice(0, limit === Infinity ? held.length : limit);
      rows.slice(0, 10).forEach((row) =>
        out.note(`  ${opts.dry ? "would detach" : "detached"} #${row.id}: ${row.title}`));
      if (rows.length > 10) out.note(`  ... and ${rows.length - 10} more`);
      if (!opts.dry) {
        for (const row of rows) {
          await db.update(listings).set({ agencyId: null })
            .where(and(eq(listings.id, row.id), eq(listings.agencyId, existing.id)));
        }
      }
      out.count("listings", rows.length);
      out.note(opts.dry ? "--dry: nothing written." : "The agency row is kept; delete it in /admin if wanted.");
      return;
    }

    out.track("agency_created", "agency_whatsapp_updated");
    let agencyId = existing?.id;
    if (!existing) {
      out.count("agency_created");
      out.note(`${opts.dry ? "would create" : "created"} agency ${DEMO_AGENCY_NAME}`);
      if (!opts.dry) {
        const [res] = await db.insert(agencies).values({
          name: DEMO_AGENCY_NAME, slug: DEMO_AGENCY_SLUG, whatsapp, isVerified: false,
        });
        agencyId = Number((res as unknown as { insertId: number }).insertId);
      }
    } else if (existing.whatsapp !== whatsapp) {
      out.count("agency_whatsapp_updated");
      out.note(`${opts.dry ? "would update" : "updated"} the demo agency WhatsApp`);
      if (!opts.dry) await db.update(agencies).set({ whatsapp }).where(eq(agencies.id, existing.id));
    }

    // Same pass in both modes: walk published listings with no seller at all.
    let cursor = 0;
    let changed = 0;
    while (changed < limit) {
      const rows = await db.select({ id: listings.id, title: listings.title }).from(listings)
        .where(and(
          eq(listings.status, "published"), gt(listings.id, cursor),
          isNull(listings.agencyId), isNull(listings.agentId), isNull(listings.ownerUserId),
        ))
        .orderBy(asc(listings.id)).limit(100);
      if (!rows.length) break;
      for (const row of rows) {
        cursor = row.id;
        if (!opts.dry) {
          // Re-check the seller columns in the WHERE so a concurrent claim wins.
          const [res] = await db.update(listings).set({ agencyId }).where(and(
            eq(listings.id, row.id), isNull(listings.agencyId),
            isNull(listings.agentId), isNull(listings.ownerUserId),
          ));
          if (Number((res as unknown as { affectedRows: number }).affectedRows) === 0) continue;
        }
        changed++;
        out.count("listings");
        if (changed <= 10) out.note(`  ${opts.dry ? "would attach" : "attached"} #${row.id}: ${row.title}`);
        if (changed >= limit) break;
      }
    }
    if (changed > 10) out.note(`  ... and ${changed - 10} more`);
    if (opts.dry) out.note("--dry: nothing written.");
  });
}
