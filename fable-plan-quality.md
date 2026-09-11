# fable-plan-quality.md — the improvement report, as phases

Written 2026-09-11 by a Fable session Anton opened for this purpose. Method:
`phased-autonomous-build`, two sessions — **one Opus session** runs Q-O1, Q-O2,
Q-O3 in order; **one Sonnet session** runs Q-S1 … Q-S4 in order after the Opus
lane is done. The ops plan's three Sonnet phases (`prompts-ops/sonnet-ops.md`)
are a separate Sonnet session that waits on Anton, not on this plan. `CLAUDE.md`
and `AGENTS.md` beat this file on conventions. Fable executes nothing here.

## Part 1 — the report

### Verdict

Read at `209f773` (main, #136 merged). The repo is in good shape: every finding
of the 2026-09-02 review that touched a request path is fixed (`R1`–`R4`, `R9`,
`R10` — checked in code, not remembered), the local gate is green, and the last
four plans landed everything they scheduled except the three ops Sonnet phases,
which wait on Anton's `db:status`. What remains is of four kinds, and the plan
below treats each differently:

| Kind | Examples | Treatment |
| --- | --- | --- |
| **Founder-only, and one is urgent** | 0014 applied to prod? `NEXT_PUBLIC_CANONICAL_HOST`, cron jobs, backups, uptime, GA4/GSC | §7 checklist. **Not code.** |
| **Missing safety net** | zero unit tests, no lint, `rate-limit.ts` regression proof lives in a throwaway script | Q-O1 |
| **Half-finished loops** | owner never hears about a lead; D3b's zone signal is dark; import overwrites a manual edit (D10) | Q-O2, Q-S2, Q-O3 |
| **Recorded-not-fixed** | 11 open lines in `fable/KNOWN-ISSUES.md`, stale `PLAN.md` decisions header, four plan files with no index | Q-S1, Q-S4 |

### What was checked and found sound — do not "improve" these

- `src/lib/safe-fetch.ts` (SSRF: DNS pin, private ranges, byte cap), the CSP
  in `src/lib/csp.ts` (per-request nonce, no `unsafe-inline` for scripts),
  session cookie flags, scrypt + timing-safe compare, OTP burn-on-5th-miss.
- Every sampled page batches independent queries with `Promise.all`; maplibre
  is `next/dynamic` with `ssr:false`; no `unstable_cache` reader filters by
  vertical without the key (the vertical-filtered readers are simply uncached).
- `scripts/*.ts` are thin CLIs over `src/lib/ops/*` (14–34 lines each).
- Public writes are throttled (`leads|ip`, `register|ip`, `otp|user`), the
  lead route defers the CRM push with `after()`, and `createClaimedDraft` /
  `rollbackImportJob` are transactions.

### The findings this plan acts on

| # | Finding | Where | Phase |
| --- | --- | --- | --- |
| F1 | **No test runner.** `rate-limit.ts`, `cuota.ts`, `valuation.ts`, `matching.ts`, `slug.ts`, `facets.ts`, `safe-fetch.ts`'s range classifier, `otp.ts`'s attempt math and the lead route's `routedTo` chain have no automated check. The O2-ops rate-limit bug was proved with a script that was then thrown away. | `package.json`, `.githooks/pre-push` | Q-O1 |
| F2 | **No lint.** Floating promises and unused imports have no gate (`REVIEW.md` Q4). | repo root | Q-O1 |
| F3 | **Nothing tells an owner a lead arrived** (`CLAUDE.md` backlog 8). `alertOperator()` posts only the operator alert. | `src/lib/crm.ts`, `app/api/leads/route.ts`, `app/mis-avisos/**` | Q-O2 |
| F4 | `app/tasacion/actions.ts:69` still awaits `pushLead()` in-request. | `app/tasacion/actions.ts` | Q-O2 |
| F5 | The lead form has no honeypot; only the IP limiter stops a scripted bot. | `app/api/leads/route.ts`, `LeadForm`, `ContactForm`, `DirectoryLeadForm`, `PriceAlert` | Q-O2 |
| F6 | **D10** — a re-import overwrites a panel edit made after the last import (`audit F61`, `REVIEW.md` Q3). | `src/db/schema.ts`, `src/lib/import/upsert.ts`, panel writers | Q-O3 (MIGRATION) |
| F7 | Home `<title>` tagline hard-coded to Spanish on every door. | `app/page.tsx:153` | Q-S1 |
| F8 | Chrome literals: `MobileMenu` aria labels, `SiteHeader` "Ingresar"; drawer has no `aria-modal` and no focus trap. | `src/components/MobileMenu.tsx`, `SiteHeader.tsx` | Q-S1 |
| F9 | `app/not-found.tsx` body copy is Spanish on the English door although it already resolves `locale`. | `app/not-found.tsx` | Q-S1 |
| F10 | `esAgentProfile` is imported directly, never enters `Dictionary`, has no English peer — a **public** page. | `app/agente/[slug]/page.tsx`, `src/i18n/*` | Q-S1 |
| F11 | `getCityPricesUncached` awaits two independent queries in sequence. | `src/lib/precios-queries.ts:105-113` | Q-S1 |
| F12 | `rollbackImportJob` spreads `previousJson` without checking it is an object (MariaDB returns a string). | `src/lib/import/jobs.ts` | Q-S1 |
| F13 | `package.json` `overrides` pin `esbuild`/`postcss` with no comment saying why. | `package.json` | Q-S1 |
| F14 | **D3b** — `DirectoryLeadForm` puts the city in the message body, so `matching.ts` has no zone signal; no screen edits `agents.bio/license_no/years_active/zones`. | `DirectoryLeadForm.tsx`, `app/admin/agentes/**`, `app/agencia/equipo/**`, `src/lib/matching.ts` | Q-S2 |
| F15 | Directory profiles emit no `RealEstateAgent` JSON-LD; listing JSON-LD has no `GeoCoordinates`. | `src/lib/jsonld.ts`, both profile pages | Q-S3 |
| F16 | `PLAN.md`'s "Decisions needed" still shows D1/D2/D6 as open; four plan files and four prompt folders have no index; `fable/KNOWN-ISSUES.md` carries lines this plan closes. | `PLAN.md`, `docs/plans/README.md` (new), `fable/KNOWN-ISSUES.md`, `CLAUDE.md` backlog | Q-S4 |

### Decided NOT to do, and why (so nobody re-opens it as a "gap")

- **Port `esPanel` / `esPublish` / `esOwner` to English (~400 strings).** Staff
  and publish surfaces stay Spanish by decision: the English door is pitched at
  foreign *buyers*, `chromeShowLogin` is already off there, and Paraguayan
  realtors work in Spanish. `verify:i18n` keeps walking only the public
  dictionary. `esAgentProfile` is the exception (F10) because that page is public.
- **Sentry or any error tracker in the request path.** A new SDK on every
  request for a site with zero users is cost without signal. The signal today is
  `/admin`'s health section plus §7's uptime monitor; revisit at the first
  incident nobody saw.
- **Structured logging.** Same reasoning; `console.error` lines land in
  Hostinger's log and nobody reads them yet either way.
- **Refactor the `vertical ? verticalConds(vertical) : []` repeats in
  `queries.ts`.** Eight call sites, each with a different base condition set.
  Churn on the hottest file with no visitor-visible change.
- **Reviews / ratings** — option **(c)**, operator-curated testimonials, is the
  direction (`docs/decisions-needed.md`), and it is **parked**: there are no
  testimonials to curate yet, and building an empty slot invites a placeholder.
- **Two-factor login for the superadmin.** Auth is founder-only and a schema
  change; with one admin account the cheaper protection is a long unique
  password and the existing three-counter login limiter. Backlog §10.
- **D21 site-mode switch.** Hard-gated by the founder until the Spanish
  marketplace is finished. Unchanged.
- **Batch `UPDATE` in `cron:cuotas`** (R13) — fine at today's row counts.

## Phase table

| Phase | Model | Prompt | Owns | Depends on | Merge rule |
| --- | --- | --- | --- | --- | --- |
| Q-O1 test + lint gate | Opus | `prompts-quality/opus-quality.md` (part 1) | `tests/**` (new), `scripts/verify-unit.ts` (new), `eslint.config.mjs` (new), `package.json` (scripts + devDeps), `.githooks/pre-push`, `AGENTS.md` §2 + §5 (one line each), any file lint forces — mechanical fixes only, `docs/log/q-o1.md` | — | **merge when green** — tooling, no schema, no auth |
| Q-O2 lead loop | Opus | same file (part 2) | `src/lib/crm.ts`, `app/api/leads/route.ts`, `app/tasacion/actions.ts`, `src/components/{LeadForm,ContactForm,DirectoryLeadForm,PriceAlert,VenderForm}.tsx` (honeypot field only), `app/mis-avisos/**` (badge), `src/lib/panel-queries.ts` (one count), `.env.example`, `esOwner`/`esPanel` keys, `tests/leads-routing.test.ts`, `docs/log/q-o2.md` | Q-O1 | **merge when green** — request path, not auth: the same rule the 2026-09-02 O1 landed under |
| Q-O3 D10 manual-edit guard | Opus | same file (part 3) | `src/db/schema.ts`, one new `drizzle/*.sql`, `src/lib/import/upsert.ts`, `src/lib/listing-edit.ts`, panel writers that call `updateListing`, `verify-import.ts` (one case), `docs/log/q-o3.md` | Q-O1 | **PR only, title `MIGRATION REQUIRED —`, never merged by a session** |
| Q-S1 known-issues sweep | Sonnet | `prompts-quality/sonnet-quality.md` (part 1) | `app/page.tsx`, `src/components/{MobileMenu,SiteHeader}.tsx`, `app/not-found.tsx`, `app/agente/[slug]/page.tsx`, `src/i18n/{es,en,index}.ts` (new keys + `esAgentProfile` fold-in), `src/lib/precios-queries.ts`, `src/lib/import/jobs.ts` (the parse guard), `package.json` (comments only), `docs/log/q-s1.md` | Q-O1 merged | merge when green |
| Q-S2 D3b — zone signal + profile editor | Sonnet | same file (part 2) | `src/components/DirectoryLeadForm.tsx`, `src/lib/matching.ts` (read `utm.city`), `app/admin/agentes/**`, `app/agencia/equipo/**`, `src/lib/team-queries.ts`, `esPanel` keys, `docs/log/q-s2.md` | Q-O1 merged | merge when green; run `verify:scopes` if a local DB exists and say so |
| Q-S3 directory + listing JSON-LD | Sonnet | same file (part 3) | `src/lib/jsonld.ts`, `app/agente/[slug]/page.tsx`, `app/inmobiliaria/[slug]/page.tsx` (the `<JsonLd>` call only), `app/propiedad/[slug]/page.tsx` (the `<JsonLd>` call only), `tests/jsonld.test.ts`, `docs/log/q-s3.md` | Q-O1 merged | merge when green (`verify:seo` must stay green) |
| Q-S4 docs truth + plan index | Sonnet | same file (part 4) | `PLAN.md` (the "Decisions needed" header and D1/D2/D6 lines), `docs/plans/README.md` (new), `fable/KNOWN-ISSUES.md`, `CLAUDE.md` (backlog items 4, 8, and one new line), `AGENTS.md` §7 (one line), `docs/log/q-s4.md` | Q-S1…Q-S3 merged | merge when green; last phase, STOP |

Order inside each lane is strict. The Sonnet lane starts only when Q-O1 and
Q-O2 are merged (Q-O3 may still be an open PR — nothing in the Sonnet lane
touches the schema or the import writer).

## §1 Decisions already made — do not re-litigate

1. Every rule in `AGENTS.md` and `CLAUDE.md`: dictionary i18n with `en.ts` in
   the same commit, cache tags with writers, facets layer, no
   `.github/workflows/`, brand via `brandName()`, no *propia*, no placeholder
   email, no invented number, `syncDisplayCoords()` after coordinate writes.
2. **Unit tests run on Node's built-in runner through tsx, under
   `scripts/tsconfig.json`**, so `server-only` resolves to the existing shim
   (`scripts/shims/server-only.ts`) and a `server-only` module like
   `rate-limit.ts` is testable with no new shim and no new dependency.
   `npm run verify:unit` = `tsx --tsconfig scripts/tsconfig.json --test
   tests/**/*.test.ts`. No vitest, no jest. Tests are **pure**: no database, no
   network, no Next runtime — the same rule that lets `verify:*` live in a hook.
   Anything that needs a DB stays in `verify:import` / `verify:scopes`.
3. **Time is injected, never faked globally.** `rate-limit.ts` and `otp.ts`
   gain an optional `now` parameter (default `Date.now()`); tests pass one.
   No monkey-patching `Date`.
4. **ESLint is added** (`REVIEW.md` Q4 — decided yes): flat config,
   `eslint-config-next` core-web-vitals + `typescript-eslint` recommended,
   plus `@typescript-eslint/no-floating-promises` as **error**. `npm run lint`
   runs in `verify:local` and pre-push after `typecheck`. Q-O1 fixes what the
   rules flag; a rule that flags more than ~30 sites is set to `warn` with a
   one-line comment naming the count, never silently disabled. No `eslint
   --fix` sweep over files the rule did not flag.
5. **Owner lead notification rides the existing webhook**, never a second
   channel: `alertOperator()` grows a sibling `alertOwner()` that posts
   `{"event":"owner_alert","kind":"new_lead", phone, leadId, listingId}` to
   `LEAD_WEBHOOK_URL` from the same `after()` block. With no webhook: nothing,
   and no log line pretending otherwise (`AGENTS.md` §4 "Alerts never lie").
   The zero-config signal is a **count badge on `/mis-avisos`** ("N consultas
   nuevas", leads with `created_at` after the owner's last visit to
   `/mis-avisos/consultas`, tracked in the session row or a cookie — Q-O2
   picks and records which). No email, no SMS, no fake "enviado".
6. **Honeypot, not CAPTCHA.** A visually hidden text field (`website`) in
   every lead-posting form; the route returns `{ ok: true }` and writes
   nothing when it is filled. A 200 keeps the bot from learning; the row count
   is the only tell. No third-party challenge on a form a Paraguayan seller
   fills on a phone.
7. **D10 is built** (`REVIEW.md` Q3 — decided yes): `listings.manually_edited_at
   DATETIME NULL`. Set by every panel writer that changes a listing field
   (`updateListing` and its callers), cleared by the import writer when it
   overwrites. The import `updated` branch **skips field overwrite** when
   `manually_edited_at` is newer than the source row's `last_seen_at`, still
   touches `last_seen_at`, and counts the row as `kept_manual` in the plan
   *and* the commit (one planner, both paths). Status changes do not set it —
   pausing a listing is not editing its content.
8. **The Sonnet lane never touches** `src/db/schema.ts`, `drizzle/**`,
   `src/db/**`, `src/lib/auth/**`, `src/lib/crm.ts`, `src/lib/import/upsert.ts`,
   `app/api/leads/route.ts`. If a Sonnet phase believes it needs one, it stops
   per §3.
9. **Staff, publish and owner surfaces stay Spanish** (see "Decided NOT to
   do"). `esAgentProfile` folds into the public dictionary because
   `/agente/[slug]` is public and served on the English door.
10. **JSON-LD states only what the row states.** `GeoCoordinates` is emitted
    only from `listings.lat/lng` (the listing's own position), never from
    `display_lat/lng`, which may be a centroid. `RealEstateAgent` on a profile
    carries name, url, image, `areaServed` from `zones` when present, and
    nothing it cannot read from the row — no `aggregateRating`, no
    `priceRange`, no telephone unless the row has one and the door shows it.
11. **Autonomous merge** is granted by the phase table above, per phase, and
    nowhere else. Q-O3 is never merged by a session.
12. **Phase names are prefixed `Q-`** so they cannot be confused with the ops
    plan's S1–S3 or the rental plan's O1–O3 in `docs/log/`.

## §2 Scope

In: the seven phases. Out, in §10: everything under "Decided NOT to do", plus
the items only Anton can move (§7).

## §3 Autonomy protocol

`AGENTS.md` §2–§6 apply verbatim. Short form: `git fetch origin main && git
reset --hard origin/main` before every branch; branch `claude/<phase-id>`;
`npm run verify:local` before every push, never `--no-verify`; minor findings
go to `fable/KNOWN-ISSUES.md` and the phase log, not into the diff; stop on
auth, payments, schema outside Q-O3, or a founder decision, by appending the
question to `docs/decisions-needed.md`, committing, pushing, and ending. Never
message another session. Fable is never spawned. Each phase ends with
`docs/log/<phase>.md` (≤ 12 lines Built, ≤ 8 Decisions, ≤ 8 Known issues, one
Verification line naming what was **not** run) and a §9 line here. Docker is
usually unavailable in the sandbox — say so, do not claim a DB run.

## §4 Opus lane

### §4.1 Q-O1 — the test and lint gate

1. `tests/` at repo root, `*.test.ts`, `node:test` + `node:assert/strict`.
   First files, each ≤ 80 lines and pure:
   - `rate-limit.test.ts` — the O2-ops regression: a 5-minute bucket's sweep
     must not expire a 60-minute bucket six minutes in; the cap holds at N,
     refuses N+1, admits after the window. Uses the injected `now` (§1.3).
   - `cuota.test.ts` — monthly payment for a known principal/rate/term against
     a hand-computed value; the AFD cap returns `null` above it; zero and
     negative inputs.
   - `facets.test.ts` — `parseFacetParams ∘ facetSearchParams` identity on a
     fixture (this exists in `verify-facets.ts`; the test imports the same
     fixture rather than copying it).
   - `slug.test.ts`, `valuation.test.ts` (the pure estimate function only),
     `matching.test.ts` (`rankCandidates` order: zone+inventory > inventory >
     zone; cap 6), `safe-fetch.test.ts` (the private-range classifier: RFC1918,
     loopback, link-local, `::ffff:` mapped, a public address), `otp.test.ts`
     (5th miss burns; cooldown math).
2. `scripts/verify-unit.ts` is not needed if `tsx --test` runs directly; the
   `package.json` script is `verify:unit`. Add it to `verify:local` and to
   `.githooks/pre-push` after `verify:seo`.
3. ESLint per §1.4. `npm run lint` in `verify:local` and pre-push directly
   after `typecheck`. Fix what it flags within the phase's file rule.
4. `AGENTS.md`: §2's `verify:local` line lists the two new steps; §5 item 1
   unchanged in meaning. `CLAUDE.md` "CI" section: the gate list gains
   `lint` and `verify:unit`.
5. Exit: `npm run verify:local` green including the two new steps; every test
   above exists and passes; `git grep -n "eslint-disable"` shows only lines
   Q-O1 added, each with a reason; PR merged green; `docs/log/q-o1.md`.

### §4.2 Q-O2 — the lead loop closes

1. `src/lib/crm.ts`: `alertOwner()` per §1.5, same 5 s bound, same `after()`
   block in `app/api/leads/route.ts` as the operator alert, inside the same
   `try`. Fires only when `routedTo === "owner"` and the owner row has a phone.
2. `app/tasacion/actions.ts`: move `pushLead()` into `after()` with a
   try/catch, exactly as the lead route does. The valuation lead is already in
   MySQL before the push.
3. Honeypot per §1.6: one hidden field in each owned form component, one
   optional key in the route's zod schema, early `return json({ ok: true })`
   with no insert when it is non-empty. Named `website`; `autocomplete="off"`,
   `tabIndex={-1}`, `aria-hidden`, positioned off-screen with an existing
   utility class or one appended CSS rule `/* == Q-O2 == */`.
4. `/mis-avisos` badge per §1.5: the count and the "seen" marker. Copy in
   `esOwner` (Spanish only, §1.9).
5. Extract the `routedTo` decision in the route into a pure function
   (`src/lib/lead-routing.ts`, `server-only`) and test it in
   `tests/leads-routing.test.ts`: agent → agency → owner → internal, each
   branch, plus "owner only when no agency and no agent".
6. `.env.example`: one sentence under `LEAD_WEBHOOK_URL` naming the new
   `owner_alert` event.
7. Exit: `verify:local` green; the routing test passes; a `curl` against a
   local `next dev` with the honeypot filled returns 200 and inserts nothing
   (say if this could not be run); PR merged green; `docs/log/q-o2.md`.

### §4.3 Q-O3 — D10, the manual-edit guard (MIGRATION REQUIRED)

1. `src/db/schema.ts`: `listings.manuallyEditedAt` (`datetime`, nullable).
   `npm run db:generate` → one `drizzle/0015_*.sql`. Nothing else in the
   migration.
2. `src/lib/listing-edit.ts` / `updateListing`: set `manually_edited_at = now`
   when any content field changed (not on status-only changes, §1.7). Find
   every caller that writes listing content from a panel and make sure it goes
   through this path — do not add a second writer.
3. `src/lib/import/upsert.ts`: in the `updated` branch, when
   `manually_edited_at > source.last_seen_at`, skip content overwrite, bump
   `last_seen_at`, count `kept_manual`. The import writer clears
   `manually_edited_at` when it *does* overwrite. `planImport` and
   `commitImport` share the branch (one planner).
4. `scripts/verify-import.ts`: one pure case for the decision function
   (extract it as a pure helper so it is testable without a DB) and, in the DB
   half, one round trip: import → panel edit → re-import → the edit survives
   and `kept_manual` is 1.
5. PR title `MIGRATION REQUIRED — Q-O3 (D10): listings.manually_edited_at`.
   Body: the runbook `npm run db:status -- --probe` → `npm run db:migrate` →
   `npm run db:status`, and the reminder that deployed code selects every
   column, so merge and migrate in the same sitting. **Open and stop.**
6. Exit: `verify:local` green; PR open, not merged; `docs/log/q-o3.md`; §9
   line; the Opus session ends with its report.

## §5 Sonnet lane

### §5.1 Q-S1 — the known-issues sweep

One PR, small commits, each finding its own commit:

1. F7: `app/page.tsx` → `brandTaglineFor(vertical.locale)`. Review the
   `<head>` diff on the three live doors with a `Host` header (`inmobiliaria.
   com.py` and the rental doors must be byte-identical; only
   `realestateinparaguay.com` changes).
2. F8: two `common` keys for the drawer labels and one for the login link,
   read through `dict()` in `SiteHeader` and passed to `MobileMenu` as props;
   `aria-modal="true"`, focus moves to the first focusable element on open and
   returns to the toggle on close, Escape closes. No new dependency.
3. F9: `app/not-found.tsx` reads its copy through `dict()` (`notFound`
   namespace, `es` + `en` in the same commit). Keep the `.catch(() => [])`.
4. F10: fold `esAgentProfile` into the dictionary (`agentProfile` namespace),
   add `enAgentProfile` translating intent (foreign-buyer register, no invented
   facts), read through `dict()` in `app/agente/[slug]/page.tsx`. Delete the
   direct import. `verify:i18n` now walks it.
5. F11: `Promise.all([resolveCity(), latestPeriod()])`.
6. F12: `const prev = typeof row.previousJson === "string" ?
   JSON.parse(row.previousJson) : row.previousJson;` with a comment naming the
   MariaDB reason. One line.
7. F13: a `"//overrides"` comment key in `package.json` naming why each pin
   exists (read `npm audit` or `git log -S` for the reason; if none can be
   found, say "pinned 2026-0x for an advisory in a transitive dep; safe to
   drop when `npm audit` is clean without it").
8. Exit: `verify:local` green; `<head>` diff reviewed as in item 1; the drawer
   checked with keyboard only in a real browser; PR merged; `docs/log/q-s1.md`;
   strike the closed lines in `fable/KNOWN-ISSUES.md` with the phase id.

### §5.2 Q-S2 — D3b: the zone signal and the profile editor

1. `DirectoryLeadForm`: send the chosen city as `utm.city` (the ciudad
   **slug**, matching `agents.zones`) alongside the message it already writes.
   No route change: `utm` is a free-form record the route already stores.
2. `src/lib/matching.ts`: read `utm.city` as the zone signal; the panel copy
   that today says the signal is dark comes off when the lead carries one.
3. `/admin/agentes`: edit `bio`, `license_no`, `years_active`, `zones` (a
   multi-select over `listDirectoryZones()` — slugs, never free text). zod
   validation; `esPanel` copy. `/agencia/equipo`: the same four fields for an
   agent of the logged-in agency, through `requireAgencyContext()` and the
   existing team queries — no second scope vocabulary. `revalidateDirectory()`
   after a write.
4. Exit: `verify:local` green; `verify:scopes` run if a local DB exists (say
   which); a directory lead created locally shows the zone-ranked candidates
   in `/admin/leads`; PR merged; `docs/log/q-s2.md`.

### §5.3 Q-S3 — JSON-LD for the directory and the map

1. `src/lib/jsonld.ts`: `agentJsonLd()` / `agencyJsonLd()` → `RealEstateAgent`
   per §1.10; `listingJsonLd` gains `geo: GeoCoordinates` **only** when the row
   has its own `lat`/`lng`. Both keep `@id`/`url` on the canonical origin the
   page already computes (directory pages: `directoryCanonicalOrigin`).
2. Wire the `<JsonLd>` call in both profile pages and the detail page.
3. `tests/jsonld.test.ts`: centroid-only listing emits no `geo`; agent with
   `zones` emits `areaServed`; nothing emits a rating.
4. Exit: `verify:local` + `verify:seo` green; the three JSON-LD blocks
   validated once with Google's Rich Results test or `schema-dts` typing (say
   which); PR merged; `docs/log/q-s3.md`.

### §5.4 Q-S4 — docs truth and the plan index

1. `PLAN.md` "Decisions needed": D1, D2, D6 ticked with a one-line pointer to
   where they were decided (`CLAUDE.md` brand + domain sections); the
   "Recording gap" banner gains a dated line saying which are now settled.
   Nothing else in `PLAN.md` moves — it is history.
2. `docs/plans/README.md`: one table — every plan file (`fable/plan.md`,
   `fable/plan-rentparaguay.md`, `fable-plan-realtor-terreno-rental.md`,
   `fable-plan-polish.md`, `fable-plan-ops.md`, this file), its prompt folder,
   its state (done / waiting on Anton / open phases), and the one thing still
   open in it. Verified against each file's §9, not remembered.
3. `fable/KNOWN-ISSUES.md`: move struck lines under a "Closed" heading with the
   phase that closed them; the file keeps only real open items.
4. `CLAUDE.md` backlog: item 4 (reviews) → "decided (c), parked"; item 8 →
   owner notification done via webhook + badge (Q-O2); one new line pointing at
   D10 if Q-O3 is merged and migrated by then, else "PR open, awaiting
   migration". `AGENTS.md` §7: one line for this plan.
5. Exit: `npm run verify:i18n` (docs only, run anyway); every sentence traces
   to a file read this session; PR merged; `docs/log/q-s4.md`; STOP.

## §6 Prompts

Two files. `prompts-quality/opus-quality.md` — one fresh **Opus** session, runs
Q-O1 (merge), Q-O2 (merge), Q-O3 (PR only) and stops.
`prompts-quality/sonnet-quality.md` — one fresh **Sonnet** session after Q-O1
and Q-O2 are merged, runs Q-S1 … Q-S4 and stops.

## §7 Human-inputs checklist (Anton) — in priority order

- [ ] **URGENT — `npm run db:status` against production, today.** #136 merged
      `drizzle/0014` and its code is deployed. `src/lib/post-queries.ts`
      selects `posts.locale` by name, so if 0014 is not applied, `/admin/guias`
      and every guide page 500 right now. If it prints pending: `db:status
      --probe` → `db:migrate` → `db:status`. Paste the output into
      `fable-plan-ops.md` §9. This also unblocks `prompts-ops/sonnet-ops.md`.
- [ ] hPanel: `NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py`, rebuild
      (`CLAUDE.md` backlog 2 — open since 2026-09-04).
- [ ] hPanel Cron Jobs: nightly `cron:cuotas`, `cron:medians`, `cron:geo`,
      `cron:resync`, `cron:sessions`, `cron:fx`; weekly `cron:translate
      --limit 200`. After O2-ops the same jobs are buttons, so a missed cron is
      visible on `/admin`.
- [ ] `npm run cron:translate -- --dry --limit 50`, then without `--dry`
      (DeepL credit is one-time; watch the dashboard).
- [ ] Backups: a weekly `mysqldump` from the PC to somewhere not Hostinger, and
      one restore into the local Docker DB to prove it. Nothing in the repo
      can do this.
- [ ] Uptime: UptimeRobot (free) on the four live doors + `/api/health`.
- [ ] GA4 + Search Console per door; submit each door's `/sitemap.xml`.
- [ ] Read-only MySQL user for agents (`fable-plan-ops.md` §7, still open).
- [ ] `NEXT_PUBLIC_CONTACT_WHATSAPP` for the rental doors; rebuild.
- [ ] Buy the Spanish rental domain (`alquiler.com.py`, else
      `alquileres.com.py`); then the one-hour rename task.
- [ ] Q1 package manager: read one Hostinger build log (`pnpm install` or
      `npm ci`) and answer in `fable/REVIEW.md`. Until then nobody touches the
      lockfiles.
- [ ] After Q-O3's PR: `db:status --probe` → `db:migrate` → `db:status`, merge
      in the same sitting.
- [ ] Rotate the MySQL and panel passwords typed into an old transcript; drop
      the `%` Remote MySQL grant (`PLAN.md` "[YOU]" — never ticked).
- [ ] The `propia-dev` skill in your skill library is stale (it still names
      `propia.com.py` as live and "Homes Paraguay" as brand). Regenerate it from
      `CLAUDE.md` after this plan lands, or delete it — `AGENTS.md` is the rules
      file now.

## §8 Open business questions — parked, not build work

- Real AFD / MUVH financing terms (`CLAUDE.md` backlog 6) — research.
- Featured-listing pricing and how money arrives (D5).
- Retention scope (D9).
- Whether `desarrolladores.com.py` (declared, `enabled: false`) is a door worth
  building or a row to delete.

## §9 Build log & handoff

- 2026-09-11 — plan written (Fable). No phase started.

## §10 Backlog

- Superadmin second factor (auth; founder decision; schema).
- `esPanel` / `esPublish` / `esOwner` English peers — only if the product
  decision in §1.9 changes.
- Reviews (c) — operator-curated testimonials, when there are any.
- Batch `UPDATE` in `cron:cuotas` past ~30 k rows.
- Error tracker — at the first incident nobody saw.
- `queries.ts` vertical-conds helper — only when a ninth call site appears.
- Rental plan §10 items (`pathByLocale` slugs, `/alquiler` hub copy pitched
  for the rental doors, `Service` JSON-LD).
