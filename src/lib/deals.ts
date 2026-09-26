/**
 * The deal and commission ledger (`deals`, migration 0019;
 * docs/plan-agency-2026-09-26.md batch 6). The only module that reads or
 * writes `deals`.
 *
 * One deal per lead (`uq_lead`). Two writers, and the split is the point:
 * - the super-admin (`upsertOperatorDeal`) writes everything, including the
 *   money columns, typed from the written agreement — the app stores and adds
 *   them up, it never derives a rate or an amount;
 * - a partner (`setPartnerDealStage`) moves the stage of a lead shared with
 *   them, under `sharedWithPanel()` — the same predicate their list reads
 *   with — and never touches a money column.
 *
 * Nothing here is cached: every reader is an admin or panel page, which is
 * force-dynamic, so there is no `unstable_cache` tag to keep in step and no
 * Date to revive. DECIMAL columns come back from mysql2 as strings and stay
 * strings; formatting is the page's job (`toLocaleString("es-PY")`).
 */
import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, deals, leadAssignments, leads, listings } from "@/db/schema";
import { isSuperAdmin, type UserRole } from "@/lib/auth/roles";
import { sharedWithPanel, type PanelViewer } from "@/lib/lead-assignments";
import {
  DEAL_STAGES,
  PARTNER_STAGES,
  type DealPartner,
  type DealStage,
  type LostReason,
  type OperatorDealInput,
  type PartnerStageInput,
} from "@/lib/deal-form";
import { isNotReportLead } from "@/lib/report-queries";

export type { DealStage, LostReason } from "@/lib/deal-form";

/* --------------------------------- reads --------------------------------- */

export interface DealRow {
  id: number;
  leadId: number;
  listingId: number | null;
  agencyId: number;
  agentId: number;
  /** The partner's display name; null when the deal has none. */
  partnerName: string | null;
  stage: DealStage;
  lostReason: LostReason | null;
  salePriceUsd: string | null;
  commissionPct: string | null;
  mySharePct: string | null;
  myShareUsd: string | null;
  paidAt: Date | null;
  note: string | null;
  stageAt: Date | null;
  createdAt: Date;
}

const dealColumns = {
  id: deals.id,
  leadId: deals.leadId,
  listingId: deals.listingId,
  agencyId: deals.agencyId,
  agentId: deals.agentId,
  agencyName: agencies.name,
  agentName: agents.name,
  stage: deals.stage,
  lostReason: deals.lostReason,
  salePriceUsd: deals.salePriceUsd,
  commissionPct: deals.commissionPct,
  mySharePct: deals.mySharePct,
  myShareUsd: deals.myShareUsd,
  paidAt: deals.paidAt,
  note: deals.note,
  stageAt: deals.stageAt,
  createdAt: deals.createdAt,
};

function toDealRow(r: DealQueryRow): DealRow {
  const partnerName = r.agencyId ? r.agencyName : r.agentId ? r.agentName : null;
  return {
    id: r.id,
    leadId: r.leadId,
    listingId: r.listingId,
    agencyId: r.agencyId,
    agentId: r.agentId,
    partnerName: partnerName ?? (r.agencyId || r.agentId ? "—" : null),
    stage: r.stage,
    lostReason: r.lostReason,
    salePriceUsd: r.salePriceUsd,
    commissionPct: r.commissionPct,
    mySharePct: r.mySharePct,
    myShareUsd: r.myShareUsd,
    paidAt: r.paidAt,
    note: r.note,
    stageAt: r.stageAt,
    createdAt: r.createdAt,
  };
}

/** `0` means "no partner" in both columns; never join a 0 to a real row. */
function dealsQuery() {
  return db
    .select(dealColumns)
    .from(deals)
    .leftJoin(agencies, and(eq(agencies.id, deals.agencyId), sql`${deals.agencyId} <> 0`))
    .leftJoin(agents, and(eq(agents.id, deals.agentId), sql`${deals.agentId} <> 0`));
}

type DealQueryRow = Awaited<ReturnType<typeof dealsQuery>>[number];

/** One lead's deal, full (operator only — it carries the money columns). */
export async function getDealByLead(leadId: number): Promise<DealRow | null> {
  const [row] = await dealsQuery().where(eq(deals.leadId, leadId)).limit(1);
  return row ? toDealRow(row) : null;
}

