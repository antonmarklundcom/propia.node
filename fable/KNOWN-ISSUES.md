# fable/KNOWN-ISSUES.md

Minor, non-blocking findings recorded by a phase session instead of widening
its own PR (plan §4.3). Each line says where it was found and what would fix
it; none of them blocks a phase.

## Open

- **Listing sidebar follow-up (2026-09-21): stored USD conversion.** Gs listings kept the `price_usd` of the rate they were written with (7300 on the demo rows). **Fixed in code 2026-09-22: `npm run cron:price-usd`** re-derives it from the latest `fx_rates` row (plan §4 rule); it still has to be run on production, between `cron:fx` and `cron:cuotas`. (The map pins' Spanish-only USD formatting noted here was fixed in #191: pins use the listing's own currency and the door's locale.)

- **Two `previous_json` readers still assume MySQL 8's parsed JSON (MariaDB
  only, 2026-09-23).** MariaDB stores `json` as `longtext`, so `mysql2` returns
  `import_rows.previous_json` as a string. `rollbackImportJob`'s restore of
  `updated`/`paused` rows parses it since #165 (`verify:import`'s "rollback
  restored the old prices" passes on the local MariaDB 11.4 as of 2026-09-23),
  but two readers do not: the `deduped` branch of the same rollback
  (`src/lib/import/jobs.ts`, `_sourceRowId`) then finds no id and falls back to
  its legacy best-effort delete, and `recentPriceChanges()`
  (`src/lib/import/resync.ts`) finds no `priceUsd` and lists nothing. Production
  is MySQL 8, where the column is native JSON, so neither is visible there.
  Fix, if local MariaDB parity matters: one `parseSnapshot(previousJson)` helper
  in `jobs.ts` used by all three readers.

- **Resolved by #165 (2026-09-21), entries removed 2026-09-23:** the rollback
  restoring nothing on MariaDB (it now parses string JSON), and `planImport`
  defaulting to the `unstable_cache` rate (it now defaults to
  `getUsdToPygRateRaw()`, `src/lib/import/upsert.ts`).

- **Plan Appendix B lists nine image slots S1 did not build.** `hero-home-2.webp`,
  `services.webp`, `contact.webp`, and a `-2` variant for `alquiler`,
  `administracion-airbnb`, `inmobiliaria-asuncion`, `residencia-paraguay`,
  `invertir-en-paraguay` and `domicilio-virtual` are in the plan's slot table
  and `docs/style/rentparaguay.com.md`'s original §4, but no component wires a
  second image for any service card, and `RentalContact`/the services hub
  section only ever render one photo. Plan §6.1's own exit rule is the grep-
  over-code equality, which is authoritative over the table, so S1 shipped
  only the nine slots the code references and left these nine unbuilt rather
  than inventing unused files. Fix: whichever phase adds a second photo to a
  service card or wires `RentalContact`'s hero image, convert the matching
  source file from plan Appendix B first, then add the `<Image>` — in that
  order, so the grep/ls equality never goes stale.

- **The O1 orphan-draft proof was not run against a real database.** Plan §5.1
  asks for it: throw before the `listing_sources` insert in
  `createClaimedDraft` and show no listing row survives. This sandbox has no
  Docker daemon and no localhost MySQL, so `docker compose up -d` cannot start
  one. The change is a `db.transaction()` of the same shape `upsert.ts` has
  used since audit F46, and `npm run verify:import` (pure half) is green, but
  nobody has watched the rollback happen. Anyone with a local database:
  `docker compose up -d && npm run db:migrate`, add a temporary
  `throw new Error("x")` before the `tx.insert(listingSources)` call, claim a
  URL through `/agencia/importar`, and confirm `select count(*) from listings
  where public_id = …` is 0.

