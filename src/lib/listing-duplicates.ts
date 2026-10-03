/**
 * Duplicate listings (plan-admin-next O5, `listing_duplicates`, migration
 * 0027) — the only module that writes that table, and the reader for the
 * listing page and /admin. The grid half is `notHiddenDuplicate()` in
 * src/lib/facet-sql.ts; the rule both follow is `primaryOf()` in
 * src/lib/listing-duplicate-rules.ts.
 *
 * Reads degrade to "no group" so a listing page never 500s over this.
 */
import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, listingDuplicates, listings } from "@/db/schema";
import { recordAdminEvent } from "@/lib/admin-events";
import { revalidateListings } from "@/lib/cache";
import { primaryOf } from "@/lib/listing-duplicate-rules";

export interface DuplicateMemberRow {
  id: number;
  publicId: string;
  slug: string;
  title: string;
  status: string;
  listedAt: Date | null;
  /** The agency's name, else the agent's; null for a private seller. */
  publisherName: string | null;
  publisherKind: "agency" | "agent" | "owner" | "none";
}

export interface DuplicateGroup {
  groupId: number;
  members: DuplicateMemberRow[];
  primary: DuplicateMemberRow | null;
}

async function membersOf(groupId: number): Promise<DuplicateMemberRow[]> {
  const rows = await db
    .select({
      id: listings.id,
      publicId: listings.publicId,
      slug: listings.slug,
      title: listings.title,
      status: listings.status,
      publishedAt: listings.publishedAt,
      createdAt: listings.createdAt,
      agencyId: listings.agencyId,
      agentId: listings.agentId,
      ownerUserId: listings.ownerUserId,
      agencyName: agencies.name,
      agentName: agents.name,
    })
    .from(listingDuplicates)
    .innerJoin(listings, eq(listings.id, listingDuplicates.listingId))
    .leftJoin(agencies, eq(agencies.id, listings.agencyId))
    .leftJoin(agents, eq(agents.id, listings.agentId))
    .where(eq(listingDuplicates.groupId, groupId));
  return rows
    .map((r) => ({
      id: r.id,
      publicId: r.publicId,
      slug: r.slug,
      title: r.title,
      status: r.status,
      listedAt: r.publishedAt ?? r.createdAt ?? null,
      publisherName: r.agencyName ?? r.agentName ?? null,
      publisherKind: (r.agencyId ? "agency" : r.agentId ? "agent" : r.ownerUserId ? "owner" : "none") as DuplicateMemberRow["publisherKind"],
    }))
    .sort((a, b) => (a.listedAt?.getTime() ?? Infinity) - (b.listedAt?.getTime() ?? Infinity) || a.id - b.id);
}

/** The group this listing belongs to, with its primary, or null. */
export async function getDuplicateGroup(listingId: number): Promise<DuplicateGroup | null> {
  try {
    const [row] = await db
      .select({ groupId: listingDuplicates.groupId })
      .from(listingDuplicates)
      .where(eq(listingDuplicates.listingId, listingId))
      .limit(1);
    if (!row) return null;
    const members = await membersOf(row.groupId);
    if (members.length < 2) return null;
    return { groupId: row.groupId, members, primary: primaryOf(members) };
  } catch {
    return null;
  }
}

export type MarkResult = "ok" | "same" | "not_found";

/**
 * Put `listingId` in the same group as `ofListingId`, merging two groups when
 * both already have one. Logged as `listing.duplicate` on both listings.
 */
export async function markDuplicate(p: { listingId: number; ofListingId: number; userId: number }): Promise<MarkResult> {
  if (p.listingId === p.ofListingId) return "same";
  const found = await db
    .select({ id: listings.id })
    .from(listings)
    .where(inArray(listings.id, [p.listingId, p.ofListingId]));
  if (found.length !== 2) return "not_found";

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ listingId: listingDuplicates.listingId, groupId: listingDuplicates.groupId })
      .from(listingDuplicates)
      .where(inArray(listingDuplicates.listingId, [p.listingId, p.ofListingId]));
    const groupOf = new Map(existing.map((r) => [r.listingId, r.groupId]));
    const target = groupOf.get(p.ofListingId) ?? groupOf.get(p.listingId) ?? p.ofListingId;
    // Fold the other group (if any) into the target.
    for (const g of new Set(existing.map((r) => r.groupId))) {
      if (g !== target) await tx.update(listingDuplicates).set({ groupId: target }).where(eq(listingDuplicates.groupId, g));
    }
    const now = new Date();
    for (const id of [p.ofListingId, p.listingId]) {
      if (!groupOf.has(id)) {
        await tx.insert(listingDuplicates).values({ listingId: id, groupId: target, markedByUserId: p.userId, markedAt: now });
      }
    }
  });
  await recordAdminEvent(p.userId, "listing.duplicate", "listing", p.listingId, { of: p.ofListingId, action: "mark" });
  revalidateListings();
  return "ok";
}

/** Take one listing out of its group; a group left with one member is dissolved. */
export async function removeFromDuplicateGroup(p: { listingId: number; userId: number }): Promise<boolean> {
  const [row] = await db
    .select({ groupId: listingDuplicates.groupId })
    .from(listingDuplicates)
    .where(eq(listingDuplicates.listingId, p.listingId))
    .limit(1);
  if (!row) return false;
  await db.transaction(async (tx) => {
    await tx.delete(listingDuplicates).where(eq(listingDuplicates.listingId, p.listingId));
    const left = await tx
      .select({ listingId: listingDuplicates.listingId })
      .from(listingDuplicates)
      .where(eq(listingDuplicates.groupId, row.groupId));
    if (left.length < 2) await tx.delete(listingDuplicates).where(eq(listingDuplicates.groupId, row.groupId));
  });
  await recordAdminEvent(p.userId, "listing.duplicate", "listing", p.listingId, { action: "remove" });
  revalidateListings();
  return true;
}
