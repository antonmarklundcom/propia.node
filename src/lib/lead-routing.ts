/**
 * Lead routing rules (plan-admin-next O3) — the database half. The rules
 * themselves are pure in `src/lib/lead-routing-rules.ts`; this file reads what
 * they need, applies the decision through `shareLeads()` (the same write a
 * share by hand makes) and logs it in `admin_events` as `lead.auto_share`.
 *
 * Called from the two lead writers' `after()` (the public form and the
 * WhatsApp lead logged on /admin/leads), so a visitor never waits on it and a
 * failure leaves the lead exactly where it was: with the operator, to share
 * by hand. Never throws.
 */
import "server-only";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, leadAssignments, leads, listings, locations } from "@/db/schema";
import { recordAdminEvent } from "@/lib/admin-events";
import { shareLeads } from "@/lib/lead-assignments";
import { REPORT_SOURCE } from "@/lib/report-queries";
import { sendShareNotices } from "@/lib/share-notices";
import { getLeadRoutingSettings, getPartnerAgentIds } from "@/lib/site-settings";
import {
  BUSY_AFTER_HOURS,
  decideRouting,
  parseRoutingConfig,
  partnerKey,
  type PartnerKey,
  type PartnerState,
  type RoutingConfig,
  type RoutingDecision,
  type RoutingLead,
} from "@/lib/lead-routing-rules";
import { esRouting } from "@/i18n/es-routing";

/** One Socio as the rules screen lists it. */
export interface Socio {
  key: PartnerKey;
  kind: "agency" | "agent";
  id: number;
  name: string;
  isVerified: boolean;
}

/**
 * The current Socios: agencies on the partner plan and the independent agents
 * marked "Socio" in /admin/agentes (site setting `partner_agent_ids`) — the
 * same two lists `publisherKindSql()` calls "partner".
 */
export async function listSocios(opts: { uncached?: boolean } = {}): Promise<Socio[]> {
  const agentIds = await getPartnerAgentIds({ uncached: opts.uncached });
  const [agencyRows, agentRows] = await Promise.all([
    db
      .select({ id: agencies.id, name: agencies.name, isVerified: agencies.isVerified })
      .from(agencies)
      .where(eq(agencies.plan, "partner"))
      .orderBy(agencies.name),
    agentIds.length
      ? db
          .select({ id: agents.id, name: agents.name, isVerified: agents.isVerified })
          .from(agents)
          .where(and(inArray(agents.id, agentIds), isNull(agents.agencyId)))
          .orderBy(agents.name)
      : Promise.resolve([]),
  ]);
  return [
    ...agencyRows.map((a) => ({ key: partnerKey({ kind: "agency", id: a.id }), kind: "agency" as const, ...a })),
    ...agentRows.map((a) => ({ key: partnerKey({ kind: "agent", id: a.id }), kind: "agent" as const, ...a })),
  ];
}

/**
 * Busy-ness and rotation state of every Socio, in one query: active shares
 * still pending after BUSY_AFTER_HOURS, and the newest share of any kind.
 * Only a verified Socio is shareable (`shareLeads()` refuses the rest).
 */
export async function partnerStates(socios: Socio[]): Promise<Map<string, PartnerState>> {
  const out = new Map<string, PartnerState>();
  for (const s of socios) out.set(s.key, { shareable: s.isVerified, overdue: 0, lastSharedAt: null });
  if (socios.length === 0) return out;
  // Socio ids are positive, so these never match the 0 "no target" column.
  const agencyIds = socios.filter((s) => s.kind === "agency").map((s) => s.id);
  const agentIds = socios.filter((s) => s.kind === "agent").map((s) => s.id);
  const rows = await db
    .select({
      agencyId: leadAssignments.agencyId,
      agentId: leadAssignments.agentId,
      overdue: sql<number>`sum(${leadAssignments.state} = 'pending' and ${leadAssignments.revokedAt} is null and ${leadAssignments.createdAt} < now() - interval ${BUSY_AFTER_HOURS} hour)`,
      last: sql<string | Date | null>`max(${leadAssignments.createdAt})`,
    })
    .from(leadAssignments)
    .where(
      or(
        agencyIds.length ? inArray(leadAssignments.agencyId, agencyIds) : undefined,
        agentIds.length ? inArray(leadAssignments.agentId, agentIds) : undefined,
      ),
    )
    .groupBy(leadAssignments.agencyId, leadAssignments.agentId);
  for (const r of rows) {
    const key = r.agencyId ? partnerKey({ kind: "agency", id: r.agencyId }) : partnerKey({ kind: "agent", id: r.agentId });
    const s = out.get(key);
    if (!s) continue;
    const last = r.last == null ? null : new Date(r.last).getTime();
    out.set(key, { ...s, overdue: Number(r.overdue ?? 0), lastSharedAt: Number.isFinite(last) ? last : null });
  }
  return out;
}

function utmSource(utm: unknown): string | null {
  // MariaDB hands `json` back as a string (fable/KNOWN-ISSUES.md).
  let v = utm;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  const src = v && typeof v === "object" ? (v as Record<string, unknown>).source : null;
  return typeof src === "string" ? src : null;
}

