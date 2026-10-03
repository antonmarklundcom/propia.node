---
name: propia-dev
description: Project knowledge and guardrails for the Paraguayan real-estate portal in repo antonmarklundcom/propia.node — one Next.js + MySQL app serving several branded domains (inmobiliaria.com.py, realestateinparaguay.com, terreno.com.py, inmobiliarios.com.py, rentparaguay.com, landforsaleparaguay.com, residenciaenparaguay.es). Use EVERY time you write, fix, review or plan work in this repo, or answer questions about it from outside the repo — triggers include "propia", "inmobiliaria", "realestateinparaguay", any of the domains above, listings, /propiedad, leads, /admin, /agencia, cuotas/financing, the import pipeline, verticals/doors, hreflang/canonicals, or Drizzle/Next.js work in this codebase. Pair with nextjs-deploy-hostinger for hosting/env/DB-connection problems — this skill is about the app; that one is about infra.
---

# Propia (the portal) — dev guide

**The repo is the source of truth, not this skill.** Inside a checkout, read
`AGENTS.md` (the rules) and `CLAUDE.md` (the verified state of the world —
domain table, backlog, migrations) before acting. They are updated with every
PR; this skill only carries what is stable and what you need when you are
*not* in a checkout. Where this file and those disagree, they win.

## 1. What it is

- One Next.js 15 App Router app (TypeScript), Drizzle ORM, **one MySQL-compatible
  database (production is MariaDB 11.8, non-strict sql_mode)**, one deployment on
  Hostinger managed Node.js. No staging. **A merge to `main` is a deploy.**
- Several branded **doors** served from the same code and DB, routed by the
  `Host` header. The complete list is `src/config/verticals.ts` — each entry
  carries locale, `filters`, `brand`, `family` and page-type ownership flags.
  - `inmobiliaria.com.py` — Spanish marketplace primary (`CANONICAL_HOST`).
  - `realestateinparaguay.com` — English translation of the same listings.
  - `terreno.com.py` / `landforsaleparaguay.com` — land feeders (es / en).
  - `inmobiliarios.com.py` — realtor directory (lead-gen, not a marketplace).
  - `rentparaguay.com` — rental services (en). `alquiler.com.py` is disabled
    (domain taken by someone else).
  - `residenciaenparaguay.es` — Spanish residency-information content door.
  - `landforsaleinparaguay.com` 308s to `landforsaleparaguay.com`; not a vertical.
- **`propia.com.py` is NOT owned and is gone from the code.** Never use it — not
  as canonical, link, fallback, email or brand. "Propia" must never be visible to
  a visitor, realtor or staff user; it survives only in backend identifiers
  (session cookie, two localStorage keys, docker DB name, package.json name).
- **The brand is the domain** (`brand` on each vertical). Public pages read it
  with `brandName()` / `brandMeta()` from `src/lib/brand-server.ts`; `BRAND_NAME`
  is only correct in /admin, /agencia, client components and scripts.
- **There is no portal email address, on purpose.** `CONTACT_EMAIL` /
  `CONTACT_WHATSAPP` are `string | null` with no fallback. Never add a placeholder.

## 2. Hard rules (from AGENTS.md — each one has already caused a bug or outage)

- `git fetch origin main && git reset --hard origin/main` before branching
  (merges happen via the GitHub API; local main goes stale). Branch `claude/<name>`.
- `npm run verify:local` green before every push (typecheck, build, ~20 pure
  `verify:*` checks). Never `--no-verify`. The pre-push hook is the only CI.
- **Never create `.github/workflows/*`** — Actions minutes are a shared budget;
  the pre-commit hook blocks it.
- **Never merge** anything touching auth, payments or `src/db/schema.ts`. A schema
  PR is titled `MIGRATION REQUIRED — …`. Deployed code selects every schema
  column, so code ahead of the DB 500s every page reading that table.
- **Agents never run migrations on production** and never hold
  `DATABASE_URL_RW`. `DATABASE_URL` for agents is read-only. Cloud sessions can't
  reach production MySQL at all (IP allowlist) — don't try.
- Never edit `src/db/index.ts` (credential handling, pool bounds 6 + 24 queued),
  `drizzle.config.ts`, or DB env handling.
- Never use a Fable-class model for subagents/sessions/workflows without explicit
  approval in the conversation.
- Stop and write to `docs/decisions-needed.md` for founder decisions: money math,
  rates, facts a visitor is told, new brands/domains, user-data policy.

## 3. Conventions that are load-bearing

- **i18n:** no visitor-facing literals in JSX. Add to `src/i18n/es.ts` *and*
  `en.ts` in the same commit. Server: `dict()` from `@/i18n/server`; client:
  `getDictionary(locale)` from `@/i18n`. `src/i18n/index.ts` and
  `src/lib/brand.ts` must never import `next/headers`. English is a peer pitched
  at foreign buyers — translate intent, never invent facts.
