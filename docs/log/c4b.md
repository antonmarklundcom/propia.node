# C4b: hub chips and price index

Landed: Group (d) was documented before implementation. Hub type chips now
have full square hairlines, Jost labels and unboxed gold Cormorant counts,
with no hover movement. The price index uses a light PageHero, narrow city
list Section and muted method Section; inline styles are removed. New price
CSS is scoped to the index. Metadata, JsonLd, copy and empty state are preserved.
Unused numberLocale variables remain; typecheck accepts them.

Validation: npm run typecheck PASS. npm run verify:i18n FAIL:
`SystemError [ERR_SYSTEM_ERROR]: A system error occurred: uv_os_get_passwd returned ENOMEM (not enough memory)`.

Not verified: browser rendering, responsive overflow and live/database output.
Build and git commands were not run, as requested.

Deviations: the city detail reference is still unstyled in this checkout and
was left untouched. The existing request-scoped brand supplies the eyebrow
without introducing dictionary copy. No implementation scope deviations.
