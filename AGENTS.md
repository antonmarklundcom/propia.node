# AGENTS.md — the rules for any agent working in this repo

Read this file before touching anything. It is **self-contained**: every rule you
must obey is here, in full, with no other file required. Where it points at
another file, that pointer is for *history and detail*, never for a rule you need
in order to act safely.

Applies to Claude Code, Codex, and any other automated contributor. A human
running these commands is bound by the same production facts.

---

## 1. What this is

One Next.js app (App Router, TypeScript), one MySQL 8 database, one deployment on
Hostinger's managed Node.js hosting. It is a Paraguayan real-estate portal that
serves **several branded domains from the same code and the same database**,
routed by the `Host` header in `middleware.ts`.

- **Zero live users so far.** Everything is git-revertible. That is why some
  autonomy is granted below — not because mistakes are cheap in production.
- **Hostinger auto-deploys `main`. There is no staging environment.** A merge is
  a deploy. A push that does not build is a live outage.
- **The database is the only copy of every listing and every lead.** Hostinger's
  daily backup is the only backup that exists.

### The domains

The complete list of domains this app answers for is the table in
`src/config/verticals.ts`. Read it there; it carries each door's language,
filters, brand and page-type ownership as data.

Two rules about domains, and they are absolute:

- **Never introduce a domain that is not already a key in `verticals.ts`** — not
  as a canonical, not as a link, not as a contact address, not as a fallback.
  Several domains this project used earlier are **not owned by the founder**, and
  reintroducing one resurrects broken canonicals and dead mailto links sitewide.
- **There is no portal email address, on purpose.** `CONTACT_EMAIL` and
  `CONTACT_WHATSAPP` in `src/config/contact.ts` are `string | null` with **no
  fallback**, and every consumer already handles null (the footer and `/contacto`
  hide the address, the privacy policy drops its "or write to" clause, the
  Organization JSON-LD omits the email contactPoint). **Never add a placeholder
  address back.** Until the founder has a real mailbox the contact channels are
  the on-site lead form and WhatsApp.

**The brand is the domain.** Each door's `brand` is declared on its vertical
(`Inmobiliaria Paraguay`, `Real Estate in Paraguay`, …). There is no separate
wordmark. On a public page, read it with `brandName()` / `brandMeta()` from
`src/lib/brand-server.ts` (async, request-scoped, correct in `generateMetadata`
and in the component body alike). `BRAND_NAME` from `src/lib/brand.ts` is the
canonical host's brand resolved once at module load, and is correct **only** on
`/admin` and `/agencia`, in client components, and in scripts — on a public page
it pins that page to one domain's name regardless of which domain the visitor
typed. `brand.ts` must never import `next/headers`, directly or transitively.

**Never write the name of the old project brand anywhere a visitor, realtor or
staff user can see it** (founder decision). It survives only in backend
identifiers nobody renders: the session cookie name, two localStorage keys, the
docker-compose database name and `package.json`'s `name`. Leave those alone.

---

## 2. Git, verification and deploy

```bash
git fetch origin main && git reset --hard origin/main   # ALWAYS, before branching
git checkout -b claude/<feature-name>
# … work …
npm install && npm run hooks:install     # after a fresh clone
npm run verify:local                     # must be green before every push
git push -u origin claude/<feature-name>
```

- **Always reset to `origin/main` before branching.** Merges happen through the
  GitHub API, so a local `main` goes stale and a merged PR can look "missing".
  This has already cost a session.
- **Branch naming: `claude/<feature-name>`.** One PR per unit of work.
- **`npm run verify:local` must pass before every push.** It is
  `typecheck → build → verify:import → verify:facets → verify:i18n → verify:seo`.
  The last four are pure — no database, no network.
- **Never `git push --no-verify`.** `.githooks/pre-push` runs the same gate; it is
  the only CI this repo has. Hooks install themselves via `prepare` on
  `npm install`; after a clone that skipped scripts, run `npm run hooks:install`.
- **Never create a file under `.github/workflows/`.** `.githooks/pre-commit`
  blocks it. Deploys run on Hostinger's build servers, which GitHub reaches with
  a free webhook; Actions minutes bill per account across every repo, so a
  workflow here spends the founder's shared quota on a path that does not use it.
  If a task genuinely needs one, state the case and stop — explicit yes first.
- **`npm run verify:scopes` stays manual.** It needs a localhost MySQL and
  refuses to run against anything else. Run it on anything touching
  `listingScopeWhere`, `panelScope` or a panel query, and say in the PR whether
  you ran it.

