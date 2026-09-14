# C4f - Agency landing page localization

- Added paraInmobiliarias Spanish and English dictionary peers and exposed the namespace through Dictionary.
- Extracted Spanish copy unchanged, preserving accents, punctuation and brand interpolation. English title: For agencies and agents.
- Page metadata, FAQ JSON-LD, breadcrumb, sections, stats and CTAs read dict(). LeadForm receives currentLocale(); number formatting uses numberLocaleFor(). Components, glyph names, links and layout are preserved.
- No custom LeadForm reasons existed on this page; shared field labels use its existing localized dictionary.

Validation:
- PASS: npm run typecheck (tsc --noEmit), including the final code changes.
- FAIL: npm run verify:i18n fails before checks execute: SystemError [ERR_SYSTEM_ERROR]: A system error occurred: uv_os_get_passwd returned ENOMEM (not enough memory).
- Reviewed page and extracted Spanish copy; no Spanish prose literals remain in the page.
- No git commands, build, browser or production validation performed. No environment variables or secrets read or written.
