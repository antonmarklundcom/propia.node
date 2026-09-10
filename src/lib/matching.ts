import "server-only";

/**
 * D3 — suggesting professionals for a directory seller lead.
 *
 * A **suggestion**, never an automation. Nothing here notifies or routes: it
 * ranks verified agents so the operator's "match 3" click in /admin/leads is
 * an informed one, and the hand-off stays a WhatsApp message a human sends
 * (fable-plan-realtor-terreno-rental.md Stage 1 D). The lead itself is
 * unchanged — still `leadType: "seller"` with a `directory:*` `utm.source`,
 * still no `leads.agent_id` column.
 *
 * Not cached, on purpose: it runs on one admin click, and a stale ranking is
 * a wrong hand-off. See `listAgentMatchCandidates`.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { agents, leadMatches, leads } from "../db/schema";
import {
  listAgentMatchCandidates,
  type AgentMatchCandidate,
} from "./directory-queries";

/** The operator may hand one lead to at most this many professionals. */
export const MAX_MATCHES_PER_LEAD = 3;

/** How many candidates the panel offers to choose from. */
export const SUGGESTION_LIMIT = 6;

export interface AgentSuggestion extends AgentMatchCandidate {
  /** Declared the lead's city in `agents.zones`. */
  zoneDeclared: boolean;
  /** Has published inventory in the lead's city. */
  hasInventoryThere: boolean;
}

export interface LeadMatchRow {
  id: number;
  leadId: number;
  agentId: number;
  agentName: string;
  agentSlug: string;
  agentWhatsapp: string | null;
  status: "proposed" | "sent" | "accepted" | "declined";
  createdAt: Date;
  sentAt: Date | null;
}

/**
 * The city a lead is about, as a `locations` slug — or null when it does not
 * say.
 *
 * Today it is usually null: `DirectoryLeadForm` puts the visitor's city in
 * the message body (there is no `leads.city` column and D1 added no schema),
 * and `/api/leads` is out of this phase's scope, so `utm.city` is only
 * present if a caller sets it. Both plausible spellings are read because the
 * extra line costs nothing and a silent mismatch costs the whole zone
 * signal. When it is null the ranking falls back to inventory size, which is
 * still a better list than alphabetical.
 */
export function leadCitySlug(
  utm: Record<string, string> | null | undefined,
): string | null {
  const raw = utm?.city ?? utm?.city_slug ?? null;
  const slug = raw?.trim().toLowerCase();
  return slug ? slug : null;
}

/**
 * Rank candidates for one city: declared zone + real inventory first, then
 * inventory only, then a declared zone alone. Inventory outranks a
 * declaration because a listing in the city is a fact and a zone list is an
 * intention — the same reasoning that made `listDirectoryZones` derived.
 *
 * Ties break on total published inventory, then name, so the order is stable
 * between two renders of the same panel.
 */
export function rankCandidates(
  candidates: AgentMatchCandidate[],
  citySlug: string | null,
  limit = SUGGESTION_LIMIT,
): AgentSuggestion[] {
  const scored: AgentSuggestion[] = candidates.map((c) => ({
    ...c,
    zoneDeclared: citySlug != null && c.declaredZones.includes(citySlug),
    hasInventoryThere: citySlug != null && c.inventoryZones.includes(citySlug),
  }));

  const tier = (s: AgentSuggestion): number =>
    s.zoneDeclared && s.hasInventoryThere
      ? 0
      : s.hasInventoryThere
        ? 1
        : s.zoneDeclared
          ? 2
          : 3;

  return scored
    .sort(
      (a, b) =>
        tier(a) - tier(b) ||
        b.listingCount - a.listingCount ||
        a.name.localeCompare(b.name, "es"),
    )
    .slice(0, limit);
}

