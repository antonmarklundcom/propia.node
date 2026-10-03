/**
 * Parsing the two deal forms (plan-agency batch 6). Pure — no database, no
 * `next/*` — so the rules are the same for the server action and for
 * `scripts/verify-scopes.ts`.
 *
 * Money stays a string end to end: the form posts what `<input type=number>`
 * normalised ("1500.5"), this checks its shape, and MySQL's DECIMAL stores it.
 * Nothing here computes or defaults an amount (money math is a founder
 * decision; the operator types it from the written agreement). Empty = NULL.
 */
import { z } from "zod";

export const DEAL_STAGES = ["open", "viewing", "offer", "reserved", "won", "lost"] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

/** What a partner may set: every stage but `open`, which is where a deal starts. */
export const PARTNER_STAGES = ["viewing", "offer", "reserved", "won", "lost"] as const;
export type PartnerStage = (typeof PARTNER_STAGES)[number];

export const LOST_REASONS = [
  "unavailable",
  "price",
  "financing",
  "slow_response",
  "bought_elsewhere",
  "not_serious",
  "other",
] as const;
export type LostReason = (typeof LOST_REASONS)[number];

/** The deal's partner. `{0, 0}` = none (the lead_assignments convention). */
export interface DealPartner {
  agencyId: number;
  agentId: number;
}

export interface OperatorDealInput {
  leadId: number;
  stage: DealStage;
  lostReason: LostReason | null;
  partner: DealPartner;
  /** DECIMAL(14,2), as a string. */
  salePriceUsd: string | null;
  /** DECIMAL(5,2), 0–100. */
  commissionPct: string | null;
  mySharePct: string | null;
  /** Typed from the agreement, never derived. */
  myShareUsd: string | null;
  /** `YYYY-MM-DD`. */
  paidAt: string | null;
  note: string | null;
}

export interface PartnerStageInput {
  leadId: number;
  stage: PartnerStage;
  lostReason: LostReason | null;
}

const NOTE_MAX = 2000;

/** `""`, whitespace and a missing field all mean NULL. */
function blankToNull(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" ? null : t;
}

const leadId = z.coerce.number().int().positive();

/** ≥ 0, up to 12 integer digits and 2 decimals — DECIMAL(14,2). */
const money = z.preprocess(
  blankToNull,
  z
    .string()
    .regex(/^\d{1,12}(\.\d{1,2})?$/)
    .nullable(),
);

/** 0–100 with up to 2 decimals — DECIMAL(5,2). */
const percent = z.preprocess(
  blankToNull,
  z
    .string()
    .regex(/^\d{1,3}(\.\d{1,2})?$/)
    .refine((v) => Number(v) <= 100)
    .nullable(),
);

/** A real calendar date: "2026-02-30" fails the round trip. */
const calendarDate = z.preprocess(
  blankToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => {
      const d = new Date(`${v}T12:00:00Z`);
      const y = d.getUTCFullYear();
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && y >= 2000 && y <= 2100;
    })
    .nullable(),
);

const lostReason = z.preprocess(blankToNull, z.enum(LOST_REASONS).nullable());

/** `none`, `agency:12` or `agent:7`. */
const partner = z.preprocess(
  (v) => blankToNull(v) ?? "none",
  z
    .string()
    .regex(/^(none|agency:\d+|agent:\d+)$/)
    .transform((v): DealPartner => {
      const [kind, id] = v.split(":");
      if (kind === "agency") return { agencyId: Number(id), agentId: 0 };
      if (kind === "agent") return { agencyId: 0, agentId: Number(id) };
      return { agencyId: 0, agentId: 0 };
    }),
);

const operatorSchema = z.object({
  leadId,
  stage: z.enum(DEAL_STAGES),
  lostReason,
  partner,
  salePriceUsd: money,
  commissionPct: percent,
  mySharePct: percent,
  myShareUsd: money,
  paidAt: calendarDate,
  note: z.preprocess(blankToNull, z.string().max(NOTE_MAX).nullable()),
});

const partnerSchema = z.object({
  leadId,
  stage: z.enum(PARTNER_STAGES),
  lostReason,
});

type FormLike = { get(name: string): FormDataEntryValue | null };

function field(form: FormLike, name: string): unknown {
  const v = form.get(name);
  return typeof v === "string" ? v : null;
}

/**
 * The operator's "Negocio" form. A lost reason is kept only on a lost deal —
 * the select is always on the form, so a stale choice must not survive a
 * stage change.
 */
