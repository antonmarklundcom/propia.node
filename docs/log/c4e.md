# C4e - final marketplace emoji sweep

Replaced decorative emoji with the shared 24px-viewBox, 1.2-stroke Glyph family. Copy wording, links and behaviour retained; added only the inline alignment CSS rule.

| Surface | Glyph mapping |
| --- | --- |
| como-funciona | doc, receipt, building |
| datos | chart, money, bank |
| financiamiento | money, chart, calendar, bank |
| para-inmobiliarias | list, chat, building, chart, card, users |
| Guide index and article | doc |
| Not found | home (40) |
| Home city chips / professional cards | pin (14) / building, land (28) |
| Recently viewed | history (18) |
| Publish cuota preview | bank (16) |
| Rental contact, including additional email icon | chat, mail, doc, pin (16) |
| ES + EN home discoverCards | home, money, chart, percent (financing) |
| Additional ES + EN home howSteps / values | search, chart, chat / check, card, pin |
| Additional ES + EN projectsTitle / pricesTitle | Removed emoji prefixes; home renders building / chart |
| Additional ES + EN foreignToggleDetail | Removed decorative globe prefix; wording unchanged |
| Additional ES adminReviewEmpty | Removed decorative celebration suffix; wording unchanged (EN inherits panel copy) |

Added chart, calendar, users, card, bank, chat, receipt, percent and history; all nine have consumers and typecheck as GlyphName. Home dictionary icon consumers use isGlyphName with the requested raw-string fallback.

Validation:
- npm run typecheck: PASS after correcting a replacement-script encoding issue.
- npm run verify:i18n: FAIL - SystemError [ERR_SYSTEM_ERROR]: A system error occurred: uv_os_get_passwd returned ENOMEM (not enough memory).
- Node Unicode emoji scan over app and src, excluding src/lib/photos.ts: PASS, zero Emoji_Presentation, emoji variation sequences, regional indicators or keycaps. Extended_Pictographic scan also finds zero after excluding bare copyright and text arrows (U+00A9, U+2197, U+2194). Those text symbols remain in files outside scope; a literal unfiltered Extended_Pictographic search is not empty.
- New-glyph consumer scan: PASS, all nine used.
- No Git commands, build, live checks or environment/secret access. No rendered browser audit performed.
