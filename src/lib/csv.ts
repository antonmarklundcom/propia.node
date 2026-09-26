/**
 * CSV for the lead exports (build A1, Agency 8). Pure — no database, no
 * `next/*` — so `verify:scopes` can check its output without a runtime.
 *
 * Comma-separated like the admin import template (`plantilla.csv`), with a
 * leading UTF-8 BOM so Excel on Windows reads "Asunción" rather than
 * "AsunciÃ³n". CRLF line ends, per RFC 4180.
 */

const BOM = "﻿";

/**
 * A cell a spreadsheet would run as a formula (`=HYPERLINK(…)`, `@SUM(…)`,
 * `-2+3`) gets a leading apostrophe. A visitor typed these messages, so an
 * export must never execute them. A phone number (`+595 981 …`) is only digits
 * and punctuation and cannot call anything, so it is left readable.
 */
function neutralise(value: string): string {
  if (/^[=@\t\r]/.test(value)) return `'${value}`;
  if (/^[+-]/.test(value) && !/^[+-][\d\s().-]*$/.test(value)) return `'${value}`;
  return value;
}

function cell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = neutralise(String(value));
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export type CsvCell = string | number | null | undefined;

export function toCsv(head: readonly string[], rows: readonly CsvCell[][]): string {
  return BOM + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** "2026-09-26 14:05" in Paraguay time, whatever the server's zone. */
export function csvDate(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** `consultas-2026-09-26.csv` — the date in Paraguay time. */
export function csvFilename(prefix: string, now = new Date()): string {
  return `${prefix}-${csvDate(now).slice(0, 10)}.csv`;
}

export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
