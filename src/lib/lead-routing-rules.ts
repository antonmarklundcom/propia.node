/**
 * Lead routing rules (docs/plan-admin-next-2026-10-02.md, O3) — the pure half.
 *
 * Off by default: every lead stays with the operator, who shares it by hand
 * from /admin/leads. With "routing automático" switched on in /admin/ajustes,
 * a new lead in the operator's own lane (`routed_to = 'internal'`) that is
 * about a listing is shared with one Socio by these rules, in this order:
 *
 *   0. the listing's own Socio — a lead on a partner's listing goes to that
 *      partner, never to a competitor (and stays manual while they are busy);
 *   1. zone       — the Socio covers the listing's barrio or its city (or
 *                   declared no zone at all = everywhere);
 *   2. operation  — venta / alquiler / alquiler temporal (none = all);
 *   3. type       — casa, departamento, terreno… (none = all);
 *   4. price band — the listing's `price_usd` inside the Socio's min/max;
 *   5. busy       — a Socio holding a shared lead still unanswered after 24 h
 *                   is skipped;
 *   6. rotation   — among those left, the most specific zone match wins
 *                   (barrio > city > anywhere), then whoever received a share
 *                   least recently, then the order of the rules.
 *
 * The result is a `lead_assignments` share (`shareLeads()`), never a new
 * `routed_to` lane: the operator keeps the lead and can revoke or re-share.
 *
 * No `server-only`, no drizzle: `npm run verify:routing` runs this file as is,
 * and the settings page previews the same decision it will take.
 */

export const ROUTING_OPERATIONS = ["venta", "alquiler", "alquiler_temporal"] as const;
export type RoutingOperation = (typeof ROUTING_OPERATIONS)[number];

export const ROUTING_PROPERTY_TYPES = [
  "casa",
  "departamento",
  "terreno",
  "duplex",
  "comercial",
  "oficina",
  "deposito",
  "quinta",
] as const;
export type RoutingPropertyType = (typeof ROUTING_PROPERTY_TYPES)[number];

/** Lead types a rule may route: an enquiry about a listing. */
export const ROUTABLE_LEAD_TYPES = ["buyer", "renter", "question"] as const;

/** A Socio, as the select and the stored rule spell it: `agency:12` / `agent:7`. */
export type PartnerKey = `${"agency" | "agent"}:${number}`;

export interface PartnerTarget {
  kind: "agency" | "agent";
  id: number;
}

/** One Socio's coverage. Empty list = no restriction on that criterion. */
export interface PartnerRule {
  partner: PartnerKey;
  active: boolean;
  /** `locations.id` of cities and/or barrios. */
  zoneIds: number[];
  operations: RoutingOperation[];
  propertyTypes: RoutingPropertyType[];
  priceMinUsd: number | null;
  priceMaxUsd: number | null;
}

export interface RoutingConfig {
  rules: PartnerRule[];
  /**
   * The super-admin who last saved the rules: the actor on every automatic
   * share (`lead_assignments.assigned_by_user_id` and `admin_events` are
   * NOT NULL, and "the rules this person set" is the honest attribution).
   */
  savedBy: number | null;
}

export const EMPTY_ROUTING_CONFIG: RoutingConfig = { rules: [], savedBy: null };

/** Most rules kept; the screen lists Socios, of whom there are a handful. */
export const MAX_RULES = 100;
/** Most zones on one rule. */
export const MAX_ZONES = 200;
/** A share still `pending` this long makes its Socio "busy". */
export const BUSY_AFTER_HOURS = 24;

const PRICE_MAX = 1e12;

export function partnerKey(t: PartnerTarget): PartnerKey {
  return `${t.kind}:${t.id}` as PartnerKey;
}

export function parsePartnerKey(v: unknown): PartnerTarget | null {
  const m = /^(agency|agent):(\d{1,10})$/.exec(String(v ?? ""));
  if (!m) return null;
  const id = Number(m[2]);
  return Number.isSafeInteger(id) && id > 0 ? { kind: m[1] as PartnerTarget["kind"], id } : null;
}

function positiveInts(v: unknown, max: number): number[] {
  if (!Array.isArray(v)) return [];
  const out = new Set<number>();
  for (const x of v) {
    const n = typeof x === "string" && /^\d{1,10}$/.test(x) ? Number(x) : x;
    if (typeof n === "number" && Number.isSafeInteger(n) && n > 0) out.add(n);
    if (out.size >= max) break;
  }
  return [...out].sort((a, b) => a - b);
}

