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
