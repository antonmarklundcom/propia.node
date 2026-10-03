# Duplicate listings (plan-admin-next O5)

2026-10-03 · branch `claude/listing-duplicates` · **migration 0027**, stacked on O1 (0026) and #272 (0024, 0025)

## The founder's answer

"Visitors too: the listing page shows 'También publicado por …'; the first
lister keeps the slot and the next takes over when it goes."

## What landed

- **`listing_duplicates`** (`drizzle/0027_burly_proudstar.sql`) holds one row
  per member of a group: `group_id`, plus who marked it and when. It is a
  table of its own, not a column on `listings`. **Who holds the slot is not
  stored**: it is recomputed every time.
- **The rule** (`src/lib/listing-duplicate-rules.ts`, pure): among a group's
  *published* members, the one published earliest holds the slot, using
  `published_at`, else `created_at`, with the lowest id breaking ties.
  - When it is paused, sold or removed, the next one takes over with nothing
    to update.
  - Checked by `npm run verify:duplicates` (in `verify:local` and the
    pre-push hook), which also covers O1's form and state.
- **The SQL twin**: `notHiddenDuplicate()` in `src/lib/facet-sql.ts`, a
  `NOT EXISTS` keyed on the primary key of `listing_duplicates`. A listing in
  no group fails the first lookup. It is ANDed into every public *grid*:
  - `publishedFacetWhere()`: hub counts, price bands, inventory and saved
    searches;
  - the category list and its count;
  - `countPublished`, the home rails (`getRecentListingsBy`,
    `getRecentListings`) and similar listings;
  - the map and the sitemap.

  **Not** into agency or agent profile lists, project pages, favourites or the
  detail page: a duplicate is still that publisher's listing.
- **Listing page**:
  - A published member that is not the primary canonicalises to the
    primary's URL and emits no hreflang. It stays online, so its own lister's
    contact keeps working.
  - Every published member shows **"También publicado por / Also listed by"**
    with the other *published* members:
    - an agency's or agent's name, or "Particular" for a private seller;
    - a member with no publisher shows the door's brand;
    - a link to each one's page.
  - Not shown in agency mode, where a lister is never named.
  - Copy: `listing.alsoListed*` in es.ts / en.ts.
- **/admin/propiedades/[id] → "Duplicados"** (staff and super-admin):
  - paste the other listing's code or link to join them (two groups merge);
  - the group table shows "Ocupa el lugar" / "Oculto en listados" / "No
    publicado", with "Quitar del grupo" per member;
  - a group left with one member is dissolved;
  - each change is `listing.duplicate` in /admin/historial, and calls
    `revalidateListings()` so grids drop or regain the listing at once.

## Verified

- `npm run verify:local` green (pre-push hook), including `verify:duplicates`.
- `npm run db:status` on the local `mariadb:11.8` after `db:migrate`:
  0 pending, 28 applied, No drift.
- `tests/e2e/listing-duplicates.spec.ts`, 5/5, the SQL rule against MariaDB:
  - three copies (A, B, C) are all in the grid;
  - B is joined to A by code, C to B by link, and the groups merge;
  - the grid shows A only, B and C canonicalise to A, and "También publicado
    por" names the others;
  - A is paused through the bulk action: the grid shows B, and B is
    self-canonical;
  - C is taken out: it is back in the grid on its own;
  - three history events are logged.
- Existing grid specs against this build: `sort`, `listing-sidebar`,
  `evergreen` and `category-links` (3 doors) green.
  - `hub-type-links` and `category-links` on landforsaleparaguay.com fail
    **identically on the base branch**. The local fixtures are 60
    venta/casa rows, with no second type and no land.

## Not done

- No "Duplicado" chip on /admin/propiedades, and no automatic detection. The
  operator marks groups by hand.
- JSON-LD on a hidden duplicate is unchanged; its canonical already points
  away.

## Risk to read before merging

This adds a subquery on `listing_duplicates` to every public grid query.
**Merged before migration 0027 is applied, every grid page 500s.** Apply
0024 → 0027 (`db:status` → `db:migrate` → `db:status`) first.