/**
 * Suggestions for a single lead — the named entry point.
 *
 * Rendering a whole inbox calls `listAgentMatchCandidates()` once and
 * `rankCandidates()` per lead instead; this wrapper is for a single-lead
 * caller (a future /admin/leads/[id], or a script) that would otherwise
 * re-derive the lead's city by hand.
 */
export async function suggestAgentsForLead(
  leadId: number,
): Promise<AgentSuggestion[]> {
  const [lead] = await db
    .select({ utm: leads.utm })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!lead) return [];

  const candidates = await listAgentMatchCandidates();
  return rankCandidates(candidates, leadCitySlug(parseUtm(lead.utm)));
}

/**
 * `leads.utm` as an object. On this stack (MariaDB) a json column comes back
 * from mysql2 as a raw JSON *string*, not a parsed object — the trap that
 * made the /vender source chip silently never render (panel-queries.ts).
 */
export function parseUtm(raw: unknown): Record<string, string> | null {
  const value = typeof raw === "string" ? safeJson(raw) : raw;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, string>)
    : null;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Existing proposals for the leads currently on screen, one query for the
 * whole page rather than one per card.
 */
export async function listMatchesForLeads(
  leadIds: number[],
): Promise<Map<number, LeadMatchRow[]>> {
  const byLead = new Map<number, LeadMatchRow[]>();
  if (leadIds.length === 0) return byLead;

  const rows = await db
    .select({
      id: leadMatches.id,
      leadId: leadMatches.leadId,
      agentId: leadMatches.agentId,
      agentName: agents.name,
      agentSlug: agents.slug,
      agentWhatsapp: agents.whatsapp,
      status: leadMatches.status,
      createdAt: leadMatches.createdAt,
      sentAt: leadMatches.sentAt,
    })
    .from(leadMatches)
    .innerJoin(agents, eq(leadMatches.agentId, agents.id))
    .where(inArray(leadMatches.leadId, leadIds))
    .orderBy(desc(leadMatches.createdAt));

  for (const r of rows) {
    const list = byLead.get(r.leadId) ?? [];
    list.push(r);
    byLead.set(r.leadId, list);
  }
  return byLead;
}

/**
 * Write a proposal. Idempotent by `uq_lead_agent`: re-saving the same three
 * professionals is the same proposal, not three more rows, and it must not
 * reset a match already marked `sent`.
 *
 * Returns how many rows were newly proposed — the panel reports that rather
 * than claiming a message went anywhere.
 */
export async function proposeMatches(
  leadId: number,
  agentIds: number[],
): Promise<number> {
  const unique = [...new Set(agentIds)].filter(
    (n) => Number.isInteger(n) && n > 0,
  );
  if (unique.length === 0) return 0;

  // Only verified agents can be proposed, whatever the form posted: the
  // checkbox list is a suggestion, and the gate belongs on the write.
  const allowed = await db
    .select({ id: agents.id })
    .from(agents)
    .where(and(inArray(agents.id, unique), eq(agents.isVerified, true)));
  if (allowed.length === 0) return 0;

  const existing = await db
    .select({ agentId: leadMatches.agentId })
    .from(leadMatches)
    .where(eq(leadMatches.leadId, leadId));
  const already = new Set(existing.map((r) => r.agentId));

  const fresh = allowed.filter((a) => !already.has(a.id));
  if (fresh.length === 0) return 0;

  await db
    .insert(leadMatches)
    .values(fresh.map((a) => ({ leadId, agentId: a.id })));
  return fresh.length;
}

/**
 * Record that the operator actually opened the hand-off for one match.
 *
 * `sent_at` is written once — a second click does not move it, so the column
 * keeps meaning "when this lead first reached this agent". `accepted` /
 * `declined` are never overwritten either: those come from the agent side
 * (D3b) and outrank an operator's re-click.
 */
export async function markMatchSent(matchId: number): Promise<void> {
  await db
    .update(leadMatches)
    .set({ status: "sent", sentAt: new Date() })
    .where(and(eq(leadMatches.id, matchId), eq(leadMatches.status, "proposed")));
}
