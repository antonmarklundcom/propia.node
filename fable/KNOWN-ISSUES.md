# fable/KNOWN-ISSUES.md

Minor, non-blocking findings recorded by a phase session instead of widening
its own PR (plan §4.3). Each line says where it was found and what would fix
it; none of them blocks a phase.

## Open

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

- **`esAgentProfile` (`src/i18n/es.ts`) is imported directly into
  `app/agente/[slug]/page.tsx` rather than read through `dict()`, and has no
  English peer.** Found in S2 while adding the `profile`/`project`
  namespaces — the same shape KNOWN-ISSUES already records for `esPanel`,
  `esPublish` and `esOwner`. It predates this plan (it is above the "Batch 3"
  comment block in `es.ts`, not part of it) and covers ~10 agent-profile-only
  strings (contact copy, meta title/description, "Trabaja en", …), so porting
  it to an `enAgentProfile` is a job of its own, not a one-line addition. S2
  only pulled the two strings this page shared with the agency profile page
  (breadcrumb nav label, empty-state line) into the new `profile` namespace
  and left the rest of `esAgentProfile` as-is — `verify:i18n` cannot see it
  either way, since it never enters `Dictionary`. Fix: fold `esAgentProfile`
  into `dict()` with an `enProfile`/`agent`-shaped English translation, same
  D6 flip-day precondition as the panel/publish/owner namespaces.

- **Q1 (package manager) is still unanswered.** `fable/REVIEW.md` Q1 asks
  which package manager hPanel's build step actually runs for this site
  (`pnpm install` or `npm ci` — check the build log). Until Anton answers,
  plan §6.1's S1 phase leaves `pnpm-workspace.yaml`, `.npmrc` and
  `package-lock.json` untouched rather than guessing. Whoever gets the answer:
  if pnpm, commit a locally-generated `pnpm-lock.yaml` with the same major, add
  `"packageManager": "pnpm@<version>"` to `package.json`, delete
  `package-lock.json`; if npm, delete `pnpm-workspace.yaml` and `.npmrc`.

- **The home `<title>`'s tagline is hard-coded to Spanish for every door**
  (`app/page.tsx`: `brandTaglineFor("es")`). `brandTaglineFor` already takes a
  locale and `brand-server.ts` passes the vertical's, so
  realestateinparaguay.com's home has been titled "Real Estate in Paraguay —
  Encontrá tu propiedad en Paraguay" since the D6 flip. Found in O2
  (fable/plan-rentparaguay.md) and deliberately **not** fixed there: the fix
  changes a live door's `<head>`, and that phase's exit criterion is that the
  three live doors' `<head>` is byte-identical. The rental doors do not wait
  on it — they take their own tagline from `rental.metaTagline` — so this is
  now a one-line fix for the English marketplace door alone:
  `brandTaglineFor(vertical.locale)`, in its own PR, with the head diff
  reviewed rather than asserted empty.

- **The chrome's last hard-coded Spanish literals.** `SiteHeader` renders
  "Ingresar" for the login link and `MobileMenu` uses "Abrir menú" / "Cerrar
  menú" / "Menú principal" as its aria labels, in every language. The login
  one is invisible on the doors that matter (`chromeShowLogin` is false for
  the English and rental families), but the drawer's aria labels reach a
  screen reader on realestateinparaguay.com and on rentparaguay.com. Fix: two
  keys in `common`, read through `dict()` in the header and passed to the
  drawer as props (it is a client component). Not done in O2 because it
  touches a live door's rendered markup.
