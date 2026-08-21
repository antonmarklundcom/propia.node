/**
 * Verify the hreflang layer — pure, no database, no network.
 *
 * `src/lib/alternates.ts` emits nothing today (both enabled doors are Spanish),
 * so a check that only exercised the live vertical table would prove the one
 * thing that needs no proving. What has to be right is the behaviour on **flip
 * day** — the release that turns `realestateinparaguay.com` English and makes
 * `inmobiliaria.com.py` primary (PLAN.md D6). That configuration does not exist
 * yet, so the check builds it and runs the real rule against it.
 *
 * Run: npm run verify:seo   (also part of npm run verify:local)
 */
import { VERTICALS, CANONICAL_HOST } from "../src/config/verticals";
import {
  alternatesFor,
  languageAlternates,
  servedDoors,
  type Door,
} from "../src/lib/alternates";

let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("\nhreflang: the live table (pre-flip)");

check(
  "no language alternates while every enabled door is Spanish",
  languageAlternates({ path: "/", scope: "site" }) === undefined,
  JSON.stringify(languageAlternates({ path: "/", scope: "site" })),
);
check(
  "…and none on listing detail either",
  languageAlternates({ path: "/propiedad/casa-abc1234567", scope: "listing" }) ===
    undefined,
);
check(
  "the primary host is a served door even if its row says enabled: false",
  servedDoors(CANONICAL_HOST).some((d) => d.host === CANONICAL_HOST),
);
check(
  "disabled feeders are not served doors",
  !servedDoors(CANONICAL_HOST).some((d) => d.host === "terreno.com.py"),
);

console.log("\nhreflang: the post-flip table (PLAN.md D6)");

/** The two hosts exactly as the D6 checklist leaves them. */
const FLIP_PRIMARY = "inmobiliaria.com.py";
const flipDoors: Door[] = [
  {
    host: "inmobiliaria.com.py",
    config: {
      ...VERTICALS["inmobiliaria.com.py"],
      locale: "es",
      ownsListingDetail: true,
    },
  },
  {
    host: "realestateinparaguay.com",
    config: {
      ...VERTICALS["realestateinparaguay.com"],
      locale: "en",
      copy: "foreign",
      filters: { foreign_exposure: true },
      ownsListingDetail: true,
    },
  },
];

const home = alternatesFor(flipDoors, FLIP_PRIMARY, { path: "/", scope: "site" });
check("two locales produce a language map", home !== undefined);
check(
  "Spanish points at the primary",
  home?.["es"] === "https://inmobiliaria.com.py/",
  home?.["es"],
);
check(
  "English points at the English door",
  home?.["en"] === "https://realestateinparaguay.com/",
  home?.["en"],
);
check(
  "x-default is the primary, the same host every unowned door canonicalises to",
  home?.["x-default"] === "https://inmobiliaria.com.py/",
  home?.["x-default"],
);
check(
  "no region tags — bare language codes only",
  Object.keys(home ?? {}).every((k) => k === "x-default" || /^[a-z]{2}$/.test(k)),
  Object.keys(home ?? {}).join(", "),
);

const cat = alternatesFor(flipDoors, FLIP_PRIMARY, {
  path: "/venta/asuncion/casas",
  scope: "site",
});
check(
  "the path is carried onto every door",
  cat?.["es"] === "https://inmobiliaria.com.py/venta/asuncion/casas" &&
    cat?.["en"] === "https://realestateinparaguay.com/venta/asuncion/casas",
);

const listing = alternatesFor(flipDoors, FLIP_PRIMARY, {
  path: "/propiedad/casa-abc1234567",
  scope: "listing",
});
check(
  "detail pages pair once both doors own their own",
  listing?.["en"] === "https://realestateinparaguay.com/propiedad/casa-abc1234567",
);

/**
 * The state between now and flip day: `inmobiliaria.com.py` is primary and
 * English is live, but the English door still canonicalises its detail pages
 * back. Then it is not a language version of them and must not be listed —
 * the same rule that keeps a feeder's URLs out of the sitemap.
 */
const halfFlipped: Door[] = [
  flipDoors[0],
  {
    host: "realestateinparaguay.com",
    config: { ...flipDoors[1].config, ownsListingDetail: false },
  },
];
check(
  "a door that canonicalises its detail pages away is not a language version",
  alternatesFor(halfFlipped, FLIP_PRIMARY, {
    path: "/propiedad/casa-abc1234567",
    scope: "listing",
  }) === undefined,
);
check(
  "…but its site pages still pair",
  alternatesFor(halfFlipped, FLIP_PRIMARY, { path: "/", scope: "site" }) !==
    undefined,
);

console.log("\nhreflang: ambiguity and overrides");

/** Two Spanish doors plus one English: the Spanish slot must be the primary. */
const threeDoors: Door[] = [
  {
    host: "terreno.com.py",
    config: { ...VERTICALS["terreno.com.py"], enabled: true },
  },
  ...flipDoors,
];
const tie = alternatesFor(threeDoors, FLIP_PRIMARY, { path: "/", scope: "site" });
check(
  "the primary wins the locale it shares with another door",
  tie?.["es"] === "https://inmobiliaria.com.py/",
  tie?.["es"],
);
check("one entry per locale, plus x-default", Object.keys(tie ?? {}).length === 3);

const overridden = alternatesFor(flipDoors, FLIP_PRIMARY, {
  path: "/venta/asuncion",
  scope: "site",
  pathByLocale: { en: "/for-sale/asuncion" },
});
check(
  "a per-locale path override reaches only that locale",
  overridden?.["en"] === "https://realestateinparaguay.com/for-sale/asuncion" &&
    overridden?.["es"] === "https://inmobiliaria.com.py/venta/asuncion",
);

/** Google requires every version to list the same set, self included. */
const selfListed = Object.values(home ?? {}).includes(
  "https://inmobiliaria.com.py/",
);
check("the set is self-referential (host-independent by construction)", selfListed);

console.log(
  failures === 0
    ? "\nhreflang: all checks passed\n"
    : `\nhreflang: ${failures} check(s) FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
