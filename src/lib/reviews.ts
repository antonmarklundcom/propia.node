/**
 * Reviews of agencies and agents (plan-admin-next O7, `reviews`, migration
 * 0028) — the only module on that table.
 *
 * Founder decision 2026-10-02:
 * - **Only verified leads or deals may review.** The operator sends a signed
 *   link (src/lib/review-token.ts) from /admin/leads, and only for a partner
 *   that actually worked the lead (`reviewTargetsForLeads()`):
 *   - a deal with that partner;
 *   - a share the partner took (accepted / contacted / closed);
 *   - or a lead routed to the listing's own agency or agent that the operator
 *     marked contacted or closed.
 *   The same check runs again when the link is opened and when it is
 *   submitted, so a link minted before a share was revoked stops working.
 * - **The operator approves** every review (/admin/resenas) before it shows.
 * - **Full reviews on the directory door, stars only on the marketplace**
 *   (`publicReviews()` returns both; the profile pages choose).
 *
 * Every public read degrades to "no reviews", so a profile page never 500s
 * over this table (or its absence before the migration).
 */
import "server-only";
import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, deals, leadAssignments, leads, listings, reviews } from "@/db/schema";
import { recordAdminEvent } from "@/lib/admin-events";
import { alertOperator } from "@/lib/crm";
import {
  mintReviewToken,
  reviewSecret,
  verifyReviewToken,
  type ReviewInput,
  type ReviewTargetKind,
} from "@/lib/review-token";

export interface ReviewTarget {
  kind: ReviewTargetKind;
  id: number;
  name: string;
}

const key = (t: { kind: ReviewTargetKind; id: number }) => `${t.kind}:${t.id}`;

/** Whether review links can be minted at all (the signing secret is set). */
export function reviewsEnabled(): boolean {
  return reviewSecret() !== null;
}

/**
 * For each lead, the partners its buyer may review — see the module comment
 * for what counts as "worked". Three grouped reads for any number of leads.
 */
export async function reviewTargetsForLeads(leadIds: number[]): Promise<Map<number, ReviewTarget[]>> {
  const out = new Map<number, ReviewTarget[]>();
  if (leadIds.length === 0) return out;
  const raw: Array<{ leadId: number; kind: ReviewTargetKind; id: number }> = [];

  const [dealRows, shareRows, routedRows] = await Promise.all([
    db
      .select({ leadId: deals.leadId, agencyId: deals.agencyId, agentId: deals.agentId })
      .from(deals)
      .where(and(inArray(deals.leadId, leadIds), or(ne(deals.agencyId, 0), ne(deals.agentId, 0)))),
    db
      .select({ leadId: leadAssignments.leadId, agencyId: leadAssignments.agencyId, agentId: leadAssignments.agentId })
      .from(leadAssignments)
      .where(
        and(
          inArray(leadAssignments.leadId, leadIds),
          sql`${leadAssignments.revokedAt} is null`,
          inArray(leadAssignments.state, ["accepted", "contacted", "closed"]),
        ),
      ),
    db
      .select({ leadId: leads.id, routedTo: leads.routedTo, agencyId: listings.agencyId, agentId: listings.agentId })
      .from(leads)
      .innerJoin(listings, eq(listings.id, leads.listingId))
      .where(
        and(
          inArray(leads.id, leadIds),
          inArray(leads.routedTo, ["agency", "agent"]),
          inArray(leads.status, ["contacted", "closed"]),
        ),
      ),
  ]);
  for (const r of [...dealRows, ...shareRows]) {
    if (r.agencyId) raw.push({ leadId: r.leadId, kind: "agency", id: r.agencyId });
    else if (r.agentId) raw.push({ leadId: r.leadId, kind: "agent", id: r.agentId });
  }
  for (const r of routedRows) {
    if (r.routedTo === "agency" && r.agencyId) raw.push({ leadId: r.leadId, kind: "agency", id: r.agencyId });
    if (r.routedTo === "agent" && r.agentId) raw.push({ leadId: r.leadId, kind: "agent", id: r.agentId });
  }
  if (raw.length === 0) return out;

  const agencyIds = [...new Set(raw.filter((r) => r.kind === "agency").map((r) => r.id))];
  const agentIds = [...new Set(raw.filter((r) => r.kind === "agent").map((r) => r.id))];
  const names = new Map<string, string>();
  const [ag, at] = await Promise.all([
    agencyIds.length ? db.select({ id: agencies.id, name: agencies.name }).from(agencies).where(inArray(agencies.id, agencyIds)) : [],
    agentIds.length ? db.select({ id: agents.id, name: agents.name }).from(agents).where(inArray(agents.id, agentIds)) : [],
  ]);
  for (const r of ag) names.set(`agency:${r.id}`, r.name);
  for (const r of at) names.set(`agent:${r.id}`, r.name);

  for (const r of raw) {
    const name = names.get(key(r));
    if (!name) continue; // the partner row is gone
    const list = out.get(r.leadId) ?? [];
    if (!list.some((t) => key(t) === key(r))) list.push({ kind: r.kind, id: r.id, name });
    out.set(r.leadId, list);
  }
  return out;
}