/** The deals of the leads on one /admin/leads page, in one query (operator only). */
export async function getDealsForLeads(leadIds: number[]): Promise<Map<number, DealRow>> {
  const out = new Map<number, DealRow>();
  if (leadIds.length === 0) return out;
  const rows = await dealsQuery().where(inArray(deals.leadId, leadIds));
  for (const r of rows) out.set(r.leadId, toDealRow(r));
  return out;
}

export interface DealStageRow {
  stage: DealStage;
  lostReason: LostReason | null;
  stageAt: Date | null;
}

/**
 * Stage only, for `staff` on /admin/leads: the money columns are not even
 * selected, so no template slip can render them.
 */
export async function getDealStagesForLeads(leadIds: number[]): Promise<Map<number, DealStageRow>> {
  const out = new Map<number, DealStageRow>();
  if (leadIds.length === 0) return out;
  const rows = await db
    .select({
      leadId: deals.leadId,
      stage: deals.stage,
      lostReason: deals.lostReason,
      stageAt: deals.stageAt,
    })
    .from(deals)
    .where(inArray(deals.leadId, leadIds));
  for (const { leadId, ...r } of rows) out.set(leadId, r);
  return out;
}

export interface DealListRow extends DealRow {
  leadName: string | null;
  leadWhatsapp: string;
  listingTitle: string | null;
}

/** Every deal for /admin/negocios, most recently moved first. */
export async function listDeals(limit = 500): Promise<DealListRow[]> {
  const rows = await db
    .select({
      ...dealColumns,
      leadName: leads.name,
      leadWhatsapp: leads.whatsapp,
      listingTitle: listings.title,
    })
    .from(deals)
    .innerJoin(leads, eq(leads.id, deals.leadId))
    .leftJoin(listings, eq(listings.id, deals.listingId))
    .leftJoin(agencies, and(eq(agencies.id, deals.agencyId), sql`${deals.agencyId} <> 0`))
    .leftJoin(agents, and(eq(agents.id, deals.agentId), sql`${deals.agentId} <> 0`))
    .orderBy(desc(sql`coalesce(${deals.stageAt}, ${deals.createdAt})`), desc(deals.id))
    .limit(Math.min(limit, 1000));
  return rows.map((r) => ({
    ...toDealRow(r),
    leadName: r.leadName,
    leadWhatsapp: r.leadWhatsapp,
    listingTitle: r.listingTitle,
  }));
}

export interface PartnerSummaryRow {
  /** `agency_id:agent_id` — unique per row, for React keys. */
  key: string;
  kind: "agency" | "agent" | "none";
  name: string | null;
  deals: number;
  won: number;
  /** Sum of `my_share_usd` with a paid date, as a DECIMAL string. */
  paidUsd: string | null;
  /** Sum of `my_share_usd` on won deals with no paid date. */
  unpaidUsd: string | null;
}

export interface DealSummary {
  byStage: Record<DealStage, number>;
  wonMonth: number;
  wonAll: number;
  paidMonthUsd: string | null;
  paidAllUsd: string | null;
  unpaidMonthUsd: string | null;
  unpaidAllUsd: string | null;
  lostReasons: { reason: LostReason | null; n: number }[];
  partners: PartnerSummaryRow[];
}

/**
 * "This month" is the database clock's calendar month — the same clock
 * `stage_at` is written with (`now()`). A typed paid date is stored at 12:00
 * UTC, so the boundary cannot tip it into the neighbouring day.
 */
const MONTH_START = sql`date_format(now(), '%Y-%m-01')`;

/**
 * The /admin/negocios aggregates. Sums are of `my_share_usd` exactly as typed:
 * "paid" = a paid date is set; "unpaid" = won with no paid date. Both come
 * back as DECIMAL strings (or null when there is nothing to add).
 */
