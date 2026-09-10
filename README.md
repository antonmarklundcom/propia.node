# propia — Paraguay real-estate portal

One Next.js engine, multiple branded doors. **If you are an agent (Claude Code,
Codex), read `AGENTS.md` first** — it is the self-contained rules file and it
governs. Then `ARCHITECTURE.md`, the design contract, and `CLAUDE.md` for the
current state of the world (which domains are live and what each one is for, the
verified backlog); `CLAUDE.md` supersedes the contract wherever they disagree.

**The brand is the domain** — decided 2026-08-16. There is no separate wordmark:
each door is branded as its own domain (`Inmobiliaria Paraguay`,
`Real Estate in Paraguay`, …), declared as `brand` on its vertical in
`src/config/verticals.ts` and read on a public page through `brandName()` /
`brandMeta()` from `src/lib/brand-server.ts`.

## Stack

Next.js (App Router) · TypeScript · Drizzle ORM · MySQL 8 (Hostinger) ·
Cloudflare R2 (images) · MapLibre + OSM (maps) · an optional outbound webhook
for WhatsApp/OTP delivery and CRM push (GoHighLevel, n8n, your own endpoint —
see `.env.example`).

## Local development

```bash
cp .env.example .env          # fill in values
docker compose up -d          # local MySQL 8 on :3306
npm install                   # also installs the git hooks (see CI below)
npm run db:generate           # generate SQL migrations from src/db/schema.ts
npm run db:migrate            # apply them
npm run dev                   # http://localhost:3000
npm run db:studio             # Drizzle Studio — interim admin UI
```

**`tsx` does not read `.env`.** `next` loads it; the jobs below do not, so every
one of them needs the credential exported in the shell first — a script that
appears to hang or connects to nothing is almost always this:

```bash
export DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia"   # bash
$env:DATABASE_URL = "mysql://propia:propia@127.0.0.1:3306/propia"   # PowerShell
```

`DATABASE_URL` should be a **read-only** user in production; the writing runs
below pick `DATABASE_URL_RW ?? DATABASE_URL`, and `DATABASE_URL_RW` never leaves
your machine (see `.env.example` and `AGENTS.md`).

Seeds, then the crons that read what they write:

```bash
npm run seed:financing        # financing_programs — RATES ARE PLACEHOLDERS
npm run seed:locations        # Gran Asunción metro + major cities hierarchy
```

Cron-style jobs (idempotent; also run on a schedule in production):

```bash
npm run cron:fx               # record today's USD→PYG rate (fx_rates)
npm run cron:cuotas           # cache listings.cuota_gs (French amortization)
npm run cron:medians          # market_medians for the current month
npm run cron:geo              # repair listings.display_lat/lng after a centroid moves
npm run cron:translate        # fill listings.title_en/description_en (needs a provider key)
npm run cron:resync           # pause listings whose source feed has gone quiet
npm run cron:sessions         # purge expired session rows
```

**Every job that writes takes `--dry`, and it is not decoration.** The dry form
is the same pass over the same rows as the real one — it reports exactly what the
real run would change and writes nothing:

```bash
npm run cron:cuotas -- --dry              # every job, same flag
npm run cron:resync -- --dry --days=45    # flags come after the --
npm run cron:translate -- --dry --limit 25
```

Order matters twice, and skipping either costs one command's worth of wrong money
or wrong map pins:

```bash
npm run seed:financing && npm run cron:cuotas   # a changed rate leaves stale cuotas cached
npm run seed:locations && npm run cron:geo      # a moved centroid leaves pins at the old spot
```

Each job's body lives in `src/lib/ops/<job>.ts` as `run<Job>({ dry })`, and the
`scripts/*.ts` file is a thin CLI over it — one runner per job, so the operations
page being built on `/admin/operaciones` presses the same code you run here.

White-glove import (M2) — CSV/spreadsheet → pending_review listings:

```bash
npm run import:csv -- data/sample-listings.csv whiteglove --agency=12 --dry
npm run import:csv -- data/sample-listings.csv whiteglove --agency=12
```

`--dry` is `planImport`, the same planner the real run commits, so the preview
cannot drift from what happens. Pass `--agency` every time: it stamps ownership
and scopes the id-space, and without it the listings belong to nobody and their
leads are unattributable.

Re-running the same file is safe: the normalize → dedup → upsert pipeline
(`src/lib/import/`) reports every unchanged row as `unchanged` and never
creates a duplicate. A re-listed property at a slightly different price
collapses onto the existing listing (`deduped`). See
`data/sample-listings.csv` for the expected columns.