### What an agent may and may not do

- **You may merge** only well-verified, low-risk work — CSS, UI, copy, docs,
  script flags — and only when a plan or the founder has said so for that unit of
  work. When in doubt, open the PR and stop.
- **You must never merge** anything touching **auth**, **payments**, or
  **`src/db/schema.ts`**. Open the PR, title it so the risk is visible, and stop.
- **A schema change is `MIGRATION REQUIRED —` in the PR title**, always, and is
  never merged by an agent. Deployed code selects every column in `schema.ts`, so
  code on `main` ahead of the database 500s every page that reads that table.
- **You never run a migration against production.** `db:migrate` is the founder's
  command, on the founder's machine.
- **You never hold the write database credential.** See §3.
- Nothing auto-merges: there is no required status check on this repo.

---

## 3. Environment and the database

`tsx` does **not** read `.env`. Every script needs the credential exported in the
shell first:

```bash
export DATABASE_URL="mysql://user:pass@host:3306/db"   # bash
$env:DATABASE_URL = "mysql://user:pass@host:3306/db"   # PowerShell
```

**Two credentials, and the split is the point:**

| Variable | Who has it | What it is for |
| --- | --- | --- |
| `DATABASE_URL` | agents included | **Read-only** user. Enough for `db:status` and every `--dry` run. |
| `DATABASE_URL_RW` | the founder's machine only | The owner user. **Never given to an agent.** |

A writing CLI run picks `DATABASE_URL_RW ?? DATABASE_URL` (see
`scripts/db-credential.ts`); a dry run always uses `DATABASE_URL`. With no
`DATABASE_URL_RW` set nothing changes — writing runs use `DATABASE_URL`, which is
how a single-credential machine has always worked. The app's own pool
(`src/db/index.ts`) reads `DATABASE_URL` and **its credential handling is never
edited**, nor are `drizzle.config.ts` or the pool bounds.

Production MySQL is reachable only from an IP allowlisted in hPanel → Remote
MySQL. **A cloud agent cannot reach production at all, and must not try.** If a
task needs production data, it needs the founder.

### Local database

```bash
docker compose up -d                 # MySQL 8 on :3306
npm run db:migrate
export DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia"
```

If Docker is unavailable in your sandbox, **say so in the PR** and do not claim a
run you did not do. A MariaDB stand-in is close but not identical: it stores
`json` columns as `longtext`, so `mysql2` hands them back as strings and anything
reading `previous_json` (the import rollback) misbehaves. That is the sandbox,
not the code.

### Migrations

```bash
npm run db:status            # read-only: pending set + schema drift. `No drift` is the only green.
npm run db:status -- --probe # additionally proves an owner-lane INSERT works; always rolls back
npm run db:migrate           # the founder, on the founder's machine
npm run db:status            # again, immediately after
```

`db:migrate` decides what to run from `__drizzle_migrations`, which **can be wrong
in both directions**: migrations pasted into phpMyAdmin record nothing, and a
recorded hash with no matching file means production ran SQL this checkout does
not contain. So the migration list is a proxy. The question that actually matters
is *does this database have what the deployed code selects* — which is what
`db:status`'s drift diff answers, by reading `src/db/schema.ts` against
`information_schema`. Run it **before merging any PR that touches `schema.ts`**
and **again immediately after `db:migrate`**.

**There is no `db:push`.** It was removed: migrations are files, reviewed in a
PR, applied by a human. Do not add it back.

---

## 4. Conventions that are load-bearing

Each of these has already caused a bug. They are not style preferences.

**Operations jobs — one runner per job.** Every routine job lives in
`src/lib/ops/<job>.ts` as `run<Job>(opts: { dry: boolean; limit?: number })`
returning `OpsResult` (`src/lib/ops/types.ts`). The `scripts/*.ts` file is a thin
CLI over it, and `/admin` calls the same function. **A second code path for the UI
is forbidden**, and the dry run must be the same pass over the same rows as the
real one — a preview computed by different code is a guess that agrees most of the
time. Every writing script takes `--dry`. Import `src/lib/ops/<job>` directly;
there is deliberately no barrel file (one job pulls in the AWS SDK, another the
Anthropic SDK).

