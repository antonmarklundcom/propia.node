/**
 * The counts badged on the /admin tabs: what is waiting for the operator on
 * each screen. One loader for every admin page, so a tab shows the same number
 * wherever the operator is standing — before this, each page passed the few
 * counts it happened to load and the rest of the badges vanished.
 *
 * What each badge counts ("waiting for you", never a total):
 * - review      listings in `pending_review`;
 * - leads       internal-lane leads still `new` — the operator's own to answer.
 *               Leads routed to an agency, agent or owner are theirs, and
 *               nobody marks those, so counting them would only ever grow;
 * - deals       deals won and not yet marked paid (commission to collect);
 * - inbox       unread emails in the viewer's mailboxes + unread WhatsApp
 *               chats not yet attached to a lead;
 * - posts       draft guides/notes;
 * - operations  jobs whose last run threw;
 * - agencies    agencies someone registered (a linked account) not yet verified;
 * - agents      agents who claimed a profile, not yet verified;
 * - reviews     partner reviews waiting for approval (O7, migration 0028).
 *
 * Not cached: a badge that lags the action the operator just took reads as
 * "my approve didn't work". The core counts are one round trip of scalar
 * subqueries on indexed columns; the tables that arrived with later
 * migrations are read separately, each failing to 0 so a missing table never
 * costs the operator the page.
 */
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { isStaff, isSuperAdmin, type UserRole } from "@/lib/auth/roles";
import { countUnreadInbox } from "@/lib/inbox";
import { countUnreadWhatsAppChats } from "@/lib/whatsapp-inbox";

export interface AdminBadges {
  review: number;
  leads: number;
  deals: number;
  inbox: number;
  posts: number;
  operations: number;
  agencies: number;
  agents: number;
  reviews: number;
}

export const NO_BADGES: AdminBadges = {
  review: 0,
  leads: 0,
  deals: 0,
  inbox: 0,
  posts: 0,
  operations: 0,
  agencies: 0,
  agents: 0,
  reviews: 0,
};

/** mysql2 returns the first row of a raw `db.execute()` as `[rows, fields]`. */
function firstRow(result: unknown): Record<string, unknown> {
  const rows = Array.isArray(result) ? result[0] : null;
  return (Array.isArray(rows) ? rows[0] : null) ?? {};
}

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
};

async function coreCounts(): Promise<Pick<AdminBadges, "review" | "leads" | "posts" | "agencies" | "agents">> {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM listings WHERE status = 'pending_review') AS review,
      (SELECT COUNT(*) FROM leads WHERE status = 'new' AND routed_to = 'internal') AS leads,
      (SELECT COUNT(*) FROM posts WHERE status = 'draft') AS posts,
      (SELECT COUNT(*) FROM agencies a
         WHERE a.is_verified = 0
           AND EXISTS (SELECT 1 FROM agents g WHERE g.agency_id = a.id AND g.user_id IS NOT NULL)) AS agencies,
      (SELECT COUNT(*) FROM agents WHERE is_verified = 0 AND user_id IS NOT NULL) AS agents
  `);
  const r = firstRow(result);
  return {
    review: n(r.review),
    leads: n(r.leads),
    posts: n(r.posts),
    agencies: n(r.agencies),
    agents: n(r.agents),
  };
}

async function unpaidWonDeals(): Promise<number> {
  const result = await db.execute(
    sql`SELECT COUNT(*) AS n FROM deals WHERE stage = 'won' AND paid_at IS NULL`,
  );
  return n(firstRow(result).n);
}

async function pendingReviews(): Promise<number> {
  const result = await db.execute(sql`SELECT COUNT(*) AS n FROM reviews WHERE status = 'pending'`);
  return n(firstRow(result).n);
}

async function failedJobs(): Promise<number> {
  // The newest run of each job, by id — the same rule as lastRunByJob().
  const result = await db.execute(sql`
    SELECT COUNT(*) AS n FROM ops_runs
    WHERE ok = 0 AND id IN (SELECT MAX(id) FROM ops_runs GROUP BY job)
  `);
  return n(firstRow(result).n);
}

export async function getAdminBadges(user: { id: number; role: UserRole }): Promise<AdminBadges> {
  const superAdmin = isSuperAdmin(user.role);
  const [core, deals, operations, email, whatsapp, reviews] = await Promise.all([
    coreCounts().catch(() => null),
    superAdmin ? unpaidWonDeals().catch(() => 0) : 0,
    superAdmin ? failedJobs().catch(() => 0) : 0,
    countUnreadInbox({ userId: user.id, superAdmin }),
    superAdmin || isStaff(user.role) ? countUnreadWhatsAppChats().catch(() => 0) : 0,
    pendingReviews().catch(() => 0),
  ]);
  return {
    ...NO_BADGES,
    ...(core ?? {}),
    deals,
    operations,
    inbox: email + whatsapp,
    reviews,
  };
}
