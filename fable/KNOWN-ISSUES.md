# fable/KNOWN-ISSUES.md

Minor, non-blocking findings recorded by a phase session instead of widening
its own PR (plan §4.3). Each line says where it was found and what would fix
it; none of them blocks a phase.

## Open


- **Resolved 2026-09-29: foreign-buyer details in the operator's go-look
  alerts.** `sendLeadCopies()` now takes the details block and
  `esPanel.alertNewLeadDetail` appends it as one line ("Datos del comprador:
  …", newlines folded to " · ", cut at 220 characters by
  `buyerDetailsAlertText()`), so Telegram, `OPERATOR_EMAIL` and the
  `operator_alert` text carry it. The owner email and partner share email still
  leave the message out on purpose. Checked in `verify:prices`.
  (`/comparar`'s price row and the category map's pins went US$-first on the
  English doors on 2026-09-27, `claude/usd-first-compare-map`.)

- **Resolved 2026-09-27 (#236): cold home
  renders 500ing on "Queue limit reached"** (found by `verify:live` the same
  day). Reproduced locally at 6 of 8 cold homes → 500; now 0 of 8, 0 of 16 and
  0 of 42 in a mixed homes + category burst, with the pool bounds untouched.
  Three changes: `singleFlight()` in `src/lib/cache.ts` (Next 15.5's
  `unstable_cache` runs every concurrent miss — the header, footer and home
  each ran the same navigation read), the home payload's ten reads capped at
  two at a time, and `src/lib/degrade.ts` — a non-essential section rejected
  by a full pool queue is retried once, then renders empty for that request
  only (never cached), while a SQL error or every section failing still
  fails the page. Still true by design: under a full multi-second stall,
  essential category/hub reads (`resolveCity`, the grid, the hub counts) 500.
  `verify:live` still paces itself two requests at a time; that is politeness
  to production now, not a workaround.

- **Listing sidebar follow-up (2026-09-21): stored USD conversion.** Gs listings kept the `price_usd` of the rate they were written with (7300 on the demo rows). **Fixed in code 2026-09-22: `npm run cron:price-usd`** re-derives it from the latest `fx_rates` row (plan §4 rule); it still has to be run on production, between `cron:fx` and `cron:cuotas`. (The map pins' Spanish-only USD formatting noted here was fixed in #191: pins use the listing's own currency and the door's locale.)

- **Resolved 2026-09-26: the two `previous_json` readers that assumed MySQL 8's
  parsed JSON.** Production is MariaDB 11.8 (not MySQL 8, as this entry used to
  say), so the rollback's `deduped` branch and `recentPriceChanges()` were
  live bugs there. All three readers now go through `parseSnapshot()`
  (`src/lib/import/snapshot.ts`), checked by `verify:import`.

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

- **Resolved in #219 (E2/E3): `db:status` crashed against MySQL 8.4 (found 2026-09-26, build A2).**
  `readDatabaseStatus()` (`src/lib/ops/migrations.ts`, the `liveCols` loop)
  reads `r.table_name`, but MySQL 8.x returns `information_schema` column
  names upper-case (`TABLE_NAME`) unless the query aliases them, so it throws
  `Cannot read properties of undefined (reading 'toLowerCase')`. Seen on the
  docker-compose `mysql:8.4` image; production is MariaDB 11.8, where it runs.
  Fixed with `AS table_name` aliases in that SELECT (`src/lib/ops/migrations.ts`).

- **Resolved by `claude/partner-loop-polish` (stacked on #226): Telegram link tokens never expired (found 2026-09-27, #226 review).**
  `src/lib/telegram.ts` derives the `/start` token as an HMAC of the user id,
  so a forwarded or screenshotted `t.me/…?start=` link can re-link that
  partner's alerts to another chat at any time, silently. Alerts carry no
  buyer data (listing title + panel link), so exposure is small. Fixed with
  both: the token now carries its issue time (still HMAC-signed, constant-time
  compare, bounded regex) and is refused after one hour, and a `/start` from a
  different chat than the one already linked is refused with "disconnect
  first" (`linkTelegramChat()`, guarded in the UPDATE's own WHERE). Residual:
  within that hour, a forwarded link still links a partner who has no chat
  linked yet. Checked by `npm run verify:telegram` and `verify:scopes`.

- **Resolved by `claude/partner-loop-polish` (stacked on #226): Telegram partner alerts were always Spanish (found 2026-09-27, #226 review).**
  `src/lib/partner-alerts.ts` builds every message from `esTelegram`, although
  `shareRecipients()` returns each partner's `locale` and the email notice
  uses it. An English-locale partner gets the email in English, Telegram in
  Spanish. Fixed: `src/i18n/en-telegram.ts` is the peer (wired as `telegram`
  in both dictionaries, so `verify:i18n` walks it), every alert and reminder
  is built per chat in its owner's `users.locale` (`src/lib/telegram-text.ts`),
  with the listing's English title when `cron:translate` has reached it. The
  bot's replies follow the linked user's locale, else the Telegram app's
  language. The operator's own reminder alert and the panel screens stay
  Spanish.

- **Open: Ypacaraí sits under Paraguarí in the location tree (found 2026-09-27, evergreen PR 2).**
  `src/lib/ops/location-tree.ts` lists Ypacaraí as a child of the Paraguarí
  departamento; the town is in Central. URLs use the city slug only
  (`/venta/ypacarai/terrenos`), so no page is wrong today, but its
  `locations.full_slug` (`paraguari/ypacarai`) and any departamento-level
  grouping are. Moving it changes a `full_slug` on production, so it wants a
  look at what `seed:locations` does with a moved node before it is edited —
  not done in this PR.

- **Open: `--color-success` is not defined anywhere (found 2026-09-28, page-speed PR #244).**
  `.panel-status--published` in `app/globals.css` uses `var(--color-success)`,
  which no stylesheet or theme declares, so the "Publicado" pill renders in
  the inherited ink colour instead of green. The page-speed cells on
  `/admin/analitica` use their own `.panel-vital--*` colours for that reason.
  Fix: declare `--color-success` next to `--color-error` in `:root` (and check
  the themes in `src/design/themes.ts`) — a one-line CSS change, not done here
  to keep the PR to its subject.
