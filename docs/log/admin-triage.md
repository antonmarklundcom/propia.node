# Admin triage — tab badges, who published / who writes (2026-10-02) — no migration

Branch `claude/funny-ritchie-pcol1s`. Founder feedback on /admin, one batch.

## What landed
- **Every tab badges what is waiting** (`src/lib/admin-badges.ts`, one loader
  for every /admin page; `adminTabs(active, badges)`): review queue, internal
  leads still `new`, deals won and not paid, unread email + unattached
  WhatsApp chats, draft guides, jobs whose last run threw, registered agencies
  / agents not yet verified. Tooltip on each badge says what it counts. Not
  cached (a lagging badge reads as "my approve didn't work"); the core counts
  are one round trip, later-migration tables fail to 0.
- **Who published a listing** (`src/lib/publisher-kind.ts`, one SQL CASE for
  badge, chips and filter): Propia (the agency chosen in Ajustes → "Mi
  inmobiliaria", site setting `house_agency_id`, or a no-agency listing created
  by an admin/staff account) · Socio (agency on the Partner plan, or a verified
  independent agent) · Inmobiliaria · Agente independiente · Dueño particular ·
  Sin asignar. Shown and filterable (`?quien=`) on /admin/propiedades and the
  review queue.
- **Titles are links** to the listing's record (`/admin/propiedades/<id>`) on
  Propiedades and the review queue; Calidad links published titles to the
  public page and in-review ones to the record.
- **Review queue** is a table like Propiedades: search, operation, type,
  publisher chips, a header select-all and a live "N seleccionadas" count; bulk
  approve/reject return to the same filtered view (`back`, re-encoded key by
  key in `app/admin/actions.ts`).
- **Calidad** problem chips were `<span>`s styled as chips — now links
  (`?problema=`, combines with `?agencia=`), jumping to the filtered table.
- **Who writes a lead** (`src/lib/contact-kind.ts`, one SQL CASE): from the
  new optional "¿Quién sos?" answer (`src/lib/contact-role.ts`, stored as
  `leads.utm.contact_role`, stamped by `/api/leads` from the enum only) plus
  the lead type, so old leads are classified too. /admin/leads: chip row with
  counts (`?quien=`), sort (`?orden=recent|oldest|kind`), a pill on each card,
  "Agente/Inmobiliaria registrada: …" when the WhatsApp matches a directory
  professional, and a "Quién escribe" CSV column. The CSV export now also
  honours `?fuente=reportes`, which it silently ignored before.
- The field is on ContactForm (particular / agent / agency), VenderForm and
  DirectoryLeadForm (owner / agent / agency), /contacto (all five, plus new
  reasons: comprar, alquilar, poner en alquiler), /para-inmobiliarias(-os),
  the rental contact and service pages, and the admin "Registrar consulta de
  WhatsApp" form. Copy: `esContactRole` / `enContactRole`, admin copy
  `src/i18n/es-triage.ts` (Spanish only, like the rest of the panel).

## Verified
- `npm run verify:local` green.
- Local MariaDB 11.8 (`mariadb:11.8`, migrated, seeded with one listing per
  publisher kind, ten leads across every kind, deals, ops runs): every badge
  count, publisher kind, contact kind, filter, sort, the phone match and the
  CSV checked by hand against the seed. Pages rendered with `next start` and a
  seeded admin session (screenshots in the session, not committed).

## Not verified
- Production data: nothing here ran against it. The classification is derived,
  so it applies to existing rows the moment this deploys.
- `npm run verify:scopes` not run: no change touches `listingScopeWhere`,
  `panelScope` or a panel (agency) query.

## Founder steps
- /admin/ajustes → "Mi inmobiliaria": pick your agency so its listings read
  as "Propias". Nothing else changes with it.
- A partner agency is "Socio" when its plan is Partner (/admin/inmobiliarias);
  an independent agent when verified (/admin/agentes).
