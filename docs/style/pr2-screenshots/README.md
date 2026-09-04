# PR 2 screenshots — Nórdico (inmobiliaria.com.py)

Taken against the seeded local database (47 demo listings), Playwright +
Chromium, 1440px viewport, `document.fonts.ready` + a full-page scroll pass
to force every lazy `<img>` before capture.

- `inmobiliaria-home.jpg` — the new Nórdico home page (hero, proof row,
  recién publicadas, dark sales-process section, buscar por ciudad, por qué
  vender acá, para inmobiliarias, faq).
- `inmobiliaria-cards.png` — zoomed listing-card row showing the pill row:
  green "Publicado en inglés" (foreign_exposure) and "Destacada" (featured,
  set on one demo row for this screenshot).
- `inmobiliaria-detail.jpg` — the listing detail page (black "Enviar
  Mensaje" primary CTA, framed-pill similar-listings row).
- `en-before.jpg` / `en-after.jpg` — realestateinparaguay.com home,
  `origin/main` (PR 1 merged) vs this branch. `en-diff.jpg` — ImageMagick
  `compare -metric AE`, which reported **0** differing pixels.
- `terreno-before.jpg` / `terreno-after.jpg` — same for terreno.com.py.
  `terreno-diff.jpg` — also **AE 0**.

Both non-Spanish-door diffs are pixel-identical, confirming this PR touches
nothing on `realestateinparaguay.com` or `terreno.com.py`.
