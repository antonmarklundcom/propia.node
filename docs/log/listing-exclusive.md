# Exclusive listings (plan-admin-next O1)

2026-10-03 · branch `claude/listing-exclusive` · **migration 0026**, stacked on #272 (0024 + 0025)

## The founder's answer

"Admin-only flag": exclusivity is tracked in /admin only, and nothing is shown
to visitors.

## What landed

- **`listing_exclusives`** (migration `0026_dizzy_lorna_dane.sql`), one row per
  exclusive listing:
  - `until`: last day, optional;
  - `note`: optional, 280 characters;
  - who set it, and when.

  A row means exclusive; no row means not. It is a table of its own, not a
  column on `listings`: every public page selects `listings` whole, so a new
  column there would 500 the site whenever code ran ahead of the migration.
  Nothing public reads this table.
- `src/lib/listing-exclusive.ts` is the only module on the table. Every read
  degrades to "not exclusive", so /admin keeps working on a database the
  migration has not reached. The pure half is
  `src/lib/listing-exclusive-state.ts`: the form reader and the
  active / expired state, with "today" in Asunción.
- **/admin/propiedades/[id]** has a new "Exclusiva" card: a checkbox, an
  optional end date and a note. It is open to staff and super-admin (the people
  who edit listings). Each change is logged as `listing.exclusive` in
  /admin/historial.
- **/admin/propiedades**:
  - an "Exclusivas (N)" chip (`?exclusiva=1`) that keeps the status, publisher
    and search filters;
  - a badge per row: "Exclusiva hasta <día>", or "Exclusiva vencida" once
    past the end date.

## Not done, on purpose

- No public badge, ranking or JSON-LD (founder decision).
- The CSV export of /admin/propiedades ignores `?exclusiva=1` and has no
  exclusive column. It is a small follow-up if wanted.
- Nothing happens automatically when a mandate expires; the panel only says
  "vencida".

## Verified

- `npm run verify:local` green (pre-push hook).
- `npm run db:status` on the local `mariadb:11.8`, after `db:migrate`:
  0 pending, No drift.
- `tests/e2e/listing-exclusive.spec.ts`, 5/5:
  - mark with an end date and a note;
  - the row is stored;
  - the badge and the chip filter work;
  - the public page has no trace;
  - an expired date reads "vencida";
  - unmarking removes the row;
  - two `listing.exclusive` events.

## Founder steps

Apply #272's migrations first (0024, 0025), then this one:
`npm run db:status` → `npm run db:migrate` → `npm run db:status` (No drift).
Merge only after that.
