/**
 * Who a lead is from, as /admin/leads groups them: a possible buyer or renter,
 * an owner who wants to sell or rent out, a possible seller (asked for a
 * valuation), an owner, an independent agent, an agency, a developer, or
 * other.
 *
 * Derived, not stored: from the visitor's own "¿Quién sos?" answer
 * (`utm.contact_role`, src/lib/contact-role.ts) and the lead type, so every
 * lead already captured is classified too. One SQL expression for the card
 * label, the chip counts, the filter and the sort — they cannot disagree.
 * First match wins:
 *
 * - said "inmobiliaria"                         → `agency`
 * - said "agente", or an agent sign-up          → `agent`
 * - said "desarrolladora", or a developer lead  → `developer`
 * - wants to sell (`seller`)                    → `owner_sell`
 * - wants to rent it out (`landlord`)           → `owner_rent`
 * - asked for a valuation                       → `maybe_seller`
 * - said "dueño" (anything else)                → `owner`
 * - asked about buying / renting                → `buyer` / `renter`
 * - anything else                               → `other`
 */
import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { leads } from "@/db/schema";
import { CONTACT_ROLE_UTM_KEY } from "@/lib/contact-role";

export const CONTACT_KINDS = [
  "buyer",
  "renter",
  "owner_sell",
  "owner_rent",
  "maybe_seller",
  "owner",
  "agent",
  "agency",
  "developer",
  "other",
] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export function isContactKind(v: unknown): v is ContactKind {
  return typeof v === "string" && (CONTACT_KINDS as readonly string[]).includes(v);
}

// Constants spelled raw, not bound: the same expression is SELECTed and
// GROUPed BY, and MySQL's ONLY_FULL_GROUP_BY cannot see two placeholders as one.
const ROLE_SQL = sql`JSON_UNQUOTE(JSON_EXTRACT(${leads.utm}, ${sql.raw(`'$.${CONTACT_ROLE_UTM_KEY}'`)}))`;

export const CONTACT_KIND_SQL: SQL<ContactKind> = sql<ContactKind>`CASE
  WHEN ${ROLE_SQL} = 'agency' THEN 'agency'
  WHEN ${ROLE_SQL} = 'agent' OR ${leads.leadType} = 'agent_signup' THEN 'agent'
  WHEN ${ROLE_SQL} = 'developer' OR ${leads.leadType} = 'developer' THEN 'developer'
  WHEN ${leads.leadType} = 'seller' THEN 'owner_sell'
  WHEN ${leads.leadType} = 'landlord' THEN 'owner_rent'
  WHEN ${leads.leadType} = 'valuation' THEN 'maybe_seller'
  WHEN ${ROLE_SQL} = 'owner' THEN 'owner'
  WHEN ${leads.leadType} = 'buyer' THEN 'buyer'
  WHEN ${leads.leadType} = 'renter' THEN 'renter'
  ELSE 'other'
END`;

/** The sort the "Ordenar" select offers on /admin/leads. */
export const LEAD_SORTS = ["recent", "oldest", "kind"] as const;
export type LeadSort = (typeof LEAD_SORTS)[number];

export function isLeadSort(v: unknown): v is LeadSort {
  return typeof v === "string" && (LEAD_SORTS as readonly string[]).includes(v);
}

/** Read a selected `CONTACT_KIND_SQL` value back defensively. */
export function toContactKind(v: unknown): ContactKind {
  return isContactKind(v) ? v : "other";
}

/** `ORDER BY` position of a kind: the order of `CONTACT_KINDS` above. */
export const CONTACT_KIND_ORDER_SQL: SQL = sql`FIELD(${CONTACT_KIND_SQL}, ${sql.raw(
  CONTACT_KINDS.map((k) => `'${k}'`).join(", "),
)})`;
