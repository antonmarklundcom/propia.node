# docs/decisions-needed.md — founder decisions, not build work

Append-only. A phase that hits a call only the founder can make writes one
entry here and stops rather than guessing.

## Reviews on agent profiles

CLAUDE.md backlog item 4: no review/rating system exists today. Building one
needs a schema (a `reviews` table, moderation state), an anti-fake-review
design (who can leave one, what stops a self-review or a competitor's), and a
legal read on publishing a named person's review of another named person.
None of that is a code decision.

Options:

- (a) Not now — leave `/agente/[slug]` and `/inmobiliaria/[slug]` without
  reviews.
- (b) Verified-lead-only reviews — only someone who submitted a lead to that
  agent/agency (traceable in `leads`) can leave one, reducing fake-review
  surface but still needing moderation and a schema.
- (c) Operator-curated testimonials — the founder (or an admin) pastes in a
  short quote per agent/agency by hand, no visitor-submitted content, no
  moderation queue, no anti-fake design needed.

**Recommendation: (c).** It is the cheapest honest start — no new abuse
surface, no legal exposure from publishing a stranger's opinion of another
named person, and it can ship without touching `schema.ts`. (b) is the
natural next step once there is enough lead volume per agent to make it real,
and can reuse (c)'s rendering.

**Decided 2026-09-11 (Fable, `fable-plan-quality.md` "Decided NOT to do"):
(c), and parked** — there are no testimonials to curate yet, so no slot is
built. Revisit when the first agency asks.

## Deprioritized 2026-09-15 (founder) — not urgent, revisit later

Anton confirmed these are not current-business priorities. Leave as-is; no
code work against them until he asks again.

- **Per-project financing opt-in** (CLAUDE.md backlog #7). Che Róga Porã stays
  `active: false` sitewide.
- **Reviews/ratings system** (see above). Stays parked at option (c)/nothing
  built.
- **`afd_primera_vivienda` rate research** (CLAUDE.md backlog #6, currently a
  9.00% placeholder in `scripts/seed-financing.ts`). Not a code task and not
  urgent — do not touch the seeded rate without a researched figure.

Current priority instead: get `npm run cron:translate` run against
production (English listing text is still Spanish-fallback everywhere), and
make sure the self-service agency/agent registration + listing-upload +
admin-approval path is solid, since the founder is about to onboard other
realtors' listings ahead of his own EAS/SERPLAID registration going through.

## Forgotten-password recovery — onboarding audit, 2026-09-15

**Stop and ask; not implemented.** There is no self-service forgotten-password
flow in `app/login` or `src/lib/auth`. The signed-in password change in
`app/agencia/perfil/actions.ts` requires the current password. The super-admin
can replace a user's password in `app/admin/usuarios/actions.ts`, but that is
not a public recovery flow or an agreed identity-check procedure.

**Founder decision:** What identity checks and recovery channel should a realtor
who has forgotten their password use, and should recovery be operator-assisted
or self-service with a configured delivery provider?

AGENTS.md §6 requires a decision before extending auth/account-data flows.
Password-reset infrastructure and public recovery promises are deliberately
deferred; this does not block the separately authorized onboarding panel and
photo-readiness copy.

Implementation choices for this audit unit: reuse the existing zero-listings
result (including drafts) without changing panel queries; dismiss the checklist
for the current page visit without storing account data; show R2 readiness copy
before upload using the existing server predicate, retaining all upload gates.
Messaging/OTP readiness indicators and translation-status UI are out of scope.

## 2026-09-22 — Facts for the English door (A6, needs the founder)

PR "A6: remove unsourced legal and cost claims" replaced every "(verify before
launch)" placeholder on realestateinparaguay.com (home dictionary, foreigner
box on `/propiedad`, and the three guides in `scripts/seed-guias-en.ts`) with
wording that states no rate, fee, timeline or legal category. To put real
figures back, the founder supplies, from a lawyer or escribano, in writing:

1. Whether foreign ownership has exceptions (rural, border zone) and the wording to use.
2. The escribanía cost band (transfer taxes, notary fees, registration) and who pays each.
3. Typical deposit, due-diligence, deed and registration timelines.
4. Who answers English enquiries (the listing agent, or the portal forwards them).
5. Residency: whether any category is linked to buying property.

