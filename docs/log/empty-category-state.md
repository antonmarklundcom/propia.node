# Empty category pages: 200 at 0 listings (E-1..E-4), 2026-10-03

Phase 3 of `docs/plan-category-pages-build.md`; founder decisions E-1..E-4 in
`docs/plan-empty-category-seo-2026-10-03.md`; report
`docs/report-telegram-alerts-2026-10-03.md` §A hardening.

## What landed

- `src/lib/indexability.ts`: `emptyRenders` signal. With it, 0 listings is
  `noindex` (renders) instead of `gone` (404/redirect). Profile pages do not
  pass it and keep their 404.
- `src/lib/empty-state.ts` (pure): `doorAllowsCategory()` (a door's
  `filters` decide which combinations it carries), `emptyStateCtas()` (E-4
  order), `otherOperationsFor()`.
- `src/lib/category-context.ts`: `emptyStateLinks()` — sibling barrios
  (nearest first) and the city page for the same type, the same place in the
  other operation, other types here; every link has ≥ 1 listing.
- `src/components/EmptyCategory.tsx`: the empty state (honest line, CTAs,
  nearest-stock links, up to six cards from the nearest cities, related
  guides). Every read is `orDegraded()`.
- `app/[operacion]/[...segments]/page.tsx`: renders `EmptyCategory` at 0 for
  a valid, non-evergreen page (list or map view); meta description at 0 is the
  honest line; breadcrumbs no longer drop "empty" ancestors (none 404 now);
  the redirect walk (`emptyRedirectTarget`) remains only for a type or
  operation the door never carries; an old `?tipo_vacio` link still shows its
  notice.
- Report §A: `treePlace()` (`src/lib/ops/location-tree.ts`) — a city/barrio
  in the code's tree but not in the database renders with count 0 instead of
  404; `src/lib/sitemap.ts` leaves its evergreen paths out until seeded.
- `app/not-found.tsx`: "¿Quisiste decir …?" for a near-miss city or barrio
  slug (`closestSlug()`, `src/lib/did-you-mean.ts`; ≤ 2 edits, a tie
  suggests nothing).
- i18n: `esCategory`/`enCategory` `empty*` keys, `notFound.didYouMean`.
- Docs: ARCHITECTURE.md §4.3, CLAUDE.md "Empty category pages".

## Checks added (`verify:seo`, block p)

Indexability at 0 with/without `emptyRenders` and with evergreen; the door
filter rule (land door, rental door, unfiltered); CTA order and omissions;
other-operation choice; `emptyStateLinks` ordering, groups, no 0-count link,
a city missing from the table; `closestSlug` (typo, far, tie, exact) and
`editDistance`; `treePlace` hit/miss; the sitemap's seeded guard.

## Not verified

- No local database in this session: the empty page was not rendered against
  real rows. `npm run build` and the typecheck pass; the logic is covered by
  pure checks only.
- The founder should open, after deploy, one empty typed URL per door (e.g.
  `/alquiler/asuncion/loma-pyta/oficinas` on inmobiliaria.com.py) and check:
  200, `noindex,follow` in the source, not in `/sitemap.xml`, CTAs in order.
- Idea "home fallback links" (plan list, Opus idea 7) was looked at and left:
  the home's `stockedOr(…, "/venta?tipo=…")` fallback still serves a visitor
  well (a filtered national hub beats an empty city page), and `?tipo=` being
  disallowed in robots.txt only stops crawlers following that one fallback.
