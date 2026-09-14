# docs/tools — director audit harness

Two Playwright scripts used by the site-quality plan
(`fable-plan-site-quality-2026-09-13.md` §3). They need `playwright` installed
somewhere on the machine (not a repo dependency): `npm i playwright && npx
playwright install chromium` in a scratch folder, then run from that folder
with the script path.

- `audit-home.mjs` — full-page screenshots of both doors' home at 1440 and 390,
  prints title/h1/canonical/hreflang, scrollWidth, page height, console errors
  and every response ≥ 400.
- `audit-inner.mjs` — walks hubs, category, detail and the marketing pages on
  both doors, prints status, scrollWidth, emoji count, title/h1/h2 and ≥ 400
  responses; screenshots category and detail.

To audit a local build instead of the live hosts, start `next start -p 3001`
against a seeded DB and change the two host URLs to `http://localhost:3001`
with `extraHTTPHeaders: { Host: '<door>' }` on the context.
