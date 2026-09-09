# Phase S3 — the seven service pages, cleanup, docs. SONNET session, ONLY after S2 is merged. Last phase.

Read `fable/plan-rentparaguay.md` FIRST, in full — plus §9 and
`fable/KNOWN-ISSUES.md` — then the i18n section of `CLAUDE.md`,
`docs/style/rentparaguay.com.md`, plan Appendix C, and O3's exemplar
(`rentalServices.alquiler` in `es.ts`/`en.ts` and
`src/components/RentalServicePage.tsx`). Execute plan §6.3 under the
autonomy protocol §4 and the fan-out rule §4.13.

Sonnet hard limits (plan §6): no `schema.ts`, no `src/lib/auth/**`, no
`src/db/**`, no `src/lib/crm.ts`, no `src/lib/import/**`, no cache keys, no
`verticals.ts`, `alternates.ts`, `origin.ts`, `sections.ts`, `themes.ts`.

Owns: the `rentalServices` namespace in `src/i18n/es.ts` + `en.ts`;
`src/components/RentalServicePage.tsx` (markup completion only);
`docs/rentparaguay-extraction/` (deletion); `CLAUDE.md`, `README.md`,
`.env.example`, `docs/style/README.md` (the doc lines plan §6.3 names);
`fable/KNOWN-ISSUES.md`; plan §9.

Phase rules:
- Reset to `origin/main`, branch `claude/fable-s3-rental-services`.
- Load skills `propia-dev` and `fable-directs-sonnet-builds` (its §Fan-out).
- Fan out: the exemplar is the template. Spawn six **Sonnet** subagents
  (never Opus, never Fable), one per remaining service, each reading only
  its own `docs/rentparaguay-extraction/content/<old-slug>.md` and writing
  only its own object in `es.ts` and `en.ts` to the Appendix C shape. The
  parent merges, runs `verify:i18n`, fixes shape drift itself. One verify,
  one PR.
- Same cleaning and translation rules as S2 (plan §1 item 13; vos-form
  Spanish; brand as an argument; no invented figures).
- Legal/fiscal figures the source states (tax rates, "Law 7548/2025",
  residency timelines, yields) stay only where the source page states them,
  unchanged, and **the PR body lists every one** so the founder can strike
  what is wrong. Nothing marked "(verificar)" in the copy itself.
- Delete `docs/rentparaguay-extraction/` in this PR, after the copy is in
  the dictionaries and before opening it. `docs/prompts/*` stays.
- Docs: CLAUDE.md domain table gains the two doors ("code landed; DNS/env
  pending") and a sentence on `family`; the i18n section lists the new
  namespaces; "Last verified" date; the outstanding-manual-steps list gains
  DNS for both domains and `NEXT_PUBLIC_CONTACT_WHATSAPP`. README's domain
  list matches. `docs/style/README.md` row for `rentparaguay.com` /
  `alquiler.com.py` → the guide, "built".
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green; `ls docs/rentparaguay-extraction`
fails; every one of the seven service URLs on both rental hosts renders its
full body, FAQ JSON-LD and form (curl with `Host:`); `grep -rn
"rentparaguay-extraction" --include=*.ts --include=*.tsx --include=*.md .`
hits only `fable/` and `docs/prompts/`; PR merged green.

## After this phase — STOP and report (last phase)
Gates: PR merged; exit list passed; pre-handoff audit done; §9 entry
committed. Do not spawn anything. Closing report to Anton: the six PR links
and their state; `fable/KNOWN-ISSUES.md` contents added by this plan; the
figure list from this PR; plan §7 items still open, numbered as manual
steps — DNS for `rentparaguay.com` and `alquiler.com.py`, the WordPress
redirect check before decommissioning, `NEXT_PUBLIC_CONTACT_WHATSAPP` +
rebuild, the optional `LEAD_WEBHOOK_URL` mail flow, and the
`generic-stock` image decision from S1.