/** The invitation URL for one lead and partner, or null without the secret. */
export function reviewLink(origin: string, leadId: number, target: { kind: ReviewTargetKind; id: number }): string | null {
  const secret = reviewSecret();
  if (!secret) return null;
  return `${origin}/resena?t=${mintReviewToken({ leadId, kind: target.kind, targetId: target.id }, secret)}`;
}

export type InviteState =
  | { state: "ok"; leadId: number; target: ReviewTarget; buyerName: string | null }
  | { state: "used"; target: ReviewTarget }
  | { state: "expired" }
  | { state: "invalid" };

/** Everything a /resena request needs to know about its token. */
export async function loadInvite(token: string): Promise<InviteState> {
  const secret = reviewSecret();
  if (!secret) return { state: "invalid" };
  const v = verifyReviewToken(token, secret);
  if (!v.ok) return v.error === "expired" ? { state: "expired" } : { state: "invalid" };
  const { leadId, kind, targetId } = v.invite;
  try {
    const [lead] = await db
      .select({ id: leads.id, name: leads.name, status: leads.status })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    if (!lead || lead.status === "spam") return { state: "invalid" };
    const target = (await reviewTargetsForLeads([leadId])).get(leadId)?.find((t) => t.kind === kind && t.id === targetId);
    if (!target) return { state: "invalid" };
    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.leadId, leadId),
          eq(reviews.agencyId, kind === "agency" ? targetId : 0),
          eq(reviews.agentId, kind === "agent" ? targetId : 0),
        ),
      )
      .limit(1);
    if (existing) return { state: "used", target };
    return { state: "ok", leadId, target, buyerName: lead.name };
  } catch {
    return { state: "invalid" };
  }
}

/** Store a review as `pending` and tell the operator. "used" on a second submit. */
export async function submitReview(p: {
  token: string;
  input: ReviewInput;
  locale: string;
  adminUrl: string;
  site: string;
}): Promise<"ok" | "used" | "expired" | "invalid"> {
  const invite = await loadInvite(p.token);
  if (invite.state !== "ok") return invite.state;
  try {
    await db.insert(reviews).values({
      leadId: invite.leadId,
      agencyId: invite.target.kind === "agency" ? invite.target.id : 0,
      agentId: invite.target.kind === "agent" ? invite.target.id : 0,
      rating: p.input.rating,
      body: p.input.body,
      authorName: p.input.authorName,
      locale: p.locale === "en" ? "en" : "es",
    });
  } catch (e) {
    // The unique (lead, target) index: a double submit or a race.
    if (String(e).includes("Duplicate")) return "used";
    throw e;
  }
  await alertOperator({
    kind: "partner_review",
    title: `Reseña nueva para ${invite.target.name} (${p.input.rating}/5), a revisar`,
    url: p.adminUrl,
    site: p.site,
  });
  return "ok";
}

