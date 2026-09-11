# Quality build — Q-S1, Q-S2, Q-S3, Q-S4. Paste into ONE fresh SONNET session,
# only after `fable-plan-quality.md` §9 shows Q-O1 and Q-O2 merged.

Read `fable-plan-quality.md` in full FIRST (if §9 does not show Q-O1 and Q-O2
merged, stop and say so), then `AGENTS.md`, then `CLAUDE.md`'s "i18n",
"Caching", "Brand name" and "Domains" sections, then `docs/log/q-o1.md` and
`docs/log/q-o2.md`. Execute plan §5.1, §5.2, §5.3, §5.4 in order, one PR each,
each merged green before the next branch is cut.

Sonnet hard limits (plan §1.8): no `src/db/schema.ts`, no `drizzle/**`, no
`src/db/**`, no `src/lib/auth/**`, no `src/lib/crm.ts`, no
`src/lib/import/upsert.ts`, no `app/api/leads/route.ts`, no new cache key
without a `revalidate*` writer, no new visitor-facing literal outside the
dictionary. If a phase seems to need any of these, stop and write the
question to `docs/decisions-needed.md`.

Session rules:
- Reset to `origin/main` before each branch: `claude/q-s1-known-issues`,
  `claude/q-s2-d3b-zones`, `claude/q-s3-jsonld`, `claude/q-s4-docs-truth`.
- `npm install`, `npm run hooks:install`, `npm run verify:local` before every
  push (it now includes `lint` and `verify:unit`). Never `--no-verify`.
- Every new `es.ts` key gets its `en.ts` peer in the same commit; English
  translates intent for foreign buyers and never invents a fact. Staff copy
  (`esPanel`) stays Spanish-only (plan §1.9).
- JSON-LD states only what the row states (plan §1.10): `geo` only from the
  listing's own `lat`/`lng`, never `display_*`; no ratings, no invented
  telephone or price range.
- Never write `propia.com.py`, a placeholder email or an invented number.
- Say in each phase log what was not run (no Docker → no `verify:scopes`).

Q-S1 (§5.1): the eight known-issue fixes, one commit each; the `<head>` diff
per door reviewed with a `Host` header; drawer checked keyboard-only in a real
browser. Merge when green. `docs/log/q-s1.md`; strike closed lines in
`fable/KNOWN-ISSUES.md`.

Q-S2 (§5.2): `utm.city` from `DirectoryLeadForm`, read in `matching.ts`;
bio/license/years/zones editors in `/admin/agentes` and `/agencia/equipo`
through the existing scope helpers; `revalidateDirectory()` after writes.
Merge when green. `docs/log/q-s2.md`.

Q-S3 (§5.3): `RealEstateAgent` on both profile pages, `GeoCoordinates` on the
detail page when the row has its own position, `tests/jsonld.test.ts`.
`verify:seo` stays green. Merge when green. `docs/log/q-s3.md`.

Q-S4 (§5.4): `PLAN.md` decisions header, `docs/plans/README.md` index,
`fable/KNOWN-ISSUES.md` Closed section, `CLAUDE.md` backlog lines, `AGENTS.md`
§7 line. Merge when green. `docs/log/q-s4.md`. Then STOP: report the four PR
links and what was not verified.
