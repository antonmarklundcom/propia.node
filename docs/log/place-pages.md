# Place guides: /zonas/<ciudad>[/<barrio>] (2026-10-03)

Phase 4 of `docs/plan-category-pages-build.md` (plus Opus idea 9, hreflang
for place pages). Stacked on phase 3 (`claude/empty-category-state`, PR #283):
merge that first.

Decisions applied as recommended in `docs/decisions-needed.md` (the founder
said "do it"; confirm when reviewing): **P-1** `/zonas/…` on every door,
spelled once by `placePath()`; **P-2** owner doors `inmobiliaria` (es) and
`en`; **P-6** draft → verified flips indexability.

## What landed

- `src/content/places/` — `types.ts` (the content model, plan §3.2),
  `index.ts` (the registry and its helpers), and **one draft: `asuncion.ts`**
  (927 words, 4 FAQ, 20 claims to verify, no photos yet). It is live but
  noindex until verified.
- Routes `app/zonas/[ciudad]` and `app/zonas/[ciudad]/[barrio]` →
  `src/components/place/PlaceGuide.tsx`: breadcrumbs, H1 and lede, hero photo
  (when photos exist), **live links** to every type × operation with stock in
  the place on this door (counted at request time) plus this door's evergreen
  pages there, the guide's sections and zones, gallery, FAQ, buyer brief
  (`surface: "place"`), barrio guide links, related guides.
- JSON-LD: `BreadcrumbList`, `Place` (tree centroid as `geo`,
  `containedInPlace` for a barrio; `placeJsonLd()` in `src/lib/jsonld.ts`),
  `FAQPage`.
- Canonical: this host for its own file; the owner's host for another door's
  file. hreflang: `placeAlternates()` (`src/lib/place-alternates.ts`) — only
  verified guides, only different languages, `x-default` Spanish.
- Sitemap: each door lists its own verified guides only.
- `/zonas` joined `MARKETPLACE_PATH_ROOTS`: the directory door 308s it.
- Category pages: the guide's excerpt + "Leé la guía de …" link on every
  combination page of the place (barrio guide first when one exists); an
  evergreen page gets only the link.
- i18n: `esPlace` / `enPlace` (`src/i18n/es-place.ts`, `en-place.ts`).
- `BRIEF_SURFACES` gained `"place"`.

## Checks added (`verify:seo` block q)

All of plan §3.3 (a)–(n) on every registered file, the shared-paragraph check
against other guides and every evergreen page, the swapped-name template
check (with a synthetic renamed copy proving the rule fires), hreflang
pairing (verified pair → es/en/x-default; a draft never pairs), the path
root, `placePath()`.

## Not verified

- No local database: `/zonas/asuncion` was never rendered against real rows.
  Typecheck, build and the pure checks pass.
- The Asunción text is an AI draft from general knowledge, written without
  the founder's notes (plan §5). Every claim is in `claimsToVerify`; nothing
  is indexable until the founder checks them.
- No photos exist yet; the hero and gallery render only when a file lists
  photos and the WebP files are in `public/img/places/asuncion/`.

## For the founder

1. Review the Asunción claims (in the file) and reply ✓ / fix / remove.
2. Send 5–8 photos of Asunción with one line each (what, where, who took it).
3. After both: the session flips the file to `verified` in a small PR.
