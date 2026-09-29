/**
 * The foreign buyer's optional enquiry details (English marketplace doors,
 * `foreignBuyerEnquiry()` in src/design/sections.ts).
 *
 * Pure — no `next/*`, no drizzle — because both halves use it: `ContactForm`
 * (a client component) builds the WhatsApp continuation from it, and
 * `/api/leads` validates against the value lists below and writes the one
 * canonical text block into `leads.message`. There is no column for any of
 * this on purpose: the message is what every reader of a lead already shows
 * (`/admin/leads`, `/agencia/leads`, `/mis-avisos/consultas`, the VenderCRM
 * and webhook copies), and `leads.utm` carries the same answers as short
 * structured keys, the way `/vender` and the directory forms mark theirs.
 */
import type { Dictionary } from "@/i18n";
import { formatUsd } from "./format";

export const BUYER_BUDGETS = ["lt50k", "50k-100k", "100k-250k", "250k-500k", "gt500k"] as const;
export const BUYER_TIMELINES = ["now", "3-6m", "6-12m", "exploring"] as const;
export const BUYER_PURPOSES = ["live", "invest", "retire", "other"] as const;
export const BUYER_CONTACTS = ["whatsapp", "email", "video"] as const;

export type BuyerBudget = (typeof BUYER_BUDGETS)[number];
export type BuyerTimeline = (typeof BUYER_TIMELINES)[number];
export type BuyerPurpose = (typeof BUYER_PURPOSES)[number];
export type BuyerContact = (typeof BUYER_CONTACTS)[number];

/** Free-text bounds, shared by the inputs' maxLength and the API's schema. */
export const BUYER_COUNTRY_MAX = 60;
export const BUYER_VISIT_MAX = 80;

export interface BuyerDetails {
  country?: string;
  budget?: BuyerBudget;
  timeline?: BuyerTimeline;
  visit?: string;
  purpose?: BuyerPurpose;
  contact?: BuyerContact;
}

type ForeignCopy = Dictionary["contactForm"]["foreign"];

/** US$ bounds of each budget band; the label is built from them, never typed. */
const BUDGET_BOUNDS: Record<BuyerBudget, [number | null, number | null]> = {
  lt50k: [null, 50_000],
  "50k-100k": [50_000, 100_000],
  "100k-250k": [100_000, 250_000],
  "250k-500k": [250_000, 500_000],
  gt500k: [500_000, null],
};

export function budgetLabel(b: BuyerBudget, t: ForeignCopy, numberLocale: string): string {
  const [min, max] = BUDGET_BOUNDS[b];
  const usd = (n: number) => formatUsd(n, numberLocale);
  if (min == null) return t.budgetUnder(usd(max!));
  if (max == null) return t.budgetOver(usd(min));
  return t.budgetBetween(usd(min), usd(max));
}

/**
 * One line of visitor text: no line breaks (a typed newline could forge a
 * line of the block), no control characters, collapsed spaces, bounded.
 */
export function cleanBuyerText(raw: string | undefined, max: number): string | undefined {
  if (raw == null) return undefined;
  // eslint-disable-next-line no-control-regex -- stripping them is the point
  const s = raw.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : undefined;
}

/** The answers with empty ones dropped and free text cleaned; `null` when nothing is left. */
export function normalizeBuyerDetails(d: BuyerDetails | null | undefined): BuyerDetails | null {
  if (!d) return null;
  const out: BuyerDetails = {
    country: cleanBuyerText(d.country, BUYER_COUNTRY_MAX),
    budget: d.budget || undefined,
    timeline: d.timeline || undefined,
    visit: cleanBuyerText(d.visit, BUYER_VISIT_MAX),
    purpose: d.purpose || undefined,
    contact: d.contact || undefined,
  };
  for (const k of Object.keys(out) as (keyof BuyerDetails)[]) {
    if (out[k] === undefined) delete out[k];
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * The readable block written under the visitor's message:
 *
 *   Buyer details
 *   Country: Canada
 *   Budget: US$ 100,000 – US$ 250,000
 *   …
 *
 * `null` when no question was answered, so an enquiry without extras is
 * stored exactly as before.
 */
export function buyerDetailsBlock(
  raw: BuyerDetails | null | undefined,
  t: ForeignCopy,
  numberLocale: string,
): string | null {
  const d = normalizeBuyerDetails(raw);
  if (!d) return null;
  const lines = [
    d.country ? `${t.lineCountry}: ${d.country}` : null,
    d.budget ? `${t.lineBudget}: ${budgetLabel(d.budget, t, numberLocale)}` : null,
    d.timeline ? `${t.lineTimeline}: ${t.timeline[d.timeline]}` : null,
    d.visit ? `${t.lineVisit}: ${d.visit}` : null,
    d.purpose ? `${t.linePurpose}: ${t.purpose[d.purpose]}` : null,
    d.contact ? `${t.lineContact}: ${t.contact[d.contact]}` : null,
  ].filter((l): l is string => l !== null);
  return [t.blockHeading, ...lines].join("\n");
}

/** The same answers as short `leads.utm` keys, for filtering later without parsing prose. */
export function buyerDetailsUtm(raw: BuyerDetails | null | undefined): Record<string, string> | null {
  const d = normalizeBuyerDetails(raw);
  if (!d) return null;
  const utm: Record<string, string> = {};
  if (d.country) utm.buyer_country = d.country;
  if (d.budget) utm.buyer_budget = d.budget;
  if (d.timeline) utm.buyer_timeline = d.timeline;
  if (d.visit) utm.buyer_visit = d.visit;
  if (d.purpose) utm.buyer_purpose = d.purpose;
  if (d.contact) utm.buyer_contact = d.contact;
  return utm;
}

/** Longest details text an operator alert carries; the full block stays on the lead. */
export const BUYER_ALERT_MAX = 220;

/**
 * The details block as one short line for the operator's "go look" alert
 * (Telegram, email, `operator_alert`): line breaks become " · " and the text
 * is cut with an ellipsis. `null` when there is no block. Operator alert only —
 * the owner and partner emails leave the message out on purpose.
 */
export function buyerDetailsAlertText(block: string | null | undefined, max = BUYER_ALERT_MAX): string | null {
  if (!block) return null;
  const one = block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" · ");
  if (!one) return null;
  return one.length <= max ? one : `${one.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
