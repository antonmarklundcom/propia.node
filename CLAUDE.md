# CLAUDE.md — current reality of this project

`ARCHITECTURE.md` is the design contract. **This file is the state of the
world.** Where the two disagree, this file wins and ARCHITECTURE.md describes
an intention that has not happened yet. Read both before building.

Last verified against the code: 2026-08-02.

## Domains — read this before touching canonicals, metadata or BRAND_NAME

| Domain | Reality |
| --- | --- |
| `realestateinparaguay.com` | **This app, live, today.** Serves the Spanish marketplace. This is the only production host. |
| `propia.com.py` | **NOT owned.** Aspirational only. It is hardcoded as the `CANONICAL_HOST` default in `src/config/verticals.ts` and appears throughout ARCHITECTURE.md, README.md and `.env.example` — all of that is a plan, not a fact. |
| `inmobiliaria.com.py` (singular) | Owned by the founder, for his **own individual estate agency brand**. NOT this marketplace. Never wire it into this app. |
| `inmobiliarios.com.py` (plural) | Not owned. The future agent-directory vertical already declared in `verticals.ts`. Distinct from the singular above — do not conflate them. |
| `*.hostingersite.com` | Hostinger's raw deploy host. Never a canonical target. |

Consequences that bite:

- `siteOrigin()` / `listingCanonicalOrigin()` in `src/lib/origin.ts` emit
  `PRIMARY_ORIGIN` (= `https://${CANONICAL_HOST}`) for any host that is not an
  `enabled` vertical. With the shipped config that means the live site
  advertises canonicals on a domain that does not resolve.
- `CANONICAL_HOST` is not just an origin string: `verticals.ts` derives
  `DEFAULT` from it (`VERTICALS[CANONICAL_HOST]`). Pointing it at
  `realestateinparaguay.com` while that entry still says `locale: "en"` +
  `filters.foreign_exposure` silently switches the whole live site to English
  and filters the listing set. **Change the env var and the vertical entry
  together, never one alone.**

## Brand name — UNDECIDED, do not "fix" it piecemeal

`src/lib/brand.ts` exports `BRAND_NAME = "Homes Paraguay"`. The architecture,
domain plan, session cookie (`propia_session`), localStorage keys and support
email (`hola@propia.com.py`) all say *propia*. This is an unfinished rebrand,
and **the founder has not picked the final name** — partly because
`propia.com.py` is not owned.

Until he decides:

- Do **not** mass-rename to either name.
- **Do** route every user-visible occurrence through `BRAND_NAME` so the
  eventual decision is a one-line change. Hardcoded `"Homes Paraguay"` string
  literals still exist in `src/i18n/es.ts` and several `app/admin/*` and
  `app/**/page.tsx` metadata titles — those are the debt to clear.
- The site is **Spanish-only** for now. The English vertical waits until the
  Spanish site is finished.

## Backlog state (verified, not remembered)

1. **R2 image storage** — code is complete (`src/lib/r2.ts`,
   `src/lib/listing-images.ts`, both photo panels gate on `isR2Configured()`).
   Blocked purely on the founder creating the Cloudflare account/bucket and
   setting `R2_*` env vars. **Do not build around it or re-implement it.**
2. **`NEXT_PUBLIC_CANONICAL_HOST`** — see the domain trap above.
3. **Individual agent profile pages** — done (`/agente/[slug]`, PR #32,
   2026-07-31). Mirrors `/inmobiliaria/[slug]` (PR #28): same indexability
   rule, same DB-backed no-static-cache pattern. `app/agente/[slug]/page.tsx`.
4. **Reviews/ratings** — does not exist. Needs a migration and a moderation /
   anti-fake-review design. **Ask the founder before starting.**
5. **Financing rates** — `che_roga_pora` (6.50%) and `afd_primera_vivienda`
   (9.00%) in `scripts/seed-financing.ts` are **placeholders**. They feed
   `npm run cron:cuotas`, which caches `listings.cuota_gs`, which is printed on
   every venta card. Wrong rates = wrong money sitewide. Verifying them against
   published AFD/MUVH terms is a research task, not a code task.

## Working agreements with the founder

- **Autonomous build + merge is authorised** for well-verified, low-risk work
  (CSS, UI, copy, docs). Zero live users, everything git-revertible.
- **Flag before merging** anything touching auth, payments, or the DB schema.
- **Always** `git fetch origin main && git reset --hard origin/main` before
  branching. Merges happen through the GitHub API, so local `main` goes stale
  and a merged PR can look "missing". This has already cost a session.
- Verify with `npx tsc --noEmit` **and** `npm run build` before merging;
  Hostinger auto-deploys `main` with no staging environment.
- Branch naming: `claude/<feature-name>`.