Cuota conversion turns normalized `price_usd` into the Gs the financing programs
quote in, using the newest `fx_rates` row that `npm run cron:fx` recorded;
`USD_TO_PYG` (default 7300) is the fallback for a database that job has never
reached, not the primary source.

**Translation providers**, tried cheapest-first by `cron:translate`; any subset
of the three keys may be set and a row falls through to the next configured one:

| Order | Key | Notes |
| --- | --- | --- |
| 1 | `DEEPL_API_KEY` | The free "Developer" tier is a **one-time** 1,000,000-character credit, not a monthly allowance. Run with `--limit`. |
| 2 | `GEMINI_API_KEY` | The intended ongoing path once that credit is spent. `GEMINI_TRANSLATION_MODEL` overrides the default. |
| 3 | `ANTHROPIC_API_KEY` | Last-resort fallback. `ANTHROPIC_TRANSLATION_MODEL` overrides the default. |

With none of them set the job refuses to run and writes nothing — the English
door reads `title_en`/`description_en` straight from the row and shows the
Spanish text until they are filled. Publishing never calls a translation API, so
it cannot be blocked by one being down.

## Hostinger production setup (one-time)

1. **MySQL (free, included in the plan):** hPanel → Databases → MySQL
   Databases → create database + user. Note host/db/user/password →
   `DATABASE_URL`. Enable **Remote MySQL** for your IP if you want to run
   migrations from your machine. Per-database size limit (~3 GB on most
   plans) is a non-issue: 15k listings is tens of MB — photos live on R2,
   never in the DB or on hosting disk.
2. **Node.js app:** hPanel → your site → set up a Node.js application
   (requires a plan with Node.js support — Cloud/Business hPanel plans have
   it; classic PHP-only shared plans do not. If your plan lacks the Node.js
   option, the cheapest fixes are upgrading to Cloud or a small Hostinger
   KVM VPS in the same São Paulo region). Point it at this repo (git
   deploy), build command `npm run build`, start command `npm run start`.
   **After every deploy where `drizzle/` changed, run the migrations against
   the production DB** (`DATABASE_URL=<prod url> npm run db:migrate`, or paste
   the new `drizzle/NNNN_*.sql` into phpMyAdmin), then `npm run db:status`
   again to confirm `No drift`. Deployed code selects every column in
   `src/db/schema.ts`; a DB behind on migrations 500s entire page trees (e.g.
   missing `listings.review_notes` broke every listing detail page after M5).
   CLAUDE.md's "Migrations" section carries the current truth line about which
   `drizzle/*.sql` files are on `main`; PLAN.md's "Pending migration" section is
   historical and stops at 0011. **No file in this repo can say what production
   has actually applied** — a migration pasted into phpMyAdmin records nothing —
   so `db:status` against prod is the only answer.
3. **Domains:** five doors share this app, routed by `middleware.ts` on the
   Host header (an unrecognized host resolves to the canonical primary). As
   of 2026-09-10:
   - `inmobiliaria.com.py` — **live.** The Spanish marketplace primary
     (`family: "marketplace"`, PLAN.md D6).
   - `realestateinparaguay.com` — **live.** Its English translation, same
     app/database; `title_en`/`description_en` still fall back to Spanish
     until `npm run cron:translate` runs against prod.
   - `inmobiliarios.com.py` — **live.** The realtor directory door
     (`family: "directory"`); every marketplace path on it 308s to
     `inmobiliaria.com.py`. It now owns `/agentes`, `/agente/*`,
     `/inmobiliarias`, `/inmobiliaria/*` in Spanish (`ownsDirectory`).
   - `rentparaguay.com` — **live.** The rental business's English door
     (`family: "rental"`); its WhatsApp CTA stays hidden until
     `NEXT_PUBLIC_CONTACT_WHATSAPP` is set.
   - `alquiler.com.py` — **not live: the domain is not purchased.**
     `enabled: true` in code so it can be previewed with a `Host` header and
     checked by `verify:seo`, but there is nothing to point DNS at yet; the
     Spanish half of the rental pair has no real address.
   See CLAUDE.md's domain table for the full detail (ownership, filters,
   `ownsListingDetail`/`ownsDirectory`) before pointing a new one here.
4. **Cron jobs:** hPanel → Cron Jobs → schedule
   `npx tsx scripts/<job>.ts` for each `cron:*` script in `package.json`
   (`cron:fx`, `cron:cuotas`, `cron:medians`, `cron:geo`, `cron:translate`,
   `cron:resync`, `cron:sessions` — see the cron block above). `cron:fx` runs
   before `cron:cuotas`: the cuota is derived from the recorded rate. Run
   `seed:financing` once before `cron:cuotas` and `seed:locations` once before
   `cron:geo` are ever scheduled. Every script is idempotent, and every one of
   them accepts `--dry` if you want to see a schedule's effect before trusting
   it. The same jobs are also becoming buttons on `/admin/operaciones`
   (`fable-plan-ops.md`), so a cron that silently stopped running is visible on
   `/admin` rather than invisible.
