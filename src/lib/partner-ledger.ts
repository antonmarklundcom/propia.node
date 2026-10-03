/**
 * The partner lead ledger (plan-admin-next O2): every lead each Socio got from
 * the site, and what became of it. Derived, not stored — CLAUDE.md forbids a
 * `leads.agent_id` column or a new `routed_to` member, and both sources below
 * are already rows:
 *
 * - **share**   — a `lead_assignments` row for the Socio (by hand or by the
 *                 routing rules), revoked or not;
 * - **listing** — a lead on the Socio's own listing that went straight to them
 *                 (`routed_to` agency / agent: marketplace mode). A listing
 *                 lead that came to the operator and was then shared counts
 *                 once, as a share.
 *
 * Outcome = the share's answer, the lead's follow-up status and the deal (its
 * stage, and on /admin the typed money). A listing lead is attributed through
 * the listing's CURRENT agency / agent: a listing moved to another agency moves
 * its old leads with it. That is the cost of not storing a partner on `leads`.
 *
 * Super-admin only (the page guards itself): the summary carries the money
 * sums `dealSummary()` already shows on /admin/negocios.
 */
import "server-only";
import { and, desc, eq, inArray, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, deals, leadAssignments, leads, listings } from "@/db/schema";
import { getPartnerAgentIds } from "@/lib/site-settings";
import type { DealStage } from "@/lib/deal-form";

export type PartnerKind = "agency" | "agent";

export interface LedgerPartner {
  kind: PartnerKind;
  id: number;
  /** `agency:12` / `agent:7` — the URL segment of the detail page. */
  key: string;
  name: string;
  isVerified: boolean;
}

export function parseLedgerKey(v: string): { kind: PartnerKind; id: number } | null {
  const m = /^(agency|agent)[:-](\d{1,10})$/.exec(v);
  if (!m) return null;
  const id = Number(m[2]);
  return Number.isSafeInteger(id) && id > 0 ? { kind: m[1] as PartnerKind, id } : null;
}

/**
 * The Socios: agencies on the partner plan and the independent agents marked
 * "Socio" (`partner_agent_ids`) — the same two lists `publisherKindSql()`
 * calls "partner".
 */
export async function listLedgerPartners(): Promise<LedgerPartner[]> {
  const agentIds = await getPartnerAgentIds();
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
    ...agencyRows.map((a) => ({ kind: "agency" as const, key: `agency:${a.id}`, ...a })),
    ...agentRows.map((a) => ({ kind: "agent" as const, key: `agent:${a.id}`, ...a })),
  ];
}

/** One partner's own row (a Socio or not — a former Socio's ledger still reads). */
export async function getLedgerPartner(kind: PartnerKind, id: number): Promise<LedgerPartner | null> {
  const table = kind === "agency" ? agencies : agents;
  const [row] = await db
    .select({ id: table.id, name: table.name, isVerified: table.isVerified })
    .from(table)
    .where(eq(table.id, id))
    .limit(1);
  return row ? { kind, key: `${kind}:${row.id}`, ...row } : null;
}

/** "Their listing" for a partner: an agency's rows, or an independent agent's. */
function listingOf(kind: PartnerKind, id: number): SQL {
  return kind === "agency"
    ? eq(listings.agencyId, id)
    : and(eq(listings.agentId, id), isNull(listings.agencyId))!;
}

/** A listing lead delivered straight to its publisher (never the operator's lane). */
const DELIVERED = inArray(leads.routedTo, ["agency", "agent"]);

/** Buyer-side and seller-side enquiries, as the ledger groups lead types. */
const BUYER_SIDE = ["buyer", "renter"] as const;
const SELLER_SIDE = ["seller", "landlord", "valuation"] as const;

export interface LedgerSummaryRow {
  partner: LedgerPartner;
  /** Leads shared with them (revoked included). */
  shared: number;
  /** Leads on their own listings that went straight to them. */
  fromListings: number;
  buyerSide: number;
  sellerSide: number;
  /** Shares still `pending` (not revoked). */
  pending: number;
  /** Shares they answered "la tomo" / "ya lo contacté" / "cerrada". */
  taken: number;
  declined: number;
  /** Deals where they are the partner. */
  deals: number;
  won: number;
  lost: number;
  /** Sum of `my_share_usd` on their won deals, as typed (DECIMAL string). */
  myShareWonUsd: string | null;
}

