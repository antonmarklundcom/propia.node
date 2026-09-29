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
  MARKETPLACE_PRIMARY_HOST,
  type VerticalConfig,
} from "../src/config/verticals";
import {
  detailOwnerForLocale,
  directoryOwnerForLocale,
} from "../src/lib/origin";
import {
  DIRECTORY_SITEMAP_PATHS,
  MARKETPLACE_PATH_ROOTS,
} from "../src/config/site-nav";
import {
  chromeShowLogin,
  chromeShowNewsletter,
  chromeShowPublishCta,
  marketplacePagesEnabled,
} from "../src/design/sections";
import {
  alternatesFor,
  languageAlternates,
  servedDoors,
  type Door,
} from "../src/lib/alternates";
import { RENTAL_SERVICES } from "../src/config/rental-services";
import { rentalPath, rentalPathsByLocale } from "../src/design/sections";
import {
  MARKETPLACE_SITEMAP_PATHS,
  rentalSitemapPaths,
} from "../src/config/site-nav";
import {
  categoryFacts,
  relatedCategoryLinks,
  type CategoryPageRef,
  type InventoryLocation,
  type InventoryRow,
} from "../src/lib/category-context";
import {
  categoryUrl,
  parseCategorySegments,
  parseOperation,
} from "../src/lib/urls";
import {
  EVERGREEN_PAGES,
  evergreenParagraphs,
  evergreenPathsFor,
  evergreenWordCount,
  isEvergreenPath,
} from "../src/content/evergreen";
import { guidesForPage, pagesForGuide } from "../src/lib/guide-links";
import { propertyHost, reportWindow, serviceAccount, signedAssertion } from "../src/lib/search-console";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { getIndexability } from "../src/lib/indexability";
import { TREE, flatten } from "../src/lib/ops/location-tree";

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
  // inmobiliarios.com.py moved out of this check in D1: it is `enabled: true`
  // from that phase (DNS is the go-live switch, not the flag), so the disabled
  // feeder left to stand for the rule is desarrolladores.com.py.
  "disabled feeders are not served doors",
  !servedDoors(CANONICAL_HOST).some(
    (d) => d.host === "desarrolladores.com.py",
  ),
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

