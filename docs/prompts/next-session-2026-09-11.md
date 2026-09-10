# Next session — 2026-09-11

Read `docs/strategy/2026-09-10-business-review.md` first, then `CLAUDE.md`.

## Founder, by hand (no Claude needed, do these before any code)

1. Sign or confirm the lawyer agreement.
2. hPanel: `NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py`, create the R2
   bucket and set `R2_*`, set `NEXT_PUBLIC_CONTACT_WHATSAPP`, rebuild.
3. GA4 + Search Console for inmobiliaria.com.py, realestateinparaguay.com,
   terreno.com.py; submit each `/sitemap.xml`.
4. Rotate the MySQL and admin passwords; delete the `%` Remote MySQL grant.

## Session A — Sonnet (fixes, one PR each, self-merge when green)

Paste into a new Claude Code chat on the repo, model **Sonnet**:

> Read `docs/strategy/2026-09-10-business-review.md` §2 and `CLAUDE.md`.
> Do these as separate small PRs on `claude/<name>` branches, running
> `npm run verify:local` before every push, no schema changes, no new
> visitor-facing literals outside `src/i18n/*`:
> 1. `fix-en-placeholders`: remove or replace every "(verify before launch)"
>    string in `src/i18n/en.ts`. Where the Spanish dictionary states the
>    fact, translate it; where it does not, drop the claim rather than
>    invent a figure. Keep `verify:i18n` green.
> 2. `whatsapp-fallback`: on `app/propiedad/[slug]/page.tsx`, when no
>    agent/agency/owner WhatsApp exists, fall back to `CONTACT_WHATSAPP`
>    from `src/config/contact.ts` (null-safe: no number, no button). Remove
>    the duplicated bottom contact form; keep the sidebar form and the
>    sticky WhatsApp bar.
> 3. `card-pill-and-rails`: find why `ListingCard` shows "Publicado en
>    inglés" on every card on the Spanish door and gate it correctly; make
>    the home "Recién publicadas" rail mix venta and alquiler.
> 4. `planes-price`: in `app/planes/page.tsx` set Destacado to
>    "Gs 450.000 / mes", note "facturado por transferencia, sin permanencia".
> 5. `cli-import-fx`: `scripts/import-csv.ts` crashes with "incrementalCache
>    missing in unstable_cache" because the import writers call the cached
>    `getUsdToPygRate()` in `src/lib/fx.ts`. Make the import path usable
>    from scripts (raw read when not in the Next runtime) without changing
>    app behaviour. Prove with `npm run import:csv -- data/sample-listings.csv whiteglove`
>    against a local MySQL.
> Log each PR in `docs/log/` in the existing style.

## Session B — Opus (structural, open PR and stop)

Model **Opus**, after Session A merges:

> Read `docs/strategy/2026-09-10-business-review.md` §4 item 5, PLAN.md D5
> and `CLAUDE.md`. Build the invoice-and-toggle version of featured
> placement, no payment integration, no schema change: in `/admin/inmobiliarias`
> let a super-admin set `agencies.plan` and, per listing in
> `/admin/propiedades/[id]`, `listings.featured_until`; call the matching
> `revalidate*` helper on write (CLAUDE.md caching rule); show the plan and
> featured state in `/agencia`. Add a one-line "facturado por transferencia"
> note in the panel. `verify:local` green, PR open, do not merge.

Do not use Fable for either session (fable-cost-guardrail). Fable is for
planning and review only, and this file already contains the plan.
