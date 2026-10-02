/**
 * Pure checks for the lead routing rules (src/lib/lead-routing-rules.ts,
 * plan-admin-next O3). No DB, no network. In verify:local and the pre-push hook.
 */
import {
  decideRouting,
  parsePrice,
  parseRoutingConfig,
  ruleFromForm,
  serializeRoutingConfig,
  type PartnerRule,
  type PartnerState,
  type RoutingConfig,
  type RoutingDecision,
  type RoutingLead,
} from "../src/lib/lead-routing-rules";

let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    failed++;
    console.error(`FAIL ${name}:\n  got  ${g}\n  want ${w}`);
  }
}

// Places: city Luque (10) with barrio Centro (11); city Asunción (20) with barrio Recoleta (21).
const rule = (partner: string, over: Partial<PartnerRule> = {}): PartnerRule => ({
  partner: partner as PartnerRule["partner"],
  active: true,
  zoneIds: [],
  operations: [],
  propertyTypes: [],
  priceMinUsd: null,
  priceMaxUsd: null,
  ...over,
});
const free = (lastSharedAt: number | null = null): PartnerState => ({ shareable: true, overdue: 0, lastSharedAt });
const lead = (over: Partial<RoutingLead["listing"] & object> = {}, top: Partial<RoutingLead> = {}): RoutingLead => ({
  routedTo: "internal",
  leadType: "buyer",
  isReport: false,
  alreadyShared: false,
  listing: {
    operation: "venta",
    propertyType: "casa",
    priceUsd: 120000,
    cityId: 10,
    barrioId: 11,
    ownerPartner: null,
    ...over,
  },
  ...top,
});
const cfg = (rules: PartnerRule[], savedBy: number | null = 1): RoutingConfig => ({ rules, savedBy });
const run = (
  config: RoutingConfig,
  l: RoutingLead,
  states: Record<string, PartnerState>,
  enabled = true,
): RoutingDecision => decideRouting({ enabled, config, lead: l, states: new Map(Object.entries(states)) });
const target = (d: RoutingDecision) => (d.kind === "share" ? `${d.target.kind}:${d.target.id}/${d.via}` : d.reason);

const allFree = { "agency:1": free(), "agency:2": free(), "agent:3": free() };

// --- gates, in order ---
eq("off", target(run(cfg([rule("agency:1")]), lead(), allFree, false)), "off");
eq("no actor", target(run(cfg([rule("agency:1")], null), lead(), allFree)), "no_actor");
eq("not internal", target(run(cfg([rule("agency:1")]), lead({}, { routedTo: "agency" }), allFree)), "not_internal");
eq("report", target(run(cfg([rule("agency:1")]), lead({}, { isReport: true, leadType: "question" }), allFree)), "report");
eq("already shared", target(run(cfg([rule("agency:1")]), lead({}, { alreadyShared: true }), allFree)), "already_shared");
eq("seller type", target(run(cfg([rule("agency:1")]), lead({}, { leadType: "seller" }), allFree)), "lead_type");
eq("valuation type", target(run(cfg([rule("agency:1")]), lead({}, { leadType: "valuation" }), allFree)), "lead_type");
eq("no listing", target(run(cfg([rule("agency:1")]), { ...lead(), listing: null }, allFree)), "no_listing");
eq("no rules", target(run(cfg([]), lead(), allFree)), "no_rules");
eq("inactive rule", target(run(cfg([rule("agency:1", { active: false })]), lead(), allFree)), "no_rules");
eq(
  "unverified/ex-Socio is not shareable",
  target(run(cfg([rule("agency:1")]), lead(), { "agency:1": { ...free(), shareable: false } })),
  "no_rules",
);
eq("unknown Socio", target(run(cfg([rule("agency:9")]), lead(), allFree)), "no_rules");
eq("renter routes", target(run(cfg([rule("agency:1")]), lead({}, { leadType: "renter" }), allFree)), "agency:1/anywhere");
eq("question routes", target(run(cfg([rule("agency:1")]), lead({}, { leadType: "question" }), allFree)), "agency:1/anywhere");

