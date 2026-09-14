# C4a ? Lead form and project placeholder

Landed: LeadForm now uses a cream surface, hairline square inputs with primary-color focus borders and no shadow, 11px uppercase Jost labels, ContactForm's gold button treatment, 12px secondary-ink fine print, and a Cormorant success title with the check Glyph. Existing success classes, props, copy, handlers and API calls are preserved. ProjectCard changes only its glyph import, placeholder markup and placeholder CSS: centered 40px building glyph in secondary ink at 0.5 opacity.

Validation: npm run typecheck PASS. Unicode-aware emoji search (Extended_Pictographic, Regional_Indicator, variation selector and keycap marker) PASS: zero matches in both components. Source comparison confirmed component changes were limited to glyph imports/replacements and CSS edits to the permitted selectors. Existing LeadForm importers remain unchanged.

Not verified: npm run verify:i18n FAIL ? SystemError [ERR_SYSTEM_ERROR]: A system error occurred: uv_os_get_passwd returned ENOMEM (not enough memory). Browser rendering and live submissions were not tested. Build and git commands were not run, as requested.

Deviations: None from the requested scope; the explicit task's focus-border treatment takes precedence over ContactForm's gold outline.
