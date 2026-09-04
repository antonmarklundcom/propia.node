# PR 2 screenshots — Nórdico (inmobiliaria.com.py)

Taken against the seeded local database (47 demo listings), Playwright +
Chromium, 1440px viewport, `document.fonts.ready` + a full-page scroll pass
to force every lazy `<img>` before capture. Regenerated after the review-fix
commit (header/footer/button contrast, dark-section, proof-row fixes).

- `inmobiliaria-home.jpg` — the new Nórdico home page: white header,
  exactly one dark section (the sales-process band), the light "para
  inmobiliarias" panel, footer.
- `header-closeup.png` — cropped to the header row: white bar, sentence-case
  nav with "Vender" between Proyectos and Empresas, black "Vender mi
  propiedad" CTA — confirms the contrast fix (was dark-green-on-dark-green
  and unreadable in the first pass).
- `inmobiliaria-cards.png` — zoomed listing-card row showing the pill row:
  green "Publicado en inglés" (foreign_exposure) and "Destacada" (featured,
  set on one demo row for this screenshot, then reverted).
- `inmobiliaria-detail.jpg` — the listing detail page: black "Enviar
  Mensaje" first, green "💬 WhatsApp" / "📞 Ver teléfono" second in the
  sticky sidebar card (a demo agency contact was temporarily attached to
  this listing to prove the WhatsApp link renders, then reverted — every
  other seeded listing has no agent/agency/owner in this dev DB, which is
  why the original screenshot showed no WhatsApp button).
- `para-inmobiliarias.jpg` — restyled marketing page: black "Quiero
  publicar mi cartera" submit button (was a green button with near-invisible
  text in the first pass).
- `en-before.jpg` / `en-after.jpg` (`realestateinparaguay.com`) and
  `terreno-before.jpg` / `terreno-after.jpg` (`terreno.com.py`) —
  `origin/main` (PR 1 merged) vs this branch, each **pixel-identical**
  (`compare -metric AE` reported **0** differing pixels for both;
  `en-diff.jpg`/`terreno-diff.jpg` attached, both solid black).
