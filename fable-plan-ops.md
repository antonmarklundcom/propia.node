# fable-plan-ops.md — run the site from `/admin`, Claude Code and Codex

Written 2026-09-10 by the Fable session that produced the operations report
(session `018ygaT7…`). Method: `phased-autonomous-build`, two sessions only —
**one Opus session** runs O1 then O2, **one Sonnet session** runs S1, S2, S3
after Anton has merged O2 and migrated. `CLAUDE.md` beats this file on
conventions. Fable is never an executor of any phase here.

## Why this plan exists

Today every routine job (`cron:*`, `seed:*`, `import:csv`, `backfill:images`)
is a `tsx` script that only runs from a PC whose IP is allowlisted in hPanel
Remote MySQL, with the **write** credentials exported in the shell. A cloud
agent cannot reach production at all; Anton needs a terminal for a nightly
job; three scripts have no `--dry`; `db:push` is one env var away from prod;
and Codex reads none of `CLAUDE.md`. The split this plan installs:

| Plane | Who | How |
| --- | --- | --- |
| Code | Claude Code, Codex | branch → `verify:local` → PR. Anton merges (= deploy). |
| Data and daily operations | Anton, as superadmin in `/admin` | buttons with dry-run preview, confirm, `ops_runs` audit row |
| Infra | Anton | hPanel env vars + rebuild, DNS, `db:status` → `db:migrate` → `db:status` |

## Phase table

| Phase | Model | Prompt | Owns | Merge rule |
| --- | --- | --- | --- | --- |
| O1 guardrails + shared `AGENTS.md` | Opus | `prompts-ops/opus-ops.md` (part 1) | `AGENTS.md` (new), `CLAUDE.md` (import line + migration truth line), `.env.example`, `README.md`, `package.json` scripts, `scripts/*.ts` (`--dry` only), `src/lib/ops/` (new, job functions extracted from scripts), `docs/log/o1-ops.md` | **merge when green** — docs, script flags, no schema, no `src/db/**` |
| O2 operations page + health panel | Opus | `prompts-ops/opus-ops.md` (part 2) | `src/db/schema.ts` (`ops_runs`, `posts.locale`, `site_settings`), one `drizzle/*.sql`, `app/admin/operaciones/**`, `app/admin/page.tsx` (health section), `app/admin/tabs.ts`, `src/lib/ops/**`, `src/lib/health.ts`, `esPanel` keys, `docs/log/o2-ops.md` | **PR only, never merged by a session** — schema; Anton runs `db:status` before and after `db:migrate` |
| S1 financing + FX editors | Sonnet | `prompts-ops/sonnet-ops.md` (part 1) | `app/admin/financiamiento/**` (new), `app/admin/tabs.ts`, `esPanel` keys, `docs/log/s1-ops.md` | merge when green |
| S2 guides: locale + markdown import | Sonnet | `prompts-ops/sonnet-ops.md` (part 2) | `app/admin/guias/**`, `app/guias/**` (locale filter), `scripts/posts-upsert.ts` (new), `docs/log/s2-ops.md` | merge when green |
| S3 site settings + deploy visibility + audit view | Sonnet | `prompts-ops/sonnet-ops.md` (part 3) | `app/admin/configuracion/**` (new), `src/lib/settings.ts` (new), consumers of `CONTACT_WHATSAPP`/`CONTACT_EMAIL`, `app/admin/operaciones/historial`, `docs/log/s3-ops.md` | merge when green; last phase, STOP |

Order is strict. S1–S3 branch from a `main` that contains O2 **and** on which
Anton has confirmed `npm run db:status` prints `No drift`.

## §1 Decisions already made — do not re-litigate

1. Every rule in `CLAUDE.md`: i18n through the dictionary, cache tags with
   writers, facets layer, no `.github/workflows/`, brand via `brandName()`,
   no *propia*, no placeholder email, `syncDisplayCoords()` after coordinate
   writes.
2. **One runner per job, shared by CLI and UI** — the `/admin/importar` rule
   (`planImport`/`commitImport`) applied to every job. O1 moves each script's
   body into `src/lib/ops/<job>.ts` exporting
   `run<Job>(opts: { dry: boolean; limit?: number }): Promise<OpsResult>`;
   the `scripts/*.ts` file becomes a thin CLI over it. O2's buttons call the
   same function. A second code path for the UI is forbidden.
3. **`--dry` on every writing script**, including `cron:cuotas`,
   `cron:medians`, `cron:sessions`, `seed:financing`, `seed:locations`,
   `seed:guias-en`, `import:csv`. The dry form prints exactly what the real
   form would change, with counts. `OpsResult` is `{ job, dry, counts:
   Record<string, number>, notes: string[], durationMs }`.
