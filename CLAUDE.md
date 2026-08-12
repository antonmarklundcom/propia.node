# CLAUDE.md — current reality of this project

`ARCHITECTURE.md` is the design contract. **This file is the state of the
world.** Where the two disagree, this file wins and ARCHITECTURE.md describes
an intention that has not happened yet. Read both before building.

Last verified against the code: 2026-08-02.

## Domains — read this before touching canonicals, metadata or BRAND_NAME

| Domain | Reality |
| --- | --- |
| `realestateinparaguay.com` | **This app, live, today.** Serves the Spanish marketplace. This is the only production host. |
| `propia.com.py` | **NOT owned.** Aspirational only. It is hardcoded as the `CANONICAL_HOST` default in `src/config/verticals.ts` and appears throughout ARCHITECTURE.md, README.md and `.env.example` — all of that is a plan, not a fact. |
| `inmobiliaria.com.py` (singular) | Owned by the founder, for his **own individual estate agency brand**. NOT this marketplace. Never wire it into this app. |
| `inmobiliarios.com.py` (plural) | Not owned. The future agent-directory vertical already declared in `verticals.ts`. Distinct from the singular above — do not conflate them. |
| `*.hostingersite.com` | Hostinger's raw deploy host. Never a canonical target. |

Consequences that bite:

- `siteOrigin()` / `listingCanonicalOrigin()` in `src/lib/origin.ts` emit
  `PRIMARY_ORIGIN` (= `https://${CANONICAL_HOST}`) for any host that is not an
  `enabled` vertical. With the shipped config that means the live site
  advertises canonicals on a domain that does not resolve.
- `CANONICAL_HOST` is not just an origin string: `verticals.ts` derives
  `DEFAULT` from it (`VERTICALS[CANONICAL_HOST]`). Pointing it at
  `realestateinparaguay.com` while that entry still says `locale: "en"` +
  `filters.foreign_exposure` silently switches the whole live site to English
  and filters the listing set. **Change the env var and the vertical entry
  together, never one alone.**

## Brand name — UNDECIDED, do not "fix" it piecemeal

`src/lib/brand.ts` exports `BRAND_NAME = "Homes Paraguay"`. The architecture,
domain plan, session cookie (`propia_session`), localStorage keys and support
email (`hola@propia.com.py`) all say *propia*. This is an unfinished rebrand,
and **the founder has not picked the final name** — partly because
`propia.com.py` is not owned.

Until he decides:

- Do **not** mass-rename to either name.
- **Do** route every user-visible occurrence through `BRAND_NAME` so the
  eventual decision is a one-line change. Hardcoded `"Homes Paraguay"` string
  literals still exist in `src/i18n/es.ts` and several `app/admin/*` and
  `app/**/page.tsx` metadata titles — those are the debt to clear.
- The site is **Spanish-only** for now. The English vertical waits until the
  Spanish site is finished.

## Import pipeline — read before touching intake or dedup

Two intakes exist and they are different products, not two versions of one:

| Path | What it is |
| --- | --- |
| `/agencia/importar` | An agent pastes a link to **their own** listing, attests to it, gets a draft. One page, structured data only, no per-site selectors. |
| `/admin/importar` | Super-admin uploads an agency's spreadsheet (.csv/.xlsx), previews, commits, can roll the whole batch back. |

Rules that are load-bearing:

- **`dedupKey()` returns `null` when there is no contact phone, and that is
  correct.** The key is bucketed (5k USD, 10 m²) so a re-listed flat still
  collapses; the phone is the only thing stopping those buckets from describing
  every unit in a building. A phone-less batch used to fold twenty flats into
  one and report success. Never "fix" the null by inventing a fallback key.
- **`listing_sources.scope_agency_id` is `NOT NULL DEFAULT 0`, 0 = unscoped.**
  It is half of `uq_source`; MySQL treats NULLs in a unique index as
  all-distinct, so making it nullable silently switches off the "re-importing
  the same file changes nothing" guarantee. Both `dedupKey()` and the
  external-id lookup are scoped by it.
- **Always pass an agency.** `importListings({ agencyId })` stamps ownership;
  without it the listings belong to nobody and their leads are unattributable.
  The CLI warns when you omit `--agency`.
- **The dry run and the commit share one planner** (`planImport` /
  `commitImport`). Do not add a separate validation path — it will drift from
  what actually runs, and the preview is the only reason the feature is safe.
- Every batch writes `import_jobs` + `import_rows`, with the pre-update values
  in `previous_json`. That is what makes rollback real rather than a delete.
- Permission is a **column**, and `commitImportAction` refuses to write without
  it. Scraping a competitor's catalogue wholesale is the thing this must not
  become; the gate is in the server action, not the form.

Verify with `npm run verify:import` (pure checks, no DB). With a local database
up it also exercises plan → commit → re-run → rollback:
`docker compose up -d && npm run db:migrate && DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia" npm run verify:import`

`npm run cron:resync` pauses listings whose sources have gone quiet (30 days by
default, `--dry` first). It records itself as a revertible import job.

## Backlog state (verified, not remembered)

1. **R2 image storage** — code is complete (`src/lib/r2.ts`,
   `src/lib/listing-images.ts`, both photo panels gate on `isR2Configured()`).
   Blocked purely on the founder creating the Cloudflare account/bucket and
   setting `R2_*` env vars. **Do not build around it or re-implement it.**
2. **`NEXT_PUBLIC_CANONICAL_HOST`** — see the domain trap above.
3. **Individual agent profile pages** — done (`/agente/[slug]`, PR #32,
   2026-07-31). Mirrors `/inmobiliaria/[slug]` (PR #28): same indexability
   rule, same DB-backed no-static-cache pattern. `app/agente/[slug]/page.tsx`.
4. **Reviews/ratings** — does not exist. Needs a migration and a moderation /
   anti-fake-review design. **Ask the founder before starting.**
5. **Import image pipeline** — **not built, on purpose.** `syncImages()` writes
   the *remote source URL* into `listing_images.r2_key` as an interim, and
   `imageUrl()` passes it through while `R2_PUBLIC_BASE_URL` is unset. Fetching,
   deduping, WebP-converting and resizing imported photos waits on backlog item
   1 above. **Do not build a stub around it** — the R2 code is written.
6. **Financing rates** — `che_roga_pora` (6.50%) and `afd_primera_vivienda`
   (9.00%) in `scripts/seed-financing.ts` are **placeholders**. They feed
   `npm run cron:cuotas`, which caches `listings.cuota_gs`, which is printed on
   every venta card. Wrong rates = wrong money sitewide. Verifying them against
   published AFD/MUVH terms is a research task, not a code task.

## Working agreements with the founder

- **Autonomous build + merge is authorised** for well-verified, low-risk work
  (CSS, UI, copy, docs). Zero live users, everything git-revertible.
- **Flag before merging** anything touching auth, payments, or the DB schema.
- **Always** `git fetch origin main && git reset --hard origin/main` before
  branching. Merges happen through the GitHub API, so local `main` goes stale
  and a merged PR can look "missing". This has already cost a session.
- Verify with `npx tsc --noEmit` **and** `npm run build` before merging;
  Hostinger auto-deploys `main` with no staging environment.
- Branch naming: `claude/<feature-name>`.
