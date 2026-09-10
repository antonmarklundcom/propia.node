# Business review and site audit — 2026-09-10

Written by a Fable coaching session at the founder's request. No code was
changed. Strategy first, then what a full local crawl of all six doors found.

## 1. Where the money is (ranked by speed to cash)

1. **Brokerage commission** on the founder's own inventory and the lawyer
   arrangement. The only four-figure-USD line possible this quarter. The
   lawyer agreement in PLAN.md may be unsigned. Sign it first.
2. **Rental services** (rentparaguay.com / alquiler.com.py): management,
   Airbnb, virtual address, residency. Recurring and high-ticket, paid in USD
   by foreigners. Code is done; only DNS + `NEXT_PUBLIC_CONTACT_WHATSAPP`
   hold it back.
3. **Brochure sites + VenderCRM** for SMBs (php-site-template). Invoiceable
   next week; funds the VPS, domains and AI usage.
4. **Agency destacado plans** (Gs 400k–600k/mo, invoiced by transfer, admin
   toggle on `featured_until` + `agencies.plan`). Only after real supply,
   real photos and measurable traffic exist.
5. **Seller-lead fees** on inmobiliarios.com.py. Needs 30+ verified agents.
   Twelve-month money.
6. **Licensing the engine to other portals**: not a business. Its useful
   descendant is D21 (agency-mode site) sold with VenderCRM to paying
   agencies, Q1 2027.

Nothing in the portal is monetized today: no payment integration, D5 still
undecided, `/planes` says "A convenir".

## 2. Verified state of the site (local crawl, 62 pages, 6 doors)

Method: MariaDB + the repo's migrations/seeds, 47 seed listings published
through `/admin/importar`, crons run, Playwright at 1280 px and 390 px on
every public route with `Host` mapped to each door over a local TLS proxy.

- **All six doors render, zero console errors, zero 500s.** Canonicals,
  hreflang and the directory-door 308s behave exactly as CLAUDE.md says.
- **Visible placeholder copy on the English door.** `src/i18n/en.ts` has 23
  "(verify before launch)" strings that render to visitors on the home page
  (freehold, purchase costs, notary timelines, taxes). Real figures or
  removal, before the English door is promoted anywhere.
- **No WhatsApp CTA on a listing without agency/agent/owner contact.** The
  detail page's WhatsApp bar renders only from `agent ?? agency ?? owner`.
  Unscoped imports (all 47 seeds) show two identical email forms and no
  WhatsApp button. Fallback to `NEXT_PUBLIC_CONTACT_WHATSAPP` is the fix.
- **Two identical contact forms on the detail page** (sidebar + bottom).
  Keep one; make the other a sticky WhatsApp bar.
- **Every listing card shows "Publicado en inglés"** on the Spanish home,
  and every rail on the Spanish home is rentals only ("Recién publicadas").
  Both read wrong to a Paraguayan buyer; check the pill's condition and
  mix operations in the rail.
- **Image slots are empty everywhere**: city tiles, listing photos ("Fotos
  próximamente"), 4 of 7 rentparaguay.com service cards. R2 bucket +
  `backfill:images` + Higgsfield for the static slots.
- **`/planes` quotes no number** for Destacado. Put Gs 450.000/mes on it and
  invoice by transfer; "a convenir" costs the sale.
- **The under-construction banner** is on every door until
  `NEXT_PUBLIC_UNDER_CONSTRUCTION=false`. Fine until real photos exist.
- **Bug: `npm run import:csv` crashes outside Next** with "incrementalCache
  missing in unstable_cache" because the import writers call
  `getUsdToPygRate()` (cached) from `src/lib/fx.ts`. Scripts should call
  `getLatestFxRateRaw()`. The admin UI import is unaffected.
- **Rental cards on the English door show rents in Gs** ("Gs 2,900,000").
  Foreign renters think in USD; show the USD equivalent first there.
- Good: inmobiliarios.com.py home is the cleanest page in the portfolio.
  The English door's guide-first home is the right pitch for its buyer.
  rentparaguay.com reads like a real business.

## 3. Domains: what to change

- **Keep**: inmobiliaria.com.py (primary), realestateinparaguay.com,
  rentparaguay.com. Buy/confirm **alquiler.com.py** only if cheap; else
  rename the entry to `es.rentparaguay.com` (one line, per the plan).
- **terreno.com.py**: keep as is. It is a feeder that canonicalises away;
  spend nothing more on it.
- **inmobiliarios.com.py**: point DNS, keep `ownsDirectory` where it is
  until then, treat it as your own seller-lead funnel until agents exist.
- **Do not buy**: desarrolladores.com.py, casas/departamentos/etc. Each
  Spanish door duplicates the same rows and adds hreflang/maintenance
  surface with no ranking gain.
- **Same Node app for everything**: yes. One repo, one DB, doors by Host is
  the right call and is now proven across six hosts. Never fork.

## 4. Top changes (ordered)

1. Founder ops week (no code): lawyer agreement; `NEXT_PUBLIC_CANONICAL_HOST`
   → inmobiliaria.com.py + rebuild; R2 bucket + envs; GA4 + Search Console
   on every live door; hPanel crons; rotate DB/admin passwords, drop the `%`
   grant; `LEAD_WEBHOOK_URL` → n8n → WhatsApp to you; `cron:translate --limit`.
2. Move the app off the 91-site shared account (96%, max processes breached)
   to a small KVM VPS.
3. Real supply: 300 real listings with real photos in Gran Asunción, own
   inventory first, then 10 agencies' spreadsheets with written permission
   in exchange for a 60-day destacado trial.
4. Fixes from §2: en.ts placeholders, WhatsApp fallback, duplicate form,
   "Publicado en inglés" pill, rail mix, price on Destacado, CLI import bug.
5. D5 the cheap way: admin toggle for `featured_until` + `plan`, invoice by
   transfer. No payment integration.
6. Turn on the rental doors (DNS + WhatsApp env + WordPress redirect check).

## 5. Feature ideas worth building later (not now)

- Price-history table + quarterly "Informe de precios" (data moat, PR links).
- Barrio guides ("vivir en {barrio}") and English buyer guides.
- WhatsApp-first lead flow: sticky bar on every listing, one-tap prefilled
  message, operator reply SLA under 5 minutes.
- Agency bundle: D21 agency-mode site + VenderCRM at a partner tier.
- Lightweight buyer retention (favourites + weekly "nuevos en tu zona").
- inmobiliarios D3 matching only once 10+ verified agents exist.

## 6. Freeze list

No new doors, no D3, no reviews, no D21, no `/es/` prefix, no payment
integration, no further i18n, until money moves.
