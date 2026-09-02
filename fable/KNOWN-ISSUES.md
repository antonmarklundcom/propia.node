# fable/KNOWN-ISSUES.md

Minor, non-blocking findings recorded by a phase session instead of widening
its own PR (plan §4.3). Each line says where it was found and what would fix
it; none of them blocks a phase.

## Open

- **`app/tasacion/actions.ts:69` awaits `pushLead()` inside the server action.**
  Found in O1 while grepping the `crm.ts` consumers. Same shape as the lead
  route before this phase — the valuation lead is already in MySQL when the
  push runs, so the push is a copy that a visitor is nonetheless waiting for.
  It is bounded now (`crm.ts` caps a webhook round-trip at 5 s), which is why
  this is a note rather than a fix: plan §5.1 names the files O1 may touch and
  this is not one of them. Fix: move the `getCrm().pushLead(...)` call into
  `after()` from `next/server`, exactly as `app/api/leads/route.ts` now does.
  One line plus a try/catch; no behaviour a caller can see changes.

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

- **`npm run verify:scopes` has not been run since O1.** It refuses to run
  against anything but a localhost database, and there is none here. O1 touches
  no `listingScopeWhere`, `panelScope` or panel query, so it is not implicated;
  a session with a local database should still run it opportunistically.

- **A refused OTP request renders its countdown in raw seconds.** Found in O2.
  `PublishWizard.tsx:779` prints `${esPublish.resendIn} ${cooldown}s`, which was
  written when the only cooldown was `createOtp`'s 60 s — the new hourly cap
  reports the window itself, so a capped publisher reads "Reenviar en 3600s".
  Correct and honest, but nobody counts in thousands of seconds. Not fixed here
  because the phase's own rule is that a refusal reuses the existing result
  shape so no client change is needed. Fix: format `cooldown` as `m:ss` (or
  hours) in that one template literal, with the copy in `esPublish`.

- **`src/lib/rate-limit.ts` has no automated regression test.** O2 fixed a real
  bug in it — the sweep expired every bucket against whichever caller's window
  happened to trigger it, so a 5-minute `import-url` request wiped an hour-long
  `otp` bucket six minutes in and handed the counted user a fresh allowance.
  The fix (a per-entry `windowMs`) was proved with a throwaway script that fakes
  `Date.now`, reproduced against `origin/main` first; the script is not in the
  repo because the module is `server-only` and a `verify:` script would have to
  strip that import to load it. Anyone adding a third window should re-do that
  proof. A permanent check needs a decision about how a pure verify script
  imports `server-only` modules.

- **The `esPanel`, `esPublish` and `esOwner` namespaces have no English peer.**
  Noticed in O2 while adding `registerErrorThrottled`. Only eight namespaces are
  assembled into `Dictionary` (`src/i18n/index.ts:51`); the panel, publish and
  owner surfaces are read as direct `esPanel.*` imports, so `verify:i18n` never
  walks them and there is nothing to add an English string *to*. Adding one key
  to a non-existent `enPanel` is not a one-line change — it is porting ~400
  staff-surface strings — so O2 added its copy to `esPanel` alone. This is a D6
  flip-day precondition for `/registro`, `/publicar` and `/agencia`, and it is
  larger than any phase in this plan.