export async function dealSummary(): Promise<DealSummary> {
  const paid = sql`${deals.paidAt} is not null`;
  const unpaid = sql`${deals.paidAt} is null and ${deals.stage} = 'won'`;
  const [stageRows, [totals], lostRows, partnerRows] = await Promise.all([
    db
      .select({ stage: deals.stage, n: sql<number>`count(*)` })
      .from(deals)
      .groupBy(deals.stage),
    db
      .select({
        wonMonth: sql<number>`coalesce(sum(${deals.stage} = 'won' and ${deals.stageAt} >= ${MONTH_START}), 0)`,
        wonAll: sql<number>`coalesce(sum(${deals.stage} = 'won'), 0)`,
        paidMonth: sql<string | null>`sum(case when ${paid} and ${deals.paidAt} >= ${MONTH_START} then ${deals.myShareUsd} end)`,
        paidAll: sql<string | null>`sum(case when ${paid} then ${deals.myShareUsd} end)`,
        unpaidMonth: sql<string | null>`sum(case when ${unpaid} and ${deals.stageAt} >= ${MONTH_START} then ${deals.myShareUsd} end)`,
        unpaidAll: sql<string | null>`sum(case when ${unpaid} then ${deals.myShareUsd} end)`,
      })
      .from(deals),
    db
      .select({ reason: deals.lostReason, n: sql<number>`count(*)` })
      .from(deals)
      .where(eq(deals.stage, "lost"))
      .groupBy(deals.lostReason),
    db
      .select({
        agencyId: deals.agencyId,
        agentId: deals.agentId,
        agencyName: sql<string | null>`max(${agencies.name})`,
        agentName: sql<string | null>`max(${agents.name})`,
        deals: sql<number>`count(*)`,
        won: sql<number>`sum(${deals.stage} = 'won')`,
        paidUsd: sql<string | null>`sum(case when ${paid} then ${deals.myShareUsd} end)`,
        unpaidUsd: sql<string | null>`sum(case when ${unpaid} then ${deals.myShareUsd} end)`,
      })
      .from(deals)
      .leftJoin(agencies, and(eq(agencies.id, deals.agencyId), sql`${deals.agencyId} <> 0`))
      .leftJoin(agents, and(eq(agents.id, deals.agentId), sql`${deals.agentId} <> 0`))
      .groupBy(deals.agencyId, deals.agentId),
  ]);

  const byStage = Object.fromEntries(DEAL_STAGES.map((s) => [s, 0])) as Record<DealStage, number>;
  for (const r of stageRows) byStage[r.stage] = Number(r.n);

  return {
    byStage,
    wonMonth: Number(totals?.wonMonth ?? 0),
    wonAll: Number(totals?.wonAll ?? 0),
    paidMonthUsd: totals?.paidMonth ?? null,
    paidAllUsd: totals?.paidAll ?? null,
    unpaidMonthUsd: totals?.unpaidMonth ?? null,
    unpaidAllUsd: totals?.unpaidAll ?? null,
    lostReasons: lostRows
      .map((r) => ({ reason: r.reason, n: Number(r.n) }))
      .sort((a, b) => b.n - a.n),
    partners: partnerRows
      .map((r) => ({
        key: `${r.agencyId}:${r.agentId}`,
        kind: (r.agencyId ? "agency" : r.agentId ? "agent" : "none") as PartnerSummaryRow["kind"],
        name: r.agencyId ? r.agencyName : r.agentId ? r.agentName : null,
        deals: Number(r.deals),
        won: Number(r.won ?? 0),
        paidUsd: r.paidUsd,
        unpaidUsd: r.unpaidUsd,
      }))
      .sort((a, b) => b.won - a.won || b.deals - a.deals),
  };
}

/* ----------------------------- operator write ----------------------------- */

export type OperatorDealResult =
  | { ok: true; created: boolean; changed: string[] }
  | { ok: false; error: "forbidden" | "no_lead" | "bad_partner" };

/** `"1500"` and `"1500.00"` are the same amount; null is not 0. */
function sameDecimal(a: string | null, b: string | null): boolean {
  if (a == null || b == null) return a == b;
  return Number(a) === Number(b);
}

function paidAtDate(v: string | null): Date | null {
  return v == null ? null : new Date(`${v}T12:00:00Z`);
}

/**
 * Create or update a lead's deal with everything the operator typed. The
 * role is checked HERE, not only by the action's guard: this is the one
 * function that writes the money columns, and it refuses any caller that is
 * not the super-admin (staff and partners included) whoever calls it.
 *
 * The partner must be `{0,0}` or a target this lead was shared with (a
 * revoked share still counts — the deal may predate the revocation).
 */