function typeGroupSums(t: SQL | typeof leads.leadType) {
  return {
    buyerSide: sql<number>`coalesce(sum(${t} in (${sql.join(BUYER_SIDE.map((x) => sql`${x}`), sql`, `)})), 0)`,
    sellerSide: sql<number>`coalesce(sum(${t} in (${sql.join(SELLER_SIDE.map((x) => sql`${x}`), sql`, `)})), 0)`,
  };
}

/**
 * The ledger's summary: one row per Socio, in four grouped queries whatever
 * the number of Socios (shares, listing leads, deals — each GROUP BY target).
 */
export async function ledgerSummary(partners: LedgerPartner[]): Promise<LedgerSummaryRow[]> {
  if (partners.length === 0) return [];
  const agencyIds = partners.filter((p) => p.kind === "agency").map((p) => p.id);
  const agentIds = partners.filter((p) => p.kind === "agent").map((p) => p.id);
  const targetIn = (agencyCol: typeof leadAssignments.agencyId | typeof deals.agencyId, agentCol: typeof leadAssignments.agentId | typeof deals.agentId) =>
    or(
      agencyIds.length ? inArray(agencyCol, agencyIds) : undefined,
      agentIds.length ? inArray(agentCol, agentIds) : undefined,
    );

  const [shareRows, agencyListingRows, agentListingRows, dealRows] = await Promise.all([
    db
      .select({
        agencyId: leadAssignments.agencyId,
        agentId: leadAssignments.agentId,
        shared: sql<number>`count(*)`,
        pending: sql<number>`coalesce(sum(${leadAssignments.state} = 'pending' and ${leadAssignments.revokedAt} is null), 0)`,
        taken: sql<number>`coalesce(sum(${leadAssignments.state} in ('accepted', 'contacted', 'closed')), 0)`,
        declined: sql<number>`coalesce(sum(${leadAssignments.state} = 'declined'), 0)`,
        ...typeGroupSums(leads.leadType),
      })
      .from(leadAssignments)
      .innerJoin(leads, eq(leads.id, leadAssignments.leadId))
      .where(and(targetIn(leadAssignments.agencyId, leadAssignments.agentId), ne(leads.status, "spam")))
      .groupBy(leadAssignments.agencyId, leadAssignments.agentId),
    agencyIds.length
      ? db
          .select({ id: listings.agencyId, n: sql<number>`count(*)`, ...typeGroupSums(leads.leadType) })
          .from(leads)
          .innerJoin(listings, eq(listings.id, leads.listingId))
          .where(and(inArray(listings.agencyId, agencyIds), DELIVERED, ne(leads.status, "spam")))
          .groupBy(listings.agencyId)
      : Promise.resolve([]),
    agentIds.length
      ? db
          .select({ id: listings.agentId, n: sql<number>`count(*)`, ...typeGroupSums(leads.leadType) })
          .from(leads)
          .innerJoin(listings, eq(listings.id, leads.listingId))
          .where(
            and(inArray(listings.agentId, agentIds), isNull(listings.agencyId), DELIVERED, ne(leads.status, "spam")),
          )
          .groupBy(listings.agentId)
      : Promise.resolve([]),
    db
      .select({
        agencyId: deals.agencyId,
        agentId: deals.agentId,
        deals: sql<number>`count(*)`,
        won: sql<number>`coalesce(sum(${deals.stage} = 'won'), 0)`,
        lost: sql<number>`coalesce(sum(${deals.stage} = 'lost'), 0)`,
        myShareWonUsd: sql<string | null>`sum(case when ${deals.stage} = 'won' then ${deals.myShareUsd} end)`,
      })
      .from(deals)
      .where(targetIn(deals.agencyId, deals.agentId))
      .groupBy(deals.agencyId, deals.agentId),
  ]);

  const keyOf = (agencyId: number, agentId: number) => (agencyId ? `agency:${agencyId}` : `agent:${agentId}`);
  const shares = new Map(shareRows.map((r) => [keyOf(r.agencyId, r.agentId), r]));
  const listingLeads = new Map<string, (typeof agencyListingRows)[number]>([
    ...agencyListingRows.map((r) => [`agency:${r.id}`, r] as const),
    ...agentListingRows.map((r) => [`agent:${r.id}`, r] as const),
  ]);
  const dealMap = new Map(dealRows.map((r) => [keyOf(r.agencyId, r.agentId), r]));

  return partners.map((partner) => {
    const s = shares.get(partner.key);
    const l = listingLeads.get(partner.key);
    const d = dealMap.get(partner.key);
    return {
      partner,
      shared: Number(s?.shared ?? 0),
      fromListings: Number(l?.n ?? 0),
      buyerSide: Number(s?.buyerSide ?? 0) + Number(l?.buyerSide ?? 0),
      sellerSide: Number(s?.sellerSide ?? 0) + Number(l?.sellerSide ?? 0),
      pending: Number(s?.pending ?? 0),
      taken: Number(s?.taken ?? 0),
      declined: Number(s?.declined ?? 0),
      deals: Number(d?.deals ?? 0),
      won: Number(d?.won ?? 0),
      lost: Number(d?.lost ?? 0),
      myShareWonUsd: d?.myShareWonUsd ?? null,
    };
  });
}

