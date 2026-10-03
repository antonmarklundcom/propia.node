# Partner ledger + commission suggestion (O2) and seller financing (O8) — 2026-10-02 — MIGRATION REQUIRED

Branch `claude/partner-ledger-financing`. Spec:
`docs/plan-admin-next-2026-10-02.md`, items O2 and O8. **Two migrations**, both
applied by the founder before merging; an agent never merges this PR.

| File | What it adds |
| --- | --- |
| `drizzle/0024_wild_iron_man.sql` | the `partner_terms` and `listing_financing` tables (O2, O8) |
| `drizzle/0025_mute_the_hand.sql` | four indexes from the 2026-10 audit (P9, `docs/log/audit-2026-10.md`): `leads(routed_to, status, created_at)`, `listings(owner_user_id, agency_id)`, `listings(updated_at)`, `ops_runs(job, id)`. Pure additions, in their own commit; drop it to run them separately. |

Both features use **new tables, not new columns on `agencies` / `agents` /
`listings`**. Those tables are selected whole by every public page, so a new
column there would 500 the site whenever the code ran ahead of the migration.
The new tables are read by /admin, the edit pages and the listing page only.
The listing page's read is wrapped so that a missing table means "no seller
financing", never an error page.

## O2 — partner lead ledger + editable commission suggestion

**The ledger.** `/admin/negocios/socios` is super-admin only, linked from
/admin/negocios. It has one row per Socio (agencies on the Socio plan, plus
independent agents marked Socio), with these columns:
- leads shared with them;
- leads that went straight to them from their own listings;
- buyer/tenant vs seller/owner enquiries;
- unanswered / taken / declined shares;
- deals, won, lost;
- your share on won deals, as typed;
- their usual split.

Each Socio has a page at `/admin/negocios/socios/agency-12` (or
`agent-7`). It lists every lead, newest first, with:
- where it came from ("Compartida" / "Su aviso");
- the partner's answer;
- the lead's status;
- the deal stage and your share.

How the ledger is built (`src/lib/partner-ledger.ts`):
- **It is derived, not stored.** CLAUDE.md forbids a partner or agent column
  on `leads` or a new `routed_to`.
- **Listing leads** are those delivered straight to the publisher
  (`routed_to` agency/agent). A listing lead that reached the operator and was
  then shared counts once, as a share.
- **Attribution follows the listing's current agency.** The page says so.
- **Query cost:** the summary is four grouped queries whatever the number of
  Socios; a Socio's page is three bounded queries (500 rows).

**The suggestion.**
- **Where it is set:** each Socio's usual "Comisión total (%)" and "Tu parte
  de la comisión (%)", plus a note, in `partner_terms` (`src/lib/partner-terms.ts`).
  The write re-checks super-admin, and each change is a `partner.terms` line in
  /admin/historial.
- **Where it shows:** on a lead's "Negocio" block in /admin/leads. If the deal's
  partner, or else the lead's single active share, has terms, they prefill
  **only the percentage fields that are still empty**. A line under the form
  says "Sugerido del reparto habitual con …: revisalo antes de guardar."
- **Nothing is stored until Guardar.** No amount is derived: "Tu parte (US$)"
  stays typed, and the existing "≈" hint still reads only the stored values.
- **The rule** is `splitPrefill()` in `src/lib/deal-form.ts`, which is pure and
  checked by `npm run verify:financing`.

## O8 — financing per listing

**Who sets it, and where.** "Financiación propia" is on the three edit pages:
/admin/propiedades/[id], /agencia/propiedad/[id] and /mis-avisos/aviso/[id].
- **Off by default.** The publisher (or /admin, staff included, since it is
  the publisher's text) switches it on and types the terms as free text:
  who finances, rate, term, down payment, and other conditions.
- **Switching it on with only "who finances" filled in is refused**: a box
  with no terms would tell a visitor less than the cuota it replaces.
- **Each action takes its scope from the session**, and the write goes
  through `getEditableListing()`, the same WHERE as any other edit. A forged
  listing id saves nothing; the e2e test proves it.

**What the visitor sees** (`/propiedad`, sale listings only):
- "Financiación del vendedor" with the terms exactly as typed, and the line
  "Datos provistos por <agency/agent>, no por el portal." (generic "el
  anunciante" in agency mode or for a private owner).
- In English: "Seller financing" / "Information provided by …, not by the
  portal."
- The site-wide estimated cuota is not shown on that listing.

**How the cuota stays away:**
- Saving with financing on clears `listings.cuota_gs`, so the cards drop the
  estimate too.
- `cron:cuotas` skips listings with financing on.
- When it is switched off, the estimate returns at the next `cron:cuotas`
  run. That is the same "cleared here, recomputed by the cron" rule a price
  edit already follows.

**Code:**
- data: `src/lib/listing-financing.ts`;
- form rules: `src/lib/listing-financing-form.ts` (pure, in
  `verify:financing`);
- the action body all three pages share: `src/lib/listing-financing-action.ts`;
- the form component: `src/components/panel/SellerFinancingForm.tsx`;
- copy: `esFinancing` (panel, Spanish), and `esListing` / `enListing`
  `sellerFinancing*` (public).

## Verified
- `npm run verify:local` passed (pre-push hook), including the new
  `verify:financing`.
- Local MariaDB 11.8: `db:status` before (0024 pending, two tables missing),
  then `db:migrate`, then `db:status` again: **0 pending, 26 applied, No
  drift**. The indexes are present in `SHOW INDEX`.
- `next start` + Playwright: `tests/e2e/partner-ledger-financing.spec.ts`,
  3/3 passing.
  1. The ledger counts one shared lead and one listing lead for the partner
     agency, and saving 5 % / 50 % logs `partner.terms`. The per-Socio page
     lists both leads.
  2. The lead's Negocio block shows 5.00 / 50.00 with the suggestion line, and
     no deal row exists until "Guardar negocio". After it, the deal stores
     5 / 50 with `my_share_usd` NULL, and the ledger counts one deal.
  3. Financing:
     - switching it on empty is refused;
     - typed terms show on /propiedad with "Datos provistos por <agency>, no
       por el portal.", and `cuota_gs` is NULL;
     - at 390 px there is no horizontal scroll;
     - a forged listing id saves nothing;
     - switched off, the box is gone.

  Screenshots were taken in the session and not committed.
- `npm run verify:scopes` reports two failures, both in the admin CSV export
  view. They fail on `main` too, are unrelated to this PR, and are fixed in the
  audit PR.

## Not verified
- Production. **Apply 0024 and 0025 first** (`db:status` → `db:migrate` →
  `db:status`), then merge.
- The English listing page was not loaded in a browser (the door needs its
  host). Its strings are checked by `verify:i18n`.
- `cron:cuotas` skipping a listing with financing on: the change is a join
  and a condition. The runner was not run here, since there are no financing
  programs in the local DB.

## Founder steps
1. `npm run db:status`, then `npm run db:migrate`, then `npm run db:status`
   again: expect "No drift". Then merge.
2. /admin/negocios → "Consultas por socio": fill in each Socio's usual split.
