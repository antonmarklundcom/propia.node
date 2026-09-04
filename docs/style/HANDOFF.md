# Handoff — visual identity work (state as of 2026-09-04)

Read this first in any session continuing the brand/design work.

## Decisions (locked)

| Domain | Direction | Guide |
| --- | --- | --- |
| inmobiliaria.com.py | **Nórdico** — Manrope only, near-white `#FAFAF8`, black buttons, one green `#2E6B4F`, 10 px radius, seller-lead home | `inmobiliaria.com.py.md` |
| realestateinparaguay.com | **Variant A, guide-first** — Newsreader + IBM Plex Sans, petrol `#0E2A30`, brass `#BFA265`, paper `#F3F3EE`, radius 0, framed cards, no cuota | `realestateinparaguay.com.md` |
| terreno.com.py | unchanged green/gold baseline; a land-specific layout pass later (map-first hero, hectares, access, zoning, title status) | none yet |
| landforsaleinparaguay.com | not a vertical yet; will inherit terreno's theme, `locale: "en"`, `ownsListingDetail: false` → realestateinparaguay.com, plus a border-zone land-ownership notice (foreign ownership restricted near borders) | none yet |

The domains are **separate brands** sharing one app for management only.
No sister-site constraint. Positioning of the Spanish site: seller leads
first (ads land on `/vender`), realtor partners second
(`/para-inmobiliarias`), buyers third. The EAS company appears only in the
legal line.

Canvas with every explored direction (Tierra, Nórdico, Atelier; English A
and B): https://claude.ai/code/artifact/95203f37-491f-4bb0-8279-f54c027df98e
Read it from a session with the Artifact tool (`action: "read"`, that URL).
Rejected: Meridian, Sovereign, Cartera (see `../visual-identity-2026-09.md`
§2), Tierra (too brown, too "comfortable"), Atelier (depends on photo
quality the portal does not control), English B (guide layer too low).

## Build state

Build prompts: `build-prompt.md`, four PRs (plumbing → inmobiliaria →
en → `/vender`). A Sonnet session was started to run all four
sequentially: https://claude.ai/code/session_011bE39iXYzm23mx9ZuYMRzR.
Check on resume: each PR's branch must be cut from `main` **after** the
previous PR merged (or stacked explicitly); PR 1 must show pixel-identical
before/after screenshots on all three hosts; `npm run verify:local` green
on every push; no `vertical.key ===` inside `src/components/`.

Docs PR: https://github.com/antonmarklundcom/propia.node/pull/90 (branch
`claude/realestate-visual-identity-cmdh73`) — merge before the builders
need the guides on `main`.

## Findings that are not design

- `--color-link` `#B5893C` is 2.87:1 on cream, not the 4.6:1 the comment
  in `tokens.ts` claims. Body links fail AA on every door today. Fix in
  PR 1 (`#8A6626`).
- `ListingCard` prints the AFD cuota regardless of locale; the only
  active programme is resident-only. The English door must not show it
  (`showCuota(key)` in the registry, PR 1/3).
- Fonts, overlays, radius, tracking, button case and
  `--color-border-accent` were **not** theme tokens; PR 1 adds them.
- Google Fonts are fine on the design canvas; the app self-hosts via
  fontsource packages.

## Working pattern that paid off

- Fable/Opus writes short delta guides and reviews renders; Sonnet
  drafts artboards or code. Roughly $0.50–0.80 of Sonnet per four-artboard
  direction, $1–2 of Fable to direct it. Re-reads are cached and cheap;
  output tokens and screenshots are the Fable cost.
- Subagents draft one direction each in parallel, into separate
  directories, from a shared FORMAT brief + a per-direction GUIDE. The
  director assembles one canvas with pages per direction and reviews
  headless screenshots before saving (fonts fall back offline; ignore).
- Keep option names stable (Tierra, Nórdico, Atelier, A, B). Placeholder
  photo tones swing the impression; neutralise them before judging a
  palette.
- Every number in a mockup is a placeholder until the founder confirms
  it; guides now say "true or cut".

## Next work, in order

1. Review and merge PRs 1–4 as they open (Opus, checklist at the end of
   `build-prompt.md`).
2. Founder inputs for `/vender`: photo, name, EAS company name, licence
   status line, real proof numbers, response-time promise.
3. Real photography for the Nórdico hero and the English hero
   (Costanera at dusk). Higgsfield pipeline is available for stand-ins.
4. terreno layout pass + landforsaleinparaguay.com vertical entry.
5. Possibly rentparaguay.com as an English rent door (`operation:
   alquiler`, `ownsListingDetail: false`); stop around 6–8 doors.
