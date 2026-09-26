/**
 * Sharing a lead with a partner agency or agent (`lead_assignments`, 0017;
 * docs/plan-lead-access-2026-09-25.md §3).
 *
 * The operator side (/admin/leads) shares and revokes; the realtor side
 * (/agencia/leads) reads what was shared with them and answers. Every
 * predicate that decides *who may see a share* lives in this file, once:
 * `sharedWithPanel()` is used by the read and by the write, so a realtor can
 * never answer a share they cannot see.
 *
 * Sharing is additive. A lead keeps its `routed_to` lane and stays visible
 * wherever it was; a share only adds readers. Revoking hides it from them on
 * their next page load — it cannot un-send what they already read.
 */
import "server-only";
import { and, desc, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, leadAssignments, leads, listings, users } from "@/db/schema";

export type ShareState = (typeof leadAssignments.$inferSelect)["state"];
export const REALTOR_STATES: readonly ShareState[] = [
  "accepted",
  "declined",
  "contacted",
  "closed",
];

export type ShareTarget = { kind: "agency" | "agent"; id: number };

/* ------------------------------ operator side ------------------------------ */

export interface ShareTargetOption {
  kind: "agency" | "agent";
  id: number;
  name: string;
  /** Agent only: the agency they belong to, if any. */
  agencyName: string | null;
}

/**
 * Who a lead can be shared with: verified agencies and verified agents only
 * (plan §3.6, the default). An unverified self-registered account is a
 * stranger as far as a visitor's phone number is concerned.
 */
export async function listShareTargets(): Promise<ShareTargetOption[]> {
  const [agencyRows, agentRows] = await Promise.all([
    db
      .select({ id: agencies.id, name: agencies.name })
      .from(agencies)
      .where(eq(agencies.isVerified, true))
      .orderBy(agencies.name),
    db
      .select({ id: agents.id, name: agents.name, agencyName: agencies.name })
      .from(agents)
      .leftJoin(agencies, eq(agencies.id, agents.agencyId))
      .where(eq(agents.isVerified, true))
      .orderBy(agents.name),
  ]);
  return [
    ...agencyRows.map((a) => ({ kind: "agency" as const, id: a.id, name: a.name, agencyName: null })),
    ...agentRows.map((a) => ({ kind: "agent" as const, ...a })),
  ];
}

async function targetIsVerified(target: ShareTarget): Promise<boolean> {
  const table = target.kind === "agency" ? agencies : agents;
  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, target.id), eq(table.isVerified, true)))
    .limit(1);
  return Boolean(row);
}

/**
 * Share leads with one target. Returns the ids actually shared.
 *
 * `internalOnly` is the staff rule (a staff user shares internal-lane leads
 * only), applied to the write the same way their list applies it to the read.
 * Re-sharing is idempotent: an active share keeps the realtor's answer, a
 * revoked one comes back as `pending`.
 */
export async function shareLeads(params: {
  leadIds: number[];
  target: ShareTarget;
  note: string | null;
  byUserId: number;
  internalOnly: boolean;
}): Promise<number[]> {
  const ids = [...new Set(params.leadIds)].filter((n) => Number.isInteger(n) && n > 0).slice(0, 200);
  if (ids.length === 0 || !(await targetIsVerified(params.target))) return [];

  const eligible = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        inArray(leads.id, ids),
        params.internalOnly ? eq(leads.routedTo, "internal") : undefined,
      ),
    );
  const leadIds = eligible.map((r) => r.id);
  if (leadIds.length === 0) return [];

  const agencyId = params.target.kind === "agency" ? params.target.id : 0;
  const agentId = params.target.kind === "agent" ? params.target.id : 0;
  await db
    .insert(leadAssignments)
    .values(
      leadIds.map((leadId) => ({
        leadId,
        agencyId,
        agentId,
        assignedByUserId: params.byUserId,
        note: params.note,
      })),
    )
    .onDuplicateKeyUpdate({
      // Drizzle writes these in table-column order (note, state, state_at,
      // revoked_at), so the IF()s still see the old revoked_at: a live share
      // keeps its answer, a revoked one restarts at pending.
      set: {
        assignedByUserId: params.byUserId,
        note: params.note,
        state: sql`if(${leadAssignments.revokedAt} is null, ${leadAssignments.state}, 'pending')`,
        stateAt: sql`if(${leadAssignments.revokedAt} is null, ${leadAssignments.stateAt}, null)`,
        revokedAt: sql`null`,
      },
    });
  return leadIds;
}

/**
 * Who to email when leads are shared with `target` (wave E1): the logged-in
 * people who will actually see the share in `/agencia/leads`, and only those
 * with an address on their account.
 *
 * - an agent → the user linked to that agent row;
 * - an agency → its `agency_admin` users (linked through `agents.agency_id`,
 *   the same link `sharedWithPanel()` reads). Not every agent of the agency:
 *   deciding who works a shared lead is the agency's call, not a broadcast.
 *
 * `agencies.email` is not used: it is a public contact field, not a login,
 * and nobody reading it has necessarily got a panel to open.
 */