/** What `decideRouting()` needs about these leads, keyed by lead id. */
export async function routingLeads(leadIds: number[], socios: Socio[]): Promise<Map<number, RoutingLead>> {
  const out = new Map<number, RoutingLead>();
  if (leadIds.length === 0) return out;
  const rows = await db
    .select({
      id: leads.id,
      routedTo: leads.routedTo,
      leadType: leads.leadType,
      utm: leads.utm,
      operation: listings.operation,
      propertyType: listings.propertyType,
      priceUsd: listings.priceUsd,
      listingAgencyId: listings.agencyId,
      listingAgentId: listings.agentId,
      locId: locations.id,
      locLevel: locations.level,
      locParent: locations.parentId,
      shares: sql<number>`(select count(*) from ${leadAssignments} where ${leadAssignments.leadId} = ${leads.id} and ${leadAssignments.revokedAt} is null)`,
    })
    .from(leads)
    .leftJoin(listings, eq(listings.id, leads.listingId))
    .leftJoin(locations, eq(locations.id, listings.locationId))
    .where(inArray(leads.id, leadIds));

  const socioKeys = new Set(socios.map((s) => s.key));
  for (const r of rows) {
    let ownerPartner: PartnerKey | null = null;
    if (r.listingAgencyId) {
      const k = partnerKey({ kind: "agency", id: r.listingAgencyId });
      if (socioKeys.has(k)) ownerPartner = k;
    } else if (r.listingAgentId) {
      const k = partnerKey({ kind: "agent", id: r.listingAgentId });
      if (socioKeys.has(k)) ownerPartner = k;
    }
    out.set(r.id, {
      routedTo: r.routedTo,
      leadType: r.leadType,
      isReport: utmSource(r.utm) === REPORT_SOURCE,
      alreadyShared: Number(r.shares) > 0,
      listing: r.operation
        ? {
            operation: r.operation,
            propertyType: r.propertyType ?? "",
            priceUsd: Number(r.priceUsd ?? 0),
            barrioId: r.locLevel === "barrio" ? r.locId : null,
            cityId: r.locLevel === "barrio" ? r.locParent : r.locLevel === "ciudad" ? r.locId : null,
            ownerPartner,
          }
        : null,
    });
  }
  return out;
}

export interface RoutingContext {
  enabled: boolean;
  config: RoutingConfig;
  socios: Socio[];
  states: Map<string, PartnerState>;
}

export async function loadRoutingContext(opts: { uncached?: boolean } = {}): Promise<RoutingContext> {
  const settings = await getLeadRoutingSettings({ uncached: opts.uncached });
  const config = parseRoutingConfig(settings.rulesRaw);
  const socios = await listSocios({ uncached: opts.uncached });
  const states = await partnerStates(socios);
  return { enabled: settings.enabled, config, socios, states };
}

/**
 * Route one freshly saved lead. Returns the decision taken (for logs and the
 * caller's curiosity); a `share` decision whose write found nothing to share
 * (the lead changed lane in between) is reported as manual.
 */
export async function autoRouteLead(leadId: number, opts: { inboxUrl: string }): Promise<RoutingDecision> {
  try {
    const settings = await getLeadRoutingSettings({ uncached: true });
    // The common case — routing off — costs one settings read and nothing else.
    if (!settings.enabled) return { kind: "manual", reason: "off" };
    const ctx = await loadRoutingContext({ uncached: true });
    const lead = (await routingLeads([leadId], ctx.socios)).get(leadId);
    if (!lead) return { kind: "manual", reason: "no_listing" };
    const decision = decideRouting({ enabled: ctx.enabled, config: ctx.config, lead, states: ctx.states });
    if (decision.kind !== "share" || ctx.config.savedBy == null) return decision;

    const shared = await shareLeads({
      leadIds: [leadId],
      target: decision.target,
      note: esRouting.shareNote,
      byUserId: ctx.config.savedBy,
      // The rules only ever touch the operator's own lane.
      internalOnly: true,
    });
    if (shared.length === 0) return { kind: "manual", reason: "not_internal" };
    await recordAdminEvent(ctx.config.savedBy, "lead.auto_share", "lead", leadId, {
      target: partnerKey(decision.target),
      via: decision.via,
      candidates: decision.candidates,
    });
    await sendShareNotices({ target: decision.target, leadIds: shared, inboxUrl: opts.inboxUrl });
    return decision;
  } catch (e) {
    console.warn(`[lead-routing] lead #${leadId} not routed: ${String(e)}`);
    return { kind: "manual", reason: "off" };
  }
}

export interface RoutingPreviewRow {
  leadId: number;
  createdAt: Date;
  name: string | null;
  listingTitle: string | null;
  decision: RoutingDecision;
}

/**
 * What the rules as saved would do with the latest leads in the operator's
 * lane — the settings screen's preview. Read-only, and the same
 * `decideRouting()` the writer runs; leads already shared show as such.
 */
export async function previewRouting(ctx: RoutingContext, limit = 15): Promise<RoutingPreviewRow[]> {
  const recent = await db
    .select({ id: leads.id, createdAt: leads.createdAt, name: leads.name, title: listings.title })
    .from(leads)
    .leftJoin(listings, eq(listings.id, leads.listingId))
    .where(eq(leads.routedTo, "internal"))
    .orderBy(sql`${leads.id} desc`)
    .limit(limit);
  const byId = await routingLeads(recent.map((r) => r.id), ctx.socios);
  return recent.map((r) => ({
    leadId: r.id,
    createdAt: r.createdAt,
    name: r.name,
    listingTitle: r.title,
    // Previewed as if switched on and saved: the point is to see the rules
    // before that. The actor only matters to the write.
    decision: decideRouting({ enabled: true, config: { ...ctx.config, savedBy: ctx.config.savedBy ?? 0 }, lead: byId.get(r.id)!, states: ctx.states }),
  }));
}