// A page's hreflang set must contain the page itself: served from a host
// that holds none of the locale slots (a feeder, or a door that
// canonicalises the page type elsewhere), no set is emitted at all.
const homeInput = { path: "/", scope: "site" as const, family: "marketplace" as const };
check(
  "the primary serving its own page still gets the set",
  alternatesFor(flipDoors, FLIP_PRIMARY, { ...homeInput, servingHost: FLIP_PRIMARY })?.["es"] ===
    "https://inmobiliaria.com.py/",
);
check(
  "the English door serving its own page still gets the set",
  alternatesFor(flipDoors, FLIP_PRIMARY, { ...homeInput, servingHost: "realestateinparaguay.com" })?.["en"] ===
    "https://realestateinparaguay.com/",
);
check(
  "a host outside the set (a feeder) emits no hreflang",
  alternatesFor(flipDoors, FLIP_PRIMARY, { ...homeInput, servingHost: "terreno.com.py" }) === undefined,
);
check(
  "every served door either emits nothing or a set that names itself",
  servedDoors(CANONICAL_HOST).every((door) => {
    const set = alternatesFor(servedDoors(CANONICAL_HOST), CANONICAL_HOST, {
      ...homeInput,
      family: door.config.family,
      servingHost: door.host,
    });
    return set === undefined || Object.values(set).some((url) => new URL(url).host === door.host);
  }),
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
  "(b) alquiler.com.py is disabled (domain taken, S6): the rental home declares no alternates and names no alquiler host",
  VERTICALS["alquiler.com.py"]?.enabled === false &&
    (rentHome === undefined ||
      Object.values(rentHome).every((u) => !u.includes("alquiler.com.py"))),
  JSON.stringify(rentHome),
);
check(
  "(b) …so rentparaguay.com stands alone: no es / x-default pointing at a domain nobody owns",
  rentHome?.["es"] === undefined && rentHome?.["x-default"] === undefined,
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

/**
 * (r2) English URLs for the rental business's own pages (plan §5.1 / Stage 1
 * C2). Three things have to hold together and none of them shows up in a
 * rendered page:
 *
 * - each door's hreflang entry names **its own** URL, not the other's — an
 *   alternate that 301s is an alternate Google drops;
 * - the two slug sets stay disjoint, so a redirect can never point at itself
 *   (a loop is a page that stops existing, with no error anywhere);
 * - the sitemaps are per-language and list only what that door serves.
 *
 * Everything below is driven through the same pure helpers the app uses, so a
 * slug added to `RENTAL_SERVICES` without its English twin fails here.
 */
console.log("\nrental doors: one page, one URL per language (R2)");

const svcEn = RENTAL_SERVICES.find((s) => s.dictKey === "administracionAirbnb")!;
// alquiler.com.py is disabled (S6), so these run against the synthetic table
// `famDoors` above, where the Spanish rental door IS served: the pairing
// machinery stays proven for the day a replacement domain is bought.
const svcAlt = alternatesFor(famDoors, FAM_PRIMARY, {
  path: rentalPath("es", "services", svcEn),
  pathByLocale: rentalPathsByLocale("services", svcEn),
  scope: "site",
  family: "rental",
});
check(
  "(r2) a service page pairs its Spanish and English URLs, each on its own door",
  svcAlt?.["es"] === "https://alquiler.com.py/servicios/administracion-airbnb" &&
    svcAlt?.["en"] === "https://rentparaguay.com/services/airbnb-management",
  JSON.stringify(svcAlt),
);
check(
  "(r2) x-default for a rental page is the family's Spanish door, at the Spanish URL",
  svcAlt?.["x-default"] ===
    "https://alquiler.com.py/servicios/administracion-airbnb",
  svcAlt?.["x-default"],
);

for (const page of ["services", "about", "contact"] as const) {
  const alt = alternatesFor(famDoors, FAM_PRIMARY, {
    path: rentalPath("es", page),
    pathByLocale: rentalPathsByLocale(page),
    scope: "site",
    family: "rental",
  });
  check(
    `(r2) "${page}": every alternate is the path that door actually serves`,
    alt?.["es"] === `https://alquiler.com.py${rentalPath("es", page)}` &&
      alt?.["en"] === `https://rentparaguay.com${rentalPath("en", page)}`,
    JSON.stringify(alt),
  );
}

check(
  "(r2) omitting pathByLocale still gives every locale the same path",
  alternatesFor(famDoors, FAM_PRIMARY, { path: "/", scope: "site", family: "rental" })?.[
    "en"
  ] === "https://rentparaguay.com/",
);

const esSlugs = RENTAL_SERVICES.map((s) => s.slug);
const enSlugs = RENTAL_SERVICES.map((s) => s.slugEn);
check(
  "(r2) every service has both slugs, and they are unique within each language",
  esSlugs.every(Boolean) &&
    enSlugs.every(Boolean) &&
    new Set(esSlugs).size === esSlugs.length &&
    new Set(enSlugs).size === enSlugs.length,
  `${esSlugs.join(",")} / ${enSlugs.join(",")}`,
);
check(
  "(r2) no service's two URLs collide — a redirect can never target itself",
  RENTAL_SERVICES.every(
    (s) => rentalPath("es", "services", s) !== rentalPath("en", "services", s),
  ),
);
check(
  "(r2) the three page kinds differ between the languages too",
  (["services", "about", "contact"] as const).every(
    (p) => rentalPath("es", p) !== rentalPath("en", p),
  ),
);

for (const locale of ["es", "en"] as const) {
  const paths = rentalSitemapPaths(locale);
  const other = locale === "en" ? "es" : "en";
  const otherOwn = [
    rentalPath(other, "services"),
    rentalPath(other, "about"),
    rentalPath(other, "contact"),
    ...RENTAL_SERVICES.map((s) => rentalPath(other, "services", s)),
  ];
  check(
    `(r2) the ${locale} rental sitemap lists its own services hub and seven pages`,
    paths.includes(rentalPath(locale, "services")) &&
      RENTAL_SERVICES.every((s) =>
        paths.includes(rentalPath(locale, "services", s)),
      ),
    paths.join(" "),
  );
  check(
    `(r2) …and none of the ${other} door's own URLs, which it 301s away`,
    otherOwn.every((p) => !paths.includes(p)),
    paths.filter((p) => otherOwn.includes(p)).join(" "),
  );
  check(
    `(r2) …and no /propiedad URL (the rental doors own no listing detail)`,
    paths.every((p) => !p.startsWith("/propiedad")),
  );
}

check(
  "(r2) the marketplace sitemap is untouched — still Spanish /nosotros and /contacto",
  MARKETPLACE_SITEMAP_PATHS.includes("/nosotros") &&
    MARKETPLACE_SITEMAP_PATHS.includes("/contacto") &&
    !MARKETPLACE_SITEMAP_PATHS.includes("/about") &&
    !MARKETPLACE_SITEMAP_PATHS.includes("/contact") &&
    !MARKETPLACE_SITEMAP_PATHS.includes("/services"),
);
check(
  "(r2) the marketplace's own hreflang for /nosotros is unchanged by all of this",
  languageAlternates({ path: "/nosotros", scope: "site", family: "marketplace" })?.[
    "en"
  ] === "https://realestateinparaguay.com/nosotros",
  JSON.stringify(
    languageAlternates({ path: "/nosotros", scope: "site", family: "marketplace" }),
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
  "(g) six doors are served — four marketplace, one rental (rentparaguay.com), one directory; alquiler.com.py is disabled (S6)",
  servedDoors(CANONICAL_HOST).length === 6,
  servedDoors(CANONICAL_HOST)
    .map((d) => d.host)
    .join(", "),
);

/**
 * The directory door (fable-plan-realtor-terreno-rental.md D1, §5.2 (g)).
 *
 * inmobiliarios.com.py is served from D1 with its own chrome, home and lead
 * form, and it is the first door whose page-type ownership is a *third* axis:
 * `ownsDirectory` decides which host is canonical for /agentes, /agente/*,
 * /inmobiliarias and /inmobiliaria/* — page types every marketplace door
 * renders. Two Spanish doors each self-canonicalising a profile is the same
 * duplicate the detail flag exists to prevent, one page type over.
 */
console.log("\ndirectory: one owner per locale, and no marketplace URLs");

const servedForDirectory = servedDoors(CANONICAL_HOST);
// Mirrors directoryOwnerForLocale(): a door that sets the flag owns its
// locale; the primary host is the owner only for a locale nobody claims.
const flaggedOwners = servedForDirectory.filter((d) => d.config.ownsDirectory);
const directoryOwners = servedForDirectory.filter(
  (d) =>
    d.config.ownsDirectory ||
    (d.host === CANONICAL_HOST &&
      !flaggedOwners.some((o) => o.config.locale === d.config.locale)),
);
const directoryLocales = directoryOwners.map((d) => d.config.locale);
check(
  "(h) exactly one served door owns the directory pages per locale",
  new Set(directoryLocales).size === directoryLocales.length,
  directoryOwners.map((d) => `${d.host} (${d.config.locale})`).join(" + "),
);
check(
  "(h) …and every locale that has a served door has an owner for it",
  [...new Set(servedForDirectory.map((d) => d.config.locale))].every((loc) =>
    directoryOwners.some((d) => d.config.locale === loc),
  ),
  "a door whose language has no directory owner would canonicalise its profiles into another language — a canonical Google drops",
);
check(
  "(h) the resolved owner per locale is a door that really owns them",
  directoryOwnerForLocale("es") === "inmobiliarios.com.py" &&
    directoryOwnerForLocale("en") === "realestateinparaguay.com",
  `${directoryOwnerForLocale("es")} / ${directoryOwnerForLocale("en")}`,
);
check(
  "(h) the directory door owns the Spanish directory pages (go-live 2026-09-10)",
  VERTICALS["inmobiliarios.com.py"]?.ownsDirectory === true &&
    VERTICALS["inmobiliaria.com.py"]?.ownsDirectory !== true,
  "DNS resolves, so the flag moved off inmobiliaria.com.py; two Spanish owners would be the duplicate the flag exists to prevent",
);
check(
  "(h) the directory door is served, so it can be previewed and verified",
  servedForDirectory.some((d) => d.host === "inmobiliarios.com.py"),
  "the alquiler.com.py precedent: resolveVertical() ignores a disabled host",
);
check(
  "(h) a directory door claims no listing detail",
  VERTICALS["inmobiliarios.com.py"]?.ownsListingDetail === false,
);

const dirAlt = languageAlternates({
  path: "/agentes",
  scope: "directory",
  family: "marketplace",
});
check(
  "(i) the marketplace's directory pages pair es↔en",
  dirAlt?.["es"] === "https://inmobiliaria.com.py/agentes" &&
    dirAlt?.["en"] === "https://realestateinparaguay.com/agentes",
  JSON.stringify(dirAlt),
);
check(
  "(i) a door that canonicalises the directory away is in no language map",
  Object.values(dirAlt ?? {}).every(
    (u) => !u.includes("terreno.com.py") && !u.includes("alquiler.com.py"),
  ),
  JSON.stringify(dirAlt),
);
check(
  "(i) the directory family declares no alternates while it owns nothing",
  languageAlternates({
    path: "/agentes",
    scope: "directory",
    family: "directory",
  }) === undefined,
);

/**
 * (j) The door's sitemap. It 301s every marketplace path (next.config.ts), so
 * submitting one would be a redirect in a sitemap — the same Search Console
 * error as submitting a URL the host canonicalises away.
 */
const MARKETPLACE_PREFIXES = [
  "/propiedad",
  "/venta",
  "/alquiler",
  "/precios",
  "/proyecto",
  "/desarrolladora",
  "/publicar",
  "/tasacion",
  "/vender",
  "/planes",
  "/datos",
  "/guias",
  "/financiamiento",
  "/para-inmobiliarias",
];
check(
  "(j) the directory door's static sitemap list holds no marketplace path",
  DIRECTORY_SITEMAP_PATHS.every(
    (p) => !MARKETPLACE_PREFIXES.some((m) => p === m || p.startsWith(`${m}/`)),
  ),
  DIRECTORY_SITEMAP_PATHS.join(", "),
);
check(
  "(j) …and every path in it is one the directory door renders",
  DIRECTORY_SITEMAP_PATHS.every((p) =>
    [
      "/",
      "/agentes",
      "/inmobiliarias",
      "/para-inmobiliarios",
      "/contacto",
      "/terminos",
      "/privacidad",
    ].includes(p),
  ),
  "a sitemap that submits a 404 is the same error as one that submits a redirect",
);
check(
  "(j) marketplacePagesEnabled() is false only for the directory family",
  !marketplacePagesEnabled("agents") &&
    marketplacePagesEnabled("inmobiliaria") &&
    marketplacePagesEnabled("en") &&
    marketplacePagesEnabled("alquiler"),
);
check(
  "(j) the redirect target is a served Spanish marketplace door that owns detail",
  Boolean(
    VERTICALS[MARKETPLACE_PRIMARY_HOST]?.enabled &&
      VERTICALS[MARKETPLACE_PRIMARY_HOST]?.locale === "es" &&
      VERTICALS[MARKETPLACE_PRIMARY_HOST]?.family === "marketplace" &&
      VERTICALS[MARKETPLACE_PRIMARY_HOST]?.ownsListingDetail,
  ),
  `${MARKETPLACE_PRIMARY_HOST} — every marketplace path on a directory door 308s here (middleware.ts); if it is not a served door that owns those pages, the redirect points at nothing`,
);
check(
  "(j) no marketplace-redirected root is in the directory door's sitemap",
  DIRECTORY_SITEMAP_PATHS.every(
    (p) => !MARKETPLACE_PATH_ROOTS.includes(p.split("/")[1] ?? ""),
  ),
  "a sitemap that submits a path the same door 308s away is a redirect in a sitemap",
);
check(
  "(j) the directory door's chrome carries no login, publish CTA or newsletter",
  !chromeShowLogin("agents") &&
    !chromeShowPublishCta("agents") &&
    !chromeShowNewsletter("agents"),
  "§1 item 4: no grids, no search, no /publicar, no login in its chrome",
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

/**
 * (k) Category pages' related-links module and intro facts
 * (`src/lib/category-context.ts`). The module is a crawl path, so its one
 * rule is the sitemap's: a link may only point at a page that is indexable on
 * this door. Driven with a synthetic inventory — the same shape
 * `getCategoryInventory()` returns — and re-checked against counts this script
 * computes itself rather than the module's own tally.
 */
console.log("\ncategory pages: related links only reach indexable pages");

const LOCS: InventoryLocation[] = [
  { id: 1, name: "Ciudad A", slug: "ciudad-a", level: "ciudad", parentId: null, lat: -25.3, lng: -57.6 },
  { id: 11, name: "Barrio A1", slug: "barrio-a1", level: "barrio", parentId: 1, lat: null, lng: null },
  { id: 12, name: "Barrio A2", slug: "barrio-a2", level: "barrio", parentId: 1, lat: null, lng: null },
  { id: 2, name: "Ciudad B", slug: "ciudad-b", level: "ciudad", parentId: null, lat: -25.4, lng: -57.6 },
  { id: 3, name: "Ciudad C", slug: "ciudad-c", level: "ciudad", parentId: null, lat: -25.31, lng: -57.6 },
  { id: 4, name: "Ciudad D", slug: "ciudad-d", level: "ciudad", parentId: null, lat: -27.3, lng: -55.9 },
  { id: 41, name: "Barrio D1", slug: "barrio-d1", level: "barrio", parentId: 4, lat: null, lng: null },
  { id: 5, name: "Ciudad E", slug: "ciudad-e", level: "ciudad", parentId: null, lat: null, lng: null },
];
const LOC_BY_ID = new Map(LOCS.map((l) => [l.id, l]));
const row = (
  locationId: number,
  propertyType: InventoryRow["propertyType"],
  count: number,
  minUsd = 50_000,
  maxUsd = 90_000,
): InventoryRow => ({ locationId, propertyType, count, minUsd, maxUsd });
const INV: InventoryRow[] = [
  row(11, "casa", 3, 80_000, 120_000), // A1 casas: indexable, parent A/casas = 5
  row(12, "casa", 1), // A2 casas: 1 → noindex, never linked
  row(1, "casa", 1, 0, 0), // city-level, price "a consultar" → ignored for bounds
  row(1, "terreno", 2), // A/terrenos: 2 → noindex, never linked
  row(12, "departamento", 4, 60_000, 150_000), // A/departamentos: 4 → linked
  row(2, "casa", 3), // B/casas → linked, and B is nearest to A
  row(3, "casa", 2), // C/casas: 2 → never linked, although closest to A
  row(41, "casa", 3), // D/casas via its barrio
  row(5, "terreno", 4), // E: one type only (a terreno-only door's shape)
];

/** Independent recount: the count the linked page itself would compute. */
function pageCountOf(path: string): { count: number; parentOk: boolean } {
  const [, , citySlug, a, b] = path.split("/");
  const city = LOCS.find((l) => l.slug === citySlug && l.level === "ciudad")!;
  const barrio = b ? LOCS.find((l) => l.slug === a && l.parentId === city.id) : undefined;
  const typeSeg = b ?? a;
  const type = typeSeg
    ? (Object.entries({ casas: "casa", departamentos: "departamento", terrenos: "terreno" })
        .find(([p]) => p === typeSeg)?.[1] ?? "?")
    : null;
  const inCity = (id: number) => id === city.id || LOC_BY_ID.get(id)?.parentId === city.id;
  const sum = (pred: (r: InventoryRow) => boolean) =>
    INV.filter(pred).reduce((n, r) => n + r.count, 0);
  const count = sum(
    (r) =>
      (barrio ? r.locationId === barrio.id : inCity(r.locationId)) &&
      (type == null || r.propertyType === type),
  );
  const parentOk = barrio
    ? sum((r) => inCity(r.locationId) && r.propertyType === type) >= 3
    : true;
  return { count, parentOk };
}

const PAGES: CategoryPageRef[] = [
  { operation: "venta", cityId: 1, barrioId: null, type: null },
  { operation: "venta", cityId: 1, barrioId: null, type: "casa" },
  { operation: "venta", cityId: 1, barrioId: 11, type: "casa" },
  { operation: "venta", cityId: 2, barrioId: null, type: "casa" },
  { operation: "venta", cityId: 5, barrioId: null, type: null },
];
const allLinks = PAGES.flatMap((p) => {
  const g = relatedCategoryLinks(INV, LOC_BY_ID, p);
  return [...g.types, ...g.barrios, ...g.cities].map((l) => ({ page: p, link: l }));
});
check(
  "(k) every related link points at a page indexable on this door",
  allLinks.every(({ link }) => {
    const { count, parentOk } = pageCountOf(link.href);
    return count >= 3 && parentOk && count === link.count;
  }),
  allLinks
    .filter(({ link }) => pageCountOf(link.href).count < 3)
    .map(({ link }) => link.href)
    .join(", "),
);
check(
  "(k) no page links to itself",
  allLinks.every(({ page, link }) => {
    const self = categoryUrl({
      operation: page.operation,
      citySlug: LOC_BY_ID.get(page.cityId)!.slug,
      barrioSlug: page.barrioId ? LOC_BY_ID.get(page.barrioId)!.slug : undefined,
      type: page.type ?? undefined,
    });
    return link.href !== self;
  }),
);
check(
  "(k) links stay inside the page's operation",
  allLinks.every(({ page, link }) => link.href.startsWith(`/${page.operation}/`)),
);
const aCasas = relatedCategoryLinks(INV, LOC_BY_ID, PAGES[1]);
check(
  "(k) /venta/ciudad-a/casas: other types = departamentos only (terrenos has 2)",
  aCasas.types.map((l) => l.href).join() === "/venta/ciudad-a/departamentos",
  aCasas.types.map((l) => l.href).join(),
);
check(
  "(k) …barrios = A1 only (A2 has 1)",
  aCasas.barrios.map((l) => l.href).join() === "/venta/ciudad-a/barrio-a1/casas",
  aCasas.barrios.map((l) => l.href).join(),
);
check(
  "(k) …other cities = B then D, nearest first; C (2 listings) is left out",
  aCasas.cities.map((l) => l.href).join() === "/venta/ciudad-b/casas,/venta/ciudad-d/casas",
  aCasas.cities.map((l) => l.href).join(),
);
check(
  "(k) a barrio page does not list itself among its sibling barrios",
  relatedCategoryLinks(INV, LOC_BY_ID, PAGES[2]).barrios.length === 0,
);
check(
  "(k) a one-type door's city page does not link its own set under a second URL",
  relatedCategoryLinks(INV, LOC_BY_ID, PAGES[4]).types.length === 0,
  "ciudad-e holds only terrenos, so /venta/ciudad-e/terrenos is the same listing set",
);
const factsA = categoryFacts(INV, LOC_BY_ID, PAGES[0]);
check(
  "(k) intro facts: count, barrios and types are the page's own rows",
  factsA.count === 11 &&
    factsA.barrioCount === 2 &&
    factsA.types.map((x) => `${x.type}:${x.count}`).join() === "casa:5,departamento:4,terreno:2",
  JSON.stringify(factsA),
);
check(
  "(k) …and a zero price never becomes the \"from\" figure",
  factsA.minUsd === 50_000 && factsA.maxUsd === 150_000,
  `${factsA.minUsd}–${factsA.maxUsd}`,
);


console.log("\n(l) evergreen category pages (src/content/evergreen/, ARCHITECTURE.md §4.3)");

const seededCity = (slug: string) =>
  flatten(TREE, "").some((n) => n.level === "ciudad" && n.slug === slug);
const seededBarrio = (citySlug: string, barrioSlug: string) =>
  flatten(TREE, "").some(
    (n) => n.level === "barrio" && n.slug === barrioSlug && n.parentFullSlug?.split("/").pop() === citySlug,
  );

check("(l) the registry is not empty", EVERGREEN_PAGES.length > 0);
const seenPaths = new Map<string, string>();
const seenKeywords = new Map<string, string>();
for (const page of EVERGREEN_PAGES) {
  const [opSeg, ...rest] = page.path.split("/").filter(Boolean);
  const op = parseOperation(opSeg ?? "");
  const shape = op ? parseCategorySegments(rest) : null;
  const rebuilt =
    op && shape
      ? categoryUrl({
          operation: op,
          citySlug: shape.citySlug,
          barrioSlug: shape.kind === "barrio-type" ? shape.barrioSlug : undefined,
          type: shape.kind === "city" ? undefined : shape.type,
        })
      : null;
  check(
    `(l) ${page.path} is a parseable category URL in canonical form`,
    rebuilt === page.path,
    String(rebuilt),
  );
  check(
    `(l) ${page.path} names a city${shape?.kind === "barrio-type" ? " and barrio" : ""} in the location tree`,
    !!shape &&
      seededCity(shape.citySlug) &&
      (shape.kind !== "barrio-type" || seededBarrio(shape.citySlug, shape.barrioSlug)),
  );
  // One page per URL per language: the Spanish and English doors may each
  // carry their own version of a path (hreflang pairs them), but two doors in
  // one language would be the duplicate the canonical tag exists to prevent.
  const pageOwner = Object.values(VERTICALS).find((v) => v.key === page.door);
  const pathLocale = `${pageOwner?.locale ?? "?"}|${page.path}`;
  check(
    `(l) ${page.path} (${page.door}) is the only keyword page for its URL in its language`,
    !seenPaths.has(pathLocale),
    `also ${seenPaths.get(pathLocale)}`,
  );
  seenPaths.set(pathLocale, `${page.door}: ${page.keyword}`);
  check(
    `(l) ${page.path}'s main keyword "${page.keyword}" targets no other page`,
    !seenKeywords.has(page.keyword),
    `also ${seenKeywords.get(page.keyword)}`,
  );
  seenKeywords.set(page.keyword, page.path);
  for (const kw of page.secondaryKeywords) {
    check(
      `(l) ${page.path}: secondary "${kw}" is not another page's main keyword`,
      !seenKeywords.has(kw) || seenKeywords.get(kw) === page.path,
    );
  }

  const owner = Object.values(VERTICALS).find((v) => v.key === page.door);
  check(
    `(l) ${page.path}'s door "${page.door}" serves marketplace pages`,
    !!owner && marketplacePagesEnabled(owner.key),
  );

  const keys = [...new Set(Object.values(VERTICALS).map((v) => v.key))];
  // The doors that carry a content file for this path (one per language).
  const pathOwners = EVERGREEN_PAGES.filter((p) => p.path === page.path)
    .map((p) => p.door)
    .sort()
    .join();
  const indexableOn = keys.filter(
    (k) =>
      getIndexability({ listingCount: 0, evergreen: isEvergreenPath(page.path, k) }).state === "index",
  );
  check(
    `(l) ${page.path} is indexable at 0 listings only on the door(s) with a page for it`,
    [...indexableOn].sort().join() === pathOwners,
    indexableOn.join(),
  );
  const inSitemapOf = keys.filter((k) => evergreenPathsFor(k).includes(page.path));
  check(
    `(l) ${page.path} is in the sitemap of the door(s) with a page for it and no other's`,
    [...inSitemapOf].sort().join() === pathOwners,
    inSitemapOf.join(),
  );

  const words = evergreenWordCount(page);
  check(`(l) ${page.path} carries 500–900 words of its own`, words >= 500 && words <= 900, `${words} words`);
  check(`(l) ${page.path} has 4–6 FAQ entries`, page.faq.length >= 4 && page.faq.length <= 6, String(page.faq.length));
  const bandsOk =
    page.priceBands.length >= 3 &&
    page.priceBands.length <= 4 &&
    page.priceBands.every((b, i, all) =>
      (b.min != null || b.max != null) &&
      (b.min == null || b.max == null || b.min < b.max) &&
      (i === 0 || (all[i - 1].max != null && b.min != null && b.min > all[i - 1].max!)),
    );
  check(`(l) ${page.path} has 3–4 ascending, non-overlapping price bands`, bandsOk);
  check(`(l) ${page.path} lists its claims to verify`, page.claimsToVerify.length > 0);
  check(
    `(l) ${page.path}'s content carries no digits (numbers come from our rows)`,
    evergreenParagraphs(page).every((x) => !/\d/.test(x)),
  );
  check(
    `(l) ${page.path}'s meta description fits in 155 characters`,
    page.metaDescription.length <= 155,
    String(page.metaDescription.length),
  );
}

// Guides ↔ evergreen links (src/lib/guide-links.ts): relatedness from the words.
{
  const g = (slug: string, title: string, excerpt = "") => ({ slug, title, excerpt });
  const guides = [
    g("comprar-casa-luque", "Cómo comprar una casa en Luque"),
    g("alquilar-en-asuncion", "Alquilar en Asunción: la garantía y el contrato"),
    g("mercado", "Cómo comprar sin apuro"),
    g("buying", "Buying property in Paraguay", "Deeds, the escribano and paying for a house"),
  ];
  const forLuque = guidesForPage("/venta/luque/casas", guides).map((x) => x.slug);
  check("(l) guide links: a guide naming the city and type comes first", forLuque[0] === "comprar-casa-luque", forLuque.join());
  check("(l) guide links: an operation word alone does not relate a guide", !forLuque.includes("mercado"), forLuque.join());
  check(
    "(l) guide links: a rental guide is not offered on another city's sale page",
    !forLuque.includes("alquilar-en-asuncion"),
    forLuque.join(),
  );
  check(
    "(l) guide links: English words relate English guides",
    guidesForPage("/venta/asuncion/casas", guides).some((x) => x.slug === "buying"),
  );
  const onDoor = EVERGREEN_PAGES.filter((p) => p.door === "inmobiliaria");
  const fromGuide = pagesForGuide("Todo sobre alquilar una casa en Lambaré: garantía y contrato", onDoor).map((p) => p.path);
  check("(l) guide links: a guide links the evergreen page it is about", fromGuide[0] === "/alquiler/lambare/casas", fromGuide.join());
  check(
    "(l) guide links: a guide links only its door's pages",
    pagesForGuide("terrenos en Areguá a cuotas", onDoor).every((p) => p.door === "inmobiliaria"),
  );
}

// No two content files share a paragraph — the whole difference between an
// evergreen page and a doorway page with the city swapped.
const norm = (x: string) => x.toLowerCase().replace(/\s+/g, " ").trim();
const owners = new Map<string, string>();
const shared: string[] = [];
for (const page of EVERGREEN_PAGES) {
  const id = `${page.door}${page.path}`;
  for (const para of new Set(evergreenParagraphs(page).map(norm))) {
    const other = owners.get(para);
    if (other && other !== id) shared.push(`${other} & ${id}: "${para.slice(0, 60)}…"`);
    owners.set(para, id);
  }
}
check("(l) no two evergreen pages share a paragraph", shared.length === 0, shared.join(" | "));

// The related-links module links an evergreen page even with no stock on
// this door, and never one that is not evergreen here.
{
  const evLoc: InventoryLocation[] = [
    { id: 1, name: "Ciudad X", slug: "ciudad-x", level: "ciudad", parentId: null, lat: -25, lng: -57 },
    { id: 2, name: "Ciudad Y", slug: "ciudad-y", level: "ciudad", parentId: null, lat: -25.1, lng: -57.1 },
  ];
  const evById = new Map(evLoc.map((l) => [l.id, l]));
  const evRows: InventoryRow[] = [
    { locationId: 1, propertyType: "casa", count: 5, minUsd: 1, maxUsd: 2 },
  ];
  const ref: CategoryPageRef = { operation: "venta", cityId: 1, barrioId: null, type: "casa" };
  const withEv = relatedCategoryLinks(evRows, evById, ref, new Set(["/venta/ciudad-y/casas", "/venta/ciudad-x/terrenos"]));
  const without = relatedCategoryLinks(evRows, evById, ref);
  check(
    "(l) related links include an evergreen page at 0 stock (other city, same type)",
    withEv.cities.some((l) => l.href === "/venta/ciudad-y/casas" && l.count === 0),
    JSON.stringify(withEv.cities),
  );
  check(
    "(l) …and an evergreen sibling type in the same city",
    withEv.types.some((l) => l.href === "/venta/ciudad-x/terrenos" && l.count === 0),
    JSON.stringify(withEv.types),
  );
  check(
    "(l) …and neither when the path is not evergreen on this door",
    without.cities.length === 0 && without.types.length === 0,
  );
}

// Search Console (src/lib/search-console.ts): the key parses in both
// spellings, the signed assertion verifies against the key, the window lags.
{
  console.log("\n(m) Search Console report");
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const json = JSON.stringify({ client_email: "reader@project.iam.gserviceaccount.com", private_key: pem });
  const sa = serviceAccount(json);
  check("(m) a raw JSON key parses", sa?.client_email === "reader@project.iam.gserviceaccount.com");
  check("(m) a base64 JSON key parses", serviceAccount(Buffer.from(json).toString("base64"))?.private_key === pem);
  check("(m) no key / junk → not configured", serviceAccount("") === null && serviceAccount("{nope") === null);
  const jwt = signedAssertion(sa!, 1_700_000_000);
  const [h, c, sig] = jwt.split(".");
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${h}.${c}`);
  check("(m) the assertion is signed with the key (RS256)", verifier.verify(publicKey, Buffer.from(sig, "base64url")));
  const claims = JSON.parse(Buffer.from(c, "base64url").toString());
  check(
    "(m) the assertion asks only for read access, for one hour",
    claims.scope === "https://www.googleapis.com/auth/webmasters.readonly" && claims.exp - claims.iat === 3600,
  );
  const w = reportWindow(new Date("2026-09-27T12:00:00Z"));
  check("(m) the window is 28 days ending two days ago", w.startDate === "2026-08-29" && w.endDate === "2026-09-25", JSON.stringify(w));
  check("(m) sc-domain properties map to our doors", propertyHost("sc-domain:inmobiliaria.com.py") === "inmobiliaria.com.py");
  check("(m) URL-prefix properties map too", propertyHost("https://terreno.com.py/") === "terreno.com.py");
  check("(m) a property that is not a door maps to none", propertyHost("sc-domain:example.com") === null);
}

console.log(
  failures === 0
    ? "\nseo: all checks passed\n"
    : `\nseo: ${failures} check(s) FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
