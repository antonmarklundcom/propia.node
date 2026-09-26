/**
 * Lead exports (build A1, Agency 8): `/agencia/leads/export` and
 * `/admin/leads/export`.
 *
 * No new query path, on purpose. The panel export is `getPanelLeads()` +
 * `getSharedLeads()` — the same two reads /agencia/leads renders, under the
 * same scope and the same share predicate — and the admin export is
 * `listAllLeads()` with the page's own filter, parsed by the one parser both
 * use. An export that ran its own SELECT would drift from what the panel shows,
 * and a CSV is exactly where a scope leak goes unnoticed.
 */
import "server-only";
import { VERTICALS } from "@/config/verticals";
import { esA1 } from "@/i18n/es-a1";
import { esPanel } from "@/i18n/es";
import type { EditScope } from "@/lib/listing-edit";
import {
  getPanelLeads,
  listAllLeads,
  type AdminLeadRow,
  type LeadFollowUp,
  type LeadRow,
} from "@/lib/panel-queries";
import {
  getSharedLeads,
  type PanelViewer,
  type SharedLeadRow,
} from "@/lib/lead-assignments";
import { csvDate, toCsv } from "@/lib/csv";
import { isReportLead } from "@/lib/report-queries";
import { listingUrl } from "@/lib/urls";

/* ------------------------------ /agencia/leads ----------------------------- */

/**
 * Whether /agencia/leads renders the caller's own inbox at all. An
 * agency_admin with no agencies row gets the "not linked" notice instead (the
 * page and the export share this, so the CSV never holds rows the page hid).
 */
export function panelShowsOwnLeads(ctx: {
  agencyId: number | null;
  user: { role: string };
}): boolean {
  return !(ctx.agencyId == null && ctx.user.role === "agency_admin");
}

export interface PanelLeadSet {
  own: LeadRow[];
  shared: SharedLeadRow[];
}

/** Exactly the two lists /agencia/leads shows this caller. */
export async function panelLeadSet(params: {
  scope: EditScope;
  viewer: PanelViewer;
  showOwn: boolean;
}): Promise<PanelLeadSet> {
  const [own, shared] = await Promise.all([
    params.showOwn ? getPanelLeads(params.scope) : Promise.resolve([] as LeadRow[]),
    getSharedLeads(params.viewer),
  ]);
  return { own, shared };
}

function propertyCells(
  lead: { listingTitle: string | null; listingSlug: string | null; listingPublicId: string | null },
  origin: string,
): [string | null, string | null] {
  if (!lead.listingTitle || !lead.listingSlug || !lead.listingPublicId) return [lead.listingTitle, null];
  return [
    lead.listingTitle,
    `${origin}${listingUrl({ slug: lead.listingSlug, publicId: lead.listingPublicId })}`,
  ];
}

export function panelLeadsCsv(set: PanelLeadSet, origin: string): string {
  const t = esA1;
  const rows = [
    // Shared first, as on the page.
    ...set.shared.map((l) => [
      t.csvSectionShared,
      csvDate(l.createdAt),
      t.csvLeadType[l.leadType] ?? l.leadType,
      l.name,
      l.whatsapp,
      l.email,
      l.message,
      ...propertyCells(l, origin),
      esPanel.shareStateLabel[l.state] ?? l.state,
    ]),
    ...set.own.map((l) => [
      t.csvSectionOwn,
      csvDate(l.createdAt),
      t.csvLeadType[l.leadType] ?? l.leadType,
      l.name,
      l.whatsapp,
      l.email,
      l.message,
      ...propertyCells(l, origin),
      null,
    ]),
  ];
  return toCsv(t.csvPanelHead, rows);
}

/* ------------------------------- /admin/leads ------------------------------ */

export const ADMIN_LEAD_TYPES = [
  "all",
  "buyer",
  "renter",
  "seller",
  "valuation",
  "developer",
  "agent_signup",
  "landlord",
  "question",
] as const;
export type AdminLeadType = (typeof ADMIN_LEAD_TYPES)[number];

/** The operator's follow-up state, in the order a lead moves through it. */
export const FOLLOW_UP: readonly LeadFollowUp[] = ["new", "contacted", "closed"];

export interface AdminLeadFilter {
  type: AdminLeadType;
  vertical?: string;
  status?: LeadFollowUp;
  phoneKey?: string;
  q?: string;
  /** Only listing reports (A3: `?fuente=reportes`). */
  reports?: boolean;
}

/**
 * The /admin/leads search params, validated once for the page and its export.
 * `sites` is the list of `leads.vertical` values that actually occur — a site
 * filter is never free text.
 */
export function parseAdminLeadFilter(
  sp: { tipo?: string; sitio?: string; estado?: string; tel?: string; q?: string; fuente?: string },
  sites: readonly string[],
): AdminLeadFilter {
  return {
    type: ADMIN_LEAD_TYPES.includes(sp.tipo as AdminLeadType) ? (sp.tipo as AdminLeadType) : "all",
    vertical: sp.sitio && sites.includes(sp.sitio) ? sp.sitio : undefined,
    status: FOLLOW_UP.includes(sp.estado as LeadFollowUp) ? (sp.estado as LeadFollowUp) : undefined,
    // "Same number" filter: only a well-formed key, never free text.
    phoneKey: sp.tel && /^\d{6,9}$/.test(sp.tel) ? sp.tel : undefined,
    q: sp.q || undefined,
    reports: sp.fuente === "reportes" || undefined,
  };
}

/** The same query string the page links with, for the export link. */
export function adminLeadFilterQuery(f: AdminLeadFilter): string {
  const sp = new URLSearchParams();
  if (f.type !== "all") sp.set("tipo", f.type);
  if (f.vertical) sp.set("sitio", f.vertical);
  if (f.status) sp.set("estado", f.status);
  if (f.phoneKey) sp.set("tel", f.phoneKey);
  if (f.q) sp.set("q", f.q);
  if (f.reports) sp.set("fuente", "reportes");
  return sp.toString();
}

/**
 * The rows /admin/leads lists for this filter. `internalOnly` comes from the
 * authenticated role (staff), never from the request.
 */
export function adminLeadRows(filter: AdminLeadFilter, internalOnly: boolean): Promise<AdminLeadRow[]> {
  return listAllLeads({
    type: filter.type,
    vertical: filter.vertical,
    status: filter.status,
    phoneKey: filter.phoneKey,
    q: filter.q,
    where: filter.reports ? isReportLead() : undefined,
    internalOnly,
  });
}

/** `leads.vertical` stores the door's key ("en", "rent"); show its domain. */
const HOST_BY_VERTICAL: Record<string, string> = Object.fromEntries(
  Object.entries(VERTICALS).map(([host, v]) => [v.key, host]),
);

export function adminLeadsCsv(rows: readonly AdminLeadRow[], origin: string): string {
  const t = esA1;
  return toCsv(
    t.csvAdminHead,
    rows.map((l) => [
      csvDate(l.createdAt),
      t.csvLeadType[l.leadType] ?? l.leadType,
      t.csvFollowUp[l.status] ?? l.status,
      l.name,
      l.whatsapp,
      l.email,
      l.message,
      HOST_BY_VERTICAL[l.vertical] ?? l.vertical,
      l.agencyName ??
        (l.ownerWhatsapp
          ? `${t.csvRouted.owner}: ${l.ownerName ?? l.ownerWhatsapp}`
          : (t.csvRouted[l.routedTo] ?? l.routedTo)),
      ...propertyCells(l, origin),
      l.note,
      l.utm?.source ?? null,
    ]),
  );
}