export interface ModerationRow {
  id: number;
  status: "pending" | "approved" | "rejected";
  rating: number;
  body: string | null;
  authorName: string;
  createdAt: Date;
  leadId: number;
  leadName: string | null;
  targetKind: ReviewTargetKind;
  targetId: number;
  targetName: string;
}

/** /admin/resenas: every pending review, then the latest decided ones. */
export async function listReviewsForModeration(limit = 100): Promise<ModerationRow[]> {
  const rows = await db
    .select({
      id: reviews.id,
      status: reviews.status,
      rating: reviews.rating,
      body: reviews.body,
      authorName: reviews.authorName,
      createdAt: reviews.createdAt,
      leadId: reviews.leadId,
      leadName: leads.name,
      agencyId: reviews.agencyId,
      agentId: reviews.agentId,
      agencyName: agencies.name,
      agentName: agents.name,
    })
    .from(reviews)
    .leftJoin(leads, eq(leads.id, reviews.leadId))
    .leftJoin(agencies, and(ne(reviews.agencyId, 0), eq(agencies.id, reviews.agencyId)))
    .leftJoin(agents, and(ne(reviews.agentId, 0), eq(agents.id, reviews.agentId)))
    .orderBy(sql`${reviews.status} = 'pending' desc`, desc(reviews.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    rating: r.rating,
    body: r.body,
    authorName: r.authorName,
    createdAt: r.createdAt,
    leadId: r.leadId,
    leadName: r.leadName,
    targetKind: r.agencyId ? "agency" : "agent",
    targetId: r.agencyId || r.agentId,
    targetName: r.agencyName ?? r.agentName ?? "—",
  }));
}

export async function countPendingReviews(): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(reviews).where(eq(reviews.status, "pending"));
  return Number(r?.n ?? 0);
}

/** Approve or reject (an approved one can be taken down the same way). Logged. */
export async function moderateReview(p: { id: number; decision: "approved" | "rejected"; userId: number }): Promise<boolean> {
  const [row] = await db.select({ status: reviews.status }).from(reviews).where(eq(reviews.id, p.id)).limit(1);
  if (!row) return false;
  await db
    .update(reviews)
    .set({ status: p.decision, moderatedByUserId: p.userId, moderatedAt: new Date() })
    .where(eq(reviews.id, p.id));
  await recordAdminEvent(p.userId, "review.moderate", "review", p.id, { from: row.status, to: p.decision });
  return true;
}

export interface PublicReview {
  id: number;
  rating: number;
  body: string | null;
  authorName: string;
  createdAt: Date;
}

export interface PublicReviews {
  count: number;
  average: number;
  items: PublicReview[];
}

/** Approved reviews of one agency or agent, newest first. Null on any failure or none. */
export async function publicReviews(target: { kind: ReviewTargetKind; id: number }, limit = 20): Promise<PublicReviews | null> {
  try {
    const where = and(
      eq(reviews.status, "approved"),
      target.kind === "agency" ? eq(reviews.agencyId, target.id) : eq(reviews.agentId, target.id),
    );
    const [agg] = await db
      .select({ n: sql<number>`count(*)`, avg: sql<string | null>`avg(${reviews.rating})` })
      .from(reviews)
      .where(where);
    const count = Number(agg?.n ?? 0);
    if (count === 0) return null;
    const items = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        body: reviews.body,
        authorName: reviews.authorName,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
    return { count, average: Number(agg?.avg ?? 0), items };
  } catch {
    return null;
  }
}

/** `lead:kind:id` of every review already written for these leads (any status). */
export async function reviewedKeys(leadIds: number[]): Promise<Set<string>> {
  if (leadIds.length === 0) return new Set();
  const rows = await db
    .select({ leadId: reviews.leadId, agencyId: reviews.agencyId, agentId: reviews.agentId })
    .from(reviews)
    .where(inArray(reviews.leadId, leadIds));
  return new Set(rows.map((r) => (r.agencyId ? `${r.leadId}:agency:${r.agencyId}` : `${r.leadId}:agent:${r.agentId}`)));
}
