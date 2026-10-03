# Server-error cause in alerts, and robots.txt facet rules (2026-10-03)

Phase 1 of `docs/plan-category-pages-build.md`. Report
`docs/report-telegram-alerts-2026-10-03.md` §C-1 and plan decision P-3.

## What landed

- `src/lib/error-alerts.ts`: `errorCause()` reads the driver error under a
  Drizzle "Failed query" (`code`, `errno`, `sqlMessage`/`message`, up to three
  wrappers deep). The alert gets a `causa: ER_CON_COUNT_ERROR (1040) Too many
  connections` line, and the cause joins the throttle key, so a full pool and a
  dropped connection on the same page are two alerts. An error without a cause
  produces exactly the old text.
- `src/lib/robots-rules.ts` (new, pure) and `app/robots.ts`: robots.txt now
  also disallows every facet query name from `FACET_PARAM` (`operacion`,
  `tipo`, `ciudad`, `barrio`, `precio_min`, `precio_max`, `dormitorios`,
  `orden`), plus `vista` and `tipo_vacio`, as `/*?name=` and `/*&name=`.
  `?page=` stays crawlable. The path rules are unchanged.

## Checks added

- `verify:telegram`: cause line present; two causes are two alerts; the same
  cause stays throttled; a nested cause is found; no cause = old text.
- `verify:seo`: every blocked name is blocked in first and later position;
  no canonical path, `?page=`, evergreen path, `/propiedad`, `/zonas` or the
  sitemap is blocked; a lookalike name (`?tipos=`) is not; panels and the API
  stay blocked.

## Not verified / for the founder

- P-3 was applied as recommended in `docs/decisions-needed.md` (founder said
  "code these things"; confirm the list when reviewing the PR).
- After deploy: open `/robots.txt` on two doors and test a `?vista=mapa` URL
  in Search Console's robots tester. URLs with these parameters that Google
  already indexed may show as "Indexed, though blocked by robots.txt" for a
  while; none of them is canonical.
- The home page's fallback links to `/venta?tipo=…` (used only when the city
  page has no stock) are now uncrawlable; `/venta` itself is not.
- No production alert was produced from this session; the cause line is
  checked against a Drizzle-shaped error, not a live one.
