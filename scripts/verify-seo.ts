/**
 * Verify the hreflang layer and the vertical table's SEO invariants — pure,
 * no database, no network.
 *
 * The D6 flip (PLAN.md) landed 2026-09-04: `inmobiliaria.com.py` is the
 * Spanish primary, `realestateinparaguay.com` is its English translation.
 * The first block below checks the live table now produces the real
 * hreflang pair. The synthetic `flipDoors` table further down is kept as an
 * independent spec — it re-derives the same post-flip shape from scratch
 * rather than from `VERTICALS`, so a future edit to the live config that
 * silently breaks the pairing (or an accidental revert of the flip) fails
 * here even if nobody re-reads the live-table block above.
 *
 * Run: npm run verify:seo   (also part of npm run verify:local)
 */
import {
  VERTICALS,
  CANONICAL_HOST,
  type VerticalConfig,
} from "../src/config/verticals";
import { detailOwnerForLocale } from "../src/lib/origin";
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

console.log("\nhreflang: the live table (flipped 2026-09-04, PLAN.md D6)");

check(
  "the live table pairs the two locales",
  languageAlternates({ path: "/", scope: "site", family: "marketplace" })?.["es"] ===
    "https://inmobiliaria.com.py/" &&
    languageAlternates({ path: "/", scope: "site", family: "marketplace" })?.["en"] ===
      "https://realestateinparaguay.com/",
  JSON.stringify(languageAlternates({ path: "/", scope: "site", family: "marketplace" })),
);
check(
  "…and on listing detail too, now both doors own their own",
  languageAlternates({
    path: "/propiedad/casa-abc1234567",
    scope: "listing",
    family: "marketplace",
  })?.["en"] === "https://realestateinparaguay.com/propiedad/casa-abc1234567",
);
check(
  "the primary host is a served door even if its row says enabled: false",
  servedDoors(CANONICAL_HOST).some((d) => d.host === CANONICAL_HOST),
);
check(
  "disabled feeders are not served doors",
  !servedDoors(CANONICAL_HOST).some((d) => d.host === "inmobiliarios.com.py"),
);

console.log("\nhreflang: the post-flip shape, re-derived independently");

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

const home = alternatesFor(flipDoors, FLIP_PRIMARY, {
  path: "/",
  scope: "site",
  family: "marketplace",
});
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
  family: "marketplace",
});
check(
  "the path is carried onto every door",
  cat?.["es"] === "https://inmobiliaria.com.py/venta/asuncion/casas" &&
    cat?.["en"] === "https://realestateinparaguay.com/venta/asuncion/casas",
);