function members<T extends string>(v: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(v)) return [];
  return allowed.filter((a) => v.includes(a));
}

/** A price bound: a finite non-negative number, else null (no bound). */
export function parsePrice(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v.replace(/[\s.,](?=\d{3}\b)/g, "")) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= PRICE_MAX ? Math.round(n) : null;
}

/**
 * The stored JSON, read defensively: anything malformed is dropped, never
 * thrown — a bad row must not break the lead form that calls this. A rule
 * whose min is above its max keeps both (it simply never matches; the screen
 * flags it).
 */
export function parseRoutingConfig(raw: string | null | undefined): RoutingConfig {
  if (!raw) return EMPTY_ROUTING_CONFIG;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return EMPTY_ROUTING_CONFIG;
  }
  if (!v || typeof v !== "object") return EMPTY_ROUTING_CONFIG;
  const o = v as { rules?: unknown; savedBy?: unknown };
  const seen = new Set<string>();
  const rules: PartnerRule[] = [];
  for (const r of Array.isArray(o.rules) ? o.rules : []) {
    if (!r || typeof r !== "object") continue;
    const x = r as Record<string, unknown>;
    const target = parsePartnerKey(x.partner);
    if (!target) continue;
    const key = partnerKey(target);
    // One rule per Socio: the screen edits coverage per partner.
    if (seen.has(key)) continue;
    seen.add(key);
    rules.push({
      partner: key,
      active: x.active === true,
      zoneIds: positiveInts(x.zoneIds, MAX_ZONES),
      operations: members(x.operations, ROUTING_OPERATIONS),
      propertyTypes: members(x.propertyTypes, ROUTING_PROPERTY_TYPES),
      priceMinUsd: parsePrice(x.priceMinUsd),
      priceMaxUsd: parsePrice(x.priceMaxUsd),
    });
    if (rules.length >= MAX_RULES) break;
  }
  const savedBy =
    typeof o.savedBy === "number" && Number.isSafeInteger(o.savedBy) && o.savedBy > 0 ? o.savedBy : null;
  return { rules, savedBy };
}

export function serializeRoutingConfig(c: RoutingConfig): string {
  return JSON.stringify({ rules: c.rules, savedBy: c.savedBy });
}

/** What the engine needs to know about one new lead. */
export interface RoutingLead {
  routedTo: string;
  leadType: string;
  /** A "Reportar este aviso" lead is the operator's alone. */
  isReport: boolean;
  /** Already shared with someone (by hand, or an earlier run). */
  alreadyShared: boolean;
  listing: {
    operation: string;
    propertyType: string;
    priceUsd: number;
    cityId: number | null;
    barrioId: number | null;
    /** The listing's publisher when it is itself a Socio, else null. */
    ownerPartner: PartnerKey | null;
  } | null;
}

/** Per Socio, what the database says right now. */
export interface PartnerState {
  /** A current Socio (partner plan / marked Socio) AND verified — shareable. */
  shareable: boolean;
  /** Active shares still `pending` after `BUSY_AFTER_HOURS`. */
  overdue: number;
  /** Epoch ms of the newest share this Socio received; null = never. */
  lastSharedAt: number | null;
}

export type ManualReason =
  | "off"
  | "not_internal"
  | "report"
  | "already_shared"
  | "lead_type"
  | "no_listing"
  | "owner_busy"
  | "no_rules"
  | "no_zone"
  | "no_operation"
  | "no_type"
  | "no_price"
  | "all_busy"
  | "no_actor";

export type RoutingDecision =
  | {
      kind: "share";
      target: PartnerTarget;
      /** Why this Socio: "owner" (their listing) or the zone tier that won. */
      via: "owner" | "barrio" | "city" | "anywhere";
      /** How many Socios were still eligible at the rotation step. */
      candidates: number;
    }
  | { kind: "manual"; reason: ManualReason };

function zoneTier(rule: PartnerRule, l: NonNullable<RoutingLead["listing"]>): 0 | 1 | 2 | 3 {
  // 3 = barrio, 2 = city, 1 = no zone declared (anywhere), 0 = no match.
  if (rule.zoneIds.length === 0) return 1;
  if (l.barrioId != null && rule.zoneIds.includes(l.barrioId)) return 3;
  if (l.cityId != null && rule.zoneIds.includes(l.cityId)) return 2;
  return 0;
}

