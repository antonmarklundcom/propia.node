/**
 * The /admin history: who did what (`admin_events`, migration 0017).
 *
 * Written from server actions only, after the write it describes succeeded —
 * or, with a transaction passed as `conn`, inside the same transaction as that
 * write (MySQL keeps a transaction usable after a failed statement, so the
 * swallowed error below cannot poison it). Never throws into the caller — a history line that failed to save must not
 * turn a successful publish into an error page — but it is awaited, so the
 * line exists by the time the operator's redirect lands.
 */
import "server-only";
import { and, desc, eq, gt, gte, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { adminEvents, users } from "@/db/schema";

export type AdminEventAction =
  | "lead.share"
  | "lead.revoke"
  | "listing.publish"
  | "listing.delete"
  | "user.role"
  | "user.password"
  | "user.delete"
  | "agent.join_agency";

export type AdminEventTarget = "lead" | "listing" | "user" | "agency";

type DbConn = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function recordAdminEvent(
  actorUserId: number,
  action: AdminEventAction,
  targetType: AdminEventTarget,
  targetId: number,
  detail?: Record<string, string | number | number[] | null>,
  /** A transaction, when the event must commit or roll back with the write. */
  conn: DbConn = db,
): Promise<void> {
  try {
    await conn.insert(adminEvents).values({
      actorUserId,
      action,
      targetType,
      targetId,
      detailJson: detail ?? null,
    });
  } catch (e) {
    console.warn(`[admin-events] ${action} ${targetType}#${targetId} not recorded: ${String(e)}`);
  }
}

export interface AdminEventRow {
  id: number;
  action: string;
  targetType: string;
  targetId: number;
  detail: Record<string, unknown> | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: Date;
}

/** JSON columns come back as strings on MariaDB (see fable/KNOWN-ISSUES.md). */
function parseDetail(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export async function listAdminEvents(params: {
  targetType?: AdminEventTarget;
  targetId?: number;
  limit?: number;
} = {}): Promise<AdminEventRow[]> {
  const filters: SQL[] = [];
  if (params.targetType) filters.push(eq(adminEvents.targetType, params.targetType));
  if (params.targetId) filters.push(eq(adminEvents.targetId, params.targetId));

  const rows = await db
    .select({
      id: adminEvents.id,
      action: adminEvents.action,
      targetType: adminEvents.targetType,
      targetId: adminEvents.targetId,
      detail: adminEvents.detailJson,
      actorName: users.name,
      actorEmail: users.email,
      createdAt: adminEvents.createdAt,
    })
    .from(adminEvents)
    .leftJoin(users, eq(users.id, adminEvents.actorUserId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(adminEvents.createdAt), desc(adminEvents.id))
    .limit(Math.min(params.limit ?? 200, 500));

  return rows.map((r) => ({ ...r, detail: parseDetail(r.detail) }));
}

/** One agent's join, as the /agencia notice shows it. */
export interface AgencyJoinEvent {
  id: number;
  agentName: string | null;
  listingIds: number[];
  createdAt: Date;
}

/**
 * `agent.join_agency` events for one agency newer than `afterId` — the
 * /agencia "these listings moved in with a new member" notice. It is read from
 * the history rather than a column, so dismissing it is a cookie holding the
 * last event id seen (app/agencia/actions.ts), and the notice ages out on its
 * own after `days`. Hits idx_target (target_type, target_id).
 */
export async function listAgencyJoinEvents(params: {
  agencyId: number;
  afterId: number;
  days?: number;
}): Promise<AgencyJoinEvent[]> {
  const since = new Date(Date.now() - (params.days ?? 30) * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      id: adminEvents.id,
      agentName: users.name,
      detail: adminEvents.detailJson,
      createdAt: adminEvents.createdAt,
    })
    .from(adminEvents)
    .leftJoin(users, eq(users.id, adminEvents.actorUserId))
    .where(
      and(
        eq(adminEvents.targetType, "agency"),
        eq(adminEvents.targetId, params.agencyId),
        eq(adminEvents.action, "agent.join_agency"),
        gt(adminEvents.id, params.afterId),
        gte(adminEvents.createdAt, since),
      ),
    )
    .orderBy(desc(adminEvents.id))
    .limit(10);

  return rows
    .map((r) => {
      const detail = parseDetail(r.detail);
      const raw = detail?.listingIds;
      // The member's name as written at the time; the actor is the fallback
      // (they differ when an operator made the move from /admin/agentes).
      const named = typeof detail?.agentName === "string" ? detail.agentName : null;
      const listingIds = Array.isArray(raw)
        ? raw.map(Number).filter((n) => Number.isInteger(n) && n > 0)
        : [];
      return { id: r.id, agentName: named ?? r.agentName, listingIds, createdAt: r.createdAt };
    })
    .filter((e) => e.listingIds.length > 0);
}