5. **R2:** create the bucket in Cloudflare, fill the `R2_*` envs, then map
   `R2_PUBLIC_BASE_URL` to the bucket's own public URL or a custom domain you
   actually own and have mapped in Cloudflare (see `.env.example` — do not
   point it at an unowned placeholder domain).

## Founder-only items — still open

The site is **live** on `realestateinparaguay.com` (Hostinger Node.js app,
domain attached). What follows is founder-only work code cannot resolve —
see CLAUDE.md's domain table and backlog for the full, currently-verified
list; this is the subset that touches production setup:

1. **Real financing rates.** `src/lib/ops/seed-financing.ts` ships PLACEHOLDER
   Che Róga Porã / AFD terms. Verified symptom: a US$160k home currently gets
   no cuota because the placeholder caps (~900M Gs ≈ US$123k) are too low.
   Replace `annualRate`, `maxTermMonths`, `maxAmountGs`, `minDownPct` with the
   current published AFD/MUVH terms, then `npm run seed:financing` +
   `npm run cron:cuotas`. The math is verified correct; only the data is a
   placeholder.
2. **USD→PYG source.** `npm run cron:fx` records the daily rate into `fx_rates`
   from a free API (open.er-api.com, no key) and `src/lib/fx.ts` reads the most
   recent row; `USD_TO_PYG` (default 7300) is only the fallback for a database
   that cron has never reached. Schedule it daily — the free tier itself
   refreshes once every 24 h.
3. **R2 image storage.** The code is complete and gated on `isR2Configured()`
   — see step 5 above. Until the `R2_*` envs are set, imported photos hotlink
   their source URLs instead of living on R2.

## Repo map

```
AGENTS.md                  the rules for any agent — read first, self-contained
ARCHITECTURE.md            the contract — read second
src/db/schema.ts           entire data model (Drizzle, MySQL dialect)
src/config/verticals.ts    domain → vertical routing config
src/lib/indexability.ts    thin-page rule — the ONLY indexability logic
src/lib/cuota.ts           French amortization / financing-program engine
src/lib/crm.ts             CRM boundary — the only file that knows about the
                           optional outbound webhook
src/lib/slug.ts            shared diacritic-safe slugify + joinSlug
src/lib/import/            intake pipeline: normalize → dedup → upsert (M2)
src/lib/ops/               one runner per routine job, shared by the CLI and /admin
src/lib/urls.ts            URL scheme (§4) — canonical build + inbound parse
src/lib/queries.ts         public read queries (listing detail, categories)
src/lib/jsonld.ts          structured data (RealEstateListing, BreadcrumbList…)
src/lib/format.ts          es-PY price/cuota formatting, R2 image URLs
src/lib/sitemap.ts         sitemap entries via getIndexability (single source)
app/propiedad/[slug]/      listing detail page (canonical, JSON-LD, WhatsApp)
app/[operacion]/[...]/     category pages (§4 shapes, indexability enforced)
app/api/leads/             leads → MySQL first, then the optional CRM webhook (crm.ts)
app/sitemap.ts app/robots.ts   SEO surface
src/i18n/es.ts             canonical voseo strings (never neutral Spanish)
src/design/tokens.ts       design tokens v1
middleware.ts              host-header vertical resolution
scripts/                   thin CLIs over src/lib/ops/ (--dry on every writer)
```

## Working rules for Claude Code sessions

**`AGENTS.md` is the rules file** — git and merge gates, the two database
credentials, the verification checklist, and when to stop and ask. It is
self-contained; the notes below are the domain-specific additions that live
closest to the code.

- Milestones and STOP gates are defined in `ARCHITECTURE.md` §6. Do not start
  the next milestone past a gate without founder sign-off.
- No MySQL-only tricks (stored procs, JSON in hot paths) — the Postgres
  escape hatch stays open.
- Indexability decisions go through `getIndexability()` — never duplicated.
- All lead/OTP traffic goes through `src/lib/crm.ts` — nothing else may know
  which CRM is behind it.
- Local-facing copy is Paraguayan voseo from `src/i18n/es.ts`, with an
  `en.ts` peer added in the same commit.
- A routine job's body belongs in `src/lib/ops/<job>.ts`, not in a script. The
  CLI and `/admin` call the same `run<Job>({ dry })` — a second code path for the
  UI is how a preview stops matching what the button does.