const TIER_VIA = { 3: "barrio", 2: "city", 1: "anywhere" } as const;

/**
 * Decide one lead. `states` is keyed by `PartnerKey`; a Socio missing from it
 * is treated as not shareable (no longer a partner, or not verified).
 */
export function decideRouting(p: {
  enabled: boolean;
  config: RoutingConfig;
  lead: RoutingLead;
  states: ReadonlyMap<string, PartnerState>;
}): RoutingDecision {
  const { config, lead, states } = p;
  const manual = (reason: ManualReason): RoutingDecision => ({ kind: "manual", reason });

  if (!p.enabled) return manual("off");
  if (config.savedBy == null) return manual("no_actor");
  if (lead.routedTo !== "internal") return manual("not_internal");
  if (lead.isReport) return manual("report");
  if (lead.alreadyShared) return manual("already_shared");
  if (!(ROUTABLE_LEAD_TYPES as readonly string[]).includes(lead.leadType)) return manual("lead_type");
  const l = lead.listing;
  if (!l) return manual("no_listing");

  // 0. The listing's own Socio.
  if (l.ownerPartner) {
    const s = states.get(l.ownerPartner);
    if (s?.shareable) {
      if (s.overdue > 0) return manual("owner_busy");
      return { kind: "share", target: parsePartnerKey(l.ownerPartner)!, via: "owner", candidates: 1 };
    }
  }

  const pool = config.rules
    .map((rule, order) => ({ rule, order, state: states.get(rule.partner) }))
    .filter((c) => c.rule.active && c.state?.shareable);
  if (pool.length === 0) return manual("no_rules");

  const tiered = pool.map((c) => ({ ...c, tier: zoneTier(c.rule, l) }));
  const inZone = tiered.filter((c) => c.tier > 0);
  if (inZone.length === 0) return manual("no_zone");

  const byOp = inZone.filter(
    (c) => c.rule.operations.length === 0 || (c.rule.operations as string[]).includes(l.operation),
  );
  if (byOp.length === 0) return manual("no_operation");

  const byType = byOp.filter(
    (c) => c.rule.propertyTypes.length === 0 || (c.rule.propertyTypes as string[]).includes(l.propertyType),
  );
  if (byType.length === 0) return manual("no_type");

  const byPrice = byType.filter(
    (c) =>
      (c.rule.priceMinUsd == null || l.priceUsd >= c.rule.priceMinUsd) &&
      (c.rule.priceMaxUsd == null || l.priceUsd <= c.rule.priceMaxUsd),
  );
  if (byPrice.length === 0) return manual("no_price");

  const free = byPrice.filter((c) => (c.state?.overdue ?? 0) === 0);
  if (free.length === 0) return manual("all_busy");

  const bestTier = Math.max(...free.map((c) => c.tier));
  const best = free
    .filter((c) => c.tier === bestTier)
    .sort(
      (a, b) =>
        (a.state?.lastSharedAt ?? -1) - (b.state?.lastSharedAt ?? -1) || a.order - b.order,
    );
  const winner = best[0];
  return {
    kind: "share",
    target: parsePartnerKey(winner.rule.partner)!,
    via: TIER_VIA[bestTier as 1 | 2 | 3],
    candidates: best.length,
  };
}

/**
 * A rule from the settings form's fields (one fieldset per Socio). The field
 * names are the form's; this is the only parser of them.
 */
export function ruleFromForm(
  partner: PartnerKey,
  get: (name: string) => string | null,
  getAll: (name: string) => string[],
): PartnerRule {
  const p = (n: string) => `${partner}:${n}`;
  return {
    partner,
    active: get(p("active")) === "on",
    zoneIds: positiveInts(getAll(p("zones")), MAX_ZONES),
    operations: members(getAll(p("ops")), ROUTING_OPERATIONS),
    propertyTypes: members(getAll(p("types")), ROUTING_PROPERTY_TYPES),
    priceMinUsd: parsePrice(get(p("min"))?.trim() ?? ""),
    priceMaxUsd: parsePrice(get(p("max"))?.trim() ?? ""),
  };
}