// --- 0. the listing's own Socio ---
eq(
  "own Socio wins over a better zone match",
  target(run(cfg([rule("agency:1", { zoneIds: [11] })]), lead({ ownerPartner: "agent:3" }), allFree)),
  "agent:3/owner",
);
eq(
  "own Socio needs no rule",
  target(run(cfg([]), lead({ ownerPartner: "agent:3" }), allFree)),
  "agent:3/owner",
);
eq(
  "busy own Socio keeps the lead manual (never a competitor)",
  target(
    run(cfg([rule("agency:1")]), lead({ ownerPartner: "agent:3" }), {
      ...allFree,
      "agent:3": { ...free(), overdue: 2 },
    }),
  ),
  "owner_busy",
);
eq(
  "own 'Socio' that is not shareable falls through to the rules",
  target(
    run(cfg([rule("agency:1")]), lead({ ownerPartner: "agent:3" }), {
      ...allFree,
      "agent:3": { ...free(), shareable: false },
    }),
  ),
  "agency:1/anywhere",
);

// --- 1. zone ---
eq("zone miss", target(run(cfg([rule("agency:1", { zoneIds: [20] })]), lead(), allFree)), "no_zone");
eq("city match", target(run(cfg([rule("agency:1", { zoneIds: [10] })]), lead(), allFree)), "agency:1/city");
eq("barrio match", target(run(cfg([rule("agency:1", { zoneIds: [11] })]), lead(), allFree)), "agency:1/barrio");
eq(
  "barrio-only rule misses a listing placed at city level",
  target(run(cfg([rule("agency:1", { zoneIds: [11] })]), lead({ barrioId: null }), allFree)),
  "no_zone",
);
eq(
  "barrio beats city beats anywhere",
  target(
    run(
      cfg([rule("agency:1"), rule("agency:2", { zoneIds: [10] }), rule("agent:3", { zoneIds: [11, 20] })]),
      lead(),
      allFree,
    ),
  ),
  "agent:3/barrio",
);
eq(
  "city beats anywhere",
  target(run(cfg([rule("agency:1"), rule("agency:2", { zoneIds: [10] })]), lead(), allFree)),
  "agency:2/city",
);

// --- 2–4. operation, type, price ---
eq("operation miss", target(run(cfg([rule("agency:1", { operations: ["alquiler"] })]), lead(), allFree)), "no_operation");
eq("operation hit", target(run(cfg([rule("agency:1", { operations: ["venta"] })]), lead(), allFree)), "agency:1/anywhere");
eq("type miss", target(run(cfg([rule("agency:1", { propertyTypes: ["terreno"] })]), lead(), allFree)), "no_type");
eq("price below min", target(run(cfg([rule("agency:1", { priceMinUsd: 150000 })]), lead(), allFree)), "no_price");
eq("price above max", target(run(cfg([rule("agency:1", { priceMaxUsd: 100000 })]), lead(), allFree)), "no_price");
eq(
  "price bounds inclusive",
  target(run(cfg([rule("agency:1", { priceMinUsd: 120000, priceMaxUsd: 120000 })]), lead(), allFree)),
  "agency:1/anywhere",
);
eq(
  "inverted band never matches",
  target(run(cfg([rule("agency:1", { priceMinUsd: 200000, priceMaxUsd: 100000 })]), lead(), allFree)),
  "no_price",
);
eq(
  "a narrower rule failing leaves the broader one",
  target(
    run(cfg([rule("agency:1", { zoneIds: [11], propertyTypes: ["terreno"] }), rule("agency:2", { zoneIds: [10] })]), lead(), allFree),
  ),
  "agency:2/city",
);

// --- 5. busy ---
eq(
  "all matching Socios busy",
  target(run(cfg([rule("agency:1")]), lead(), { "agency:1": { ...free(), overdue: 1 } })),
  "all_busy",
);
eq(
  "busy barrio specialist falls back to the city tier",
  target(
    run(cfg([rule("agency:1", { zoneIds: [11] }), rule("agency:2", { zoneIds: [10] })]), lead(), {
      "agency:1": { ...free(), overdue: 1 },
      "agency:2": free(),
    }),
  ),
  "agency:2/city",
);

