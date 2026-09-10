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
const svcAlt = languageAlternates({
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
  const alt = languageAlternates({
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
  languageAlternates({ path: "/", scope: "site", family: "rental" })?.["en"] ===
    "https://rentparaguay.com/",
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
  "(g) six doors are served — three live, two rental, one directory (D1)",
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

console.log(
  failures === 0
    ? "\nseo: all checks passed\n"
    : `\nseo: ${failures} check(s) FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
