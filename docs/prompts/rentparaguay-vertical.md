# Build the rentparaguay.com / alquiler.com.py vertical — paste into a fresh Sonnet (or Opus) session

**Priority: this is the main focus — get it 100% right before moving on.**
A second prompt exists at `docs/prompts/inmobiliarios-directory.md` for a
different, unrelated domain (`inmobiliarios.com.py`, plural); its cheap
steps can run in parallel or whenever, but this one is what Anton wants
polished first.

**Cross-reference:** the cross-domain redirect to `inmobiliarios.com.py`
flagged in this vertical's own `SITE-SUMMARY.md` (navigating rentparaguay.com's
XML sitemap files bounced to a different, unrelated domain) was
**independently reproduced** in a separate Playwright scan of
`inmobiliarios.com.py` itself (`docs/inmobiliarios-com-py-competitive-analysis.md`,
§"Reproducible bug worth flagging") — same symptom seen from the other
domain's side, on `/nosotros`, `/login`, and after a viewport resize. Two
independent scans hitting the same cross-domain bounce makes a stray
plugin/redirect script far less likely and a shared-hosting/CDN
misconfiguration more likely. Worth ruling in/out before either old
WordPress install is decommissioned — flag it in this vertical's PR too.

## Context you need before touching anything

1. Read `CLAUDE.md` in full — especially the "Domains" section and the
   "Listing filters" section. Read `PLAN.md`'s D6 entry (the
   `inmobiliaria.com.py` / `realestateinparaguay.com` split) — it is the
   precedent this build follows.
2. Read `src/config/verticals.ts` end to end. `alquiler.com.py` is already
   declared there: `key: "alquiler"`, `filters: { operation: ["alquiler"] }`,
   `copy: "rental"`, `enabled: false`. **`rentparaguay.com` has no entry at
   all yet** — it does not exist in the codebase.
3. Read the extraction at `docs/rentparaguay-extraction/SITE-SUMMARY.md` in
   full, then `docs/rentparaguay-extraction/site-content.json` for the
   structured per-page copy. That folder is the old WordPress site's
   content, scraped and staged directly in this repo so any session working
   from git alone can reach it — **it's reference material to build from,
   not a folder to keep around long-term.** Once this vertical's real pages
   and images are in place, delete `docs/rentparaguay-extraction/` in the
   same PR (or a fast-follow) rather than leaving 17 MB of scraped scratch
   content in the repo permanently. Images live at
   `docs/rentparaguay-extraction/images/` (50 files).

## The one architecture decision to make first — propose it, don't just build it

`alquiler.com.py` (Spanish, `.com.py`) and `rentparaguay.com` (English
domain name, and the old site's copy is written entirely for an
English-speaking expat/investor audience) look like the same D6 pattern
already used for `inmobiliaria.com.py` / `realestateinparaguay.com`: one
Spanish primary, one English translation of the same door, both sharing the
same underlying listing set (`operation: alquiler`) but different
`locale`/`copy`/theme.

Work out and write down (in the PR description, before writing page code):
- Does `rentparaguay.com` get its own new `VerticalKey` (it needs one —
  `VerticalKey` entries must be unique per PLAN.md's own note that two doors
  sharing a key is a `verify:seo` violation), or does it map to `alquiler`
  with a locale flag the way `en` maps to `inmobiliaria`'s content?
  Model it on the `realestateinparaguay.com` entry in `verticals.ts` — same
  shape, `ownsListingDetail` reasoning included.
- `alquiler.com.py` currently has no real content written for it anywhere in
  the app (`PLAN.md` line ~274 says as much — the `copy: "rental"` branch is
  declared but never consumed). This build is what finally writes it, driven
  by the old site's real copy, adapted/translated into both `es.ts` and
  `en.ts` namespaces per the i18n rules in `CLAUDE.md`.

## What's real vs. fabricated in the source material — do not skip this

The extraction's `SITE-SUMMARY.md` has the full breakdown. The short version:

- **Real, reusable:** the 7 service pages' copy (rent/apartment-house,
  Airbnb management, apartment management, realtor Asunción, residency
  Paraguay, invest in Paraguay, virtual address), the About Us founder
  story (Anton Marklund), the home page's mission/vision/overview copy,
  contact details (Edificio Skytower, +595 995 628 862 — the email
  `hello@rentparaguay.com` is not real per Anton, a new one goes through
  Resend on the new build).