// --- 6. rotation ---
eq(
  "least recently shared first",
  target(run(cfg([rule("agency:1"), rule("agency:2")]), lead(), { "agency:1": free(2000), "agency:2": free(1000) })),
  "agency:2/anywhere",
);
eq(
  "never shared before anyone",
  target(run(cfg([rule("agency:1"), rule("agency:2")]), lead(), { "agency:1": free(1000), "agency:2": free(null) })),
  "agency:2/anywhere",
);
eq(
  "tie broken by rule order",
  target(run(cfg([rule("agency:2"), rule("agency:1")]), lead(), { "agency:1": free(), "agency:2": free() })),
  "agency:2/anywhere",
);
const rot = run(cfg([rule("agency:1"), rule("agency:2")]), lead(), { "agency:1": free(), "agency:2": free() });
eq("candidates counted", rot.kind === "share" ? rot.candidates : -1, 2);

// --- config parsing ---
eq("empty", parseRoutingConfig(undefined), { rules: [], savedBy: null });
eq("garbage", parseRoutingConfig("{not json"), { rules: [], savedBy: null });
eq("array root", parseRoutingConfig("[]"), { rules: [], savedBy: null });
const messy = parseRoutingConfig(
  JSON.stringify({
    savedBy: 7,
    rules: [
      {
        partner: "agency:1",
        active: true,
        zoneIds: [11, "10", -3, 0, 1.5, "x", 11],
        operations: ["venta", "permuta"],
        propertyTypes: ["casa", "castillo"],
        priceMinUsd: "50000",
        priceMaxUsd: -1,
      },
      { partner: "agency:1", active: true }, // duplicate: first wins
      { partner: "user:3", active: true }, // not a Socio kind
      { partner: "agent:0", active: true },
      { partner: "agent:4", active: "yes" }, // active must be literally true
      null,
    ],
  }),
);
eq("parse: one rule per Socio, junk dropped", messy.rules.map((r) => r.partner), ["agency:1", "agent:4"]);
eq("parse: zones sanitised", messy.rules[0].zoneIds, [10, 11]);
eq("parse: unknown members dropped", [messy.rules[0].operations, messy.rules[0].propertyTypes], [["venta"], ["casa"]]);
eq("parse: prices", [messy.rules[0].priceMinUsd, messy.rules[0].priceMaxUsd], [50000, null]);
eq("parse: active strict", messy.rules[1].active, false);
eq("parse: savedBy", messy.savedBy, 7);
eq("round trip", parseRoutingConfig(serializeRoutingConfig(messy)), messy);
eq("bad savedBy", parseRoutingConfig(JSON.stringify({ rules: [], savedBy: "1" })).savedBy, null);

eq("price: blank", parsePrice(""), null);
eq("price: thousands", parsePrice("150.000"), 150000);
eq("price: millions", parsePrice("1.500.000"), 1500000);
eq("price: words", parsePrice("mucho"), null);
eq("price: negative", parsePrice("-5"), null);

// --- the form's fields ---
const form: Record<string, string[]> = {
  "agent:3:active": ["on"],
  "agent:3:zones": ["11", "abc", "20"],
  "agent:3:ops": ["venta", "x"],
  "agent:3:types": ["casa"],
  "agent:3:min": " 80.000 ",
  "agent:3:max": [""],
} as unknown as Record<string, string[]>;
const get = (n: string) => {
  const v = form[n] as unknown;
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? null) : null;
};
const getAll = (n: string) => {
  const v = form[n] as unknown;
  return Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
};
eq("ruleFromForm", ruleFromForm("agent:3", get, getAll), {
  partner: "agent:3",
  active: true,
  zoneIds: [11, 20],
  operations: ["venta"],
  propertyTypes: ["casa"],
  priceMinUsd: 80000,
  priceMaxUsd: null,
});
eq("ruleFromForm: unticked", ruleFromForm("agency:1", () => null, () => []).active, false);

if (failed) {
  console.error(`verify:routing — ${failed} failure(s)`);
  process.exit(1);
}
console.log("verify:routing — OK");