**Separate, also the founder's:** the English footer says "`<brand>` is a service
of EAS", and the Spanish peer says "es un servicio de EAS". The entity is not
registered yet (about a month away), and "EAS" alone names a company type,
not a company. Decide the exact legal line to show until then (for example the
brand only) and after registration (the full registered name). Not changed in
code, because it is a statement of fact to visitors.

## 2026-09-22 — National type pages (`/venta/casas`), F-f, proposal only

**Today.** `/venta/casas` is a 404: `parseCategorySegments()` (`src/lib/urls.ts`)
reads one segment as a city slug, and no city is called `casas`. Since #178 the
national hub's type chips link to `/venta?tipo=casas`, which is correct and
works, but every `?tipo=` URL is `noindex` by design (`hasListingUserParams`,
pinned by `verify:facets`). So the highest-volume type searches ("casas en venta
Paraguay", "terrenos en venta") have no indexable page on any door; only
city-scoped pages (`/venta/asuncion/casas`) can rank.

**Proposal (recommended: option A).**

- **A. `/<operacion>/<tipo>` as a real category page.** In
  `parseCategorySegments()`, a single segment that `parseTypePlural()` accepts
  becomes `{ kind: "national-type", type }`, and everything else stays a city.
  No city slug collides with a type plural today (checked against the local
  `locations` table: casas, departamentos, terrenos, duplex, comerciales,
  oficinas, depositos, quintas all return no row). A seed guard in
  `seed:locations` would keep it that way. Canonical is itself, indexable under
  the same `getIndexability()` rule (`MIN_INDEXABLE = 3`), listed in the
  sitemap, hreflang derived by `languageAlternates()` like any category page,
  breadcrumb Inicio › Venta › Casas. The hub chips then link there instead of `?tipo=`.
- B. A distinct prefix (`/venta/tipo/casas`). No collision risk, but an uglier
  URL and a new shape to teach every helper.
- C. Make a lone `?tipo=` indexable. Breaks the "query strings are transient"
  rule that `verify:facets` and the sitemap rely on. Not recommended.

**What the founder decides (the rest is implementation):**

1. Option A, B or C.
2. What happens to `/venta?tipo=casas` (and the same on `/alquiler`) once the
   clean URL exists: a **308 to `/venta/casas`** (recommended: one URL per set)
   or keep it as a noindex filter view that canonicalises to `/venta/casas`.
3. Terreno doors (`terreno.com.py`, `landforsaleparaguay.com`) already filter
   every page to terrenos, so their `/venta/terrenos` would duplicate `/venta`.
   Proposal: on those doors a national-type URL for their own type 308s to the
   hub, and other types 404 as they do today.
4. The English door keeps the Spanish path segments (`/venta/casas`), as it
   does for every category page today. Localised English paths would be a
   separate, larger change (the `rentalPath()` pattern).

Size once decided: M (urls.ts, the segments page, sitemap, hub chips,
`verify:seo`/`verify:facets` cases, one e2e). Not built.

## 2026-09-25 — Sharing leads with partner realtors (plan only)

Plan: `docs/plan-lead-access-2026-09-25.md`. The superadmin shares a lead with
a verified agency or agent through a new `lead_assignments` table (not
`routed_to`, not a `leads.agent_id` column), so it shows in their
`/agencia/leads`. Not built. The founder decides:

1. **Privacy wording.** `/privacidad` §3 covers sharing a lead with whoever
   published the listing, not handing a general enquiry (`/contacto`,
   `/vender`, `/tasacion`) to a partner. Proposed added line: "Con
   profesionales inmobiliarios verificados con los que trabajamos, cuando tu
   consulta no es sobre un aviso concreto o nos pedís que te pongamos en
   contacto." Until it is signed, share only directory leads (their form
   already says verified agents will contact them) and leads whose sender
   agreed to be forwarded.
2. **Targets:** verified agencies and agents only (recommended), or any.
3. **Staff:** may share `internal`-lane leads (recommended, same predicate as
   their list), or superadmin only.
4. **Staff listing rights:** today `staff` can set a listing to `published` and
   hard-delete from `/admin/propiedades`, although Approve/Reject is
   superadmin-only. Intended or not?

