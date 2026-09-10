# Phase P2 — hero photos for the two operation hubs. OPUS session, medium effort. Runs after P1 when possible; tolerated overlap otherwise.

Load skills, in order: `higgsfield-image-pipeline` (governs model, credits and
how files reach the repo), then `webimg-pipeline` (convert/resize/rename/alt).
Read ONLY: this file; `fable-plan-polish.md` §1, §4; `app/[operacion]/page.tsx`
(just the hero markup); `docs/style/inmobiliaria.com.py.md` §1 for the
marketplace palette and `docs/style/rentparaguay.com.md` §1 for the rental one;
`ls public/img` to see the existing naming (`hero-home.webp`, `zona-*.webp`).

Owns: `public/img/hub-venta.webp`, `public/img/hub-alquiler.webp` (and their
`@2x`/mobile variants only if the pipeline skill produces them by default);
`/* == P2 == */` CSS block at the end of `app/globals.css`; the `data-op={op}`
attribute on `.hub-hero` in `app/[operacion]/page.tsx` **only if** P1 has not
added it yet on `origin/main` (check first); `docs/log/p2.md`; one §9 line.

Hard limits: exactly **two** generated images, no more — credits are a fixed
budget. No other files. No new dependencies.

## Decisions (final)
1. **Subjects.** `hub-venta`: a warm, sunlit Paraguayan residential street or
   modern house exterior with lapacho/greenery, late afternoon, no people, no
   text, no logos. `hub-alquiler`: a bright apartment interior with a balcony
   view over Asunción, natural light, no people. Photoreal, editorial, not
   render-looking. 16:9, hero-safe (subject off-centre so a title sits left).
2. **Wire as a background** on `.hub-hero[data-op="venta"]` /
   `[data-op="alquiler"]` (the `alquiler_temporal` hub reuses the alquiler
   image): `background-image: linear-gradient(<the existing dark gradient at
   ~0.72 alpha>), url(/img/hub-<op>.webp)`, `background-size: cover`,
   `background-position: center`. Text stays white on the dark overlay — check
   contrast ≥ 4.5:1 by reading the overlay alpha, not by eye.
3. Output ≤ 220 KB per WebP at 1920px wide, `loading` is CSS so no `<img>`
   attributes to set. Alt text is not needed for a decorative background; the
   H1 carries the meaning.
4. If the image pipeline cannot get bytes into the repo from this environment
   (the skill names the known failure), do NOT retry more than once: write the
   two prompts and the wiring CSS, commit them with a placeholder-free CSS rule
   that is harmless without the files, and note the manual step in
   `docs/log/p2.md` Known issues. Never commit a broken image.

## Exit
Both files exist under `public/img` and load in `npm run build`; `npx tsc
--noEmit` clean; `verify:seo` green. Branch `claude/p2-hub-photos`, one PR
"P2 — hub hero photos (venta, alquiler)". Merge yourself when green (§1 item
3). `docs/log/p2.md` + §9 line in the PR.