- **Listing text on the English door:** `locale === "en" ? (l.titleEn ?? l.title)
  : l.title`. `title_en`/`description_en` are written only by `cron:translate`
  (Gemini → Claude fallback; DeepL removed because it translated place names).
  Never translate in a request or a publish hook.
- **Page titles:** return only the page segment; `app/layout.tsx`'s
  `title.template` appends the brand. OG titles spell the brand out. A page that
  sets its own `openGraph` must pass `images: doorOgImages(brand)`.
- **SEO ownership is data + a check:** `ownsListingDetail`, `ownsDirectory`,
  `ownsCategories`, `ownsSitePages` on each vertical decide canonicals, sitemap
  membership and hreflang (`languageAlternates()` derives it — never hand-write
  hreflang). A sitemap lists only URLs its host owns. `npm run verify:seo` enforces it.
- **Rental URLs** are built only by `rentalPath()`. **Seller page** by `sellerPath()`.
- **Filters:** `src/lib/facets.ts` (pure, shared with clients) and
  `src/lib/facet-sql.ts` (the only place a facet becomes SQL). Door `filters`
  only ever narrow (ANDed). **A cached query filtering by vertical must include
  the vertical key in its cache key** — otherwise one door's listings leak to another.
- **Caching:** every route is dynamic (layout reads Host), so
  `export const revalidate` is dead — don't add it. Use `unstable_cache` with
  tags from `src/lib/cache.ts`; every tag needs a `revalidate*()` call in the
  writing action. Dates come back as strings — re-wrap in the cached wrapper.
  Hot readers go through `singleFlight()`; many-read pages through `loadSections()`.
- **Map coords** are materialized: call `syncDisplayCoords()` after writes to
  lat/lng/location_id. Never `coalesce(listings.lat, locations.lat)` in a query;
  never add `IS NOT NULL` beside `display_lat BETWEEN`.
- **Ops jobs:** one runner per job in `src/lib/ops/<job>.ts` returning
  `OpsResult`; the script and `/admin/operaciones` call the same function; every
  writer takes `--dry` and the dry run is the same pass. Scripts can't call
  `unstable_cache` code — use the `*Raw` uncached sibling.
- **Import:** `dedupKey()` returning `null` without a phone is correct; never
  invent a fallback. Always pass `agencyId`. Dry run and commit share one planner.
- **Alerts never lie:** with no webhook/Telegram/email configured, send nothing
  and log nothing that implies delivery. Missing optional env → degrade quietly,
  document in `.env.example`.
- **"Only module" rule:** most tables have exactly one module that touches them
  (e.g. `reviews.ts`, `inbox.ts`, `lead-assignments.ts`, `listing-duplicates.ts`).
  Find it in CLAUDE.md's backlog before writing a second query path. Lead
  attributes like contact role, channel and publisher kind are *derived* (SQL
  CASE / `leads.utm`), never new columns.

## 4. Environment facts

- `tsx` does not read `.env` — export `DATABASE_URL` in the shell first.
- Local DB: `docker compose up -d` (or a `mariadb:11.8` container, closer to
  prod), then `npm run db:migrate`, `DATABASE_URL=mysql://propia:propia@127.0.0.1:3306/propia`.
- `npm run db:status` = pending migrations + schema drift vs `information_schema`.
  `No drift` is the only green. Run before merging any schema PR and after migrate.
- `NEXT_PUBLIC_*` is inlined at build — changing it in hPanel needs a rebuild.
- Leads are stored in the portal DB (`leads`) **and** copied to VenderCRM by
  `deliverLead()` (`VENDERCRM_BASE_URL` + per-door `VENDERCRM_KEY_<DOOR>`).
- Images: R2 code is complete and waits on the founder's bucket (`R2_*`).
  Don't rebuild it; `backfill:images` exists too.
- Email: Cloudflare Email Sending from `mail.inmobiliaria.com.py`
  (`CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_EMAIL_TOKEN`); see the cloudflare-email skill.
- Hourly `/api/cron/tick` runs translate/geo/sessions/digests; it deliberately
  does not run `cron:fx`, `cron:cuotas`, `cron:resync` or `backfill:images`.

## 5. Things that are deliberately NOT done (don't "fix" them)

- Financing rate `afd_primera_vivienda` is a placeholder; Che Róga Porã is
  `active: false` on purpose. Money math is a founder decision.
- No `db:push`. No GitHub Actions. No portal email. No JSON-LD `aggregateRating`.
- FSBO publishers get no `agents` row. No `leads.source` / partner column on leads.
- Category pages under the listing-count threshold are noindex — except the
  evergreen pages listed in `src/content/evergreen/index.ts`.

## 6. Giving Claude Code a task in this repo

- Name the route/component if known; say whether merging is allowed for this unit.
- Remind it: reset to origin/main, `verify:local` before push, PR not merge for
  auth/payments/schema, and say in the PR what was not verified (e.g. no Docker,
  `verify:scopes` not run).
- After merge: check `docs/log/<phase>.md` for the commands the founder still
  has to run (migrations, `--dry` then real cron runs, hPanel env vars).