## 2026-09-26 — Inbound email (E2/E3), choices made while building

Built on `claude/build-e2e3-inbox` (`docs/log/e2e3.md`). Chosen and working;
say if any should change:

1. **Staff see hola@ and contacto@ only; anton@ is the super-admin's.**
   `SHARED_MAILBOXES` in `src/lib/inbox-address.ts`. Anything else that lands
   (anton@, a mistyped address caught by the catch-all, a forged `lead-…@`)
   is super-admin only.
2. **A lead's email thread is shown to everyone who may see the lead** —
   including a partner the lead was shared with, and the FSBO owner. They
   already see the buyer's name, phone, email and message; the thread adds
   what the buyer wrote back by email. This rides on the open privacy
   sentence of 2026-09-25 (item 1 above): if sharing stays restricted, so
   does this.
3. **"Convertir en consulta" asks the operator for a WhatsApp number**
   (prefilled when the email contains one), because `leads.whatsapp` is
   required everywhere. An email with no phone cannot become a lead until the
   operator has one.
4. **No email notification to the owner or partner when a buyer replies by
   email.** The operator gets Telegram; the others see it next time they open
   their leads page. Say if they should get an email too (one function in
   `lead-emails.ts`). **Partners resolved by plan-agency batch 4:** a partner
   holding an active share of the lead now gets a Telegram ping (no buyer
   data, just "look") when they linked Telegram on `/agencia/perfil`. The FSBO
   owner still gets nothing; still open for them.

## 2026-09-26 — Agency mode: public copy that becomes false (founder wording)

The switch is built (`/admin/ajustes`, `docs/plan-agency-2026-09-26.md` batch 3)
and **off** until the founder turns it on. In agency mode every enquiry reaches
the operator, so these visitor-facing claims stop being true. Rewording them is
a statement about what the business is, and depends on D1 (whether taking
commission needs a licence or a registered company), so no agent invents it:

| Where (es.ts, with its en.ts peer) | Says today |
|---|---|
| `limitsBody` (`/nosotros`) | "No somos una inmobiliaria y no representamos a ninguna de las partes…" |
| home values "Contacto directo" (`esHome.values`) | "Hablás directo con el vendedor o la inmobiliaria, sin intermediarios." |
| home how-it-works step 3 | "Escribile por WhatsApp a quien publicó… sin intermediarios ni costo." |
| premium home `aboutText` | "…el contacto directo de quien lo publica, sin intermediarios ni comisión para vos." |
| rental hub guide paragraph | "…canal de contacto directo por WhatsApp, sin intermediarios…" |
| `/nosotros` `principleDirect` | "Contacto directo, sin peaje" |
| `/agentes`, `/inmobiliarias` subtitles | "…su contacto directo" |

Also decide: D4 — does a partner see the buyer's name and phone only after
pressing "La tomo"? Today a shared lead shows them immediately.

## 2026-09-26 — Privacy policy sentence for first-party statistics

`/admin/analitica` (plan-agency batch 5) counts page views and WhatsApp taps
without cookies: each event stores the path, the referring site, utm tags, the
device type and a 16-character hash of IP + browser + day that changes every
day (the IP itself is never stored). Raw events are kept 365 days
(/admin/ajustes), daily totals indefinitely. `/privacidad` says nothing about
this yet. Proposed line, for the founder to approve or reword: "Contamos
visitas de forma anónima, sin cookies ni servicios de terceros: guardamos la
página visitada, el sitio de origen y el tipo de dispositivo, nunca tu
dirección IP."

## 2026-09-27 — May a partner change a deal the operator has closed?

Found reviewing #226 (deal ledger). `setPartnerDealStage()` (`src/lib/deals.ts`)
lets a partner move a shared lead's deal between any of the partner stages at
any time, including out of `won` or `lost` — even after the super-admin has
typed the sale price and commission and set `paid_at`. `/admin/negocios` would
then drop it from "won" while its `my_share_usd` still counts in the paid
total (that sum checks only `paid_at`), so the ledger stops adding up.