**i18n — never inline a visitor-facing string.** Copy lives in `src/i18n/es.ts`
with an `en.ts` **peer added in the same commit**. Read it through `dict()` from
`@/i18n/server` on the server (async, request-scoped, correct in
`generateMetadata` too) or `getDictionary(locale)` from `@/i18n` in client
components. `src/i18n/index.ts` must never import `next/headers`. `en.ts` is a
peer, not a translation of Spanish sentences: the English door is pitched at
foreign buyers, so translate intent and never invent a fact the Spanish does not
state. `npm run verify:i18n` walks both dictionaries side by side (keys, arity,
array lengths, empty strings) — the type gate alone does not catch a function
that quietly takes fewer arguments.

**Page titles** get their brand suffix once, from a `title.template` in
`app/layout.tsx`. A page returns only its own segment. OG titles do not inherit
the template, so those spell the brand out.

**Numbers are not copy.** `toLocaleString` takes a number locale derived from the
request (`es-PY` / `en-US`), not the dictionary.

**Filters — one vocabulary, two files.** `src/lib/facets.ts` is pure (the
`ListingFacets` type, query-string names, `parseFacetParams` and its inverse) and
is shared with client components. `src/lib/facet-sql.ts` is `server-only` and is
the **only** place a facet becomes a WHERE clause. Never add a facet in a page or
a route handler. A door's `filters` may only ever *narrow* what the visitor asked
for — conditions are ANDed, never merged over the visitor's choice. **A cached
query that filters by vertical must put the vertical key in its cache key**;
forgetting is a live cross-door data leak, since enabled doors declare different
filters today. `npm run verify:facets` covers the pure half.

**Caching — `unstable_cache` only, and every tag has a writer.** Every public
route is dynamic (the root layout reads the `Host` header), so `export const
revalidate` is silently dead — do not add one. Tags, TTLs and the
`revalidateListings()` / `revalidateDirectory()` / `revalidateGuides()` helpers
live in `src/lib/cache.ts`. `revalidatePath()` does **not** clear
`unstable_cache` entries — they are separate caches — so a new cached query
without a matching `revalidate*` call in the action that writes it reads to an
operator as "my save didn't work" until the TTL expires. **Dates do not survive
the cache boundary**: entries are serialized, a `Date` returns as an ISO string
and `string > Date` is silently false, so a cached query returning Dates re-wraps
them in its own exported wrapper, not in each consumer.

**Map coordinates are materialized at write time.** A listing is plotted at
`listings.display_lat/display_lng` — its own coordinate, else its location's
centroid — and `idx_geo` is `(status, display_lat, display_lng)`. Call
`syncDisplayCoords(conn, id)` from `src/lib/geo.ts` after any write that touched
`lat`, `lng` or `location_id`. **Never put `coalesce(listings.lat,
locations.lat)` back into a query**: it is not sargable, so every map pan scans
the published set. **Never add `IS NOT NULL` next to `display_lat BETWEEN …`** —
`BETWEEN` already excludes NULL, and the redundant predicate is what made the
planner fall back from `range` to `ref`. A moved centroid is the one staleness no
write hook can see: `npm run cron:geo` repairs it.

**SEO ownership is a check, not a convention.** Which host is canonical for
`/propiedad` (`ownsListingDetail`) and for the directory pages (`ownsDirectory`,
per locale) is declared in `verticals.ts`; a host's sitemap lists only URLs that
host owns, and hreflang is *derived* from the same table by
`languageAlternates()` (`src/lib/alternates.ts`) — never hand-maintained. A set
is emitted only when two doors serve **different** locales, and only a host that
owns the page type appears in it. `npm run verify:seo` refuses a push where two
served doors would own their `/propiedad` pages in the same language, where two
doors share a vertical key, or where a host key is spelled in a form
`resolveVertical()` never looks up. Keep any new host-specific page type on the
same rule: submitting a URL you canonicalise elsewhere is a Search Console error,
not a neutral extra.

**A rental URL is spelled in exactly one place: `rentalPath()`**, defined in
`src/config/rental-services.ts` (import-free, because `next.config.ts` reads it)
and re-exported from `@/design/sections`, which is where the app imports it from.
The rental family's own pages have a Spanish URL on one door and an English URL on
the other, and each door 301s the other language's — a literal `"/servicios/…"` at
a new call site is a link into a redirect on half the doors.

