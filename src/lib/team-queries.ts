/**
 * Team membership — who belongs to an inmobiliaria, and who runs it.
 *
 * There is no "agency role" column and this file deliberately does not add one.
 * Membership already exists as `agents.agency_id` (NULL = independent), and
 * "byråansvarig / responsable" already exists as `users.role = 'agency_admin'`
 * versus `'agent'` (auth/roles.ts). Team management is therefore UI plus the
 * two writes below, not a new concept in the schema.
 *
 * Every mutation carries the caller's agencyId in its WHERE clause, exactly
 * like listing-edit.ts: a forged userId in a POST matches no row inside the
 * caller's agency instead of touching somebody else's colleague.
 *
 * DECISION — what happens to a departing member's listings (open question
 * flagged to the founder, implemented consistently in both the agency panel and
 * the super-admin move):
 *   Listings keep their `agency_id`. An aviso belongs to the inmobiliaria that
 *   published it, not to the person who typed it in — the phone number on the
 *   card is the agency's, the lead history is the agency's, and un-scoping the
 *   rows would make published listings vanish from the panel that answers their
 *   enquiries. The person keeps their public /agente/[slug] profile and becomes
 *   independent; their future listings are their own.
 *   If the founder wants the opposite (listings follow the agent), it is one
 *   extra UPDATE in removeTeamMember() and moveAgentToAgency() — the same one
 *   in both places, so the two paths never disagree.
 *
 * The mirror image — what an independent's own listings do when they JOIN an
 * agency — follows the same principle: they move in with them
 * (moveIndependentListingsToAgency(), bug 6), on the invite accept and on the
 * super-admin move alike.
 */
import "server-only";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, listings, users } from "@/db/schema";
import { recordAdminEvent } from "@/lib/admin-events";
import { consumeInvite, stampInviteUser } from "@/lib/agency-invites";
import type { UserRole } from "@/lib/auth/roles";

type DbConn = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The two roles a member of an agency can hold. */
export type TeamRole = "agent" | "agency_admin";

export interface TeamMember {
  agentId: number;
  userId: number | null;
  name: string;
  slug: string;
  email: string | null;
  whatsapp: string | null;
  /** NULL when the agents row has no login attached yet (imported profile). */
  role: UserRole | null;
  isVerified: boolean;
}

/** Everyone in one agency, by name. Uses agents.idx_agency. */
export async function listAgencyTeam(agencyId: number): Promise<TeamMember[]> {
  return db
    .select({
      agentId: agents.id,
      userId: agents.userId,
      name: agents.name,
      slug: agents.slug,
      email: users.email,
      whatsapp: agents.whatsapp,
      role: users.role,
      isVerified: agents.isVerified,
    })
    .from(agents)
    .leftJoin(users, eq(agents.userId, users.id))
    .where(eq(agents.agencyId, agencyId))
    .orderBy(asc(agents.name));
}

/**
 * How many agency_admins an agency has. The guard behind every demotion and
 * every removal: an agency with zero admins can no longer invite anybody, edit
 * its own company record, or manage its team — it would need the founder to dig
 * it out by hand.
 */
export async function countAgencyAdmins(agencyId: number): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(agents)
    .innerJoin(users, eq(agents.userId, users.id))
    .where(and(eq(agents.agencyId, agencyId), eq(users.role, "agency_admin")));
  return Number(row?.n ?? 0);
}

/** Outcome codes; the caller maps them straight onto a ?msg= flash. */
export type TeamWriteResult =
  | "ok"
  | "not_in_team"
  | "last_admin"
  | "protected";

/** True when the user id belongs to this agency (the membership gate). */
async function memberRole(
  agencyId: number,
  userId: number,
): Promise<UserRole | null> {
  const [row] = await db
    .select({ role: users.role })
    .from(agents)
    .innerJoin(users, eq(agents.userId, users.id))
    .where(and(eq(agents.agencyId, agencyId), eq(agents.userId, userId)))
    .limit(1);
  return row?.role ?? null;
}

/**
 * Promote a colleague to agency_admin, or demote one back to agent.
 *
 * A super-admin ("admin") who happens to sit in an agency is never rewritten
 * here — the agency panel does not get to strip the founder's own role.
 */