- ~~**`npm run verify:scopes` has not been run since O1.**~~ **Run green on
  2026-09-10** in ops O1, on a local database, after fixing what had been
  stopping it: it died partway through with `Invariant: incrementalCache missing`
  the moment it reached `updateListing`, which reads the `unstable_cache`-wrapped
  USD→PYG rate. `src/lib/fx.ts` now falls back to the uncached read when
  `NEXT_RUNTIME` is unset, and all 60-odd scope, profile and session checks pass.
  Keep running it on anything touching `listingScopeWhere`, `panelScope` or a
  panel query.

- **RESOLVED 2026-09-22: `npm run verify:rate-limit`** (in `verify:local` and
  the pre-push hook) now pins the limiter with a hand-moved fake clock: exhausted
  allowance, the expiry boundary, the mixed-window sweep below, key independence.
  It imports the module through the `server-only` shim in `scripts/tsconfig.json`.
  Mutation-checked: reintroducing the pre-O2 sweep, or `>` → `>=` at the window
  boundary, fails it. History, kept for context:
  `src/lib/rate-limit.ts` had no automated regression test. O2 fixed a real
  bug in it — the sweep expired every bucket against whichever caller's window
  happened to trigger it, so a 5-minute `import-url` request wiped an hour-long
  `otp` bucket six minutes in and handed the counted user a fresh allowance.
  The fix (a per-entry `windowMs`) was proved with a throwaway script that fakes
  `Date.now`, reproduced against `origin/main` first; the script is not in the
  repo because the module is `server-only` and a `verify:` script would have to
  strip that import to load it. Anyone adding a third window should re-do that
  proof. A permanent check needs a decision about how a pure verify script
  imports `server-only` modules.

- **Panel and owner copy is Spanish-only, by decision.** `esPanel` and
  `esOwner` are read as direct imports (`app/admin/*`, `/agencia`,
  `/mis-avisos`), so `verify:i18n` never walks them. Publish is no longer part
  of this: `enPublish` is assembled into `Dictionary` (`src/i18n/index.ts`).
  An `enPanel` object exists in `en.ts` but nothing reads it through `dict()`.
  Staff and owner surfaces stay Spanish (`fable-plan-quality.md`); reopen only if
  English-speaking realtors appear.

- **Q1 (package manager) is still unanswered.** `fable/REVIEW.md` Q1 asks
  which package manager hPanel's build step actually runs for this site
  (`pnpm install` or `npm ci` — check the build log). Until Anton answers,
  plan §6.1's S1 phase leaves `pnpm-workspace.yaml`, `.npmrc` and
  `package-lock.json` untouched rather than guessing. Whoever gets the answer:
  if pnpm, commit a locally-generated `pnpm-lock.yaml` with the same major, add
  `"packageManager": "pnpm@<version>"` to `package.json`, delete
  `package-lock.json`; if npm, delete `pnpm-workspace.yaml` and `.npmrc`.

- **Closed 2026-09-22 (A8 docs pass), verified in code:** the home `<title>`
  tagline now uses `brandTaglineFor(vertical.locale)` (`app/page.tsx`); the
  header/menu labels are no longer hard-coded Spanish in `src/components`;
  `esAgentProfile` is read through `dict()` with an `enAgentProfile` peer.
  Their entries were removed from this file.

- **Local test data only: `/img/premium/*-thumb.webp` 404s (F-e, 2026-09-22).**
  Seven `listing_images` rows in the local MariaDB point at
  `/img/premium/…-1280.webp`, and `imageThumbUrl()` asks for a `-thumb.webp`
  that folder does not have. No shipped path writes such a key: uploads write
  the thumb too (`thumbKey()`), imports and `seed:sample-photos` store absolute
  URLs. No code change; delete or re-point those local rows if they get in the
  way. (Sample photos now do use their shipped thumbs, #186.)

- **Production does not show the pre-launch notice (2026-09-22).**
  `curl https://inmobiliaria.com.py/venta` has no `site-notice` markup, so
  hPanel has `NEXT_PUBLIC_UNDER_CONSTRUCTION=false` while the listings are
  still demo data. Founder decision: set it back to unset/true and rebuild, or
  keep it off once `seed:sample-photos` has marked every demo listing.
