# Per-domain style guides

Each domain is its own brand. They share the Next.js app and the database
for management, and nothing else is required to match. The guides are
written to be handed to a builder session as-is.

| Domain | Guide | Status |
| --- | --- | --- |
| inmobiliaria.com.py | `inmobiliaria.com.py.md` | **locked: Nórdico** (2026-09-04), not built |
| realestateinparaguay.com | `realestateinparaguay.com.md` | **locked: variant A, guide-first** (2026-09-04), not built |
| terreno.com.py | — | keeps the current green/gold editorial baseline |
| landforsaleinparaguay.com | — | not a vertical yet; inherits the terreno baseline when added |

`../visual-identity-2026-09.md` is the earlier critique of the three
explored directions and the reasoning behind the palettes. Its "sister
sites" framing (§1, §2 last paragraph) is superseded by the decision to run
the domains as separate brands; the palettes, the plumbing list (§5), the
cuota finding (§6.3) and the link-contrast bug (§5.3) still stand.

Canvas with all explored directions (Tierra, Nórdico, Atelier for the Spanish site; A and B for the English site): https://claude.ai/code/artifact/95203f37-491f-4bb0-8279-f54c027df98e

## Recommended order

1. **Preview in Claude Design** with the prompts in `preview-prompts.md` (three canvases: inmobiliaria, realestate guide-first, realestate directory-first)
   (one canvas per domain, Sonnet is enough). Cheap, and it settles the
   two decisions a palette table cannot: whether Lora/Figtree feels local
   or merely soft, and whether the framed English card beats the scrim
   card. Adjust the guide, not the build, if something is off.
2. **Build with Sonnet** from `build-prompt.md`, one PR per domain, the
   plumbing PR first. Fable/Opus reviews the result; nothing merges on a
   red pre-push hook.
3. terreno stays untouched. landforsaleinparaguay.com is added later as a
   vertical with no theme override.