export type LedgerSource = "share" | "listing";

export interface LedgerLeadRow {
  leadId: number;
  source: LedgerSource;
  /** When they got it: the share's date, or the lead's for a listing lead. */
  at: Date;
  leadType: (typeof leads.$inferSelect)["leadType"];
  name: string | null;
  whatsapp: string;
  leadStatus: (typeof leads.$inferSelect)["status"];
  listingTitle: string | null;
  /** The share's answer; null for a listing lead. */
  shareState: (typeof leadAssignments.$inferSelect)["state"] | null;
  revoked: boolean;
  /** The lead's deal when THIS partner is on it. */
  dealStage: DealStage | null;
  myShareUsd: string | null;
}

/** How many ledger lines one partner page shows (newest first). */
export const LEDGER_LIMIT = 500;

/**
 * One partner's ledger: every lead they got, newest first, with its outcome.
 * Two bounded queries (shares, listing leads), merged; the deals of those
 * leads in one more.
 */
export async function partnerLedger(kind: PartnerKind, id: number): Promise<LedgerLeadRow[]> {
  const shareTarget =
    kind === "agency" ? eq(leadAssignments.agencyId, id) : eq(leadAssignments.agentId, id);
  const [shareRows, listingRows] = await Promise.all([
    db
      .select({
        leadId: leads.id,
        at: leadAssignments.createdAt,
        leadType: leads.leadType,
        name: leads.name,
        whatsapp: leads.whatsapp,
        leadStatus: leads.status,
        listingTitle: listings.title,
        shareState: leadAssignments.state,
        revokedAt: leadAssignments.revokedAt,
      })
      .from(leadAssignments)
      .innerJoin(leads, eq(leads.id, leadAssignments.leadId))
      .leftJoin(listings, eq(listings.id, leads.listingId))
      .where(and(shareTarget, ne(leads.status, "spam")))
      .orderBy(desc(leadAssignments.createdAt))
      .limit(LEDGER_LIMIT),
    db
      .select({
        leadId: leads.id,
        at: leads.createdAt,
        leadType: leads.leadType,
        name: leads.name,
        whatsapp: leads.whatsapp,
        leadStatus: leads.status,
        listingTitle: listings.title,
      })
      .from(leads)
      .innerJoin(listings, eq(listings.id, leads.listingId))
      .where(and(listingOf(kind, id), DELIVERED, ne(leads.status, "spam")))
      .orderBy(desc(leads.createdAt))
      .limit(LEDGER_LIMIT),
  ]);

  const rows: LedgerLeadRow[] = [
    ...shareRows.map((r) => ({
      leadId: r.leadId,
      source: "share" as const,
      at: r.at,
      leadType: r.leadType,
      name: r.name,
      whatsapp: r.whatsapp,
      leadStatus: r.leadStatus,
      listingTitle: r.listingTitle,
      shareState: r.shareState,
      revoked: r.revokedAt != null,
      dealStage: null,
      myShareUsd: null,
    })),
    ...listingRows.map((r) => ({
      ...r,
      source: "listing" as const,
      shareState: null,
      revoked: false,
      dealStage: null,
      myShareUsd: null,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, LEDGER_LIMIT);

  if (rows.length > 0) {
    const dealRows = await db
      .select({ leadId: deals.leadId, stage: deals.stage, myShareUsd: deals.myShareUsd })
      .from(deals)
      .where(
        and(
          inArray(
            deals.leadId,
            rows.map((r) => r.leadId),
          ),
          kind === "agency" ? eq(deals.agencyId, id) : eq(deals.agentId, id),
        ),
      );
    const byLead = new Map(dealRows.map((d) => [d.leadId, d]));
    for (const r of rows) {
      const d = byLead.get(r.leadId);
      if (d) {
        r.dealStage = d.stage;
        r.myShareUsd = d.myShareUsd;
      }
    }
  }
  return rows;
}
