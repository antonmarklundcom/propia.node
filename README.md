# propia — Paraguay real-estate portal

One Next.js engine, multiple branded doors. propia.com.py launches first.
Read `ARCHITECTURE.md` before building anything — it is the contract.

## Stack

Next.js (App Router) · TypeScript · Drizzle ORM · MySQL 8 (Hostinger) ·
Cloudflare R2 (images) · MapLibre + OSM (maps) · GHL (CRM/WhatsApp/OTP).

## Local development

```bash
cp .env.example .env          # fill in values
docker compose up -d          # local MySQL 8 on :3306
npm install
npm run db:generate           # generate SQL migrations from src/db/schema.ts
npm run db:migrate            # apply them
npx tsx scripts/seed-financing.ts
npm run dev                   # http://localhost:3000
npm run db:studio             # Drizzle Studio — interim admin UI
```

## Hostinger production setup (one-time)

1. **MySQL (free, included in the plan):** hPanel → Databases → MySQL
   Databases → create database + user. Note host/db/user/password →
   `DATABASE_URL`. Enable **Remote MySQL** for your IP if you want to run
   migrations from your machine. Per-database size limit (~3 GB on most
   plans) is a non-issue: 15k listings is tens of MB — photos live on R2,
   never in the DB or on hosting disk.
2. **Node.js app:** hPanel → your site → set up a Node.js application
   (requires a plan with Node.js support — Cloud/Business hPanel plans have
   it; classic PHP-only shared plans do not. If your plan lacks the Node.js
   option, the cheapest fixes are upgrading to Cloud or a small Hostinger
   KVM VPS in the same São Paulo region). Point it at this repo (git
   deploy), build command `npm run build`, start command `npm run start`.
3. **Domains:** point propia.com.py (and later feeder domains) at the same
   app. `middleware.ts` routes by Host header; disabled verticals resolve to
   propia.
4. **Cron jobs:** hPanel → Cron Jobs → schedule
   `npx tsx scripts/<job>.ts` (medians nightly, cuota nightly, counts
   hourly, sitemap nightly). Every script must stay idempotent.
5. **R2:** create the bucket in Cloudflare, fill the `R2_*` envs, map
   `img.propia.com.py` to it.

## Repo map

```
ARCHITECTURE.md            the contract — read first
src/db/schema.ts           entire data model (Drizzle, MySQL dialect)
src/config/verticals.ts    domain → vertical routing config (propia only enabled)
src/lib/indexability.ts    thin-page rule — the ONLY indexability logic
src/lib/cuota.ts           French amortization / financing-program engine
src/lib/crm.ts             CRM boundary — the only file that knows about GHL
src/i18n/es.ts             canonical voseo strings (never neutral Spanish)
src/design/tokens.ts       design tokens v1
middleware.ts              host-header vertical resolution
scripts/                   cron-run idempotent jobs (seeds, medians, sitemap…)
```

## Working rules for Claude Code sessions

- Milestones and STOP gates are defined in `ARCHITECTURE.md` §6. Do not start
  the next milestone past a gate without founder sign-off.
- No MySQL-only tricks (stored procs, JSON in hot paths) — the Postgres
  escape hatch stays open.
- Indexability decisions go through `getIndexability()` — never duplicated.
- All lead/OTP traffic goes through `src/lib/crm.ts` — nothing else may know
  which CRM is behind it.
- Local-facing copy is Paraguayan voseo from `src/i18n/es.ts`.