export async function shareRecipients(
  target: ShareTarget,
): Promise<{ email: string; locale: "es" | "en" }[]> {
  const rows = await db
    .selectDistinct({ email: users.email, locale: users.locale })
    .from(agents)
    .innerJoin(users, eq(users.id, agents.userId))
    .where(
      target.kind === "agent"
        ? eq(agents.id, target.id)
        : and(eq(agents.agencyId, target.id), eq(users.role, "agency_admin")),
    )
    .limit(20);
  return rows.filter((r): r is { email: string; locale: "es" | "en" } => Boolean(r.email));
}

/** Revoke one share. Returns its lead id, or null when nothing changed. */
export async function revokeShare(params: {
  assignmentId: number;
  internalOnly: boolean;
}): Promise<number | null> {
  const [row] = await db
    .select({ leadId: leadAssignments.leadId, routedTo: leads.routedTo })
    .from(leadAssignments)
    .innerJoin(leads, eq(leads.id, leadAssignments.leadId))
    .where(and(eq(leadAssignments.id, params.assignmentId), isNull(leadAssignments.revokedAt)))
    .limit(1);
  if (!row || (params.internalOnly && row.routedTo !== "internal")) return null;

  const [res] = await db
    .update(leadAssignments)
    .set({ revokedAt: sql`now()` })
    .where(and(eq(leadAssignments.id, params.assignmentId), isNull(leadAssignments.revokedAt)));
  return res.affectedRows > 0 ? row.leadId : null;
}

export interface ShareRow {
  id: number;
  leadId: number;
  kind: "agency" | "agent";
  targetName: string;
  targetWhatsapp: string | null;
  state: ShareState;
  note: string | null;
  createdAt: Date;
  stateAt: Date | null;
  revokedAt: Date | null;
}

/** Every share of the leads on one /admin/leads page, in one query. */
export async function listSharesForLeads(leadIds: number[]): Promise<Map<number, ShareRow[]>> {
  const out = new Map<number, ShareRow[]>();
  if (leadIds.length === 0) return out;
  const rows = await db
    .select({
      id: leadAssignments.id,
      leadId: leadAssignments.leadId,
      agencyId: leadAssignments.agencyId,
      agencyName: agencies.name,
      agencyWhatsapp: agencies.whatsapp,
      agentName: agents.name,
      agentWhatsapp: agents.whatsapp,
      state: leadAssignments.state,
      note: leadAssignments.note,
      createdAt: leadAssignments.createdAt,
      stateAt: leadAssignments.stateAt,
      revokedAt: leadAssignments.revokedAt,
    })
    .from(leadAssignments)
    .leftJoin(agencies, and(eq(agencies.id, leadAssignments.agencyId), sql`${leadAssignments.agencyId} <> 0`))
    .leftJoin(agents, and(eq(agents.id, leadAssignments.agentId), sql`${leadAssignments.agentId} <> 0`))
    .where(inArray(leadAssignments.leadId, leadIds))
    .orderBy(leadAssignments.createdAt);

  for (const r of rows) {
    const kind = r.agencyId ? "agency" : "agent";
    const share: ShareRow = {
      id: r.id,
      leadId: r.leadId,
      kind,
      targetName: (kind === "agency" ? r.agencyName : r.agentName) ?? "—",
      targetWhatsapp: kind === "agency" ? r.agencyWhatsapp : r.agentWhatsapp,
      state: r.state,
      note: r.note,
      createdAt: r.createdAt,
      stateAt: r.stateAt,
      revokedAt: r.revokedAt,
    };
    out.set(r.leadId, [...(out.get(r.leadId) ?? []), share]);
  }
  return out;
}

export interface ShareBoardRow {
  kind: "agency" | "agent";
  targetName: string;
  active: number;
  pending: number;
  /** Still `pending` more than 24 h after the share. */
  overdue: number;
  answered: number;
  /** Average hours from share to first answer, over answered shares. */
  avgHours: number | null;
}

/**
 * The response board: per partner, how many shared leads they have answered
 * and how fast. Computed from `created_at` / `state_at`; no extra column.
 */