4. **`db:push` is removed from `package.json`.** Migrations are files.
   `db:migrate` stays, human-run, per PLAN.md D11(b).
5. **Agents never merge, never migrate prod, never hold the write DB user.**
   `AGENTS.md` says so. The line in `CLAUDE.md` ("Autonomous build + merge is
   authorised…") is replaced by a pointer to `AGENTS.md`; this plan's phase
   table is the only place autonomous merge is granted, per phase.
6. **`AGENTS.md` is the rules file; `CLAUDE.md` imports it.** `CLAUDE.md`
   keeps the domain table, backlog, i18n/caching/facets/geo sections and
   history; its "Working agreements" section becomes `@AGENTS.md`. Codex reads
   `AGENTS.md` natively. No `.codex/` directory, no `.claude/settings.json`.
7. **One migration in this plan, in O2**, carrying all three schema changes:
   `ops_runs`, `posts.locale` (`enum('es','en') NOT NULL DEFAULT 'es'`),
   `site_settings` (`key varchar(60) PK, value text, updated_at, updated_by`).
   S1–S3 add no columns. If a Sonnet phase believes it needs one, it stops.
8. **Every operations button is superadmin-only** (`requireSuperAdmin()`,
   `src/lib/auth/guards.ts:36`), runs in a server action with `dry: true`
   first, shows the `OpsResult`, and only a second explicit click runs
   `dry: false`. Both clicks write an `ops_runs` row (`job, dry, started_by,
   started_at, finished_at, ok, result_json`). Long jobs (`translate`,
   `backfill:images`) take a mandatory `limit`.
9. **Health is computed, not stored.** `src/lib/health.ts` answers, uncached
   or `unstable_cache` with a 5-minute TTL and no tag: pending migrations and
   drift (reuse `scripts/check-migrations.ts` logic, moved to
   `src/lib/ops/migrations.ts`, `--probe` excluded from the UI), published
   listings with no position (`countListingsWithoutPosition`), with no photo,
   with no `title_en`, leads with `routed_to = ''`, last `ops_runs` row per
   job, deployed commit (`process.env.HOSTINGER_GIT_COMMIT ?? git rev-parse`
   at build time via `next.config.ts` `env`, whichever O2 finds works).
10. **Site settings override env, never replace it.** `getSetting(key)` in
    `src/lib/settings.ts` returns the DB value if set, else the existing env
    constant. `NEXT_PUBLIC_*` stays for build-time consumers; S3 only moves
    the two contact values and the per-door tagline behind it.
11. **Financing editor writes `financing_programs` and then calls
    `runCuotas({ dry: false })`** in the same action, because a saved rate
    with stale cuotas is wrong money on every card (`CLAUDE.md` backlog 6).
    The editor shows the dry-run diff of cuotas before saving.
12. **Read-only DB user is Anton's task (§7), not code.** `AGENTS.md`
    documents `DATABASE_URL` (read-only, for `db:status` and `--dry`) and
    `DATABASE_URL_RW` (never given to an agent). Scripts read
    `DATABASE_URL_RW ?? DATABASE_URL` only when `dry` is false.

## §2 Scope

In: the five phases above. Out, parked in §8: reviews, D10 import-vs-manual
edits, R2 backfill UI (waits on the bucket; the runner is built in O1, the
button in O2 is disabled until `isR2Configured()`), ESLint (Q4), package
manager (Q1), owner notifications.

## §3 Autonomy protocol

`fable/plan.md` §4 applies verbatim: reset to `origin/main` before every
branch; `npm run verify:local` before every push; minor findings go to
`fable/KNOWN-ISSUES.md`; stop on auth, payments, schema outside O2, or any
founder decision, and write the question to `docs/decisions-needed.md`. Each
phase ends with `docs/log/<phase>-ops.md` (what landed, what was not
verified, exact commands Anton runs) and a §9 entry here.

## §4 Opus phases

### §4.1 O1 — guardrails and the shared rules file

1. `AGENTS.md` at repo root, content from the report's draft (facts, git and
   deploy, environment and database, before-claiming-done), corrected against
   the code as of the branch. `CLAUDE.md`'s "Working agreements with the
   founder" section is replaced by `@AGENTS.md` plus one sentence.
2. `CLAUDE.md` gains, under "Migrations", a dated truth line: which
   `drizzle/*.sql` files are on `main` past 0011 (0012 `fx_rates`, 0013
   `lead_matches` + `agents.*`) and that only `db:status` against prod can
   say whether they are applied. `PLAN.md`'s "Pending migration" heading gets
   a one-line banner: historical, superseded by that line.
3. `.env.example`: `NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py`; delete
   the "only production domain" sentence; add `DATABASE_URL_RW` with the
   one-paragraph explanation from §1.12.
