# Next-work plan — 2026-09-19

Written for a **Sonnet 5 manager leading Codex CLI (`gpt-6-astra`, effort low)**. It is the
current queue: it supersedes `CODEX-PLAN-onboarding-2026-09.md` (all of it shipped in #144)
and any list of open work in `PLAN.md`, which is history.

**How it was made.** Two read-only Codex audits of `main` @ `2c8a135`, both `gpt-6-astra`
effort low (model and effort read from the session logs): code health
(`01a0ba18-8893-7520-bb5b-bb6aa0975f90`) and documentation-versus-reality
(`01a0ba18-8f5e-75d1-951d-ba711c656779`). Neither changed a file. The manager re-checked
the claims below against the code before writing them down: A1, A2, A4, A7, A8, A10, the
missing `app/sitemap.ts`, the existing D3 matching, and migrations 0012 to 0014. Everything
here is read from source; nothing was run against production, so "live" status is unknown.

## 0. Rules for every task

- Each task: `git fetch origin main && git reset --hard origin/main`, branch
  `claude/<name>`, one PR. Codex writes the code at effort low; the manager runs
  `npm run verify:local` itself (Codex's copy fails on this machine because
  `verify:import` runs out of memory in its sandbox), compares `git diff --stat` to the
  task's file list, reads the diff, and greps added lines for mojibake.
- Never `--no-verify`, never `.github/workflows/`, never run a migration.
- **Agents never merge.** No plan or founder instruction authorises an agent merge yet, so
  every PR is opened and left for Anton. Tasks marked SENSITIVE (auth, leads, notifications)
  must say so in the PR title.
- A task that turns out to need a founder decision (AGENTS.md section 6) stops and asks.
- The normal tier is the only tier used. If a task fails audit twice, stop and report the
  exact error and session id. Never escalate to high on the manager's own judgment.
- Order matters where noted: tasks that edit `src/i18n/*` are serialised, reset to
  `origin/main` between them.

## 1. Already done: do not schedule again

The audits confirmed these are in `main`. Re-dispatching any of them wastes a run.

- Onboarding fixes, including the inventory-aware home tiles and 404 suggestions (#144).
- D3 realtor matching (`src/lib/matching.ts`, `app/admin/leads/MatchPanel.tsx`, migration 0013).
- Image backfill pipeline (fetch, WebP convert, resize, upload): `src/lib/ops/backfill-images.ts`.
  It runs only once R2 exists, and has defects listed in W1.
- English agent-profile copy, home `<title>` tagline, header and menu label localisation.
- Owner lead notification (#157) and deferred tasacion CRM push (#156).

## 2. Task list

Size: S = under 30 lines, M = one to three files, L = larger. All at normal tier.

### Wave 0 — records match reality (docs only, no runtime risk)

**T1. Documentation truth pass (S-M, one PR).** Files: `CLAUDE.md`, `AGENTS.md`,
`README.md`, `fable/KNOWN-ISSUES.md`. Fix only what the audit proved wrong:

- `app/sitemap.ts` is gone; the serving code is `app/sitemap.xml/route.ts`,
  `app/sitemap/[chunk]/route.ts` and `src/lib/sitemap-xml.ts` (CLAUDE.md Domains, README repo map).
- CLAUDE.md backlog #5 and AGENTS.md section 7: the import image pipeline is written
  (`src/lib/ops/backfill-images.ts`), only its execution waits on R2.
- CLAUDE.md #6: the AFD placeholder lives in `src/lib/ops/seed-financing.ts`; cuotas print
  only when an estimate exists and the door shows them (the English marketplace suppresses them).
- CLAUDE.md #11: D3 (schema, `lead_matches`, ranking, "match 3" UI) is built; only the
  hand-off to the realtor stays manual.
- CLAUDE.md Migrations: three migrations past 0011, not two (0014 adds `ops_runs`,
  `site_settings`, `posts.locale`).
- Rental redirects are 308 (`permanent: true` in `next.config.ts`), not 301, in AGENTS.md
  section 4 and both rental rows of the CLAUDE.md domain table.
- `cron:translate` refuses to run for real without a provider key but a `--dry` run works
  without one; Gemini alone is a valid provider (CLAUDE.md, README).
- README: eight vertical entries, seven enabled (not "five doors"); `/admin/operaciones`
  exists; use `npm run cron:<name>` not `npx tsx scripts/<job>.ts`; the 700M Gs AFD cap and
  10% down payment; CLI cron runs do not write panel run history.
- CLAUDE.md i18n: more than `SearchBar` is a client consumer of the dictionary (ContactForm,
  LeadForm, PriceAlert, ValuationTool, VenderForm, PublishWizard, DirectoryLeadForm); English
  uses `satisfies Dictionary`, Spanish defines the contract with `as const`.
- AGENTS.md sections 2 and 4: `verify:import` runs a database half when a local URL is set;
  `user:create` has no `--dry` (until T12); `db:migrate` reads `DATABASE_URL` directly, not `_RW`.
- `fable/KNOWN-ISSUES.md`: close the tagline, header/menu label and agent-profile entries
  (fixed, see section 1); narrow the panel/publish/owner entry (publish now has `enPublish`;
  panel and owner stay Spanish by decision, `fable-plan-quality.md`).
- **Do not touch** the AGENTS.md sentence that Hostinger auto-deploys `main` until Anton
  answers F1 in section 4: the docs contradict each other and only he knows.
- Also bump the "Last verified" date in CLAUDE.md. Acceptance: docs only (`git diff --stat`
  lists the four files), `verify:local` green.

**T2. Repo hygiene (S).** Add an ARCHIVED banner as the first line of
`fable-plan-premium-fix.md` and `fable-plan-site-quality-2026-09-13.md` (superseded by
completed C1-C4 work; `fable-plan-polish.md:80` still says the hub WebPs are blocked but
`public/img/hub-venta.webp` is tracked, so fix that line too). Add one line to `PLAN.md`
saying open work now lives in this file. The two untracked root files
(`AUDIT-onboarding-2026-09.md`, `CODEX-PLAN-onboarding-2026-09.md`) are historical: Anton
deletes them or lets T2 add them under `docs/archive/` (his call, F6). Local stale branches
`claude/onboarding-*` hold nothing unique and can be deleted with `git branch -D`.

### Wave 1 — fixes with no auth, payments, schema, leads or notifications

Each is independent unless noted. Codex must re-locate the cited lines first (they were read
on `2c8a135`).

**T3. Harden the image backfill (M).** Files: `src/lib/ops/backfill-images.ts`,
`src/lib/safe-fetch.ts` (read; extend only if needed). Problems: the job calls a bare
`fetch()` on imported URLs at `:50`, so redirects and internal addresses are followed and the
whole body is buffered with no byte cap (A1); `--limit 1` still loads every image row and
its listing before slicing (A5). Fix: use the existing `safe-fetch` module for the download
with a streaming size cap, and read eligible rows in bounded pages that stop at the limit.
Acceptance: `npm run backfill:images -- --dry --limit 1` still works with no R2 (dry never
uploads), the dry pass and the real pass share one code path, typecheck and `verify:local`
green. Say in the PR that no R2 bucket was available.

**T4. Remote image URLs vs R2 keys (S).** Files: `src/lib/format.ts` (`imageUrl`,
`imageThumbUrl`, around `:80-94`). Problem: with `R2_PUBLIC_BASE_URL` set, an absolute
remote URL is prefixed with the R2 base, and a remote `.webp` URL gets a `-thumb.webp`
suffix that does not exist. Fix: pass absolute `http(s)` URLs through unchanged in both
helpers. Must land **before** Anton turns R2 on. Acceptance: a small pure check (add to an
existing verify script) that asserts stored keys are prefixed and absolute URLs are not.

**T5. Resync rollback record (M).** Files: `src/lib/import/resync.ts` only.
Problem (A2): the listing status update, the job row and the rollback rows are separate
statements; a failure after the update leaves listings paused with no undo record. Fix: one
transaction for all three. Acceptance: `verify:local` green; the PR states whether a local
MySQL was available to exercise `cron:resync --dry`.

**T6. Stale median groups (M).** Files: `src/lib/ops/medians.ts`, possibly
`src/lib/precios-queries.ts`. Problem (A3): the job only upserts groups that still have
listings, so a group that empties keeps its old median and sample count on `/precios` and
in valuations. Fix: replace the current period's job-owned rows atomically. Acceptance: the
dry and real runs share the same pass, `verify:local` green.

**T7. Operations buttons clear their caches (M).** Files: `app/admin/operaciones/actions.ts`,
`app/admin/operaciones/jobs.ts`, `src/lib/cache.ts`. Problem (A4): only listing-changing
jobs call `revalidateListings()`; medians (6 h cache), FX, location seeding and financing
seeding leave stale cached readers after an operator runs them. Fix: map each job to the
tags it changes and invalidate after a successful real run; update the outdated
"CLI-only writer" comments. Acceptance: every tag in `cache.ts` has a writer that can be
named in the PR.

**T8. English company links in the mobile menu (M).** Files: `src/components/SiteHeader.tsx`,
`src/components/MobileMenu.tsx`, `src/config/site-nav.ts`, `src/i18n/es.ts`, `src/i18n/en.ts`.
Problem (A7): only the rental doors receive a localised `companyGroup`; the English
marketplace door shows Spanish company link labels. Fix: pass a dictionary-backed group for
every door. Acceptance: `verify:i18n` and `verify:seo` green. **Serialise with T9.**

**T9. Project cards on the English door (L).** Files: `src/components/ProjectCard.tsx`,
`app/proyectos/page.tsx`, `src/i18n/es.ts`, `src/i18n/en.ts`. Problem (A6): stage badges,
delivery labels and availability text are hard-coded Spanish and dates force `es-PY`. Fix:
dictionary copy plus a request-derived locale for numbers and dates. Run after T8 (both
edit the dictionaries). Acceptance: `verify:i18n` green, both dictionaries change in the
same commit.

**T10. Import portability (S).** Files: `src/lib/import/jobs.ts` (`:377`, parse
`previousJson` when a driver returns a string), `src/lib/import/upsert.ts` (`:176`, give
`planImport` an uncached FX default). Acceptance: `verify:import` green; no behaviour change
on MySQL.

**T11. English guide seeder (S, investigate first).** `scripts/seed-guias-en.ts` says
`posts.locale` does not exist and omits it when inserting English posts, but the column
exists now (default Spanish). Codex reports first whether the script would mis-label
English posts if run; fix only if it does.

### Wave 2 — sensitive: open the PR, say why, stop

**T12. `user:create --dry` (M, SENSITIVE: auth).** `scripts/create-user.ts` (A8) treats all
arguments positionally and always upserts password, role and name, so an appended `--dry`
becomes part of the name and writes anyway. Fix: parse flags, share one validated plan
between preview and execute. Needs Anton's explicit yes to touch an auth script.

**T13. Rate-limiter regression check (M, SENSITIVE: lead/OTP throttling).** Add a
deterministic, clock-controlled check for `src/lib/rate-limit.ts` (mixed windows, expiry
boundary, exhausted allowance) to the verify scripts, using the existing `server-only` shim
in `scripts/tsconfig.json` (the old objection in KNOWN-ISSUES is stale). Test only; no
change to the limiter itself.

### Blocked, do not start

- Orphan-draft rollback proof (`src/lib/import/claim-import.ts`) needs a real local MySQL.
  Only after `docker compose up -d` works on this machine.
- Panel, owner and other staff-surface English copy (about 400 strings): parked by the
  quality-plan decision. Reopen only if English-speaking realtors appear.
- Reviews, per-project financing opt-in, AFD rate research: parked by Anton on 2026-09-15.
- Forgotten-password recovery: needs a delivery-channel decision (logged in
  `docs/decisions-needed.md`).

## 3. Suggested order

T1 and T2 first (they make the docs trustworthy for everything after). Then T3 + T4 (R2
readiness), T5, T6, T7, T10, T11 in any order. T8 then T9. T12 and T13 last, only with
Anton's yes. That is 13 PRs; nothing depends on more than one earlier PR.

## 4. Founder-only items and questions

**Questions that change the plan:**

- **F1. Does a merge to `main` deploy?** `AGENTS.md` says Hostinger auto-deploys `main`.
  `docs/log/c4-director-2026-09-14.md` says it does not and that production served an older
  build. If it does not, the merged #156 and #157 are not live and every PR here needs a
  manual redeploy to matter.
- **F2. Package manager on hPanel** (`npm ci` or `pnpm install`): read the build log.
  `.npmrc` and `pnpm-workspace.yaml` stay until answered.
- **F3. Password recovery:** email/SMS channel, or operator-assisted only.
- **F4. Is a Spanish rental domain going to be bought?** (`alquiler.com.py` is not owned.)
- **F5. Should agent-authored PRs be allowed to merge docs-only work?** If yes, say so here
  and T1/T2 may then be merged by the manager.
- **F6.** Delete or archive the two untracked onboarding docs.

**Manual steps (no code can do these; commands contain no secrets):**

1. hPanel: set `NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py`; rebuild.
2. `npm run db:status`, then (founder machine only) `npm run db:migrate`, then
   `npm run db:status` again. `No drift` is the only green. Migrations 0012-0014 are
   recorded as unknown on production; the guides pages 500 or go empty without 0014.
3. Translations: configure one provider key privately; `npm run cron:translate -- --dry --limit 25`,
   then `npm run cron:translate -- --limit 25`; the DeepL free credit is one-time.
4. R2: create the Cloudflare bucket and set the `R2_*` env vars; only after T3 and T4 land,
   run `npm run backfill:images -- --dry --limit 25` then without `--dry`.
5. hPanel: set `NEXT_PUBLIC_CONTACT_WHATSAPP`; rebuild.
6. Set `LEAD_WEBHOOK_URL` (owner and operator alerts stay silent without it).
7. Attach `terreno.com.py`'s and the two English land domains to the app; verify DNS/SSL;
   check the old `rentparaguay.com` WordPress URLs against `next.config.ts` before
   retiring that hosting.

## 5. Manager report format (per task)

Task and repo; Codex session id with model and effort read from the session log; commands
run and their result; anything rejected; anything still open. Label output with the model
that produced it.
