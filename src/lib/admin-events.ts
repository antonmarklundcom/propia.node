/**
 * The /admin history: who did what (`admin_events`, migration 0017).
 *
 * Written from server actions only, after the write it describes succeeded.
 * Never throws into the caller — a history line that failed to save must not
 * turn a successful publish into an error page — but it is awaited, so the
 * line exists by the time the operator's redirect lands.
 */
import "server-only";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { adminEvents, users } from "@/db/schema";

export type AdminEventAction =
  | "lead.share"
  | "lead.revoke"
  | "listing.publish"
  | "listing.delete"
  | "user.role"
  | "user.password"
  | "user.delete";

export type AdminEventTarget = "lead" | "listing" | "user";

export async function recordAdminEvent(
  actorUserId: number,
  action: AdminEventAction,
  targetType: AdminEventTarget,
  targetId: number,
  detail?: Record<string, string | number | null>,
): Promise<void> {
  try {
    await db.insert(adminEvents).values({
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