**Import pipeline.** `dedupKey()` returns `null` when there is no contact phone,
**and that is correct** — the key is bucketed, and the phone is the only thing
stopping those buckets from describing every unit in a building. Never invent a
fallback key. `listing_sources.scope_agency_id` is `NOT NULL DEFAULT 0` (0 =
unscoped) and is half of `uq_source`; making it nullable silently switches off the
"re-importing the same file changes nothing" guarantee, because MySQL treats NULLs
in a unique index as all-distinct. **Always pass an agency** to
`importListings({ agencyId })` — without it the listings belong to nobody and
their leads are unattributable. **The dry run and the commit share one planner**
(`planImport` / `commitImport`); never add a separate validation path. Permission
to import is a **column**, and `commitImportAction` refuses to write without it.
Every batch writes `import_jobs` + `import_rows` with pre-update values in
`previous_json` — that is what makes rollback real rather than a delete.

**Calling app code from a script.** Anything wrapped in `unstable_cache` throws
`Invariant: incrementalCache missing` when there is no Next.js runtime around it.
Batch code reads the uncached variant (`getUsdToPygRateRaw()`, not
`getUsdToPygRate()`); when you write a new cached reader that a job may reach,
give it an uncached sibling rather than making the job fake a runtime.

**Alerts never lie.** `alertOperator()` (`src/lib/crm.ts`) posts to
`LEAD_WEBHOOK_URL` if one is set, and does nothing if not. Same rule as `sendOtp`:
**never log a line that pretends a message was delivered.** With no webhook the
zero-config signal is the `/admin` badges.

---

## 5. Before you claim you are done

Every one of these, in order:

1. `npm run verify:local` — green. Not "green except".
2. `npm run verify:scopes` if you touched `listingScopeWhere`, `panelScope` or a
   panel query — and say in the PR whether a local database was available.
3. Ran every script you changed in its `--dry` form, against a real database if
   you have one. **If you could not, say so in the PR.** Never describe a run you
   did not perform, and never present a `--dry` result as a real one.
4. Re-read your own diff adversarially, as a reviewer looking for what CI would
   reject. Fix what you find before pushing.
5. `npm run db:status` if you touched `src/db/schema.ts` — and the PR title starts
   `MIGRATION REQUIRED —`, and you do **not** merge it.
6. Said plainly in the PR what you did not verify. An honest gap is information;
   an unstated one is a trap for whoever merges.

---

## 6. Stop and ask

Stop, write the question into `docs/decisions-needed.md`, and say so, for:

- **auth**, **payments**, or any **`src/db/schema.ts`** change beyond what your
  task explicitly authorised;
- a **founder decision**: money math, a rate, anything a visitor is told is a
  fact, a new brand or domain, a policy on user data;
- a missing credential with **no graceful fallback** (a missing env value on its
  own is never a blocker — document it in `.env.example` and degrade quietly);
- anything where guessing wrong forces a rewrite rather than an edit.

Everything else: choose, write down what you chose and why, and keep going. Minor
non-blocking findings go in `fable/KNOWN-ISSUES.md` — record them and carry on
rather than widening your diff.

**Model cost guardrail.** The Fable / Mythos-class models (`claude-fable-*`) are
never used for a phase, a subagent, a spawned session, a Workflow or a Routine
without the founder's explicit approval in that conversation. A session that
believes it needs one stops and says why; it never spawns one.

---

## 7. Where the history lives

These files explain *why*, and are not a substitute for anything above.

- **`CLAUDE.md`** — the verified state of the world. Its headings:
  "Domains", "Brand name", "Import pipeline", "Backlog state",
  "Caching", "Listing filters", "Map coordinates", "i18n", "CI",
  "Migrations". Read the domain table and the backlog before proposing work;
  the backlog says what is **deliberately not built** (R2 is written and waits on
  a bucket; the import image pipeline waits on R2; reviews need a founder
  decision). This file supersedes `CLAUDE.md`'s old "Working agreements" section.
- **`ARCHITECTURE.md`** — the design contract. Where it disagrees with
  `CLAUDE.md`, `CLAUDE.md` wins and the contract describes an intention.
- **`PLAN.md`** — product tracker: milestones, founder decisions D1–D21, the
  audit findings (F-numbers) many comments in the code cite.
- **`fable-plan-ops.md`** — the operations plan: `src/lib/ops/`,
  `/admin/operaciones`, and the human-inputs checklist.
- **`docs/log/`** — one file per shipped phase: what landed, what was not
  verified, the exact commands the founder still has to run.
- **`fable/KNOWN-ISSUES.md`** — findings recorded rather than fixed.
