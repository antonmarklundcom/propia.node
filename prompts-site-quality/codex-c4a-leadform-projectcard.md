Task: Two leftovers from the site-quality plan (fable-plan-site-quality-2026-09-13.md, docs/prompts/premium-editorial-inner.md group (c)). First, /contacto and /para-inmobiliarias still render src/components/LeadForm.tsx with its old rounded-card styling (.lead-form* in app/globals.css around line 6169) and a success state that shows an emoji check mark. Restyle LeadForm to the same editorial look as the already-restyled ContactForm (.contact-form* rules in app/globals.css around line 2876 and the Glyph-based success/footer treatment in src/components/ContactForm.tsx): cream surface, hairline borders, radius 0, Jost labels 11px uppercase tracking, Cormorant success title, gold primary button, and the success icon becomes the check glyph from src/components/Glyph.tsx instead of an emoji. Second, src/components/ProjectCard.tsx renders a construction emoji as the no-image placeholder; replace it with the building glyph from Glyph.tsx. ProjectCard is shared with the rental doors and the directory home, so change only the placeholder markup and its .project-card__placeholder CSS (center the glyph, 40px, secondary ink at 0.5 opacity), nothing else in that component. Do not change any behaviour, prop, copy, dictionary string, or API call.

Files to touch: src/components/LeadForm.tsx, src/components/ProjectCard.tsx, app/globals.css (only the .lead-form* and .project-card__placeholder rules), docs/log/c4a.md (new, short: what landed, what was not verified, deviations).

Do not touch: anything else. No git commands of any kind. No npm run build (it fails in this sandbox). Do not print or write any environment variable or secret.

Definition of done:
- A Unicode-aware emoji search over src/components/LeadForm.tsx and src/components/ProjectCard.tsx returns nothing.
- LeadForm success state uses <Glyph name='check' /> and the same class structure as before (lead-form--done, lead-form__done-title, lead-form__done-text) so nothing else breaks.
- .lead-form__input, textarea, select share the ContactForm input look (1px hairline border var(--color-border), radius 0, focus border var(--color-primary), no box-shadow), .lead-form__submit matches .contact-form__submit, .lead-form__fineprint 12px secondary ink.
- Every existing LeadForm prop and call site keeps working unchanged (app/contacto/page.tsx, app/para-inmobiliarias/page.tsx, src/components/RentalServicePage.tsx and any other importer).
- ProjectCard placeholder is a Glyph, no emoji, no layout change to the card.
- docs/log/c4a.md written.

Commands to run before reporting (working directory C:\Users\anton\propia.node), run every one and report FAIL rather than skip:
- npm run typecheck
- npm run verify:i18n (may die with an ENOMEM error in this sandbox; if so, report that exact text as FAIL and continue)

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
