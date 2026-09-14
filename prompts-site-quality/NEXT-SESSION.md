# Prompt for the next Fable session (written 2026-09-13 night)

Paste the block below into a new Fable chat in the Claude desktop app, working directory `C:\Users\anton\propia.node`.

---

Continue the propia.node site-quality run. Read, in this order: `fable-plan-site-quality-2026-09-13.md`, `docs/log/c1.md` … `docs/log/c3c.md`, `docs/log/process-audit.md` (if present), and my memory file `propia-site-quality-2026-09-13`. Then `git fetch origin` and tell me which of the branches `codex/c1-home-layout`, `codex/c2-english-pages`, `codex/c3a-detail-page`, `codex/c3b-hubs-category`, `codex/c3c-marketing-pages` are already merged into `main` (they are stacked in that order; the tip branch contains everything).

State when this prompt was written: C0 merged (#141). C1–C3c are built by Codex, audited by rendering on a seeded local MySQL, all `verify:local` green, pushed, NOT merged. `gh` auth on this PC is expired (`gh auth login` fixes it); git push works.

Do, in this order, all work by Codex via the manager-worker-codex skill (you audit by running the build and rendering, you commit):

1. If nothing new is merged, stop and tell me which URL to open to merge the tip branch as one PR (compare `codex/c3c-marketing-pages` against `main`). A merge is a deploy on Hostinger.
2. Once merged and deployed: re-run the live audit (`docs/tools/audit-home.mjs`, `docs/tools/audit-inner.mjs` from a scratch folder with playwright installed) against `https://inmobiliaria.com.py` and `https://realestateinparaguay.com`; record results in `docs/log/live-2026-09-14.md`. Anything red goes back to Codex.
3. Remaining code items from the plan: (a) `/contacto` still uses `LeadForm` with its old styling and a success emoji — restyle it to the editorial look like `ContactForm` (Codex, normal); (b) `ProjectCard` still has emoji (shared with rental doors, restyle carefully, Codex normal); (c) the hub pages' "Por ciudad" / "Por tipo" chips and the `/precios` page have not been restyled (Codex normal, extend `docs/prompts/premium-editorial-inner.md` with a group (d) first); (d) act on `docs/log/process-audit.md` if it names a high-likelihood cause of the Hostinger process-count problem.
4. Founder steps I must do myself, remind me: run `npm run db:migrate` against production (migration 0014 is pending, `/guias` is empty until then); set `NEXT_PUBLIC_CONTACT_WHATSAPP` in hPanel and rebuild; real listing photos for the first 10–20 listings (every listing is a placeholder today; nothing in code fixes that).

Local render recipe, sandbox limits and the harness quirks are in the memory file; do not rediscover them.