export async function upsertOperatorDeal(
  actor: { id: number; role: UserRole },
  input: OperatorDealInput,
): Promise<OperatorDealResult> {
  if (!isSuperAdmin(actor.role)) return { ok: false, error: "forbidden" };

  const [lead] = await db
    .select({ id: leads.id, listingId: leads.listingId })
    .from(leads)
    // A listing report is never shared and never becomes a deal.
    .where(and(eq(leads.id, input.leadId), isNotReportLead()))
    .limit(1);
  if (!lead) return { ok: false, error: "no_lead" };

  const p = input.partner;
  if (p.agencyId !== 0 || p.agentId !== 0) {
    const [share] = await db
      .select({ id: leadAssignments.id })
      .from(leadAssignments)
      .where(
        and(
          eq(leadAssignments.leadId, input.leadId),
          eq(leadAssignments.agencyId, p.agencyId),
          eq(leadAssignments.agentId, p.agentId),
        ),
      )
      .limit(1);
    if (!share) return { ok: false, error: "bad_partner" };
  }

  const values = {
    agencyId: p.agencyId,
    agentId: p.agentId,
    stage: input.stage,
    lostReason: input.stage === "lost" ? input.lostReason : null,
    salePriceUsd: input.salePriceUsd,
    commissionPct: input.commissionPct,
    mySharePct: input.mySharePct,
    myShareUsd: input.myShareUsd,
    paidAt: paidAtDate(input.paidAt),
    note: input.note,
  };

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(deals)
      .where(eq(deals.leadId, input.leadId))
      .for("update")
      .limit(1);

    if (!existing) {
      await tx.insert(deals).values({
        ...values,
        leadId: input.leadId,
        listingId: lead.listingId,
        createdByUserId: actor.id,
        stageAt: sql`now()`,
      });
      return { ok: true as const, created: true, changed: ["stage"] };
    }

    const changed: string[] = [];
    if (existing.stage !== values.stage) changed.push("stage");
    if (existing.lostReason !== values.lostReason) changed.push("lost_reason");
    if (existing.agencyId !== values.agencyId || existing.agentId !== values.agentId) changed.push("partner");
    if (!sameDecimal(existing.salePriceUsd, values.salePriceUsd)) changed.push("sale_price_usd");
    if (!sameDecimal(existing.commissionPct, values.commissionPct)) changed.push("commission_pct");
    if (!sameDecimal(existing.mySharePct, values.mySharePct)) changed.push("my_share_pct");
    if (!sameDecimal(existing.myShareUsd, values.myShareUsd)) changed.push("my_share_usd");
    if ((existing.paidAt?.getTime() ?? null) !== (values.paidAt?.getTime() ?? null)) changed.push("paid_at");
    if ((existing.note ?? null) !== values.note) changed.push("note");

    if (changed.length > 0) {
      await tx
        .update(deals)
        .set({
          ...values,
          // stage_at = when the deal entered its current stage.
          ...(existing.stage !== values.stage || existing.stageAt == null
            ? { stageAt: sql`now()` }
            : {}),
        })
        .where(eq(deals.id, existing.id));
    }
    return { ok: true as const, created: false, changed };
  });
}

/* ------------------------------ partner side ------------------------------ */

/**
 * The active share targets of these leads that this viewer can see — exactly
 * `sharedWithPanel()`, nothing added. A lead absent from the result is not
 * shared with them (or the share was revoked).
 */
async function visibleTargets(
  conn: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
  viewer: PanelViewer,
  leadIds: number[],
): Promise<Map<number, DealPartner[]>> {
  const out = new Map<number, DealPartner[]>();
  if (leadIds.length === 0) return out;
  const rows = await conn
    .select({
      leadId: leadAssignments.leadId,
      agencyId: leadAssignments.agencyId,
      agentId: leadAssignments.agentId,
    })
    .from(leadAssignments)
    .where(and(inArray(leadAssignments.leadId, leadIds), sharedWithPanel(viewer)))
    .orderBy(leadAssignments.id);
  for (const { leadId, ...t } of rows) out.set(leadId, [...(out.get(leadId) ?? []), t]);
  return out;
}

/** May a viewer with these targets move a deal whose partner is `deal`? */
function partnerMayMove(deal: DealPartner, targets: DealPartner[]): boolean {
  if (deal.agencyId === 0 && deal.agentId === 0) return true;
  return targets.some((t) => t.agencyId === deal.agencyId && t.agentId === deal.agentId);
}

export interface PartnerDealStage {
  stage: DealStage;
  lostReason: LostReason | null;
}

