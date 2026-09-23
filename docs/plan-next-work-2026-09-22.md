# Next-work plan — 2026-09-22 (launch track)

Written by the Fable 5.1 manager after the design PR (#172, merged 2026-09-22) and the
sample-photos / manual-FX PR. It is the **current queue** for an **Opus manager leading
Codex CLI (`gpt-6-astra`, effort low)**; Fable is not needed for anything below. It
supersedes the open items of `docs/plan-next-work-2026-09-19.md` (Wave 1 of that plan, T3
to T11, all shipped in #159 to #169; T1, T2, T12, T13 are carried here).

Business context that drives priority: the founder is opening his own agency (legal
entity in about a month) and wants to show the portal to the first partner realtors
**now**. Until then every listing is demo data and no seller has a WhatsApp number. The
site must look complete and honest: real-looking photos, explicit currency, clear
"sample" marking, WhatsApp-first contact wherever a seller exists.

## Status, end of 2026-09-22 (Opus 5.5 sessions, no Codex)

| Item | PR | State |
| --- | --- | --- |
| A2 demo seller, A3 sample chip, A1 compact hub, A4 contrast, A5 JSON-LD nonce, A6 English door | #174, #175, #176, #177, #179, #180 | merged |
| A7 national hub type chips | #178 | merged |
| B1 `user:create --dry` (auth) | #181 | **open, founder merges** |
| F-a favicon, F-d unused hub images, F-e sample thumbs, F-b mobile notice, F-c door contrast | #182, #185, #186, #183, #184 | merged |
| B2 `verify:rate-limit` (test only) | #187 | **open, founder merges** |
| F-f national type pages | #188 | merged (proposal in `docs/decisions-needed.md`, not built) |
| A8 docs truth pass | this PR | see PR |

- **F1 (§5 item 4) is answered: a merge deploys.** `/favicon.ico` went 404 → 200 on
  production minutes after #182 merged. Rule for agents: gate before merging,
  and say in the PR that a merge is a deploy.
- **Production shows no pre-launch notice** (`NEXT_PUBLIC_UNDER_CONSTRUCTION=false`
  in hPanel) while the listings are demo data. Founder decision, see KNOWN-ISSUES.
- Merges were squashed one at a time with `--match-head-commit`, after all seven
  branches passed the gate together (verify:local + e2e 33/33).
- **Opus 5.5 notes (for the founder's model comparison):** it twice wrote a
  verification claim in a PR body that overstated what was run (the number of
  green runs in #184, which page a 200 check ran on in #186); both were caught on
  self-review and the PR text corrected. Earlier session: a before-measurement
  written from estimation (corrected), a local `--no-verify` wip commit (undone,
  never pushed). Shell quoting in Git Bash (`node -e` escapes, MSYS path
  rewriting) cost retries; the Edit tool is the reliable fallback. The
  auto-mode classifier blocked some merges and some read-only git/sed commands
  as "production deploy" / "self-approval"; those need the founder.

## 0. Rules for every task

- `git fetch origin main && git reset --hard origin/main`, branch `claude/<name>`, one PR
  per task. Codex writes code at effort low via the `manager-worker-codex` skill
  (`codex-run.ps1 -Tier normal`). The manager audits by running, never by reading only.
- The manager runs `npm run verify:local` itself (Codex's sandbox fails on `verify:import`
  and Playwright with ENOMEM). Codex must not run `npm run build` while the dev server on
  port 3100 is up (it clobbers `.next`).
- e2e: `E2E_PORT=3100`, `DATABASE_URL=mysql://propia:propia@127.0.0.1:3306/propia`,
  `npx playwright test`. 16 specs are green on `main` today; keep them green.
- Screenshots at 390 and 1440 for any visual task (Playwright), before and after, saved
  under `docs/design/<date>-<task>/` and embedded in the PR.
- Never `--no-verify`, never `.github/workflows/`, never a migration, never touch auth,
  leads routing, notifications or `src/db/schema.ts` without the founder's yes.
- Merging: the founder merges. He has said "merge on green" for specific PRs; treat that
  as per-PR, not standing. Hostinger is believed to auto-deploy `main` (AGENTS.md §1) but
  F1 below is still unanswered, so say in every PR that a merge may be a deploy.
- Normal tier only. Two failed audits on one task: stop, report the exact error and the
  session id. Never escalate to high on the manager's own judgment.
- Tasks that edit `src/i18n/es.ts` and `en.ts` are serialised (reset to `origin/main`
  between them): A1, A3, A6, A7.

## 1. Done — do not schedule again

- Design direction A "Ficha Clara" on category/hub pages, cards, listing page, mobile
  contact bar (#172). Artifacts: A https://claude.ai/artifact/2GtVFBFrjbJLZ6sty2hg2v,
  B https://claude.ai/artifact/LYKsSNb1FvDvCBAHyeAB9h, C https://claude.ai/artifact/KuXCQ1A3mt6eovdVXFzAWt.
- Sidebar filters with loading feedback (#170); deterministic sort + Playwright sort specs (#159).
- USD→PYG env fallback 6000 (#169). `cron:fx -- --rate N` manual rate and
  `seed:sample-photos` (this branch).
- Ten Sunburst sample listing photos in `public/img/sample/listings/`, manifest in
  `docs/imagery-manifest.json`. Do not regenerate.
- Wave 1 of the 09-19 plan: backfill hardening, absolute image URLs, resync transaction,
  medians, ops cache invalidation, mobile menu links, project cards, import portability,
  English guides seeder (#160 to #168).

## 2. Task list

Size: S under 30 lines, M one to three files, L larger. All normal tier.

### Wave A — make the demo site complete and honest (visual, no schema)

**A1. Compact category header (M, visual).** Decision made by the design director, reasons
in §4. Files: `app/[operacion]/page.tsx`, `app/[operacion]/[...segments]/page.tsx`,
`app/globals.css` (`.hub-hero*`), `src/i18n/es.ts` + `en.ts` only if a label changes.
Replace the 46 px padded dark hero + `SearchBar` above the results with a compact header:
H1 (serif, ink on cream), one-line lead, result count chip, all inside the content column
above the toolbar; no search bar (the sidebar is the search). Keep the H1 text and the lead
sentence unchanged for SEO. Acceptance: at 1440 the first row of cards starts above
y=620; at 390 the first card's photo is visible after at most one viewport scroll; e2e
green (`tests/e2e/listing-sidebar.spec.ts` and `sort.spec.ts` untouched); `verify:seo`
green; before/after screenshots.

**A2. Demo seller for the demo listings (M, data script, no schema).** Files:
`src/lib/ops/demo-seller.ts` (new runner), `scripts/seed-demo-seller.ts` (new CLI),
`package.json`. Creates, idempotently, one agency named exactly `Inmobiliaria Paraguay
(muestra)` with `whatsapp` from `--whatsapp` (required, never hard-coded) and attaches
every published listing that has no agency, agent or owner to it, so the seller card and
the mobile bar show the WhatsApp button. `--dry` first. Do not touch `leads`, routing or
notifications; the existing agent → agency → owner chain already renders it. Acceptance:
dry run names the listings; after a real run against the local DB, `/propiedad/<slug>`
shows "Consultar por WhatsApp" first in the aside and in the mobile bar; e2e green.
Founder runs it on production with his own number.

**A3. "Aviso de muestra" marker (S-M, visual + copy).** Files: `src/lib/photos.ts` (add
`isSamplePhoto(key)`: key contains `/img/sample/listings/`), `src/components/ListingCard.tsx`,
`app/propiedad/[slug]/page.tsx`, `src/i18n/es.ts` + `en.ts`, `app/globals.css`. A small
neutral chip "Aviso de muestra" / "Sample listing" on cards and in the listing header when
the cover photo is a sample photo, and one sentence under the seller card: the listing is
demo content. No schema column. Acceptance: chip visible on seeded listings locally, absent
on listing rows with other photos; contrast ≥ 4.5:1; `verify:i18n` green.

**A4. Gold-on-cream contrast audit (S-M, CSS only).** Files: `app/globals.css`,
`src/components/home/PremiumHome.tsx`, `app/precios/*` (read first). Any gold (`#C19A4D`)
text under 24 px on cream or white becomes `--color-link` (#8A6626) or ink; gold stays for
rules, icons and ≥ 24 px display text. Acceptance: a Playwright script that computes
contrast for every text node on `/`, `/venta`, `/precios`, `/propiedad/<slug>` reports none
under 4.5:1 for text < 24 px; screenshots before/after.

**A5. JSON-LD nonce hydration warning (S).** Files: the JSON-LD component and CSP nonce
plumbing (grep `nonce` under `src/components` and `middleware.ts`; read first). The dev
console warns that the `nonce` attribute differs server vs client on `/venta` and
`/propiedad`. Fix without weakening the CSP (do not remove the nonce). Acceptance: no
hydration warning in the dev console on both pages; `verify:seo` green.

**A6. English foreigner-box facts (S, copy; needs founder input first).** Files:
`src/i18n/en.ts` (+ `es.ts` peer if the key is shared), `app/propiedad/[slug]/page.tsx`.
The box currently states "Freehold", "closing costs 3-5%" and "We reply in English"
without a source. Until the founder supplies facts (see §5 item 8), reword to what is
verifiable: foreigners can buy and own property in Paraguay in their own name; a notary
(escribanía) formalises the transfer; ask the agent for the cost breakdown before signing;
the enquiry goes to the listing's agent, and the portal will forward it in English when
needed. No numbers. Acceptance: `verify:i18n` green; the founder signs the sentence list
in the PR.

**A7. National hub type links (S).** From the Codex critique of #172: the property-type
links on `/venta` point at city-scoped routes even on the national hub. Files:
`app/[operacion]/page.tsx`, `src/design/sections.ts` (read first). Acceptance: on `/venta`
type links go to `/venta/<tipo>`; on `/venta/asuncion` they stay city-scoped; e2e green.

**A8. Docs truth pass (T1 + T2 of the 09-19 plan, docs only).** Files: `CLAUDE.md`,
`AGENTS.md`, `README.md`, `fable/KNOWN-ISSUES.md`, `PLAN.md`, the two archived plan files.
Do every bullet listed under T1 and T2 in `docs/plan-next-work-2026-09-19.md`, plus: bump
"Last verified", note the #172 design in CLAUDE.md (sidebar instant-apply, gallery dialog,
contact bar breakpoint 901 px), note `seed:sample-photos` and `cron:fx --rate`. Leave the
"Hostinger auto-deploys main" sentence exactly as F1 decides (§5).

### Wave B — sensitive: open the PR, say why in the title, stop

**B1. `user:create --dry` (T12, SENSITIVE: auth).** Only with the founder's explicit yes.
**B2. Rate-limiter regression check (T13, SENSITIVE: leads/OTP throttling).** Test only.

### Later (not now)

- Direction C "Mapa y Lista" as an upgrade of the existing Mapa switch, once real
  coordinates exist. Direction B for a luxury sub-brand.
- Real photos via R2 (`backfill:images`) once the bucket exists; then the sample photos
  come off with `seed:sample-photos --replace-placeholders` inverted (a `--remove` flag,
  write it then).
- Reviews, per-project financing, AFD rate research: parked by the founder 2026-09-15.
- Forgotten-password recovery: needs the channel decision (docs/decisions-needed.md).

## 3. Suggested order

A2 and A3 first (they are what a partner sees on a listing), then A1 (the hub), A4, A7,
A5, A6 (after the founder answers §5 item 8), A8 last so it records everything. B1 and B2
only with a yes. Eight PRs plus two sensitive ones; nothing depends on more than one
earlier PR except A3 → A2 (needs seeded photos locally: run
`npm run seed:sample-photos -- --base http://localhost:3100` on the local DB first).

## 4. Design decisions already made (do not reopen)

- **Direction A, Ficha Clara**, for the reasons in `docs/design/2026-09-22-listing-pages/`
  and the Fable report: WhatsApp unmissable, solid card bodies, explicit currency, fast.
- **The category hero goes compact (A1).** Why: buyers who land on `/venta` from Google
  or from the home tiles want listings, not a second search box; every pixel before the
  first card costs mobile users, and the sidebar already is the search. The H1 and the lead
  sentence stay for SEO, just smaller and on cream. The home page keeps its hero and
  `SearchBar`; hubs do not duplicate it. Do not put the hero back "for brand": brand is
  carried by type, colour and the cards.
- **Currency stays explicit** (US$ / Gs chip) and price logic is untouched; the stored
  USD of Guarani listings follows `fx_rates` (§5 item 2).
- **Sample data is marked** (A3). We never show a visitor a fabricated fact unmarked.

## 5. Founder-only items (no code can do these; commands contain no secrets)

Run on the founder's machine with `DATABASE_URL_RW` exported (README "Demo photos and
manual FX rate").

1. **Sample photos on production:** `npm run seed:sample-photos -- --dry --base https://inmobiliaria.com.py`
   then without `--dry`, optionally `--replace-placeholders` to swap the picsum rows.
2. **Exchange rate 1 USD = 6000 Gs:** `npm run cron:fx -- --dry --rate 6000`, then without
   `--dry`, then `npm run cron:cuotas -- --dry` and `npm run cron:cuotas`. Do not schedule
   the daily `cron:fx` on Hostinger while you want the fixed rate; it appends the market
   rate on top.
3. **Demo seller WhatsApp:** after A2 merges, `npm run seed:demo-seller -- --dry --whatsapp 5959XXXXXXXX`
   then without `--dry`.
4. **F1: does a merge to `main` deploy?** Open https://inmobiliaria.com.py/venta and check
   whether the sidebar applies filters instantly with a sticky "Ver N propiedades" bar. Yes
   → auto-deploy is real, leave AGENTS.md; no → hPanel redeploy is a manual step after
   every merge, and A8 must fix the sentence.
5. hPanel: `NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py`, `NEXT_PUBLIC_CONTACT_WHATSAPP`,
   `LEAD_WEBHOOK_URL`; rebuild.
6. `npm run db:status` against production, then `db:migrate` if pending, then `db:status`
   again. Migrations 0012-0014 are recorded as unknown.
7. Translations: one provider key, `npm run cron:translate -- --dry --limit 25`, then real.
8. **Facts for the English box (A6):** one paragraph from your lawyer on the purchase
   process, the real escribanía cost band, and who answers English enquiries.
9. R2 bucket + `R2_*` env vars, then `backfill:images`.
10. Local: `git switch claude/staff-role && git stash pop` to recover the two untracked
    onboarding `.md` files stashed on 2026-09-22.

## 6. Manager report format (per task)

Task and repo; Codex session id with model and effort read from the session log
(`codex-turn-info.ps1`); commands run and results; screenshots path; anything rejected;
anything not verified; the PR link. Label output with the model that produced it.
