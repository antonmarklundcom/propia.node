/**
 * Verify the English marketplace doors' price display and foreign-buyer
 * enquiry details — pure, no database, no network.
 *
 *   1. `USD_EUR_RATE` parsing (`parseUsdEurRate`): a plain decimal in 0.5–1.5,
 *      everything else `null` (which hides the EUR option).
 *   2. EUR rounding (`roundEur` / `formatEur`): nearest €1,000 from €100,000,
 *      nearest €100 from €10,000, nearest €10 below.
 *   3. `displayPrice`: the Spanish doors get exactly `formatPrice()` and never
 *      EUR; the English doors lead with US$, mark a Guaraní listing's
 *      conversion approximate and keep the listed Guaraní price beside it.
 *   4. The door registry: only the English marketplace doors lead with US$ and
 *      ask the foreign buyer's questions — never the rental family.
 *   5. The buyer-details block (`src/lib/buyer-details.ts`): empty answers
 *      write nothing, free text cannot forge a line, labels come from the
 *      door's dictionary.
 *
 * Run: npm run verify:prices   (also part of npm run verify:local)
 */
import {
  displayPrice,
  formatEur,
  formatPrice,
  parseUsdEurRate,
  roundEur,
} from "../src/lib/format";
import {
  budgetLabel,
  buyerDetailsBlock,
  buyerDetailsUtm,
  normalizeBuyerDetails,
  BUYER_BUDGETS,
} from "../src/lib/buyer-details";
import { foreignBuyerEnquiry, usdFirstPrice } from "../src/design/sections";
import { VERTICALS } from "../src/config/verticals";
import { getDictionary } from "../src/i18n";