4. `README.md`: brand is decided; `export DATABASE_URL=…` before any `tsx`
   script (`next` loads `.env`, `tsx` does not); translation providers list;
   cron list unchanged.
5. `package.json`: remove `db:push`; add `posts:upsert` placeholder is **not**
   added (S2 adds it).
6. `src/lib/ops/`: one file per job — `cuotas.ts`, `medians.ts`, `geo.ts`,
   `fx.ts`, `resync.ts`, `translate.ts`, `sessions.ts`, `backfill-images.ts`,
   `seed-financing.ts`, `seed-locations.ts`, `import-csv.ts` — each exporting
   `run<Job>(opts)` returning `OpsResult` (`src/lib/ops/types.ts`). Scripts
   become CLIs over them, `--dry` everywhere, output unchanged in shape where
   docs quote it. `scripts/check-migrations.ts`'s read-only half moves to
   `src/lib/ops/migrations.ts`; `--probe` stays in the script.
7. Exit: `npm run verify:local` green; `npm run cron:cuotas -- --dry` and
   every other script's `--dry` run against a local Docker DB (or, in a
   sandbox with no Docker, documented as not run); `grep -rn "db:push"
   package.json README.md` empty; `AGENTS.md` and `CLAUDE.md` agree on every
   host; PR merged green.

### §4.2 O2 — operations page, health panel, one migration

1. Schema (§1.7), `npm run db:generate` → one `drizzle/0014_*.sql`. PR title
   starts `MIGRATION REQUIRED —`.
2. `app/admin/operaciones/page.tsx`: one card per job in `src/lib/ops/`:
   description (from `esPanel`), last run (from `ops_runs`), a `limit` input
   where §1.8 requires one, "Simular" (dry) → result table → "Ejecutar".
   Server actions in `actions.ts`, each guarded by `requireSuperAdmin()`,
   each writing `ops_runs`. R2 backfill card disabled with a reason until
   `isR2Configured()`. `db:migrate` is **not** a button.
3. `app/admin/page.tsx`: a "Salud" section from `src/lib/health.ts` (§1.9),
   each line linking to the page that fixes it. `app/admin/tabs.ts` gets
   `/admin/operaciones` in `manage`.
4. Cache: a job that changes listing data calls the matching `revalidate*`
   helper from `src/lib/cache.ts` after `dry: false`; the CLI path already
   could not (no cache handler), so the UI path is the one that must.
5. `docs/log/o2-ops.md` includes the exact runbook: `db:status --probe` →
   `db:migrate` → `db:status`, and the fact that `main` must not carry O2's
   code before the migration is applied (deployed code selects every column).
6. Exit: `verify:local` green; `verify:scopes` run if a local DB exists;
   PR open, **not merged**; §9 entry; the Opus session stops.

## §5 Sonnet phases

### §5.1 S1 — financing programs and FX rate editors

`app/admin/financiamiento/page.tsx`: table of `financing_programs` with
inline edit of `annual_rate`, `max_term_months`, `max_amount_gs`,
`min_down_pct`, `active`; save action validates with zod, writes, records who
changed it in `ops_runs` (`job: "financing.edit"`), then runs
`runCuotas({ dry: false })` and shows the counts (§1.11). Below it: the
latest `fx_rates` row, a manual override form that inserts a row with
`source: "manual"`, and a "Recalcular cuotas" that is the same button as the
operations page. Copy in `esPanel` only (staff surface, Spanish). Exit:
`verify:local` green; a rate change on a local DB is followed by changed
`cuota_gs` values; PR merged green.

### §5.2 S2 — guides with a locale, and posts from markdown

`posts.locale` (added in O2) is set in the `/admin/guias` editor (default
`es`), filtered in `app/guias/**` and the sitemap by the door's locale, and
read by the English home's three guide links. `scripts/posts-upsert.ts`
(`npm run posts:upsert -- path/to/file.md --dry`): front matter `slug, title,
locale, excerpt, status`, body markdown → the same upsert `seed-guias-en.ts`
uses; `seed-guias-en.ts` is rewritten to call it with three markdown files
under `content/guias/en/`. `revalidateGuides()` after a write. Exit:
`verify:local` and `verify:seo` green; an English post no longer appears on
`inmobiliaria.com.py` (checked with a `Host` header locally); PR merged.

### §5.3 S3 — site settings, deploy visibility, run history

`src/lib/settings.ts` (§1.10) with `getSetting(key)` cached under a
`settings` tag and `revalidateSettings()` called by the save action.
`app/admin/configuracion/page.tsx` edits `contact_whatsapp`,
`contact_email`, and `tagline_<verticalKey>`; `src/config/contact.ts`
consumers (footer, `/contacto`, JSON-LD, `NewsletterSignup`) read through
`getSetting` with the env constant as fallback. `/admin/operaciones/historial`
lists `ops_runs` newest first with filters by job and by user. The health
section shows the deployed commit and build time. Exit: `verify:local` green;
changing the WhatsApp number in `/admin/configuracion` changes the footer
without a rebuild (local check); PR merged; STOP.