export async function listShareBoard(): Promise<ShareBoardRow[]> {
  const rows = await db
    .select({
      agencyId: leadAssignments.agencyId,
      agentId: leadAssignments.agentId,
      agencyName: sql<string | null>`max(${agencies.name})`,
      agentName: sql<string | null>`max(${agents.name})`,
      active: sql<number>`count(*)`,
      pending: sql<number>`sum(${leadAssignments.state} = 'pending')`,
      overdue: sql<number>`sum(${leadAssignments.state} = 'pending' and ${leadAssignments.createdAt} < now() - interval 24 hour)`,
      answered: sql<number>`sum(${leadAssignments.stateAt} is not null)`,
      avgMinutes: sql<number | null>`avg(case when ${leadAssignments.stateAt} is not null then timestampdiff(minute, ${leadAssignments.createdAt}, ${leadAssignments.stateAt}) end)`,
    })
    .from(leadAssignments)
    .leftJoin(agencies, eq(agencies.id, leadAssignments.agencyId))
    .leftJoin(agents, eq(agents.id, leadAssignments.agentId))
    .where(isNull(leadAssignments.revokedAt))
    .groupBy(leadAssignments.agencyId, leadAssignments.agentId);

  return rows
    .map((r) => ({
      kind: (r.agencyId ? "agency" : "agent") as "agency" | "agent",
      targetName: (r.agencyId ? r.agencyName : r.agentName) ?? "—",
      active: Number(r.active),
      pending: Number(r.pending ?? 0),
      overdue: Number(r.overdue ?? 0),
      answered: Number(r.answered ?? 0),
      avgHours: r.avgMinutes == null ? null : Math.round(Number(r.avgMinutes) / 6) / 10,
    }))
    .sort((a, b) => b.overdue - a.overdue || b.active - a.active);
}

/* ------------------------------ realtor side ------------------------------ */

/**
 * Who is asking, as /agencia resolves it: an agency member (agencyId set) or
 * an independent agent (agencyId null, their own `agents` row by user id).
 */
export interface PanelViewer {
  agencyId: number | null;
  userId: number;
}

/**
 * The one visibility predicate for shares, used by the read AND the write.
 * - Agency member: shares with the agency, and shares with any agent of it
 *   (the agency admin sees what was handed to their people).
 * - Independent agent: shares with their own `agents` row.
 * - Anyone else (no agents row): nothing.
 */
function sharedWithPanel(viewer: PanelViewer): SQL {
  const active = isNull(leadAssignments.revokedAt);
  if (viewer.agencyId != null) {
    return and(
      active,
      or(
        eq(leadAssignments.agencyId, viewer.agencyId),
        inArray(
          leadAssignments.agentId,
          db.select({ id: agents.id }).from(agents).where(eq(agents.agencyId, viewer.agencyId)),
        ),
      ),
    )!;
  }
  return and(
    active,
    inArray(
      leadAssignments.agentId,
      db.select({ id: agents.id }).from(agents).where(eq(agents.userId, viewer.userId)),
    ),
  )!;
}

export interface SharedLeadRow {
  assignmentId: number;
  state: ShareState;
  /** The operator's note to the realtor (never `leads.note`). */
  shareNote: string | null;
  sharedAt: Date;
  id: number;
  leadType: (typeof leads.$inferSelect)["leadType"];
  name: string | null;
  whatsapp: string;
  email: string | null;
  message: string | null;
  createdAt: Date;
  listingTitle: string | null;
  listingPublicId: string | null;
  listingSlug: string | null;
}

/** Leads the portal shared with this viewer, newest share first. */
export async function getSharedLeads(viewer: PanelViewer): Promise<SharedLeadRow[]> {
  return db
    .select({
      assignmentId: leadAssignments.id,
      state: leadAssignments.state,
      shareNote: leadAssignments.note,
      sharedAt: leadAssignments.createdAt,
      id: leads.id,
      leadType: leads.leadType,
      name: leads.name,
      whatsapp: leads.whatsapp,
      email: leads.email,
      message: leads.message,
      createdAt: leads.createdAt,
      listingTitle: listings.title,
      listingPublicId: listings.publicId,
      listingSlug: listings.slug,
    })
    .from(leadAssignments)
    .innerJoin(leads, eq(leads.id, leadAssignments.leadId))
    // LEFT: most shared leads have no listing — that is why sharing exists.
    .leftJoin(listings, eq(listings.id, leads.listingId))
    .where(sharedWithPanel(viewer))
    .orderBy(desc(leadAssignments.createdAt))
    .limit(300);
}

/** The realtor's answer. Returns rows affected: 0 = not theirs, or revoked. */
export async function setShareState(params: {
  assignmentId: number;
  state: ShareState;
  viewer: PanelViewer;
}): Promise<number> {
  if (!REALTOR_STATES.includes(params.state)) return 0;
  const [res] = await db
    .update(leadAssignments)
    // state_at keeps the FIRST answer: the response board measures how fast a
    // partner reacted, not when they last touched the card.
    .set({ state: params.state, stateAt: sql`coalesce(${leadAssignments.stateAt}, now())` })
    .where(and(eq(leadAssignments.id, params.assignmentId), sharedWithPanel(params.viewer)));
  return res.affectedRows;
}
