/**
 * Per-agent numbers for the agency's responsable on /agencia (build A1,
 * Agency 4): listings published, leads in the last 30 days, shared leads
 * answered, median hours to answer.
 *
 * Every query is pinned to one agency by `agencyId`, which callers take from
 * `requireAgencyContext()` and nothing else. Leads count through the same
 * listing scope and the same lanes `getPanelLeads()` uses, so the totals here
 * add up to what /agencia/leads lists (minus leads on listings no agent owns).
 */
import "server-only";
import { and, eq, gte, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { agents, leadAssignments, leads, listings } from "@/db/schema";
import { listingScopeWhere } from "@/lib/listing-edit";

export const TEAM_STATS_DAYS = 30;

export interface AgentNumbers {
  agentId: number;
  name: string;
  published: number;
  leads: number;
  sharedAnswered: number;
  /** Null when the agent has answered no shared lead yet. */
  medianHours: number | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export async function getAgentNumbers(agencyId: number): Promise<AgentNumbers[]> {
  const scope = listingScopeWhere({ kind: "agency", agencyId })!;
  const since = new Date(Date.now() - TEAM_STATS_DAYS * 24 * 60 * 60 * 1000);

  const [team, published, recentLeads, answers] = await Promise.all([
    db
      .select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(eq(agents.agencyId, agencyId))
      .orderBy(agents.name),
    db
      .select({ agentId: listings.agentId, n: sql<number>`count(*)` })
      .from(listings)
      .where(and(scope, eq(listings.status, "published"), isNotNull(listings.agentId)))
      .groupBy(listings.agentId),
    db
      .select({ agentId: listings.agentId, n: sql<number>`count(*)` })
      .from(leads)
      .innerJoin(listings, eq(leads.listingId, listings.id))
      .where(
        and(
          scope,
          inArray(leads.routedTo, ["agency", "agent", "owner"]),
          gte(leads.createdAt, since),
          isNotNull(listings.agentId),
        ),
      )
      .groupBy(listings.agentId),
    // One row per answered share; count and median are taken in TS (MySQL
    // has no MEDIAN, and the volume is a handful of rows per agency).
    db
      .select({
        agentId: leadAssignments.agentId,
        minutes: sql<number>`timestampdiff(minute, ${leadAssignments.createdAt}, ${leadAssignments.stateAt})`,
      })
      .from(leadAssignments)
      .innerJoin(agents, eq(agents.id, leadAssignments.agentId))
      .where(
        and(
          eq(agents.agencyId, agencyId),
          isNull(leadAssignments.revokedAt),
          isNotNull(leadAssignments.stateAt),
        ),
      ),
  ]);

  const byAgent = (rows: { agentId: number | null; n: number }[]) =>
    new Map(rows.map((r) => [r.agentId, Number(r.n)]));
  const publishedBy = byAgent(published);
  const leadsBy = byAgent(recentLeads);
  const minutesBy = new Map<number, number[]>();
  for (const a of answers) {
    const list = minutesBy.get(a.agentId) ?? [];
    list.push(Number(a.minutes));
    minutesBy.set(a.agentId, list);
  }

  return team.map((a) => {
    const mins = minutesBy.get(a.id) ?? [];
    const med = median(mins);
    return {
      agentId: a.id,
      name: a.name,
      published: publishedBy.get(a.id) ?? 0,
      leads: leadsBy.get(a.id) ?? 0,
      sharedAnswered: mins.length,
      medianHours: med == null ? null : Math.round(med / 6) / 10,
    };
  });
}