## §6 Prompts

Two files. `prompts-ops/opus-ops.md` — paste into one fresh **Opus** session;
it runs O1 (merges it) then O2 (PR only) and stops.
`prompts-ops/sonnet-ops.md` — paste into one fresh **Sonnet** session after
Anton has merged O2 and `db:status` is clean; it runs S1, S2, S3 in order.

## §7 Human-inputs checklist (Anton)

- [ ] Create a **read-only MySQL user** in hPanel (SELECT on
      `u210059163_propia`), allowlist the PC's IP for it. This becomes the
      agents' `DATABASE_URL`; keep the owner user as `DATABASE_URL_RW` on your
      own machine only.
- [ ] Run `npm run db:status` against prod **now** (before O2) and paste the
      output into `docs/log/o1-ops.md`'s "prod state" line or into the O2 PR.
      0012/0013 are on `main`; nobody has recorded whether they are applied.
- [ ] Merge O2, then `db:status --probe` → `db:migrate` → `db:status`.
- [ ] hPanel: `NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py`, rebuild
      (`CLAUDE.md` backlog 2 — still open).
- [ ] hPanel Cron Jobs: schedule the `cron:*` scripts nightly
      (`PLAN.md:477` is still unticked); after O2 the same jobs are also
      buttons, so a missed cron is visible on `/admin`.
- [ ] Answer Q1 (package manager) and Q4 (ESLint) in `fable/REVIEW.md`.

## §8 Things the operations report did not cover — decide, then build

- **Backups.** No `mysqldump`, no schedule, no restore test is mentioned
  anywhere in the repo (grep over `*.md` and `*.ts` for `backup`,
  `mysqldump`: nothing). Hostinger's daily backup is the only copy of every
  listing and lead. Minimum: a weekly `mysqldump` from the PC to an
  off-Hostinger location, and one documented restore.
- **Error visibility.** No error tracker (`sentry`, uptime: nothing). A
  `Digest:` page is invisible until someone visits. Cheapest: UptimeRobot on
  the four doors plus `/api/health` (returns `db:status` drift count), and
  the `LEAD_WEBHOOK_URL` alert channel for `ops_runs.ok = false`.
- **Superadmin account hardening.** Password only today; the operations page
  makes that account able to rewrite every cuota and pause every listing.
  Two-step login or at least an IP note in `ops_runs` before S3 ships.
- **Analytics and Search Console** per door — not in the repo at all.
- **Owner notification on a lead** (`CLAUDE.md` backlog 8): after S3 the
  settings table can hold the operator's WhatsApp, which is half of it.
- **`preview` doors**: `*.hostingersite.com` must stay `noindex`; verify
  after the canonical host env change.

## §9 Build log & handoff

- 2026-09-10 — plan written (Fable). No phase started.
- 2026-09-10 — **O1 landed** (`claude/ops-o1-guardrails`, `docs/log/o1-ops.md`).
  Eleven jobs now have one runner each in `src/lib/ops/` (`run<Job>(opts) →
  OpsResult`), every writing script takes `--dry`, and `scripts/*.ts` are thin
  CLIs over them. `AGENTS.md` is the self-contained rules file; `CLAUDE.md`'s
  "Working agreements" is `@AGENTS.md` and its "Migrations" section carries the
  0012/0013 truth line. `db:push` removed; `DATABASE_URL` / `DATABASE_URL_RW`
  split implemented in `scripts/db-credential.ts` and documented in
  `.env.example`; `README.md` corrected (brand decided, `export DATABASE_URL`
  before any tsx script, the three translation providers, `cron:fx` in the cron
  list). **Deviation:** `src/lib/fx.ts` and `scripts/verify-import.ts` were
  touched, outside §4.1's file list — three documented commands (`import:csv`,
  `verify:import`'s DB half, and `verify:scopes`) were dying on `Invariant:
  incrementalCache missing` and O1's own exit criteria could not be met without
  the fix. `verify:scopes` now runs green end to end for the first time since
  2026-09-05. Verified against a local MariaDB 10.11 (Docker Hub is blocked in
  the sandbox, so `mysql:8.4` could not be pulled); `cron:fx --dry` could not
  reach its rate API and is the one job not exercised end to end.
  **O2 looks first at** `src/lib/ops/types.ts` (`OpsJob` is the `ops_runs.job`
  registry) and `src/lib/ops/migrations.ts` (`readDatabaseStatus()` /
  `driftCount()` are the health panel's numbers, already computed). No runner
  calls a `revalidate*` helper — that is the O2 action's job, per §4.2 item 4.
