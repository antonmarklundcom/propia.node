/**
 * "Quiero que una inmobiliaria lo venda" — a private owner asking the portal to
 * hand their listing to a realtor (plan-build 2026-09-26, A2 Owner 4).
 *
 * It is an ordinary `seller` lead on the `internal` lane, so it lands in
 * /admin/leads next to /vender and /tasacion requests, where the operator can
 * match or share it like any other. What marks it is `utm.source` =
 * "owner:panel" (no new column, no new `routed_to` member — CLAUDE.md backlog
 * 11), and `listing_id`, which says exactly which property is on offer.
 *
 * At most one request per listing per 24 hours. The check and the insert run
 * in one transaction that first locks the listing row, so two quick clicks (or
 * two tabs) serialise on that lock instead of both passing the check.
 */
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads, listings, users } from "@/db/schema";
import { listingScopeWhere, type EditScope } from "@/lib/listing-edit";

export const OWNER_PANEL_SOURCE = "owner:panel";

export interface RealtorRequestListing {
  id: number;
  publicId: string;
  slug: string;
  title: string;
  operation: string;
  priceUsd: number;
  projectId: number | null;
}

export type RealtorRequestResult =
  | { ok: true; leadId: number; listing: RealtorRequestListing; message: string }
  | { ok: false; reason: "not_found" | "duplicate" };

/** The owner's stored WhatsApp, to prefill the request form. */
export async function ownerWhatsapp(userId: number): Promise<string | null> {
  const [row] = await db
    .select({ whatsapp: users.whatsapp })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.whatsapp ?? null;
}

/**
 * Record the request. `scope` comes from the session (requireOwnerContext),
 * never the form, so a forged listing id matches no row and reads as
 * not_found — the same 404-not-403 rule as the edit page.
 */
export async function createRealtorRequest(params: {
  scope: EditScope;
  listingId: number;
  vertical: string;
  name: string | null;
  email: string | null;
  whatsapp: string;
  /** Builds the stored message from the listing title (known only here). */
  message: (listingTitle: string) => string;
}): Promise<RealtorRequestResult> {
  const guard = listingScopeWhere(params.scope);
  return db.transaction(async (tx): Promise<RealtorRequestResult> => {
    const [listing] = await tx
      .select({
        id: listings.id,
        publicId: listings.publicId,
        slug: listings.slug,
        title: listings.title,
        operation: listings.operation,
        priceUsd: listings.priceUsd,
        projectId: listings.projectId,
      })
      .from(listings)
      .where(
        guard
          ? and(eq(listings.id, params.listingId), guard)
          : eq(listings.id, params.listingId),
      )
      .limit(1)
      .for("update");
    if (!listing) return { ok: false, reason: "not_found" };

    const [recent] = await tx
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          eq(leads.listingId, listing.id),
          eq(leads.leadType, "seller"),
          // Compared in SQL against the same clock CURRENT_TIMESTAMP wrote.
          sql`${leads.createdAt} > NOW() - INTERVAL 1 DAY`,
          // JSON_EXTRACT works on MySQL's json and on MariaDB's longtext alike.
          sql`JSON_UNQUOTE(JSON_EXTRACT(${leads.utm}, '$.source')) = ${OWNER_PANEL_SOURCE}`,
        ),
      )
      .limit(1);
    if (recent) return { ok: false, reason: "duplicate" };

    const message = params.message(listing.title).slice(0, 2000);
    const [res] = await tx.insert(leads).values({
      leadType: "seller",
      vertical: params.vertical,
      listingId: listing.id,
      projectId: listing.projectId,
      name: params.name?.slice(0, 140) || null,
      whatsapp: params.whatsapp,
      email: params.email?.slice(0, 190) || null,
      message,
      utm: { source: OWNER_PANEL_SOURCE },
      // The owner is asking the portal itself, not a buyer asking the owner:
      // `owner` would route it back into their own inbox.
      routedTo: "internal",
    });
    const leadId = Number((res as unknown as { insertId: number }).insertId);
    return {
      ok: true,
      leadId,
      listing: { ...listing, priceUsd: Number(listing.priceUsd) },
      message,
    };
  });
}