export async function setTeamMemberRole(params: {
  agencyId: number;
  targetUserId: number;
  role: TeamRole;
}): Promise<TeamWriteResult> {
  const current = await memberRole(params.agencyId, params.targetUserId);
  if (current == null) return "not_in_team";
  if (current === "admin" || current === "staff") return "protected";
  if (current === params.role) return "ok";

  // Demoting the last responsable leaves the agency unmanageable.
  if (
    current === "agency_admin" &&
    (await countAgencyAdmins(params.agencyId)) <= 1
  ) {
    return "last_admin";
  }

  await db
    .update(users)
    .set({ role: params.role })
    .where(eq(users.id, params.targetUserId));
  return "ok";
}

/**
 * Detach a colleague from the agency. They keep their login and their public
 * agent profile and become independent (agency_id = NULL) — this is not an
 * account deletion, and their listings stay with the agency (see the decision
 * note at the top of this file).
 *
 * An agency_admin who leaves is downgraded to `agent`: there is no company left
 * for them to administer, and leaving the role behind would give an independent
 * account the agency-admin UI over nothing.
 */
export async function removeTeamMember(params: {
  agencyId: number;
  targetUserId: number;
}): Promise<TeamWriteResult> {
  const current = await memberRole(params.agencyId, params.targetUserId);
  if (current == null) return "not_in_team";
  if (current === "admin" || current === "staff") return "protected";

  if (
    current === "agency_admin" &&
    (await countAgencyAdmins(params.agencyId)) <= 1
  ) {
    return "last_admin";
  }

  await db
    .update(agents)
    .set({ agencyId: null })
    .where(
      and(eq(agents.agencyId, params.agencyId), eq(agents.userId, params.targetUserId)),
    );

  if (current === "agency_admin") {
    await db
      .update(users)
      .set({ role: "agent" })
      .where(eq(users.id, params.targetUserId));
  }

  return "ok";
}

/**
 * Attach an existing, independent account to an agency by redeeming an invite.
 * The agencyId and role come from the invite row, never from the request.
 *
 * Refuses anyone who already belongs to an agency: switching companies is a
 * decision for the agency they are leaving (or the founder), not something an
 * invite link should do silently behind their current employer's back.
 */
export type JoinResult =
  | "ok"
  | "already_in_agency"
  | "protected"
  | "no_profile";

/**
 * Can this account accept an invitation at all? Called before the invite is
 * consumed, so an account that cannot join doesn't burn a single-use link, and
 * again inside the join itself as the real check.
 */
export async function joinPreflight(
  userId: number,
  conn: DbConn = db,
): Promise<JoinResult> {
  const [me] = await conn
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!me) return "no_profile";
  // Portal operators are not agency employees.
  if (me.role === "admin" || me.role === "staff") return "protected";

  const [agent] = await conn
    .select({ id: agents.id, agencyId: agents.agencyId })
    .from(agents)
    .where(eq(agents.userId, userId))
    .limit(1);
  if (!agent) return "no_profile";
  if (agent.agencyId != null) return "already_in_agency";
  return "ok";
}

/**
 * Bug 6 (plan-build-2026-09-26 §3 A5, founder default §8.3): an independent
 * agent's own listings move INTO the agency they join.
 *
 * Before joining, their panel is scoped on `owner_user_id` (panelScope() in
 * auth/guards.ts); after, on `agency_id`. Without this UPDATE every listing
 * they published as an independent would drop out of the panel the moment
 * they joined — still live on the site, but editable by nobody but /admin.
 *
 * Only rows that are theirs AND agency-less move: a listing another agency
 * already owns is never re-scoped by an invite. `agent_id` is set to their
 * agents row, so the card and new leads name them within the agency. Leads
 * already on those listings need no write: /agencia/leads joins a lead to its
 * listing and applies the same ownership predicate (getPanelLeads()), so they
 * follow the listing.
 *
 * Must run inside the caller's transaction; returns the ids it moved so the
 * caller can write them to admin_events in that same transaction.
 */
export async function moveIndependentListingsToAgency(
  conn: DbConn,
  params: { userId: number; agentId: number; agencyId: number },
): Promise<number[]> {
  const mine = and(
    eq(listings.ownerUserId, params.userId),
    isNull(listings.agencyId),
  );
  // Lock the rows so the id list written to the history is exactly the set
  // the UPDATE touches, even if a publish lands concurrently.
  const rows = await conn
    .select({ id: listings.id })
    .from(listings)
    .where(mine)
    .for("update");
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];

  await conn
    .update(listings)
    .set({ agencyId: params.agencyId, agentId: params.agentId })
    .where(and(inArray(listings.id, ids), mine));
  return ids;
}

