/**
 * Filters and CSV for /admin/propiedades and /admin/calidad (admin triage 3).
 *
 * The page and its `/export` route both call the parsers here and the same
 * readers (`listAllListings()`, `listQualityRows()`), so a CSV is exactly the
 * view on screen — never a second SELECT that could drift from it. Staff
 * export /propiedades under the same role as the page; /calidad is
 * super-admin only on both.
 */
import "server-only";
import { esPanel, listingStatusLabel } from "@/i18n/es";
import { esTriage } from "@/i18n/es-triage";
import { csvDate, toCsv } from "@/lib/csv";
import {
  ADMIN_STATUSES,
  type AdminListingRow,
  type ListingStatusValue,
} from "@/lib/listing-edit";
import type { QualityIssue } from "@/lib/listing-score";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import { isPublisherKind, type PublisherKind } from "@/lib/publisher-kind";
import type { QualityRow } from "@/lib/quality-queries";
import { listingUrl } from "@/lib/urls";

const OPERATION_LABEL: Record<string, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporal: "Alquiler temporal",
};

/* ----------------------------- /admin/propiedades --------------------------- */

export interface ListingFilter {
  status: ListingStatusValue | "all";
  q: string;
  publisher: PublisherKind | undefined;
}

export function parseListingFilter(sp: { status?: string; q?: string; quien?: string }): ListingFilter {
  const status = (ADMIN_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as ListingStatusValue)
    : "all";
  return {
    status,
    q: sp.q?.trim() ?? "",
    publisher: isPublisherKind(sp.quien) ? sp.quien : undefined,
  };
}

/** The filter spelled back as a query string (for the export link). */
export function listingFilterQuery(f: ListingFilter): string {
  const sp = new URLSearchParams();
  if (f.status !== "all") sp.set("status", f.status);
  if (f.publisher) sp.set("quien", f.publisher);
  if (f.q) sp.set("q", f.q);
  return sp.toString();
}

/** What the export holds: the page shows 200, the file the whole filtered set. */
export const LISTING_EXPORT_LIMIT = 5000;

export function listingsCsv(rows: readonly AdminListingRow[], origin: string): string {
  const t = esTriage.export;
  const head = [
    "ID",
    t.colTitle,
    t.colOperation,
    t.colType,
    t.colPlace,
    esTriage.publisherColumn,
    t.colPublisherName,
    t.colPrice,
    t.colCurrency,
    esPanel.statusLabel,
    t.colUpdated,
    t.colUrl,
  ];
  const body = rows.map((r) => [
    r.publicId,
    r.title,
    OPERATION_LABEL[r.operation] ?? r.operation,
    PROPERTY_TYPE_LABELS[r.propertyType] ?? r.propertyType,
    r.locationName,
    esTriage.publisher[r.publisherKind],
    r.agencyName ?? r.publisherName,
    Number(r.priceAmount),
    r.priceCurrency,
    listingStatusLabel[r.status] ?? r.status,
    csvDate(new Date(r.updatedAt)),
    r.status === "published" ? `${origin}${listingUrl(r)}` : "",
  ]);
  return toCsv(head, body);
}

/* -------------------------------- /admin/calidad ---------------------------- */

export interface QualityFilter {
  agencia: string | undefined;
  /** Already validated against the issues that exist in the agency's rows. */
  issue: QualityIssue | null;
}

export const qualityAgencyKey = (r: QualityRow): string => (r.agencyId == null ? "none" : String(r.agencyId));

/**
 * The page's own narrowing, in one place: agency first, then the problem chip
 * (only a problem some row of that agency has). Also hands back the chip
 * counts the page draws.
 */
export function filterQualityRows(
  all: readonly QualityRow[],
  params: { agencia?: string; problema?: string },
): { byAgency: QualityRow[]; filtered: QualityRow[]; issueCounts: Map<QualityIssue, number>; issue: QualityIssue | null } {
  const byAgency = params.agencia ? all.filter((r) => qualityAgencyKey(r) === params.agencia) : [...all];
  const issueCounts = new Map<QualityIssue, number>();
  for (const r of byAgency) for (const i of r.issues) issueCounts.set(i, (issueCounts.get(i) ?? 0) + 1);
  const issue = [...issueCounts.keys()].find((i) => i === params.problema) ?? null;
  const filtered = issue ? byAgency.filter((r) => r.issues.includes(issue)) : byAgency;
  return { byAgency, filtered, issueCounts, issue };
}

/** Worst first, the table's order. */
export const worstFirst = (rows: readonly QualityRow[]): QualityRow[] =>
  [...rows].sort((a, b) => a.score - b.score || a.id - b.id);

export function qualityCsv(rows: readonly QualityRow[], origin: string): string {
  const t = esTriage.export;
  const head = [
    esPanel.qualityColScore,
    "ID",
    t.colTitle,
    esPanel.statusLabel,
    esPanel.qualityColAgency,
    esPanel.qualityColIssues,
    t.colUrl,
  ];
  const body = worstFirst(rows).map((r) => [
    r.score,
    r.publicId,
    r.title,
    listingStatusLabel[r.status as keyof typeof listingStatusLabel] ?? r.status,
    r.agencyName ?? esPanel.qualityNoAgency,
    r.issues.map((i) => esPanel.qualityIssue[i]).join(" · "),
    r.status === "published" ? `${origin}${listingUrl(r)}` : "",
  ]);
  return toCsv(head, body);
}