/**
 * The stage selector's state for each lead on a partner's shared list:
 * - key absent → hide the selector (not shared with them, or another
 *   partner's deal);
 * - `null` → no deal yet, the selector creates one;
 * - otherwise the current stage.
 * Selects no money column.
 */
export async function getPartnerDealStages(
  viewer: PanelViewer,
  leadIds: number[],
): Promise<Map<number, PartnerDealStage | null>> {
  const out = new Map<number, PartnerDealStage | null>();
  const targets = await visibleTargets(db, viewer, leadIds);
  const visible = [...targets.keys()];
  if (visible.length === 0) return out;

  const rows = await db
    .select({
      leadId: deals.leadId,
      agencyId: deals.agencyId,
      agentId: deals.agentId,
      stage: deals.stage,
      lostReason: deals.lostReason,
    })
    .from(deals)
    .where(inArray(deals.leadId, visible));
  const byLead = new Map(rows.map((r) => [r.leadId, r]));

  for (const leadId of visible) {
    const deal = byLead.get(leadId);
    if (!deal) out.set(leadId, null);
    else if (partnerMayMove(deal, targets.get(leadId)!)) {
      out.set(leadId, { stage: deal.stage, lostReason: deal.lostReason });
    }
  }
  return out;
}

export type PartnerStageResult = "ok" | "forbidden" | "invalid";

/**
 * A partner moves a deal's stage. Allowed only on a lead actively shared with
 * them (`sharedWithPanel()`, checked in the read that decides and again in the
 * UPDATE's own WHERE), and only on a deal that is theirs or has no partner
 * yet — one partner never moves another's. Creates the deal when missing,
 * with the partner as its partner and themselves as its creator. Writes
 * stage, lost reason, stage time and (on an unclaimed deal) the partner
 * columns — never a money column.
 */
export async function setPartnerDealStage(params: {
  viewer: PanelViewer;
  input: PartnerStageInput;
}): Promise<PartnerStageResult> {
  const { viewer, input } = params;
  if (!(PARTNER_STAGES as readonly string[]).includes(input.stage)) return "invalid";
  const lostReason = input.stage === "lost" ? input.lostReason : null;

  try {
    return await db.transaction(async (tx) => {
      const targets = (await visibleTargets(tx, viewer, [input.leadId])).get(input.leadId);
      if (!targets || targets.length === 0) return "forbidden";

      const [existing] = await tx
        .select({
          id: deals.id,
          agencyId: deals.agencyId,
          agentId: deals.agentId,
          stage: deals.stage,
          stageAt: deals.stageAt,
        })
        .from(deals)
        .where(eq(deals.leadId, input.leadId))
        .for("update")
        .limit(1);

      // The first visible share is the partner of record: an agency admin can
      // see both an agency share and a share with one of its agents.
      const mine = targets[0];

      if (!existing) {
        const [lead] = await tx
          .select({ listingId: leads.listingId })
          .from(leads)
          .where(eq(leads.id, input.leadId))
          .limit(1);
        if (!lead) return "forbidden";
        await tx.insert(deals).values({
          leadId: input.leadId,
          listingId: lead.listingId,
          agencyId: mine.agencyId,
          agentId: mine.agentId,
          stage: input.stage,
          lostReason,
          createdByUserId: viewer.userId,
          stageAt: sql`now()`,
        });
        return "ok";
      }

      if (!partnerMayMove(existing, targets)) return "forbidden";
      const unclaimed = existing.agencyId === 0 && existing.agentId === 0;

      const [res] = await tx
        .update(deals)
        .set({
          ...(unclaimed ? { agencyId: mine.agencyId, agentId: mine.agentId } : {}),
          stage: input.stage,
          lostReason,
          ...(existing.stage !== input.stage || existing.stageAt == null
            ? { stageAt: sql`now()` }
            : {}),
        })
        .where(
          and(
            eq(deals.id, existing.id),
            inArray(
              deals.leadId,
              tx
                .select({ id: leadAssignments.leadId })
                .from(leadAssignments)
                .where(and(eq(leadAssignments.leadId, input.leadId), sharedWithPanel(viewer))),
            ),
          ),
        );
      return res.affectedRows > 0 ? "ok" : "forbidden";
    });
  } catch (e) {
    // Two partners opening the same lead's deal in the same instant: the
    // second insert hits uq_lead. Nothing was written for them; they retry.
    if ((e as { errno?: number }).errno === 1062) return "invalid";
    throw e;
  }
}