export function parseOperatorDealForm(form: FormLike): OperatorDealInput | null {
  const r = operatorSchema.safeParse({
    leadId: field(form, "leadId"),
    stage: field(form, "stage"),
    lostReason: field(form, "lostReason"),
    partner: field(form, "partner"),
    salePriceUsd: field(form, "salePriceUsd"),
    commissionPct: field(form, "commissionPct"),
    mySharePct: field(form, "mySharePct"),
    myShareUsd: field(form, "myShareUsd"),
    paidAt: field(form, "paidAt"),
    note: field(form, "note"),
  });
  if (!r.success) return null;
  const v = r.data as OperatorDealInput;
  return { ...v, lostReason: v.stage === "lost" ? v.lostReason : null };
}

/** The partner's stage selector on /agencia/leads. No money field exists on it. */
export function parsePartnerStageForm(form: FormLike): PartnerStageInput | null {
  const r = partnerSchema.safeParse({
    leadId: field(form, "leadId"),
    stage: field(form, "stage"),
    lostReason: field(form, "lostReason"),
  });
  if (!r.success) return null;
  const v = r.data as PartnerStageInput;
  return { ...v, lostReason: v.stage === "lost" ? v.lostReason : null };
}

/* --------------------- partner terms (plan-admin-next O2) --------------------- */

/** The usual split with one Socio, as /admin/negocios/socios edits it. */
export interface PartnerTermsInput {
  commissionPct: string | null;
  mySharePct: string | null;
  note: string | null;
}

export const PARTNER_TERMS_NOTE_MAX = 500;

const partnerTermsSchema = z.object({
  commissionPct: percent,
  mySharePct: percent,
  note: z.preprocess(blankToNull, z.string().max(PARTNER_TERMS_NOTE_MAX).nullable()),
});

/** Same percent rules as the deal form; blank = no suggestion for that field. */
export function parsePartnerTermsForm(form: FormLike): PartnerTermsInput | null {
  const r = partnerTermsSchema.safeParse({
    commissionPct: field(form, "commissionPct"),
    mySharePct: field(form, "mySharePct"),
    note: field(form, "note"),
  });
  return r.success ? (r.data as PartnerTermsInput) : null;
}

export interface SplitPrefill {
  commissionPct: string | null;
  mySharePct: string | null;
  /** True when at least one value shown came from the partner's usual terms. */
  suggested: boolean;
}

/**
 * What the "Negocio" form shows in its two percentage fields. A value already
 * on the deal always wins — the suggestion only fills a field that is still
 * empty, and nothing is stored until the operator saves. No amount is
 * derived here.
 */
export function splitPrefill(
  deal: { commissionPct: string | null; mySharePct: string | null } | null | undefined,
  terms: { commissionPct: string | null; mySharePct: string | null } | null | undefined,
): SplitPrefill {
  const commissionPct = deal?.commissionPct ?? terms?.commissionPct ?? null;
  const mySharePct = deal?.mySharePct ?? terms?.mySharePct ?? null;
  const suggested =
    (deal?.commissionPct == null && terms?.commissionPct != null) ||
    (deal?.mySharePct == null && terms?.mySharePct != null);
  return { commissionPct, mySharePct, suggested };
}

/**
 * The "≈ US$ X" hint next to "Tu parte (US$)": price × commission% × share%.
 * Display only — shown as an estimate, never written to `my_share_usd`.
 * Null unless all three inputs were typed.
 */
export function estimateMyShareUsd(
  salePriceUsd: string | null,
  commissionPct: string | null,
  mySharePct: string | null,
): number | null {
  if (salePriceUsd == null || commissionPct == null || mySharePct == null) return null;
  const n = (Number(salePriceUsd) * Number(commissionPct) * Number(mySharePct)) / 10_000;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/* ------------------------------ display ------------------------------ */

/**
 * A DECIMAL string (or a number) as es-PY money: "150.000" or "1.234,50".
 * Formatting only — the value itself is never rounded before it is stored.
 */
export function formatUsd(v: string | number | null): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  const cents = Math.round(n * 100) % 100 !== 0;
  return n.toLocaleString("es-PY", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/** "3" / "2,5" — a percentage as typed, es-PY decimals, no sign. */
export function formatPct(v: string | null): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("es-PY", { maximumFractionDigits: 2 }) : "—";
}

/** A paid date is stored at 12:00 UTC; read it back in UTC so the day never shifts. */
export function paidDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function formatPaidDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
