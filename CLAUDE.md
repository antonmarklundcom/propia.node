# CLAUDE.md — current reality of this project

`ARCHITECTURE.md` is the design contract. **This file is the state of the
world.** Where the two disagree, this file wins and ARCHITECTURE.md describes
an intention that has not happened yet. Read both before building.

Last verified against the code: 2026-08-16.

## Domains — read this before touching canonicals, metadata or BRAND_NAME

| Domain | Reality |
| --- | --- |
| `realestateinparaguay.com` | **This app, live, today**, and the current `CANONICAL_HOST` default. Serves the Spanish marketplace. Slated to become the **English** site once `inmobiliaria.com.py` takes over as Spanish primary — its `verticals.ts` entry still says `locale: "es"` and must not be flipped alone (see the flip checklist in PLAN.md D6). |
| `inmobiliaria.com.py` (singular) | **Owned, enabled, and as of 2026-08-16 the Spanish marketplace primary in waiting** — the founder reversed the earlier "his own agency brand only, never wire it in" call (PLAN.md D6). Same app, same database, same `/admin` and `/agencia`. It ships with `ownsListingDetail: false` while both hosts serve identical Spanish rows, so its `/propiedad` pages canonicalise to `realestateinparaguay.com` and its sitemap omits them; every other page type there indexes normally. |
| `propia.com.py` | **NOT owned.** Aspirational only. Still declared (disabled) in `verticals.ts` and referenced throughout ARCHITECTURE.md, README.md and `.env.example` — all of that is a plan, not a fact. `inmobiliaria.com.py` is the `.com.py` domain it was standing in for; do **not** make it the fallback for anything. |
| `inmobiliarios.com.py` (plural) | Not owned. The future agent-directory vertical already declared in `verticals.ts`. Distinct from the singular above — do not conflate them. |
| `*.hostingersite.com` | Hostinger's raw deploy host. Never a canonical target. |

Consequences that bite:

- `siteOrigin()` / `listingCanonicalOrigin()` in `src/lib/origin.ts` emit
  `PRIMARY_ORIGIN` (= `https://${CANONICAL_HOST}`) for any host that is not an
  `enabled` vertical — preview deploys and `*.hostingersite.com` included.
- A host's sitemap only lists URLs that host owns: `app/sitemap.ts` skips
  `/propiedad` entries when `hostOwnsListingDetail()` is false. Keep any new
  host-specific page type on that same rule — submitting a URL you
  canonicalise elsewhere is a Search Console error, not a neutral extra.
- `CANONICAL_HOST` is not just an origin string: `verticals.ts` derives
  `DEFAULT` from it (`VERTICALS[CANONICAL_HOST]`), so it decides the locale,
  filters and copy of every request that arrives without a known host. Moving
  it to `inmobiliaria.com.py` and leaving `realestateinparaguay.com` at
  `locale: "es"` leaves two Spanish primaries; flipping that entry to
  `locale: "en"` + `filters.foreign_exposure` without moving the env var
  silently switches the whole live site to English and filters the listing
  set. **Change the env var and the vertical entries together, never one
  alone** — PLAN.md D6 has the full flip checklist.

## Brand name — DECIDED: the domain is the brand

Resolved 2026-08-16. There is no separate wordmark and no "Homes Paraguay" —
that name is gone from the codebase. **Each host is branded as its own
domain**, declared as `brand` on the vertical:

| Host | Brand |
| --- | --- |
| `realestateinparaguay.com` | Real Estate in Paraguay |
| `inmobiliaria.com.py` | Inmobiliaria Paraguay |

How to read it, and the one mistake to avoid:

- `brandName()` / `brandMeta()` from **`src/lib/brand-server.ts`** — async,
  request-scoped, **correct on every public page**, in `generateMetadata` and
  in the component body alike.
- `BRAND_NAME` from `src/lib/brand.ts` — the CANONICAL_HOST's brand, resolved
  once at module load. Correct **only** on `/admin` and `/agencia` (staff
  surfaces reached on one host), in client components, and in scripts. On a
  public page it pins that page to one domain's name regardless of which
  domain the visitor typed.
- `brand.ts` must never import `next/headers`, directly or transitively:
  `src/i18n/es.ts` imports it and six client components import that. The
  request-scoped half lives in `brand-server.ts` for exactly this reason.
- **The brand suffix on page titles is set once**, as a `title.template` in
  `app/layout.tsx`. A page returns only its own segment (`"Casas en Asunción"`)
  and Next appends `" — <brand>"`. Do not put the brand back into a page's own
  title — it will double. OG titles do *not* inherit the template, so those
  spell the brand out.
- Copy that names the brand is brand-parameterised, not constant:
  `faqSections(brand)`, `esSiteNotice.body(brand)`, `esPrecios.methodBody(brand)`,
  `inquiryPrefillFor(brand, …)`, and friends.
- Still *propia*-flavoured and untouched by this: the session cookie
  (`propia_session`), localStorage keys, and the support email
  `hola@propia.com.py` — **which is on a domain the founder does not own**, so
  every contact path currently dead-ends. Fixing that needs a real mailbox
  from the founder, not a code decision.
- The site is **Spanish-only** for now. Both hosts serve `locale: "es"`; the
  English vertical waits until the Spanish site is finished.

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
2. **`NEXT_PUBLIC_CANONICAL_HOST`** — see the domain trap above. It moves to
   `inmobiliaria.com.py` on flip day, as one item in the PLAN.md D6 checklist,
   never on its own.
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
6. **Financing rates** — `afd_primera_vivienda` (9.00%) in
   `scripts/seed-financing.ts` is a **placeholder**. It feeds
   `npm run cron:cuotas`, which caches `listings.cuota_gs`, which is printed on
   every venta card. Wrong rates = wrong money sitewide. Verifying it against
   published AFD/MUVH terms is a research task, not a code task.
7. **Che Róga Porã is `active: false`** (founder decision, 2026-08-16): it is
   approved per development, not per portal, so quoting it on every venta
   listing implied an eligibility the seller had not established. With only AFD
   active, cuotas are ~19% higher and listings above ~US$107k show no cuota
   line at all (AFD's 700M Gs cap). Applying it to a live database is two
   commands in order — `npm run seed:financing && npm run cron:cuotas` — the
   second clears cuotas still cached from the programme. **Per-project opt-in
   is not built**: it needs a column on `projects` plus an `/admin/proyectos`
   screen that does not exist yet. Flipping `active` back to `true` site-wide
   is NOT the intended path.

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