- **Fabricated theme placeholder — do NOT carry forward as real:** the "For
  Rent" listings page and homepage "Featured Properties" (Brickon demo data,
  Bali/Jakarta addresses, absurd USD prices), the About Us "team" (Teddy
  Lamb / Errol Schultz / Vera Blair + their photos), every testimonial
  site-wide. None of this is a real person, a real listing, or a real quote.

**There is no separate rental-listings feature to build.** The old site
never had real inventory — its whole "For Rent" page was theme demo data.
`alquiler.com.py`'s `filters: { operation: ["alquiler"] }` already narrows
the *existing shared* listings grid/map/category pages
(`src/lib/facet-sql.ts`'s `verticalConds()`) to `operation = alquiler` rows
in the one shared `listings` table — the same mechanism `terreno.com.py`
uses for `property_type: terreno`. This vertical's job is the marketing
shell (home, services, about, contact) plus enabling the door; it is not a
new listings pipeline. Flag in the PR if the shared `listings` table
currently has zero `alquiler` rows to publish against — that's a content/ops
gap for Anton, not something this build should fake data around.

## Build scope

1. `verticals.ts` — new host entry (or entries, per the decision above),
   `enabled: false` until reviewed (flip to `true` in a follow-up once
   Anton has looked at it live).
2. `es.ts` / `en.ts` — new namespace(s) for this vertical's home/services/
   about/contact copy, added to both files in the same commit per the i18n
   rules (`CLAUDE.md`). Translate intent from the old site's English copy
   into natural Spanish for the `.com.py` side; keep the English side close
   to the old copy but clean up the theme-leftover lines called out in
   `SITE-SUMMARY.md` (the "altora" line, the zero-state trust counters, the
   dead "Contact Us" button hrefs).
3. Pages/shell — home, the 7 service pages (or however you choose to
   structure them — a single services hub + detail routes mirrors the old
   site's own IA and is probably right), about, contact.
4. **A real contact/lead form on `/contacto` (or wherever this vertical's
   contact page lands)** — the old site never had one. Wire it through
   Resend per Anton's instruction (not VenderCRM — confirm this is a
   deliberate divergence from the `vendercrm-lead-capture` pattern used on
   his `.com.py` brochure sites, since this is a `propia.node` lead and may
   want to land in the same `leads`/CRM tables the rest of the app already
   has — read `src/lib/crm.ts` before assuming Resend replaces that vs. sits
   alongside it as the notification channel).
5. Imagery — copy the real content images (not the fake-team/testimonial
   ones) from `docs/rentparaguay-extraction/images/` into wherever
   this repo keeps static marketing imagery (check for an existing
   `public/` convention before inventing one; this is ordinary static
   assets, not the R2 listing-photo pipeline in `CLAUDE.md` backlog item 1
   — don't confuse the two). Several images are generic stock, not
   Paraguay-specific — flag which ones in the PR rather than silently
   shipping generic stock photography as this vertical's brand imagery;
   Anton may want these regenerated via the `higgsfield-web-imagery` /
   `webimg-pipeline` skills instead.

## Rules that apply regardless

- `git fetch origin main && git reset --hard origin/main` before branching.
  `claude/<slug>` branch name.
- No `.github/workflows/`. `npm run verify:local` green before every push.
- No *propia* anywhere visitor-facing. No placeholder contact email/phone.
- `npm run db:status` before/after only if you end up touching `schema.ts`
  (you shouldn't need to for this build — flag it if you think you do,
  don't just do it).
- **Open a PR, do not auto-merge.** This is the first real content on a
  brand-new door plus a new `VerticalKey` — structural enough that Anton
  should look at it live before it merges, even though none of it touches
  auth/payments/schema.
- `docs/rentparaguay-extraction/` is scratch material to read from and then
  delete (see step 5) — the images you actually decide to use, placed
  properly (not left in `docs/`), are what belongs in the repo long-term.

## Report back

PR link and state; the `VerticalKey`/domain decision made and why; which
images you used vs. flagged as needing regeneration; whether the shared
`listings` table has any `alquiler` rows today; confirmation `verify:local`
and `verify:seo` are green.