export interface JoinOutcome {
  result: JoinResult;
  /** Listings that moved into the agency with them (empty unless "ok"). */
  movedListingIds: number[];
}

/**
 * The membership writes of accepting an invite. Pass the transaction the
 * invite was claimed in: the claim, the membership, the listing move and the
 * history line commit together or not at all.
 */
export async function joinAgencyWithExistingAccount(
  params: {
    userId: number;
    agencyId: number;
    role: TeamRole;
  },
  conn: DbConn = db,
): Promise<JoinOutcome> {
  const refused = (result: JoinResult): JoinOutcome => ({ result, movedListingIds: [] });

  const pre = await joinPreflight(params.userId, conn);
  if (pre !== "ok") return refused(pre);

  const [agent] = await conn
    .select({ id: agents.id, name: agents.name })
    .from(agents)
    .where(eq(agents.userId, params.userId))
    .limit(1);
  if (!agent) return refused("no_profile");

  // Scoped on "still independent" so two open tabs can't fight over it.
  const [res] = await conn
    .update(agents)
    .set({ agencyId: params.agencyId })
    .where(and(eq(agents.id, agent.id), isNull(agents.agencyId)));
  if (res.affectedRows !== 1) return refused("already_in_agency");

  await conn
    .update(users)
    .set({ role: params.role })
    .where(eq(users.id, params.userId));

  const movedListingIds = await moveIndependentListingsToAgency(conn, {
    userId: params.userId,
    agentId: agent.id,
    agencyId: params.agencyId,
  });

  await recordAdminEvent(
    params.userId,
    "agent.join_agency",
    "agency",
    params.agencyId,
    { agentId: agent.id, agentName: agent.name, listingIds: movedListingIds },
    conn,
  );

  return { result: "ok", movedListingIds };
}

/** Thrown inside the transaction so a refused join rolls the claim back. */
class JoinRefused extends Error {
  constructor(readonly code: RedeemResult) {
    super(code);
  }
}

export type RedeemResult = JoinResult | "invalid";

/**
 * Accept an invite with an existing account: claim the invite, join, move the
 * agent's own listings in (bug 6), write the history line, stamp who redeemed
 * it — ONE transaction. A join refused after the claim rolls the claim back
 * instead of burning a single-use link, and no half-joined state (a member
 * whose listings stayed behind) can be committed.
 */
