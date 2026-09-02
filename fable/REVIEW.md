# fable/REVIEW.md — repo review, 2026-09-02

Reviewed at `be89c85` (main, PR #78 merged). Every finding below was checked
in code at the cited line; nothing here is remembered from docs. The previous
audit (`docs/audit-2026-08.md`, 64 findings) was re-verified item by item and
is **not** repeated here — see "What the previous audit got right" below.

## Verdict

A live, single-deployment Next.js 15 / Drizzle / MySQL marketplace in unusually
good shape for a solo-founder repo: the local gate (typecheck, build, four pure
verify scripts) is green at HEAD, 62 of the 64 audit findings are genuinely
fixed, and the invariants that matter (scope-based authorisation, canonical /
sitemap / hreflang from one predicate, atomic import commit, bounded DB pool)
are enforced by code, not by convention. What is left is small and specific:
**(1)** two latent 503-shaped and one data-integrity gap in request paths that
were hardened everywhere except one call site each; **(2)** two public-write
surfaces with no throttle; **(3)** documentation that still tells an operator
to point a domain the founder does not own and to schedule cron jobs that do
not exist, while omitting three that do. The biggest risk to the site is not
in this repo at all: two generated migrations (0010, 0011) had not been applied
to production as of the last recorded session, and this sandbox cannot reach
the live host to confirm they have been since.

## Gate results at HEAD

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run build` | pass, every route `ƒ (Dynamic)` as documented |
| `verify:import` / `verify:facets` / `verify:i18n` / `verify:seo` | all pass |
| `verify:scopes` | not run — needs a localhost MySQL, none in this sandbox |
| Production health probe | **not possible** — egress to both live domains is blocked here |

## Findings

Severity: blocker = fix before anything else · high = real production risk ·
medium = should land in this plan · low = hygiene.

| ID | Sev | Area | Where | What is wrong | Why it matters | Fix sketch |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | high | ops / 503 | `src/lib/crm.ts:102` and `app/api/leads/route.ts:178` | `WebhookProvider.post()` calls `fetch` with no timeout or `AbortSignal`, and the lead route **awaits** `pushLead()` before responding (only the operator alert is deferred with `after()`). | Latent today because `LEAD_WEBHOOK_URL` is unset. The moment it is set and the endpoint hangs, every lead submission holds a Node process open — the exact mechanism of the 2026-07-26 503 spiral in PLAN.md. | `AbortSignal.timeout(5000)` in `post()`; move `pushLead` and the `ghlContactId` update into the same `after()` as the alert. The lead is already stored, so nothing is lost. |
| R2 | high | data integrity | `src/lib/import/claim-import.ts:107–172` | `createClaimedDraft` does `insert(listings)` → `syncDisplayCoords` → `insert(listingSources)` as three separate statements, no `db.transaction()`. | This is audit F46, fixed in `upsert.ts:437` but never applied to the `/agencia/importar` link-claim path. A failure after the first insert leaves a draft with no provenance row: invisible to dedup and to `findExistingClaim`, so the agent cannot re-claim the URL either. | Wrap the three writes in `db.transaction()` exactly as `upsert.ts` does; `syncDisplayCoords` already accepts a connection handle. |
| R3 | medium | security | `app/registro/actions.ts:33`, `src/lib/registration.ts:84` | `registerAction` is unauthenticated and unthrottled; each call runs scrypt (N=16384) plus an insert. Every other public write (`/api/leads`, login) is rate-limited. | Cheap CPU-exhaustion and junk-account flood on a host that shares a 200-process cap with ~90 other sites. | `allowRequest(\`register|${ip}\`, 5, 10 min)` before `registerAccount`, same helper the lead route uses. |
| R4 | medium | security | `src/lib/otp.ts:34–59`, `app/publicar/actions.ts:139` | `createOtp` enforces only a 60 s cooldown **per phone number**; `requestOtpAction` needs any logged-in user (obtainable via open `/registro`) and has no per-user or daily cap. | An account can WhatsApp-bomb any number every 61 s indefinitely and burn the operator's messaging quota. Dormant while no provider is configured. | Add `allowRequest(\`otp|${user.id}\`, 5, 1 h)` in the action; keep the per-number cooldown. |
| R5 | medium | deploy | `pnpm-workspace.yaml:1`, `.npmrc`, no `pnpm-lock.yaml` | The repo states Hostinger builds with pnpm (commit `a4f4686` was a real build fix), but only an npm `package-lock.json` is committed. | A pnpm build resolves a fresh, unpinned tree on every deploy; a transitive bump can change production without a commit. | Needs Anton's answer (Q1 below). Then either commit `pnpm-lock.yaml` + `packageManager` field, or drop the pnpm files. |
| R6 | medium | docs / ops | `README.md:74,81,86,102`; `README.md:11`; `README.md:77–79`; `ARCHITECTURE.md:26`; `package.json:5`; `next.config.ts:8` | README tells the operator to register and point `propia.com.py` and map `img.propia.com.py`; calls GHL the CRM of record; lists cron jobs "counts hourly" and "sitemap nightly" that do not exist and omits `cron:resync`, `cron:geo`, `cron:sessions`. `package.json` description names the unowned domain; `next.config.ts` keeps a dead `img.propia.com.py` remote pattern. | An operator following README verbatim buys a domain the founder ruled out and never schedules the job CLAUDE.md calls "the one staleness no write hook can see". CLAUDE.md says the domain must not be reintroduced anywhere. | Rewrite README's production-setup, launch-blockers and cron sections from CLAUDE.md's domain table and `package.json`'s real `cron:*` list; one-line fixes for the other three. |
| R7 | medium | i18n | `app/inmobiliaria/[slug]/page.tsx:75,93,120,129`; `app/agente/[slug]/page.tsx:80,98`; `app/proyecto/[slug]/page.tsx:20–44,134` | Buyer-facing profile and project pages still carry inline Spanish literals (`"Inicio"`, `"Verificado"`, `"Sin propiedades publicadas…"`, `STAGE_LABEL`/`TYPE_LABEL`/`STATE_LABEL`, a hard-coded `es-PY` date). `es.ts` already has `breadcrumbHome` and `verified` keys that these pages do not use. | These three page types will render Spanish on the English door on flip day, and `verify:i18n` cannot catch strings that never entered the dictionary. Listed as a D6 precondition nowhere. | New `profile` / `project` namespaces in `es.ts` + `en.ts` in one commit; read through `dict()`; date locale from `currentLocale()`. |
| R8 | low | SEO | `app/[operacion]/[...segments]/page.tsx:232–246` | The only public template with no `openGraph` block. The layout default supplies `siteName` and the image, but `og:title` falls back to the bare page title without the brand — the F47 fix was applied to every other template. | Category pages are most of the indexable URLs and the most-shared on WhatsApp; the card shows the title without the brand. | Add `openGraph: { title: \`${title} — ${brand}\`, description }` matching `app/[operacion]/page.tsx:56`. |
| R9 | low | cache | `src/lib/cache.ts:46`; `src/lib/precios-queries.ts:279,285`; `src/lib/valuation.ts:173` | `CACHE_TTL.marketMedians` (21 600 s) is declared and never read; both call sites hard-code 3 600. The `market-medians` tag has no writer. | TTL-only is **correct** here — `compute-medians.ts` is a tsx script and cannot call `revalidateTag` — but the file's own rule says every tag has a writer, and a future edit to the constant does nothing. | Use the constant at both sites; add a sentence in `cache.ts` that this tag is TTL-only by design. |
| R10 | low | data | `src/lib/import/jobs.ts:258–460` | `rollbackImportJob` runs its cascade and restores as separate statements. | A crash mid-way leaves `import_rows` saying `created` for a listing already deleted. A retry converges (ids are re-derived), so this is defence in depth, not a live bug. | Wrap in `db.transaction()`. |
| R11 | low | ops | `src/lib/rate-limit.ts:10` vs `src/db/index.ts:27` | The limiter comment assumes one Node process; the pool comment says Passenger may run several. Both limiters are per-process Maps. | Effective limits are N× the documented ones. Acceptable at this scale; the docs should not contradict each other. | Fix the comment; note the multiplier. No shared store needed today. |
| R12 | low | docs | `CLAUDE.md` brand section; `PLAN.md:8`; `docs/audit-2026-08.md:72` | CLAUDE.md still says `safe-fetch.ts`'s User-Agent is propia-flavoured (it reads `realestateinparaguay.com` at line 279); PLAN.md's banner says 2026-08-21 while the body runs to 08-26; the audit table's F1 row says OPEN though PR #66 fixed it. | CLAUDE.md's whole premise is "verified against code". | Three one-line edits. |
| R13 | low | perf | `scripts/recompute-cuotas.ts:62` | One `UPDATE` per listing, sequential. | Fine at 3 k rows, minutes at 30 k. | Batch by `CASE … WHEN` or chunked `IN` lists when inventory grows. Backlog. |
| R14 | low | DX | repo root | No ESLint config, no `lint` script. `verify:local` is tsc + build + four pure checks. | Unused imports and floating promises have no automated check. Not a drift — no doc claims otherwise. | Founder's call (Q4). Backlog. |

## What the previous audit got right (re-verified, do not re-fix)

All of F1–F3, F5–F16, F18–F47, F49–F62 are fixed as their status says, with two
corrections: **F1 is fixed** (the audit table header still says OPEN — R12),
and **F46 is fixed only in `upsert.ts`** (R2). F55 was not re-verified.

## What is good — later sessions must NOT "improve" these away

- **`src/lib/safe-fetch.ts`** — DNS-pinned socket lookup, exhaustive
  IPv6-embedded-IPv4 ranges, streaming byte cap, https-downgrade block. Better
  than most production SSRF guards. Do not "simplify" it to a hostname check.
- **`EditScope` / `listingScopeWhere()` / `maySetStatus()`** in
  `src/lib/listing-edit.ts` — one authorisation vocabulary for admin, agency
  and owner scopes, reused by every query and action. Never add a second
  allow-list.
- **`src/db/index.ts` pool bounds** — `connectionLimit: 6`, `queueLimit: 24`,
  `connectTimeout: 8000` are an outage fix, not tuning. Do not raise them.
- **`dedupKey()` returning `null` without a phone**, `scope_agency_id NOT NULL
  DEFAULT 0`, one planner for dry-run and commit — CLAUDE.md explains each.
- **`host.ts` → `origin.ts` → `indexability.ts` → `alternates.ts` →
  `sitemap.ts`** — canonical, robots, hreflang and sitemap all consume the same
  predicates. A page type that decides indexability locally reintroduces F8.
- **`app/not-found.tsx` swallowing its DB call**, the health-route
  `failureClass()` mapping, `db:status`'s schema-drift diff, the three-counter
  login limiter, re-encoding every upload through `sharp`.
- **The local gate** (`.githooks/pre-push`, the four pure `verify:*` scripts,
  `pre-commit` refusing `.github/workflows/`). This is the CI. Keep it pure.
- **`unstable_cache` with named writers** and the Date re-wrap at the cache
  boundary. `revalidatePath()` does not clear these — do not swap one for the
  other.

## Open questions for Anton — decisions only he can make

| # | Question | Recommended answer |
| --- | --- | --- |
| Q1 | Which package manager does hPanel's build step actually run for this site (check the build log: `pnpm install` or `npm ci`)? | If pnpm: commit `pnpm-lock.yaml` generated locally with the same major, add `"packageManager": "pnpm@<version>"`, delete `package-lock.json`. If npm: delete `pnpm-workspace.yaml` and `.npmrc` and their comments. Sonnet phase S1 does whichever you answer. |
| Q2 | Are migrations 0010 and 0011 applied to production? PLAN.md's last record says no, and this sandbox cannot probe the site. | Run `npm run db:status -- --probe` against prod today. If it reports pending, run `db:migrate` in the same sitting — deployed main already selects those columns. |
| Q3 | D10 (re-import overwrites manual panel edits, audit F61): should a re-import skip rows an operator edited after the last import? | Yes: add `listings.manually_edited_at` (set by panel writers, cleared by import), and have the `updated` branch skip field overwrite when it is newer than the source's `last_seen_at`. MIGRATION; needs an Opus phase once you say yes. |
| Q4 | Do you want ESLint added to the local gate? | Yes, `eslint-config-next` with the recommended set only, run in pre-push after typecheck. Cheap, catches floating promises. Not in this plan until you say so. |
| Q5 | D3 real financing rates, D5 featured pricing, D9 retention scope — still blank in PLAN.md. | Research and product decisions, not code. Nothing in this plan waits on them; the plan parks them in §8. |

## Fixed in this session

Nothing. Every finding above is either a change to a request path, an auth
surface, or a coordinated docs sweep — none qualifies as the five-minute
trivial fix this session was allowed. R12's three one-liners are folded into
phase S1 rather than committed piecemeal.
