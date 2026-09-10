# Handoff gates — every phase in `fable-plan-realtor-terreno-rental.md`

A phase is done when all four pass:
1. PR merged green — every phase merges itself once its own Exit criteria
   pass (Anton authorized autonomous merge for T1/R1/R2/D1 on 2026-09-10;
   the schema-touching D3 phase, not written yet, is the one exception and
   still needs an explicit go plus `npm run db:status` before/after).
2. Its prompt's Exit list passed, each item checked once.
3. Pre-handoff audit: ONE `npm run verify:local` on the merged main + ONE
   adversarial re-read of the merged diff; findings fixed in ONE follow-up
   commit, no second round.
4. `docs/log/<id>.md` committed (≤ 12 lines Built, ≤ 8 Decisions, ≤ 8 Known
   issues, one Verification line) and the §9 line added to the plan.

Spawning: this plan has no watcher Routine — it is five small phases, two of
which wait for Anton. T1 and R1 are started by Anton in two Sonnet windows.
D1 is started by Anton in an Opus window once questions 1/2/3/6 are answered;
D1 names D2 as next but does not spawn it (its PR needs Anton's merge first).
R2 likewise. Nothing spawns anything; nothing runs on Fable.

Stop-and-ask (`fable/plan.md` §4.4) means: append the question to
`docs/decisions-needed.md`, commit, push the branch, end the session.

Start line for any phase (fresh window, model per the phase table,
permission mode auto-accept):
`Read prompts-realtor-terreno-rental/<file>.md in this repo and execute it.`
