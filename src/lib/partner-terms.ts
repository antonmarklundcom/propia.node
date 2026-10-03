/**
 * Partner terms (plan-admin-next O2, `partner_terms`, migration 0024) — the
 * only module on that table: the commission split the operator usually agrees
 * with one Socio, offered as an editable prefill on a lead's "Negocio" block
 * (`splitPrefill()`, src/lib/deal-form.ts). A suggestion, never an automatic
 * value: no deal is written from here, and no amount is derived.
 *
 * Super-admin only, like every money column: the write re-checks the role
 * itself, the same rule as `upsertOperatorDeal()`.
 */
import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { partnerTerms } from "@/db/schema";
import { isSuperAdmin, type UserRole } from "@/lib/auth/roles";
import type { PartnerTermsInput } from "@/lib/deal-form";

export interface PartnerTermsRow {
  /** `agency:12` / `agent:7`. */
  key: string;
  commissionPct: string | null;
  mySharePct: string | null;
  note: string | null;
  updatedAt: Date;
}

export type PartnerRef = { kind: "agency" | "agent"; id: number };

const keyOf = (agencyId: number, agentId: number) => (agencyId ? `agency:${agencyId}` : `agent:${agentId}`);

/** Terms for these partners, keyed `agency:12` / `agent:7`. */
export async function getPartnerTerms(refs: PartnerRef[]): Promise<Map<string, PartnerTermsRow>> {
  const out = new Map<string, PartnerTermsRow>();
  const agencyIds = [...new Set(refs.filter((r) => r.kind === "agency").map((r) => r.id))];
  const agentIds = [...new Set(refs.filter((r) => r.kind === "agent").map((r) => r.id))];
  if (agencyIds.length === 0 && agentIds.length === 0) return out;
  const rows = await db
    .select()
    .from(partnerTerms)
    .where(
      or(
        agencyIds.length ? and(inArray(partnerTerms.agencyId, agencyIds), eq(partnerTerms.agentId, 0)) : undefined,
        agentIds.length ? and(inArray(partnerTerms.agentId, agentIds), eq(partnerTerms.agencyId, 0)) : undefined,
      ),
    );
  for (const r of rows) {
    out.set(keyOf(r.agencyId, r.agentId), {
      key: keyOf(r.agencyId, r.agentId),
      commissionPct: r.commissionPct,
      mySharePct: r.mySharePct,
      note: r.note,
      updatedAt: r.updatedAt,
    });
  }
  return out;
}

/** Upsert one partner's terms. Refuses anyone but the super-admin. */
export async function savePartnerTerms(p: {
  role: UserRole;
  userId: number;
  partner: PartnerRef;
  input: PartnerTermsInput;
}): Promise<boolean> {
  if (!isSuperAdmin(p.role)) return false;
  const values = {
    commissionPct: p.input.commissionPct,
    mySharePct: p.input.mySharePct,
    note: p.input.note,
    updatedByUserId: p.userId,
    updatedAt: new Date(),
  };
  await db
    .insert(partnerTerms)
    .values({
      agencyId: p.partner.kind === "agency" ? p.partner.id : 0,
      agentId: p.partner.kind === "agent" ? p.partner.id : 0,
      ...values,
    })
    .onDuplicateKeyUpdate({ set: values });
  return true;
}
