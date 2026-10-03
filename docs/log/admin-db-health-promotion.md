# /admin database-connection health + /admin/google evergreen candidates (2026-10-03)

Branch `claude/admin-db-health-promotion`. No migration, no schema change, no
edit to `src/db/index.ts`, auth or payments.

## 1. "Conexiones y procesos" in /admin's "Salud del sitio" (super-admin)

Why: the "Failed query" errors are suspected to be the MySQL user's connection
limit, filled by orphaned copies of this app (docs/hosting-process-cap.md). The
box now shows the two views that confirm or rule that out.

- **Database** (`src/lib/runtime-health.ts`): `Threads_connected`
  (`SHOW GLOBAL STATUS`), `max_connections` and `max_user_connections`
  (`SHOW VARIABLES`, session scope — on an account with its own
  `MAX_USER_CONNECTIONS` that is the value shown), and the threads held by the
  app's database user (`information_schema.PROCESSLIST` where `USER` = the user
  part of `CURRENT_USER()`; without the PROCESS privilege a user sees only its
  own threads, which is the set wanted), plus how many of those are idle
  (`Sleep`). The four statements run one after another (one pool connection at
  a time). **Each read degrades on its own** to "no disponible"; the page call
  is wrapped in `.catch(() => null)` as the last guard, so a diagnostic never
  500s /admin.
- **This process:** pid, uptime, and the pool's bounds **read from the live
  mysql2 pool object** (`db.$client.pool.config`), not a copied constant —
  omitted when that object does not expose them.
- **Copies of this app on the host:** a `/proc` scan (Linux only, otherwise "no
  disponible"): processes whose cmdline is `next-server (vX)` (the title
  `next start` sets — what `pgrep -f next-server` in the hosting doc finds) or
  `… next start`, whose `/proc/<pid>/cwd` equals this process's cwd (the doc's
  `readlink /proc/$p/cwd` test). Shows copies, how many have PPID 1 (orphaned),
  their total threads (what the "Max Processes" cap counts), and how many other
  Next servers the account runs from other folders. A process whose cwd could
  not be read is never counted as a copy. Max 5 000 `/proc` entries, read in
  batches of 64.
- **Verdict line:** red when this user's connections are ≥ 80 % of
  `max_user_connections` (when that is non-zero), else red when
  `Threads_connected` ≥ 80 % of `max_connections`; otherwise one quiet line. A
  finding also appears when orphaned copies exist.
- **Never cached:** `getHealth()`'s `unstable_cache` entry lives in the build
  folder every copy shares, so a pid passed through it would describe whichever
  copy filled it.
- Pure half: `src/lib/runtime-health-rules.ts` (`parseProcStat`,
  `parseCmdline`, `looksLikeNextServer`, `summarizeCopies`,
  `connectionVerdict`, `showValue`). Copy: `src/i18n/es-admin-insights.ts`
  (panel copy is Spanish-only, own file like `es-triage.ts`).

## 2. "Candidatas a página evergreen" on /admin/google

- Category URLs (`/<op>/<ciudad>[/<barrio>]/<tipo>` or `/<op>/<ciudad>`, shape
  checked only by `parseOperation()` + `parseCategorySegments()` from
  `src/lib/urls.ts`) on the door's own host, with impressions in the 28-day
  window, **not evergreen** — neither on this door nor on another door in the
  same language (`verify:seo` allows one evergreen page per path per language,
  so such a path cannot be promoted here). Rows of the same path (query-string
  variants) are summed; position is impression-weighted. Top 20 by impressions,
  then clicks, then path. Columns: clicks, impressions, average position, the
  top 3 searches.
- The searches come from **one extra request per property**, `["page","query"]`
  with a `page includingRegex` pre-filter on the operation prefixes (5 000
  rows), through the existing signed-JWT `query()`. It has **its own six-hour
  `unstable_cache` entry** (`gsc:page-query`) and throws on failure, so a failed
  read is never cached and never costs the main report: the table then shows
  the pages without searches and a note with the error.
- The page request's category rows are kept on the cached report
  (`categoryPages`); the candidate list itself is derived per render.
- Pure half: `src/lib/gsc-candidates.ts` (`categoryPathOf`,
  `categoryPageFilterRegex`, `evergreenCandidates`).

## Checks

`npm run verify:admin-insights` (`scripts/verify-admin-insights.ts`, pure: no
DB, no network, no fs) — /proc stat and cmdline parsing, the Next-server match,
copy/orphan summary, the 80 % verdict (per-user and server-wide, `0` = no
per-user limit), `SHOW` row reading, uptime formatting, category path parsing
(shapes, hosts, trailing slash, query strings), the API pre-filter regex, and
candidate selection (registry exclusion, summing, weighted position, ordering,
cap, top queries, missing query data). Added to the end of `verify:local`, to
`.githooks/pre-push` and to both lists in AGENTS.md §2.

## What was NOT verified

- **No local database** was run: none of the four SQL statements has been
  executed against MySQL or MariaDB here. `information_schema.PROCESSLIST` vs
  `CURRENT_USER()` could hit a collation mismatch on some server; if it does,
  that one line reads "no disponible" rather than failing.
- **Not run against production**, and **not on Hostinger**: whether its
  launcher's copies really show `next-server` in `/proc/<pid>/cmdline`, and
  whether a hosted account may read `/proc/<pid>/cwd` of its own processes, is
  unproven. The `/proc/self/stat` parser was exercised against this sandbox's
  real `/proc` only.
- **No real Search Console call**: the page × query request (and its
  `includingRegex` filter, which Google evaluates as RE2) was never sent. The
  candidate logic is checked on synthetic rows only.
- /admin and /admin/google were not rendered in a browser; `typecheck` and
  `next build` passed.