const listing = alternatesFor(flipDoors, FLIP_PRIMARY, {
  path: "/propiedad/casa-abc1234567",
  scope: "listing",
  family: "marketplace",
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
    family: "marketplace",
  }) === undefined,
);
check(
  "…but its site pages still pair",
  alternatesFor(halfFlipped, FLIP_PRIMARY, {
    path: "/",
    scope: "site",
    family: "marketplace",
  }) !== undefined,
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
const tie = alternatesFor(threeDoors, FLIP_PRIMARY, {
  path: "/",
  scope: "site",
  family: "marketplace",
});
check(
  "the primary wins the locale it shares with another door",
  tie?.["es"] === "https://inmobiliaria.com.py/",
  tie?.["es"],
);
check("one entry per locale, plus x-default", Object.keys(tie ?? {}).length === 3);

const overridden = alternatesFor(flipDoors, FLIP_PRIMARY, {
  path: "/venta/asuncion",
  scope: "site",
  family: "marketplace",
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

/**
 * The vertical table is hand-written TypeScript, so the traps below all
 * compile. Each one is a live SEO regression that no page would report: the
 * site keeps rendering and Google quietly does the wrong thing with it. The
 * flip checklist (PLAN.md D6) edits exactly these fields, one host at a time,
 * which is when a half-applied edit is most likely — so the half-applied state
 * fails a push instead of a quarter of indexing.
 */
/**
 * Families (fable/plan-rentparaguay.md §5.1). Two businesses now share this
 * deployment: the marketplace (inmobiliaria.com.py, realestateinparaguay.com,
 * terreno.com.py) and the rental services firm (alquiler.com.py,
 * rentparaguay.com). hreflang pairs *translations*, so a door may only ever
 * be declared as a language version of a door in its own family — otherwise
 * rentparaguay.com/ claims inmobiliaria.com.py/ as its Spanish version, and
 * /servicios/… is declared on doors that redirect it to /. Neither shows up
 * in a rendered page: the tags are right there in the <head>, addressed to a
 * crawler, describing a relationship nobody in the building believes.
 */
console.log("\nfamilies: the marketplace and the rental doors never pair");

const mkHome = languageAlternates({ path: "/", scope: "site", family: "marketplace" });
check(
  "(a) the marketplace home map is unchanged by the rental doors",
  mkHome?.["es"] === "https://inmobiliaria.com.py/" &&
    mkHome?.["en"] === "https://realestateinparaguay.com/" &&
    mkHome?.["x-default"] === "https://inmobiliaria.com.py/",
  JSON.stringify(mkHome),
);
check(
  "(a) …and names no rental host",
  Object.values(mkHome ?? {}).every(
    (u) => !u.includes("rentparaguay.com") && !u.includes("alquiler.com.py"),
  ),
  JSON.stringify(mkHome),
);

const rentHome = languageAlternates({ path: "/", scope: "site", family: "rental" });
check(
  "(b) the rental home map is its own two doors",
  rentHome?.["es"] === "https://alquiler.com.py/" &&
    rentHome?.["en"] === "https://rentparaguay.com/" &&
    rentHome?.["x-default"] === "https://alquiler.com.py/",
  JSON.stringify(rentHome),
);

const svc = languageAlternates({
  path: "/servicios/alquiler",
  scope: "site",
  family: "marketplace",
});
check(
  "(c) a rental path asked for as marketplace content never reaches a rental door",
  Object.values(svc ?? {}).every((u) => !u.includes("rentparaguay.com")),
  JSON.stringify(svc),
);
check(
  "(c) …and the rental family declares it on its own two doors only",
  Object.values(
    languageAlternates({
      path: "/servicios/alquiler",
      scope: "site",
      family: "rental",
    }) ?? {},
  ).every((u) => u.includes("rentparaguay.com") || u.includes("alquiler.com.py")),
);
check(
  "(c) a rental door owns no /propiedad, so its detail pages pair with nothing",
  languageAlternates({
    path: "/propiedad/casa-abc1234567",
    scope: "listing",
    family: "rental",
  }) === undefined,
);

/**
 * (d) The same three answers re-derived from a table written here rather than
 * read from `VERTICALS` — the same trick the flip block above uses. An edit
 * that makes the live table agree with a broken rule still fails this.
 */
const FAM_PRIMARY = "inmobiliaria.com.py";
const base: VerticalConfig = {
  key: "inmobiliaria",
  locale: "es",
  family: "marketplace",
  brand: "b",
  copy: "ownership",
  enabled: true,
  ownsListingDetail: true,
};
const famDoors: Door[] = [
  { host: "inmobiliaria.com.py", config: { ...base } },
  {
    host: "realestateinparaguay.com",
    config: { ...base, key: "en", locale: "en" },
  },
  {
    host: "alquiler.com.py",
    config: {
      ...base,
      key: "alquiler",
      family: "rental",
      copy: "rental",
      ownsListingDetail: false,
    },
  },
  {
    host: "rentparaguay.com",
    config: {
      ...base,
      key: "rent",
      locale: "en",
      family: "rental",
      copy: "rental",
      ownsListingDetail: false,
    },
  },
];
const synMk = alternatesFor(famDoors, FAM_PRIMARY, {
  path: "/",
  scope: "site",
  family: "marketplace",
});
const synRent = alternatesFor(famDoors, FAM_PRIMARY, {
  path: "/",
  scope: "site",
  family: "rental",
});
check(
  "(d) synthetic: the marketplace map is the two marketplace doors",
  synMk?.["es"] === "https://inmobiliaria.com.py/" &&
    synMk?.["en"] === "https://realestateinparaguay.com/",
  JSON.stringify(synMk),
);
check(
  "(d) synthetic: the rental map is the two rental doors",
  synRent?.["es"] === "https://alquiler.com.py/" &&
    synRent?.["en"] === "https://rentparaguay.com/",
  JSON.stringify(synRent),
);
check(
  "(d) synthetic: x-default in a family the primary is not in is that family's Spanish door",
  synRent?.["x-default"] === "https://alquiler.com.py/",
  synRent?.["x-default"],
);
check(
  "(d) synthetic: a rental door never appears in the marketplace map",
  Object.values(synMk ?? {}).every(
    (u) => !u.includes("rentparaguay.com") && !u.includes("alquiler.com.py"),
  ),
);

check(
  "(e) every vertical declares a family",
  Object.values(VERTICALS).every((v) =>
    ["marketplace", "rental", "directory"].includes(v.family),
  ),
  Object.entries(VERTICALS)
    .filter(([, v]) => !v.family)
    .map(([h]) => h)
    .join(", "),
);

/**
 * (f) A feeder canonicalises /propiedad to the door that owns detail *in the
 * feeder's own language*. An English page whose canonical is a Spanish URL is
 * a canonical Google ignores, which is the whole reason this is per-locale
 * rather than "always the primary". Driven through the pure helper, so no
 * request is needed.
 */
check(
  "(f) an English feeder's detail canonical is the English detail owner",
  detailOwnerForLocale(VERTICALS["rentparaguay.com"].locale) ===
    "realestateinparaguay.com",
  detailOwnerForLocale("en"),
);
check(
  "(f) a Spanish feeder's is the Spanish primary",
  detailOwnerForLocale(VERTICALS["terreno.com.py"].locale) ===
    "inmobiliaria.com.py",
  detailOwnerForLocale("es"),
);
check(
  "(f) every served feeder resolves to a door that really owns detail",
  servedDoors(CANONICAL_HOST)
    .filter((d) => !d.config.ownsListingDetail && d.host !== CANONICAL_HOST)
    .every((d) => {
      const owner = VERTICALS[detailOwnerForLocale(d.config.locale)];
      return Boolean(owner?.ownsListingDetail || owner === VERTICALS[CANONICAL_HOST]);
    }),
);

check(
  "(g) five doors are served — the three live ones plus the two rental doors",
  servedDoors(CANONICAL_HOST).length === 5,
  servedDoors(CANONICAL_HOST)
    .map((d) => d.host)
    .join(", "),
);

console.log("\nvertical table: traps that are not type errors");

const servedNow = servedDoors(CANONICAL_HOST);

check(
  "CANONICAL_HOST has an entry",
  Boolean(VERTICALS[CANONICAL_HOST]),
  `${CANONICAL_HOST} is not a key of VERTICALS — every page would be branded with a domain nobody owns (audit F41)`,
);

for (const host of Object.keys(VERTICALS)) {
  check(
    `"${host}" is in the form VERTICALS is looked up by`,
    host === host.toLowerCase().replace(/^www\./, "").split(":")[0],
    "resolveVertical() lowercases, strips www. and drops the port before this lookup, so any other spelling silently never matches",
  );
}

const keys = Object.values(VERTICALS).map((v) => v.key);
check(
  "vertical keys are unique",
  new Set(keys).size === keys.length,
  "currentVertical() resolves the x-vertical header by finding the FIRST entry with that key — two hosts sharing one would serve whichever comes first in the file",
);

/**
 * The duplicate-content trap, and the reason `inmobiliaria.com.py` ships
 * `ownsListingDetail: false` today: two hosts serving the same rows in the
 * same language, each self-canonicalising its detail pages, is two domains
 * publishing identical content. Flipping that flag alone — without the locale
 * flip that makes one of them a translation — is the single-line edit that
 * causes it.
 */
const detailOwners = servedNow.filter(
  (d) => d.host === CANONICAL_HOST || d.config.ownsListingDetail,
);
const localesOwningDetail = detailOwners.map((d) => d.config.locale);
check(
  "no two served doors own their detail pages in the same language",
  new Set(localesOwningDetail).size === localesOwningDetail.length,
  detailOwners.map((d) => `${d.host} (${d.config.locale})`).join(" + "),
);

check(
  "a directory/projects door does not claim listing detail",
  servedNow.every((d) => !d.config.mode || d.config.mode === "portal" || !d.config.ownsListingDetail),
  "those doors render a different shell entirely and have no /propiedad to be canonical for",
);

const brands = servedNow.map((d) => d.config.brand);
check(
  "every served door has its own brand name",
  brands.every(Boolean) && new Set(brands).size === brands.length,
  brands.join(" / ") + " — the domain IS the brand (CLAUDE.md), so two doors sharing a name means one of them is wearing the other's",
);

/**
 * `origin.ts` treats the primary host as owning its detail pages whatever its
 * row says. If the row disagrees, the code is right and the table is lying to
 * the next reader. Note the limit: CANONICAL_HOST comes from the environment,
 * and on flip day the env moves in hPanel — a local run of this check still
 * sees the code default, so it catches the mismatch only for whoever runs it
 * with the new value set.
 */
check(
  "the primary host's row agrees that it owns its detail pages",
  VERTICALS[CANONICAL_HOST]?.ownsListingDetail !== false,
  `${CANONICAL_HOST} is primary, so origin.ts self-canonicalises its /propiedad pages regardless of the flag`,
);

console.log(
  failures === 0
    ? "\nseo: all checks passed\n"
    : `\nseo: ${failures} check(s) FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