export async function redeemInviteForExistingAccount(params: {
  inviteId: number;
  userId: number;
  agencyId: number;
  role: TeamRole;
}): Promise<{ result: RedeemResult; movedListingIds: number[] }> {
  try {
    return await db.transaction(async (tx) => {
      if (!(await consumeInvite(params.inviteId, tx))) throw new JoinRefused("invalid");
      const outcome = await joinAgencyWithExistingAccount(
        { userId: params.userId, agencyId: params.agencyId, role: params.role },
        tx,
      );
      if (outcome.result !== "ok") throw new JoinRefused(outcome.result);
      await stampInviteUser(params.inviteId, params.userId, tx);
      return outcome;
    });
  } catch (e) {
    if (e instanceof JoinRefused) return { result: e.code, movedListingIds: [] };
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* Super-admin: move agents between agencies (/admin/agentes)          */
/* ------------------------------------------------------------------ */

export interface AdminAgentRow {
  agentId: number;
  userId: number | null;
  name: string;
  slug: string;
  email: string | null;
  whatsapp: string | null;
  role: UserRole | null;
  isVerified: boolean;
  agencyId: number | null;
  agencyName: string | null;
}

/** Every agent with their login and current agency, by name. */
export async function listAgentsWithAgency(): Promise<AdminAgentRow[]> {
  return db
    .select({
      agentId: agents.id,
      userId: agents.userId,
      name: agents.name,
      slug: agents.slug,
      email: users.email,
      whatsapp: agents.whatsapp,
      role: users.role,
      isVerified: agents.isVerified,
      agencyId: agents.agencyId,
      agencyName: agencies.name,
    })
    .from(agents)
    .leftJoin(users, eq(agents.userId, users.id))
    .leftJoin(agencies, eq(agents.agencyId, agencies.id))
    .orderBy(asc(agents.name));
}

export interface AgencyAdminCount {
  id: number;
  name: string;
  adminCount: number;
}

/**
 * Every agency with how many agency_admins it has, so /admin/agentes can warn
 * "esta inmobiliaria no tiene responsable" instead of silently producing one.
 */
export async function listAgenciesWithAdminCount(): Promise<AgencyAdminCount[]> {
  const rows = await db
    .select({
      id: agencies.id,
      name: agencies.name,
      adminCount: sql<number>`sum(case when ${users.role} = 'agency_admin' then 1 else 0 end)`,
    })
    .from(agencies)
    .leftJoin(agents, eq(agents.agencyId, agencies.id))
    .leftJoin(users, eq(agents.userId, users.id))
    .groupBy(agencies.id, agencies.name)
    .orderBy(asc(agencies.name));

  return rows.map((r) => ({ ...r, adminCount: Number(r.adminCount ?? 0) }));
}

export type AdminMoveResult =
  | "ok"
  | "not_found"
  | "last_admin"
  | "protected";

/**
 * Point an agents row at another agency, or at NULL (independent), and set the
 * role that goes with the destination.
 *
 * Same lockout guard as the agency panel, from the other side: moving the only
 * agency_admin out of an agency is refused, so no super-admin action can leave
 * an inmobiliaria without a responsable either. Listings keep their agency_id
 * here too — one decision, both paths (see the note at the top of this file).
 */
export async function moveAgentToAgency(params: {
  agentId: number;
  /** NULL = make them independent. */
  agencyId: number | null;
  /** Role to apply at the destination; ignored when the row has no login. */
  role: TeamRole;
  /** The operator making the move — the actor on the admin_events line. */
  actorUserId: number;
}): Promise<AdminMoveResult> {
  const [row] = await db
    .select({
      id: agents.id,
      name: agents.name,
      userId: agents.userId,
      agencyId: agents.agencyId,
      role: users.role,
    })
    .from(agents)
    .leftJoin(users, eq(agents.userId, users.id))
    .where(eq(agents.id, params.agentId))
    .limit(1);
  if (!row) return "not_found";
  // Never rewrite a portal operator's role from a list of agents.
  if (row.role === "admin" || row.role === "staff") return "protected";

  const leaving = row.agencyId != null && row.agencyId !== params.agencyId;
  if (
    leaving &&
    row.role === "agency_admin" &&
    (await countAgencyAdmins(row.agencyId!)) <= 1
  ) {
    return "last_admin";
  }

  await db.transaction(async (tx) => {
    await tx
      .update(agents)
      .set({ agencyId: params.agencyId })
      .where(eq(agents.id, params.agentId));

    if (row.userId != null) {
      // Nobody administers "independent": that destination is always an agent.
      const role: TeamRole = params.agencyId == null ? "agent" : params.role;
      await tx.update(users).set({ role }).where(eq(users.id, row.userId));

      // Independent → agency: their own listings join with them (bug 6), the
      // same rule as accepting an invite.
      if (row.agencyId == null && params.agencyId != null) {
        const listingIds = await moveIndependentListingsToAgency(tx, {
          userId: row.userId,
          agentId: row.id,
          agencyId: params.agencyId,
        });
        await recordAdminEvent(
          params.actorUserId,
          "agent.join_agency",
          "agency",
          params.agencyId,
          { agentId: row.id, agentName: row.name, listingIds },
          tx,
        );
      }
    }
  });

  return "ok";
}

/**
 * Titles for the /agencia "listings that moved in" notice. Scoped on the
 * agency in the WHERE clause, so an id list read from the history can never
 * name a listing that has since left (or never belonged to) this agency.
 */
export async function listAgencyListingTitles(
  agencyId: number,
  ids: number[],
): Promise<{ id: number; title: string }[]> {
  if (ids.length === 0) return [];
  return db
    .select({ id: listings.id, title: listings.title })
    .from(listings)
    .where(and(eq(listings.agencyId, agencyId), inArray(listings.id, ids)))
    .orderBy(asc(listings.id))
    .limit(50);
}