This is who owns the commission record, so no agent picks it. Options:
(a) lock the stage for partners once it is `won` or `lost` (the operator can
still change it); (b) lock only once `paid_at` is set; (c) leave it open and
make `/admin/negocios` count paid shares only on `won` deals. Recommendation:
(a) — a closed deal is the operator's to reopen. Small change either way
(one guard in `setPartnerDealStage` + a read-only selector).

## 2026-09-27 — Evergreen pages: which door owns the land pages? (S9)

**Answered 2026-09-27 (founder): (a), `terreno.com.py`.** The land evergreen
pages ship on door `terreno` in evergreen PR 2. Still open: S8 (whether
`inmobiliaria.com.py`'s `/venta/<city>/terrenos` grids canonicalise to it).

`docs/seo-evergreen-keywords.md` maps 8 land searches to evergreen pages
(`/venta/aregua/terrenos` 110, `/venta/luque/terrenos` 70, `/venta/itaugua/terrenos`
50, `/venta/ciudad-del-este/terrenos` 50, Ypacaraí, Limpio, Encarnación,
Capiatá). Today the same terreno grid is self-canonical on both
`terreno.com.py` and `inmobiliaria.com.py` (`docs/plan-seo-doors-2026-09-27.md`
§4.1), so they compete for one spot.

Options: (a) the land evergreen pages live on `terreno.com.py` (land-only
content: cuotas, loteamientos, títulos, servicios), and later
`inmobiliaria.com.py`'s `/venta/<city>/terrenos` grids canonicalise to it
(the `ownsCategories` flag, S8); (b) they live on `inmobiliaria.com.py` and
`terreno.com.py` owns land guides and the national land hub instead (the
SEO-doors plan's S1(a)).

**Recommendation: (a)** — it matches the stated intent that `terreno.com.py`
is the land specialist, every door starts at zero authority so there is no
stronger domain to protect yet, and it is reversible with one flag. The
registry's `door` field makes either answer a one-line change per page; no
land page is written until this is answered.

## 2026-09-27 — Places missing from the location tree (S10)

**Answered 2026-09-27 (founder): yes, both.** Added to
`src/lib/ops/location-tree.ts` in evergreen PR 2, with four evergreen pages
(San Bernardino terrenos + casas, Loma Pytã casas + departamentos). **The
centroids are approximate and need checking**, and production needs
`npm run seed:locations` then `npm run cron:geo` right after the merge —
until then those four URLs 404 while the sitemap already lists them.

The biggest land search in the keyword export, `terrenos en san bernardino`
(210, plus ~10 variants), has no URL: San Bernardino is not in
`src/lib/ops/location-tree.ts`. Same for Loma Pytã (an Asunción barrio; ~90
for cheap house rentals), Emboscada, Villarrica, Caaguazú, Coronel Oviedo,
Concepción, Atyrá — and Luque's barrios (`alquiler de casa en 4to barrio
luque` 110; Laurelty, Yukyry, Zárate Isla, Isla Bogado, Mora Cué, Palma Loma).
Adding a place is a small code change plus `npm run seed:locations` and
`npm run cron:geo` on production, but its department and centroid are facts
someone should check. Question: add San Bernardino (Cordillera) and Loma
Pytã first? Recommendation: yes, those two — together they carry more search
volume than any other missing place.

## 2026-09-27 — Evergreen keyword map: three judgement calls to confirm

**Answered 2026-09-27 (founder):** (1) both — `departamento en asuncion` is a
secondary on the rental *and* the sale page, and each page targets its own
long tail (alquiler: 1 dormitorio, monoambiente, amoblado, centro; venta:
comprar, usados, en pozo, financiados); (2) dropped; (3) still waits on F-f.

1. `departamento en asuncion` (1 300/mo, no "venta"/"alquiler" in it) is put
   on `/alquiler/asuncion/departamentos`, because every other Asunción
   apartment cluster is rental. Swap to `/venta/asuncion/departamentos` if
   buyers are who type it.
2. `casas en remate en asunción` (30) sits on `/venta/asuncion/casas`, but the
   portal has no foreclosure listings; drop it rather than imply we do?
3. The national searches (`casas en paraguay` 210, `venta de casas baratas en
   paraguay` 170, `terrenos baratos en paraguay` 140 …) have no indexable page
   until decision F-f (a clean `/venta/casas` URL) is made.
