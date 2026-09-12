# PF3 — editorial restyle of the inner pages (Opus). Finding F9 of
# `fable-plan-premium-fix.md`. NOT to be started until PF1 is merged and the
# founder has looked at the home on a preview: this phase edits the same CSS
# file and needs a delta-spec from the director first (same method as PE1,
# `docs/prompts/premium-editorial.md`).

Scope, when it runs: `/propiedad/[slug]` (facts row, details table, lead form,
similar listings), the hub and category pages (search panel, filter bar,
list/map toggle, chips), `/nosotros`, `/contacto`, `/proyectos`, `/tasacion`,
`/agentes` + `/inmobiliarias` cards. Replace emoji icon fonts with the
`ds-glyph` inline SVG set the home uses, radius 0 everywhere, gold primary /
outlined secondary buttons, Cormorant headings, Jost body, `--color-border`
hairlines instead of boxed white panels. No new copy, no layout
re-architecture, no new components without a spec line for them.

Director: write `docs/prompts/premium-editorial-inner.md` (delta-spec, per
page: keep / change / delete), then spawn one Opus builder per page group
with disjoint CSS blocks (`/* == PF3-<group> == */` appended), verify with the
same harness as PF1, one PR.
