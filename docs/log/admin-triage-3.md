# Admin triage 3 — exports, reply templates, bulk contacted, deltas, thumbs, shortcuts, mobile (2026-10-02) — no migration

Branch `claude/funny-ritchie-pcol1s` (PR #267), on top of `admin-triage-2.md`.

## What landed
- **CSV export** on /admin/propiedades (staff and up) and /admin/calidad (super-admin):
  `app/admin/<page>/export/route.ts`, guarded like the page, same filter parser
  and reader (`src/lib/admin-listing-export.ts`: `parseListingFilter`,
  `filterQualityRows`, `listingsCsv`, `qualityCsv`), `src/lib/csv.ts`. The file
  holds the whole filtered set (propiedades up to 5000; the page shows 200).
- **Reply templates**: site setting `reply_templates` (JSON array, max 20, each
  <= 1000 chars; `src/lib/reply-templates.ts`, pure). /admin/ajustes, "Plantillas
  de respuesta": one textarea, templates separated by a `---` line; logged as
  `setting.change`. `TemplatePicker` (client) is a "Plantilla" select above the
  WhatsApp and email reply boxes on each /admin/leads card; it only fills the
  textarea ({nombre}, {propiedad} replaced; asks before overwriting). Nothing is sent.
- **Bulk "Marcar contactadas"** (`markLeadsContactedAction`, `markLeadsContacted()`):
  ticked cards (same `leadIds` boxes as the bulk share bar, which now shows
  whenever there are leads) go new -> contacted only; staff limited to
  `routed_to = 'internal'`; one `lead.contacted` admin event each; same view after.
- **/admin/analitica**: each headline number in "Resumen por sitio" shows the
  change vs the previous period of equal length (`deltaOf()`, `.panel-delta`,
  `--color-success` / `--color-error`). `analyticsWindow()` takes an end day;
  `dailyWhere()` clamps to the window end (needed for a window wholly before raw retention).
- **Cover thumbnails** 56x42 lazy in /admin/propiedades and the review queue,
  one query (`getCoverThumbs()`, position 0, `imageThumbUrl()`).
- **Review-queue shortcuts** (`ReviewShortcuts`): j/k, x, a, r, ?, visible hint,
  ignored while typing or with a modifier.
- **Mobile**: `.panel-table--stack` (under 700px rows become cards via `data-label`)
  on /admin, /admin/propiedades, /admin/calidad and the analytics summary. Other
  `.panel-table`s are unchanged.
- `npm run verify:triage` (pure: templates, delta) in `verify:local` and pre-push.

## Verified
- `npm run verify:local` (see PR for the run).
- Local MariaDB 11.8 + `next start`, playwright chromium, seeded admin session:
  every feature clicked/pressed; CSV row counts equal the on-screen filtered rows;
  21 templates and 1001 chars refused; picker filled the real placeholders and sent
  nothing; bulk touched only new leads (a ticked closed one stayed closed); deltas
  rendered; no horizontal scroll at 390px on /admin, /admin/propiedades,
  /admin/calidad, /admin/leads, /admin/analitica, /admin/ajustes. Screenshots at
  1280 and 390 taken in the session (not committed).
- Staff restriction of the bulk query checked directly (`internalOnly` leaves
  agency / agent / owner leads untouched).

## Not verified
- Production data. The email-box picker (same component as WhatsApp; the email
  box needs Cloudflare + inbound env). A staff session through the UI.
- `verify:scopes` not run: no agency-panel query touched.
