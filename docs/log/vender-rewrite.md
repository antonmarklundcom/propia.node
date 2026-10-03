# /vender rewrite — marketing-firm positioning (2026-10-03)

## What landed
- **Form**: every field required (name, WhatsApp, "Soy", city, type, message ≥ 10
  chars), validated in `VenderForm` with one message per field; server errors
  are told apart (bad phone → phone field, 429 → wait). Hero and closing forms
  behave identically. "Quiero una tasación / Sin costo. Sin compromiso." is gone.
- **Submit proven**: `tests/e2e/vender-form.spec.ts` posts through the real
  `/api/leads` and checks the stored row (`seller`, `utm.source=vender`, role).
  Run: `E2E_PORT=3100 npx playwright test tests/e2e/vender-form.spec.ts` (local DB).
- **Page**: new copy (`esVender`), the placeholder photo/laptop/"nombre a
  confirmar" blocks removed, FAQ no longer says "publicar es gratis".
- **Partner band** (Spanish door): "Quiero ser socio" form → `agent_signup`,
  `utm.source=vender:socio`, role `agent`.
- **English door**: `realestateinparaguay.com/sell` now renders (its `/vender` 308s to `/sell`; one component, `SellerLanding`) (lighter: no
  partner band, no header CTA), hreflang-paired with the Spanish page, linked
  from the footer and the home sell tile only.

## What makes the site read as "list for free" (not changed yet)
1. `common.publishCta` "Publicá gratis" — home hero fallback and empty grid.
2. `/publicar` self-serve wizard ("Cargá tus propiedades vos mismo. Es gratis").
3. Footer `FOOTER_PRO`: "Publicar una propiedad", "Planes y precios".
4. `valuationMagnet` "Descubrilo gratis" and `/tasacion` "Gratis, sin registrarte".
5. Vocabulary: "aviso" everywhere (classified ads). Marketing firms say
   "propiedad", "plan", "estrategia", "mandato".
6. Home leads with a search box and "Recién publicadas" grid (portal framing).
7. `esNordico.partnersText` "Publicá tu cartera completa… sin intermediarios".

## Headline ideas (the live H1 is #1)
1. Tu propiedad merece una estrategia de venta, no un aviso más.
2. Vender bien es un trabajo de marketing.
3. Antes de publicar, planificamos cómo se vende.
4. La firma de marketing inmobiliario que vende con estrategia.
5. Tu propiedad, frente a los compradores correctos.
Partner: "¿Sos corredor? Trabajá con el respaldo de una firma de marketing."
Subhead angles: precio con datos · producción visual · campañas ES/EN ·
seguimiento hasta la firma. CTA verbs: "Hablemos de mi propiedad",
"Armar mi plan de venta", "Quiero ser socio".

## Positioning added
Both pages carry a "digital marketing from Sweden, Spain and the US, brought to Paraguay" section (`expertise*` keys). It is the founder's own statement; no per-country detail was added.
