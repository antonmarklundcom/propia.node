/**
 * `import_rows.previous_json`, read back.
 *
 * MySQL 8 hands a `json` column to mysql2 already parsed; MariaDB — which is
 * what production runs (11.8) — stores it as `longtext`, so the same column
 * arrives as a string. Every reader goes through this one function so the two
 * engines cannot drift apart again (the rollback's `deduped` branch and
 * `recentPriceChanges()` both read `.field` off the raw value and silently
 * found nothing on MariaDB).
 *
 * Pure: no `server-only`, no drizzle, so `verify:import` can check it.
 */
export function parseSnapshot(value: unknown): Record<string, unknown> | null {
  let parsed: unknown = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}