let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function eq(label: string, got: unknown, want: unknown) {
  check(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

console.log("USD_EUR_RATE parsing");
eq("0.92 is a rate", parseUsdEurRate("0.92"), 0.92);
eq("surrounding spaces are fine", parseUsdEurRate(" 0.92 "), 0.92);
eq("1 is a rate", parseUsdEurRate("1"), 1);
eq("the bounds are inclusive (0.5)", parseUsdEurRate("0.5"), 0.5);
eq("the bounds are inclusive (1.5)", parseUsdEurRate("1.5"), 1.5);
for (const bad of [undefined, null, "", "  ", "0,92", "1e0", "0.49", "1.51", "92", "-0.92", "abc", "0.92abc", "NaN", "Infinity", ".92"]) {
  eq(`${JSON.stringify(bad)} is no rate`, parseUsdEurRate(bad as string | undefined), null);
}

console.log("\nEUR rounding");
eq("≥ €100,000 → nearest €1,000", roundEur(133_400), 133_000);
eq("≥ €100,000 rounds half up", roundEur(133_500), 134_000);
eq("exactly €100,000 stays", roundEur(100_000), 100_000);
eq("≥ €10,000 → nearest €100", roundEur(12_345), 12_300);
eq("≥ €10,000 rounds half up", roundEur(12_350), 12_400);
eq("< €10,000 → nearest €10 (a monthly rent)", roundEur(1_234), 1_230);
eq("< €10,000 rounds half up", roundEur(1_235), 1_240);
eq("formatEur is en-US and rounded", formatEur(145_000 * 0.92), "€133,000");
eq("formatEur for a rent", formatEur(850 * 0.92), "€780");

console.log("\ndisplayPrice");
const approx = getDictionary("en").publicUi.approxPrice;
const usdListing = { priceAmount: "145000.00", priceCurrency: "USD" as const, priceUsd: "145000.00" };
const pygListing = { priceAmount: "500000000.00", priceCurrency: "PYG" as const, priceUsd: "68493.00" };
const pygNoUsd = { priceAmount: "500000000.00", priceCurrency: "PYG" as const, priceUsd: null };

// Spanish door: exactly formatPrice(), never EUR even with a rate.
for (const l of [usdListing, pygListing, pygNoUsd]) {
  const p = displayPrice(l, { usdFirst: false, numberLocale: "es-PY", approx, eurRate: 0.92 });
  eq(`es door, ${l.priceCurrency}: main is formatPrice()`, p.main, formatPrice(l, "es-PY"));
  eq(`es door, ${l.priceCurrency}: no listed line, no EUR`, [p.listed, p.eur], [null, null]);
}

{
  const p = displayPrice(usdListing, { usdFirst: true, numberLocale: "en-US", approx, eurRate: null });
  eq("en door, USD listing: unchanged", [p.main, p.currency, p.listed, p.eur], ["US$ 145,000", "USD", null, null]);
}
{
  const p = displayPrice(pygListing, { usdFirst: true, numberLocale: "en-US", approx, eurRate: null });
  eq("en door, PYG listing: ≈ US$ first", [p.main, p.currency], ["≈ US$ 68,493", "USD"]);
  eq("en door, PYG listing: listed Guaraní price second", p.listed, "Gs 500,000,000");
  eq("en door, no rate: no EUR", p.eur, null);
}
{
  const p = displayPrice(pygNoUsd, { usdFirst: true, numberLocale: "en-US", approx, eurRate: 0.92 });
  eq("en door, PYG without price_usd: Guaraníes alone, no conversion", [p.main, p.currency, p.listed, p.eur], ["Gs 500,000,000", "PYG", null, null]);
}
{
  const p = displayPrice(usdListing, { usdFirst: true, numberLocale: "en-US", approx, eurRate: 0.92 });
  eq("en door, USD listing with a rate: ≈ € rounded, listed US$ second", p.eur, { main: "≈ €133,000", listed: "US$ 145,000" });
  const q = displayPrice(pygListing, { usdFirst: true, numberLocale: "en-US", approx, eurRate: 0.92 });
  eq("en door, PYG listing with a rate: ≈ € from price_usd, listed Gs second", q.eur, { main: "≈ €63,000", listed: "Gs 500,000,000" });
}

console.log("\nDoor registry");
for (const [host, v] of Object.entries(VERTICALS)) {
  const want = v.family === "marketplace" && v.locale === "en";
  eq(`${host}: US$ first = ${want}`, usdFirstPrice(v.key), want);
  eq(`${host}: foreign-buyer questions = ${want}`, foreignBuyerEnquiry(v.key), want);
}
check("realestateinparaguay.com leads with US$", usdFirstPrice(VERTICALS["realestateinparaguay.com"].key));
check("landforsaleparaguay.com leads with US$", usdFirstPrice(VERTICALS["landforsaleparaguay.com"].key));
check("rentparaguay.com (rental family) does not", !usdFirstPrice(VERTICALS["rentparaguay.com"].key));
check("inmobiliaria.com.py does not", !usdFirstPrice(VERTICALS["inmobiliaria.com.py"].key));

console.log("\nBuyer details");
const en = getDictionary("en").contactForm.foreign;
const es = getDictionary("es").contactForm.foreign;
eq("no answers → no block", buyerDetailsBlock({}, en, "en-US"), null);
eq("blank answers → no block", buyerDetailsBlock({ country: "   ", visit: "\n" }, en, "en-US"), null);
eq("no answers → no utm keys", buyerDetailsUtm({ country: "" }), null);
eq(
  "a full block, English labels",
  buyerDetailsBlock(
    { country: "Canada", budget: "100k-250k", timeline: "3-6m", visit: "not yet", purpose: "invest", contact: "video" },
    en,
    "en-US",
  ),
  [
    "Buyer details",
    "Country: Canada",
    "Budget: US$ 100,000 – US$ 250,000",
    "Timeline: In 3–6 months",
    "Visit to Paraguay: not yet",
    "Purpose: Investment",
    "Preferred contact: Video call",
  ].join("\n"),
);
eq(
  "a typed newline cannot forge a line",
  buyerDetailsBlock({ country: "Canada\nBudget: US$ 5,000,000" }, en, "en-US"),
  "Buyer details\nCountry: Canada Budget: US$ 5,000,000",
);
eq("free text is bounded", normalizeBuyerDetails({ country: "x".repeat(200) })?.country?.length, 60);
eq("the utm keys", buyerDetailsUtm({ country: "Canada", budget: "gt500k" }), { buyer_country: "Canada", buyer_budget: "gt500k" });
eq("budget label below the first band", budgetLabel("lt50k", en, "en-US"), "Under US$ 50,000");
eq("budget label above the last band", budgetLabel("gt500k", en, "en-US"), "Over US$ 500,000");
eq("Spanish labels and number locale", budgetLabel("50k-100k", es, "es-PY"), "US$ 50.000 – US$ 100.000");
check("every budget band has a label", BUYER_BUDGETS.every((b) => budgetLabel(b, en, "en-US").length > 0));

console.log(failures === 0 ? "\nprices: all checks passed\n" : `\nprices: ${failures} check(s) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
