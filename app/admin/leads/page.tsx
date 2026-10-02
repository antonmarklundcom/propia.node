import { getAdminBadges } from "@/lib/admin-badges";
import { isStaff } from "@/lib/auth/roles";
import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import {
  countLeadsByContactKind,
  countLeadsByPublisher,
  LEAD_PUBLISHER_KINDS,
  findProfessionalsByPhoneKey,
  countLeadsByStatus,
  countLeadsByPhoneKey,
  countLeadsByType,
  countLeadsByVertical,
  countRecentLeads,
  leadHistoryFor,
  leadPhoneKey,
  listLeadHistory,
  type LeadHistoryRow,
  type AdminLeadRow,
  type LeadFollowUp,
} from "@/lib/panel-queries";
import { cookies } from "next/headers";
import { RememberView } from "./RememberView";
import {
  ADMIN_LEAD_TYPES,
  ADMIN_LEAD_VIEW_COOKIE,
  ADMIN_LEAD_VIEWS,
  adminLeadsInternalOnly,
  parseAdminLeadView,
  adminLeadFilterQuery,
  adminLeadRows,
  FOLLOW_UP,
  parseAdminLeadFilter,
} from "@/lib/lead-export";
import { esA1 } from "@/i18n/es-a1";
import { esPanel } from "@/i18n/es";
import { listAgentMatchCandidates } from "@/lib/directory-queries";
import {
  leadCitySlug,
  listMatchesForLeads,
  rankCandidates,
  type LeadMatchRow,
} from "@/lib/matching";
import { listingUrl } from "@/lib/urls";
import { VERTICALS } from "@/config/verticals";
import { waLink } from "@/lib/wa";
import { adminTabs } from "../tabs";
import { MatchPanel } from "./MatchPanel";
import { SharePanel, ShareTargetSelect } from "./SharePanel";
import { shareLeadsAction } from "./actions";
import {
  listShareBoard,
  listSharesForLeads,
  listShareTargets,
  type ShareRow,
} from "@/lib/lead-assignments";
import { siteOrigin } from "@/lib/origin";
import { isSuperAdmin } from "@/lib/auth/roles";
import { getPartnerTerms, type PartnerTermsRow } from "@/lib/partner-terms";
import { deleteLeadAction, setLeadSpamAction, updateLeadAction } from "./actions";
import { countReportLeads, REPORT_SOURCE } from "@/lib/report-queries";
import { esA3, type ReportReason } from "@/i18n/es-a3";
import { esBrief } from "@/i18n/es-brief";
import { BRIEF_SOURCE } from "@/lib/buyer-brief";
import { OWNER_PANEL_SOURCE } from "@/lib/owner-realtor-request";
import { esInbox } from "@/i18n/es-e2";
import { leadReplyRecipient, listLeadThreads } from "@/lib/inbox";
import { LEAD_EMAIL_FLASH, leadEmailReplyAvailable } from "@/lib/inbox-access";
import { LeadEmailThread } from "@/components/panel/EmailThread";
import { leadEmailAction, leadWhatsAppAction, suggestLeadReplyAction, suggestLeadWhatsAppReplyAction } from "./actions";
import { LeadWhatsAppThread } from "@/components/panel/WhatsAppThread";
import { getWhatsAppContacts, listLeadWhatsApp, type WhatsAppContact, type WhatsAppMessage } from "@/lib/whatsapp-inbox";
import { LEAD_WHATSAPP_FLASH } from "@/lib/whatsapp-access";
import { normalizeWaPhone } from "@/lib/whatsapp-webhook";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { isAiReplyEnabled } from "@/lib/ai-reply";
import { DealPanel, DealStageReadOnly } from "./DealPanel";
import { esDeals } from "@/i18n/es-deals";
import {
  getDealsForLeads,
  getDealStagesForLeads,
  type DealRow,
  type DealStageRow,
} from "@/lib/deals";
import { WhatsappLeadForm } from "./WhatsappLeadForm";
import { esWa } from "@/i18n/es-wa";
import { WHATSAPP_MANUAL_SOURCE } from "@/lib/whatsapp-lead";
import { currentVertical } from "@/lib/vertical-context";
import { CONTACT_KINDS, LEAD_SORTS } from "@/lib/contact-kind";
import { esTriage } from "@/i18n/es-triage";

/** A listing report (A3): a `question` lead marked `utm.source`. */
function isReport(lead: AdminLeadRow): boolean {
  return lead.utm?.source === REPORT_SOURCE;
}

export const metadata: Metadata = {
  title: `Consultas`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const LEAD_TYPES = ADMIN_LEAD_TYPES;

const LEAD_TYPE_LABEL: Record<string, string> = {
  all: esPanel.filterAll,
  buyer: "Compra",
  renter: "Alquiler",
  seller: "Venta",
  valuation: "Tasación",
  developer: "Desarrolladora",
  agent_signup: "Alta de agente",
  landlord: "Alquilar su propiedad",
  question: "Consulta",
};

const FOLLOW_UP_LABEL: Record<LeadFollowUp, string> = {
  new: "Nueva",
  contacted: "Contactada",
  closed: "Cerrada",
  spam: "Spam",
};

const FOLLOW_UP_CHIP: Record<LeadFollowUp, string> = {
  new: "Nuevas",
  contacted: "Contactadas",
  closed: "Cerradas",
  spam: "Spam",
};

/** Who the lead was routed to — 'internal' means it is yours to work. */
const ROUTED_LABEL: Record<string, string> = {
  agency: "Inmobiliaria",
  agent: "Agente",
  owner: "Particular",
  internal: "Interno",
  developer: "Desarrolladora",
};

/** `leads.vertical` stores the door's key ("en", "rent"); show its domain. */
const HOST_BY_VERTICAL: Record<string, string> = Object.fromEntries(
  Object.entries(VERTICALS).map(([host, v]) => [v.key, host]),
);

function siteLabel(vertical: string): string {
  return HOST_BY_VERTICAL[vertical] ?? vertical;
}

/** One filter URL, so the chip rows and the search keep each other. */
function leadsHref(p: {
  tipo?: string;
  sitio?: string;
  estado?: string;
  tel?: string;
  q?: string;
  agrupar?: boolean;
  fuente?: string;
  quien?: string;
  orden?: string;
  publico?: string;
  vista?: string;
}): string {
  const sp = new URLSearchParams();
  if (p.vista) sp.set("vista", p.vista);
  if (p.publico) sp.set("publico", p.publico);
  if (p.fuente) sp.set("fuente", p.fuente);
  if (p.quien) sp.set("quien", p.quien);
  if (p.orden) sp.set("orden", p.orden);
  if (p.tipo && p.tipo !== "all") sp.set("tipo", p.tipo);
  if (p.sitio) sp.set("sitio", p.sitio);
  if (p.estado) sp.set("estado", p.estado);
  if (p.tel) sp.set("tel", p.tel);
  if (p.q) sp.set("q", p.q);
  if (p.agrupar) sp.set("agrupar", "1");
  const qs = sp.toString();
  return qs ? `/admin/leads?${qs}` : "/admin/leads";
}

function waReplyHref(whatsapp: string): string {
  return waLink(whatsapp) ?? `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
}

/**
 * Hand an FSBO lead to the person who published the listing. Null for every
 * other lead: an agency works its own inbox, and an internal lead is the
 * founder's to answer directly.
 */
function forwardHref(lead: AdminLeadRow) {
  // A report is about the publisher, never forwarded to them; the owner's own
  // "sell it for me" request (A2) is from them, so forwarding it back is noise.
  if (!lead.ownerWhatsapp || isReport(lead) || lead.utm?.source === OWNER_PANEL_SOURCE) return null;
  const href = waLink(
    lead.ownerWhatsapp,
    esPanel.forwardLeadMessage({
      listingTitle: lead.listingTitle,
      name: lead.name,
      whatsapp: lead.whatsapp,
      message: lead.message,
    }),
  );
  if (!href) return null;
  return (
    <a
      className="panel-btn"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {esPanel.forwardLead}
    </a>
  );
}

/**
 * A lead that came in through the directory door (D1): `leadType: "seller"`
 * plus a `directory:*` `utm.source`. There is no `leads.source` column and D3
 * does not add one — the marker is the marker.
 */
function isDirectoryLead(lead: AdminLeadRow): boolean {
  return (
    lead.leadType === "seller" &&
    (lead.utm?.source ?? "").startsWith("directory:")
  );
}

const MATCH_FLASH: Record<string, { text: string; error?: boolean }> = {
  match_saved: { text: esPanel.matchSavedFlash },
  match_none: { text: esPanel.matchNoneFlash },
  match_limit: { text: esPanel.matchLimitError, error: true },
  match_invalid: { text: esPanel.matchInvalidError, error: true },
  shared: { text: esPanel.shareFlashShared },
  share_none: { text: esPanel.shareFlashNone, error: true },
  share_invalid: { text: esPanel.shareFlashInvalid, error: true },
  share_revoked: { text: esPanel.shareFlashRevoked },
  spam_marked: { text: esPanel.spamFlashMarked },
  spam_restored: { text: esPanel.spamFlashRestored },
  spam_invalid: { text: esPanel.spamFlashInvalid, error: true },
  lead_deleted: { text: esPanel.deleteFlashDone },
  lead_delete_invalid: { text: esPanel.deleteFlashInvalid, error: true },
  ...LEAD_EMAIL_FLASH,
  ...LEAD_WHATSAPP_FLASH,
  converted: { text: esInbox.flash.converted },
  ...Object.fromEntries(
    Object.entries(esDeals.flash).map(([k, text]) => [k, { text, error: !esDeals.flashOk.includes(k) }]),
  ),
};

/** The bulk share bar's <form>; each card's checkbox points at it by id. */
const BULK_SHARE_FORM = "bulk-share";

/**
 * Leads grouped by `leadPhoneKey()`, in the order the list already has
 * (newest first), so each group's head is its newest lead. A number with no
 * usable digits is a group of its own rather than one bucket of strangers.
 */
function groupByPhone(rows: AdminLeadRow[]): AdminLeadRow[][] {
  const groups = new Map<string, AdminLeadRow[]>();
  for (const row of rows) {
    const key = leadPhoneKey(row.whatsapp);
    const k = /^\d{6,9}$/.test(key) ? key : `id:${row.id}`;
    const g = groups.get(k);
    if (g) g.push(row);
    else groups.set(k, [row]);
  }
  return [...groups.values()];
}

/** The lead types "Registrar consulta de WhatsApp" offers (plus "auto"). */
const WA_FORM_TYPES = ["buyer", "renter", "seller", "valuation", "landlord", "question"];

/** How many of a person's other leads a card lists before "y N más". */
const HISTORY_SHOWN = 5;

/**
 * "También consultó por N más": the same person's other leads (same WhatsApp
 * number or same email), each with its listing, date and door. Sliced from
 * the page's one history query; nothing here reads the database.
 */
function LeadHistory({
  lead,
  history,
}: {
  lead: AdminLeadRow;
  history: readonly LeadHistoryRow[];
}) {
  const others = leadHistoryFor(lead, history);
  if (others.length === 0) return null;
  const key = leadPhoneKey(lead.whatsapp);
  const more = others.length - HISTORY_SHOWN;
  return (
    <details className="panel-card__body">
      <summary>{esWa.historyTitle(others.length)}</summary>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
        {others.slice(0, HISTORY_SHOWN).map((h) => (
          <li key={h.id}>
            {h.listingTitle && h.listingPublicId && h.listingSlug ? (
              <Link
                href={listingUrl({ slug: h.listingSlug, publicId: h.listingPublicId })}
                target="_blank"
              >
                {h.listingTitle}
              </Link>
            ) : (
              <span>
                {esWa.historyNoListing} · {LEAD_TYPE_LABEL[h.leadType] ?? h.leadType}
              </span>
            )}
            {" · "}
            {formatWhen(new Date(h.createdAt))}
            {" · "}
            {siteLabel(h.vertical)}
            {h.byEmail ? ` · ${esWa.historySameEmail}` : null}
          </li>
        ))}
      </ul>
      {more > 0 ? (
        /^\d{6,9}$/.test(key) ? (
          <Link href={leadsHref({ tel: key })}>{esWa.historyMore(more)}</Link>
        ) : (
          <span>{esWa.historyMore(more)}</span>
        )
      ) : null}
    </details>
  );
}

function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    sitio?: string;
    estado?: string;
    tel?: string;
    q?: string;
    msg?: string;
    agrupar?: string;
    fuente?: string;
    negocio?: string;
    quien?: string;
    orden?: string;
    publico?: string;
    vista?: string;
  }>;
}) {
  const [{ tipo, sitio, estado, tel, q, msg, agrupar, fuente, negocio, quien, orden, publico, vista }, user, jar] =
    await Promise.all([searchParams, requireStaffOrAbove(), cookies()]);

  // Staff are internal-only by role. Everyone else picks "Mis consultas"
  // (the internal lane, what the tab badge counts) or "Todas"; the choice is
  // remembered in a cookie and every count, list and export below follows it.
  const staffOnly = isStaff(user.role);
  const viewCookie = jar.get(ADMIN_LEAD_VIEW_COOKIE)?.value;
  const view = parseAdminLeadView(vista, viewCookie);
  const internalOnly = adminLeadsInternalOnly(view, staffOnly);
  const [badges, recentLeads, counts, siteCounts, statusCounts, reportCount, kindCounts, publisherCounts] =
    await Promise.all([
      getAdminBadges(user),
      countRecentLeads(24, internalOnly),
      countLeadsByType(internalOnly),
      countLeadsByVertical(internalOnly),
      countLeadsByStatus(internalOnly),
      countReportLeads(internalOnly),
      countLeadsByContactKind(internalOnly),
      countLeadsByPublisher(internalOnly),
    ]);
  // One parser for the page and its CSV export (src/lib/lead-export.ts): a
  // site is only a value some lead actually carries, a number only a
  // well-formed key — never free text.
  const filter = parseAdminLeadFilter(
    { tipo, sitio, estado, tel, q, fuente, quien, orden, publico, vista },
    siteCounts.map((s) => s.vertical),
    viewCookie,
  );
  const {
    type: activeType,
    vertical: activeSite,
    status: activeStatus,
    phoneKey: activeTel,
  } = filter;
  const reportsOnly = filter.reports === true;
  const activeKind = filter.contactKind;
  const activeSort = filter.sort;
  const activePublisher = filter.publisher;
  /**
   * Every filter link on the page keeps "Quién escribe" and the sort, so
   * picking a type or a site never silently drops them.
   */
  const linkTo = (p: Parameters<typeof leadsHref>[0]) =>
    leadsHref({
      vista: view,
      quien: activeKind,
      publico: activePublisher,
      orden: activeSort === "recent" ? undefined : activeSort,
      ...p,
    });
  // Superadmin 7: one card per WhatsApp number. Display only — every lead
  // keeps its own row, status, note and shares.
  const grouped = agrupar === "1";
  const rows = await adminLeadRows(filter, staffOnly);
  const exportQuery = adminLeadFilterQuery(filter);
  // Which numbers on this page wrote more than once (one GROUP BY), who each
  // lead is shared with, the partners it could be shared with, and — for the
  // super-admin — how those partners answer. One query each for the page.
  const [repeats, sharesByLead, shareTargets, board, origin, threads, history, door, professionals] = await Promise.all([
    countLeadsByPhoneKey(
      rows.map((r) => leadPhoneKey(r.whatsapp)),
      internalOnly,
    ),
    listSharesForLeads(rows.map((r) => r.id)),
    listShareTargets(),
    isSuperAdmin(user.role) ? listShareBoard() : Promise.resolve([]),
    siteOrigin(),
    // Email threads (wave E2) of exactly the rows this page lists — the
    // rows already carry the staff rule, so the threads inherit it.
    listLeadThreads(rows.map((r) => r.id)),
    // Buyer history: the same people's other leads, one query for the page.
    // Skipped on the one-number view, where every card already is the history.
    activeTel
      ? Promise.resolve([] as LeadHistoryRow[])
      : listLeadHistory({
          phoneKeys: rows.map((r) => leadPhoneKey(r.whatsapp)),
          emails: rows.map((r) => r.email),
          internalOnly,
        }),
    currentVertical(),
    // Display only; a failed read must not cost the operator the inbox.
    findProfessionalsByPhoneKey(rows.map((r) => leadPhoneKey(r.whatsapp))).catch(
      () => new Map<string, { kind: "agent" | "agency"; name: string }>(),
    ),
  ]);
  // The deal ledger (batch 6): the super-admin gets the full row, staff the
  // stage alone — their query never selects a money column.
  const superAdmin = isSuperAdmin(user.role);
  const leadIds = rows.map((r) => r.id);
  const [dealsByLead, dealStagesByLead] = await Promise.all([
    superAdmin ? getDealsForLeads(leadIds) : Promise.resolve(new Map<number, DealRow>()),
    superAdmin ? Promise.resolve(new Map<number, DealStageRow>()) : getDealStagesForLeads(leadIds),
  ]);

  /**
   * The partner whose usual split the "Negocio" block suggests (O2): the
   * deal's partner, else the lead's one active share. Super-admin only, one
   * query for the page.
   */
  const splitPartnerOf = new Map<number, { kind: "agency" | "agent"; id: number; name: string }>();
  if (superAdmin) {
    for (const id of leadIds) {
      const deal = dealsByLead.get(id);
      const shares = sharesByLead.get(id) ?? [];
      const dealShare = deal
        ? shares.find((sh) => (deal.agencyId ? sh.kind === "agency" && sh.targetId === deal.agencyId : deal.agentId ? sh.kind === "agent" && sh.targetId === deal.agentId : false))
        : undefined;
      const active = shares.filter((sh) => !sh.revokedAt);
      const pick = dealShare ?? (deal?.agencyId || deal?.agentId ? undefined : active.length === 1 ? active[0] : undefined);
      if (pick) splitPartnerOf.set(id, { kind: pick.kind, id: pick.targetId, name: pick.targetName });
    }
  }
  const splitTerms = superAdmin && splitPartnerOf.size > 0
    ? await getPartnerTerms([...splitPartnerOf.values()]).catch(() => new Map<string, PartnerTermsRow>())
    : new Map<string, PartnerTermsRow>();
  const termsForLead = (id: number) => {
    const p = splitPartnerOf.get(id);
    const tr = p ? splitTerms.get(`${p.kind}:${p.id}`) : undefined;
    return p && tr ? { partnerName: p.name, commissionPct: tr.commissionPct, mySharePct: tr.mySharePct } : null;
  };
  // WhatsApp threads of exactly these rows (they carry the staff rule), and
  // each number's 24-hour window. A read failure (migration 0021 not applied
  // yet) leaves the cards without a WhatsApp block rather than failing the page.
  const [waThreads, waContacts] = await Promise.all([
    listLeadWhatsApp(leadIds).catch(() => new Map<number, WhatsAppMessage[]>()),
    getWhatsAppContacts(rows.map((r) => normalizeWaPhone(r.whatsapp) ?? "")).catch(() => new Map<string, WhatsAppContact>()),
  ]);
  const waSendable = isWhatsAppConfigured();
  const openDealLead = Number(negocio) || 0;
  // The doors "Registrar consulta de WhatsApp" can file a lead under.
  const waSites = Object.entries(VERTICALS)
    .filter(([, v]) => v.enabled)
    .map(([host, v]) => ({ key: v.key, label: host }));
  const replyAvailable = leadEmailReplyAvailable();
  const partnerPanelUrl = `${origin}/agencia/leads`;
  // Where "Guardar" on a card sends the operator back to.
  const backHref = linkTo({
    tipo: activeType,
    sitio: activeSite,
    estado: activeStatus,
    tel: activeTel,
    q,
    agrupar: grouped,
    fuente: reportsOnly ? "reportes" : undefined,
  });

  // D3 matching, loaded once for the page rather than per card: one candidate
  // query and one matches query, then the ranking is pure TS per lead. Skipped
  // entirely when the filter shows no directory lead — a buyer inbox must not
  // pay for a feature it never renders.
  const directoryLeads = rows.filter(isDirectoryLead);
  const [candidates, matchesByLead] = await Promise.all([
    directoryLeads.length > 0
      ? listAgentMatchCandidates()
      : Promise.resolve([]),
    directoryLeads.length > 0
      ? listMatchesForLeads(directoryLeads.map((l) => l.id))
      : Promise.resolve(new Map<number, LeadMatchRow[]>()),
  ]);

  const leadCard = (lead: AdminLeadRow) => (
    <article className="panel-card" key={lead.id} id={`lead-${lead.id}`}>
      <div className="panel-card__head">
        <div>
          <h3 className="panel-card__title">
            {shareTargets.length > 0 && !isReport(lead) ? (
              <input
                type="checkbox"
                name="leadIds"
                value={lead.id}
                form={BULK_SHARE_FORM}
                aria-label={`${esPanel.shareSelect}: ${lead.name ?? lead.whatsapp}`}
                style={{ marginRight: 8 }}
              />
            ) : null}
            {lead.name ?? "Consulta"}
          </h3>
          <div className="panel-card__meta">
            <span
              className={`panel-chip${lead.status === "new" ? " panel-chip--active" : ""}`}
            >
              {FOLLOW_UP_LABEL[lead.status]}
            </span>
            <span>
              {LEAD_TYPE_LABEL[lead.leadType] ?? lead.leadType}
            </span>
            <Link
              className={`panel-kind panel-kind--${lead.publisherKind === "no_listing" ? "none" : lead.publisherKind}`}
              href={linkTo({ publico: lead.publisherKind })}
              title={esTriage.leadPublisherFilterLabel}
            >
              {esTriage.leadPublisherPill(lead.publisherKind, lead.publisherName)}
            </Link>
            <Link
              className={`panel-kind panel-kind--${lead.contactKind}`}
              href={linkTo({ quien: lead.contactKind })}
              title={esTriage.contactFilterLabel}
            >
              {esTriage.contact[lead.contactKind]}
            </Link>
            {(() => {
              // A professional in the directory, recognised by their WhatsApp
              // even when they never said so on the form.
              const pro = professionals.get(leadPhoneKey(lead.whatsapp));
              return pro ? (
                <span className={`panel-kind panel-kind--${pro.kind}`}>
                  {pro.kind === "agent" ? esTriage.knownAgent(pro.name) : esTriage.knownAgency(pro.name)}
                </span>
              ) : null;
            })()}
            <span>{formatWhen(lead.createdAt)}</span>
            <span>{lead.whatsapp}</span>
            {/* The same person writing again — or the same bot. */}
            {(() => {
              const key = leadPhoneKey(lead.whatsapp);
              const n = repeats.get(key);
              return n && !activeTel ? (
                <Link
                  className="panel-chip panel-chip--active"
                  href={linkTo({ tel: key })}
                >
                  {esPanel.leadsSamePhone(n)}
                </Link>
              ) : null;
            })()}
            {lead.email ? <span>{lead.email}</span> : null}
            {/* Who owns the follow-up: an agency, a particular
                seller who has no panel yet, or you. */}
            <span>
              {/* An internal lead is yours whoever published the listing: a
                  report, an owner's request, and every lead in agency mode. */}
              {isReport(lead) || lead.routedTo === "internal"
                ? ROUTED_LABEL.internal
                : lead.agencyName ??
                (lead.ownerWhatsapp
                  ? `${esPanel.leadOwnerRouted}: ${lead.ownerName ?? lead.ownerWhatsapp}`
                  : (ROUTED_LABEL[lead.routedTo] ?? lead.routedTo))}
            </span>
            {/* Which door captured it — matters once feeders are on. */}
            <span>{siteLabel(lead.vertical)}</span>
            {/* No dedicated `leads.source` column — /vender (PR4)
                stamps utm.source instead (VenderForm.tsx). */}
            {isReport(lead) ? (
              <span className="panel-chip panel-chip--active">
                {esA3.admin.reportBadge}
                {lead.utm?.report_reason &&
                lead.utm.report_reason in esA3.admin.reportReason
                  ? ` · ${esA3.admin.reportReason[lead.utm.report_reason as ReportReason]}`
                  : null}
              </span>
            ) : null}
            {lead.utm?.source === WHATSAPP_MANUAL_SOURCE ? (
              <span className="panel-chip panel-chip--active">
                {esWa.sourceChip}
              </span>
            ) : null}
            {lead.utm?.source === "vender" ? (
              <span className="panel-chip panel-chip--active">
                /vender
              </span>
            ) : null}
            {lead.utm?.source === BRIEF_SOURCE ? (
              <span className="panel-chip panel-chip--active">
                {esBrief.adminBadge}
              </span>
            ) : null}
            {lead.listingTitle &&
            lead.listingPublicId &&
            lead.listingSlug ? (
              <Link
                href={listingUrl({
                  slug: lead.listingSlug,
                  publicId: lead.listingPublicId,
                })}
                target="_blank"
              >
                {lead.listingTitle}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="panel-card__actions">
          <a
            className="panel-btn panel-btn--whatsapp"
            href={waReplyHref(lead.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {esPanel.contactLead}
          </a>
          {/* A particular seller has no inbox of their own (PLAN.md
              D8), so the lead only reaches them if it is forwarded. */}
          {forwardHref(lead)}
        </div>
      </div>

      {lead.message ? (
        <div className="panel-card__body panel-card__body--message">{lead.message}</div>
      ) : null}

      <LeadHistory lead={lead} history={history} />

      <LeadEmailThread
        messages={threads.get(lead.id) ?? []}
        action={leadEmailAction}
        hidden={{ leadId: lead.id, back: backHref }}
        replyTo={leadReplyRecipient(threads.get(lead.id) ?? [], lead.email)}
        unavailable={replyAvailable ? null : esInbox.thread.replyUnavailable}
        suggest={isAiReplyEnabled() ? suggestLeadReplyAction.bind(null, lead.id) : undefined}
      />

      <LeadWhatsAppThread
        messages={waThreads.get(lead.id) ?? []}
        action={leadWhatsAppAction}
        hidden={{ leadId: lead.id, back: backHref }}
        canReply={waSendable}
        phone={normalizeWaPhone(lead.whatsapp)}
        lastInboundAt={waContacts.get(normalizeWaPhone(lead.whatsapp) ?? "")?.lastInboundAt ?? null}
        suggest={isAiReplyEnabled() ? suggestLeadWhatsAppReplyAction.bind(null, lead.id) : undefined}
      />

      <form action={updateLeadAction} className="panel-form">
        <input type="hidden" name="leadId" value={lead.id} />
        <input type="hidden" name="back" value={backHref} />
        <label className="panel-form__field">
          <span className="auth-field__label">Estado</span>
          <select
            className="auth-field__input"
            name="status"
            defaultValue={lead.status}
          >
            {FOLLOW_UP.map((st) => (
              <option key={st} value={st}>
                {FOLLOW_UP_LABEL[st]}
              </option>
            ))}
          </select>
        </label>
        <label
          className="panel-form__field"
          style={{ flexBasis: "320px", flexGrow: 1 }}
        >
          <span className="auth-field__label">Nota interna</span>
          <textarea
            className="auth-field__input"
            name="note"
            rows={2}
            maxLength={2000}
            defaultValue={lead.note ?? ""}
          />
        </label>
        <div className="panel-form__field panel-form__field--action">
          <button className="panel-btn" type="submit">
            Guardar
          </button>
        </div>
      </form>

      {/* Spam is reversible and hides the lead; delete is permanent and only
          the super-admin gets the button. No JS: the confirm is a <details>. */}
      <div className="panel-form">
        <form action={setLeadSpamAction}>
          <input type="hidden" name="leadId" value={lead.id} />
          <input type="hidden" name="back" value={backHref} />
          <input type="hidden" name="spam" value={lead.status === "spam" ? "0" : "1"} />
          <button className="panel-btn" type="submit">
            {lead.status === "spam" ? esPanel.unspamButton : esPanel.spamButton}
          </button>
        </form>
        {superAdmin ? (
          <details>
            <summary>{esPanel.deleteSummary}</summary>
            <form action={deleteLeadAction}>
              <p className="auth-field__label">{esPanel.deleteWarning}</p>
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="back" value={backHref} />
              <button className="panel-btn panel-btn--danger" type="submit">
                {esPanel.deleteButton}
              </button>
            </form>
          </details>
        ) : null}
      </div>

      {/* A report is never shared: shareLeads() refuses it too. */}
      {!isReport(lead) && (
        <SharePanel
          leadId={lead.id}
          shares={sharesByLead.get(lead.id) ?? ([] as ShareRow[])}
          targets={shareTargets}
          back={backHref}
          panelUrl={partnerPanelUrl}
          leadName={lead.name}
        />
      )}

      {/* The deal and commission ledger. A report never becomes a deal. */}
      {isReport(lead) ? null : superAdmin ? (
        <DealPanel
          leadId={lead.id}
          deal={dealsByLead.get(lead.id)}
          shares={sharesByLead.get(lead.id) ?? []}
          back={backHref}
          open={openDealLead === lead.id}
          terms={termsForLead(lead.id)}
        />
      ) : (
        <DealStageReadOnly deal={dealStagesByLead.get(lead.id)} />
      )}

      {/* Directory leads belong to nobody yet: the operator proposes
          up to three verified professionals and hands the lead over on
          WhatsApp. Every other lead already has an inbox. */}
      {isDirectoryLead(lead) ? (
        <MatchPanel
          leadId={lead.id}
          citySlug={leadCitySlug(lead.utm)}
          suggestions={rankCandidates(
            candidates,
            leadCitySlug(lead.utm),
          )}
          matches={matchesByLead.get(lead.id) ?? []}
          forwardText={esPanel.forwardLeadMessage({
            listingTitle: lead.listingTitle,
            name: lead.name,
            whatsapp: lead.whatsapp,
            message: lead.message,
          })}
        />
      ) : null}
    </article>
  );

  const flash = msg ? MATCH_FLASH[msg] : undefined;

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("leads", badges)}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>
            {flash.text}
          </p>
        ) : null}

        <h2 className="panel-section__title">{esPanel.adminLeadsTitle}</h2>
        <p style={{ color: "#55655F", fontSize: 13, marginTop: 0 }}>
          {staffOnly ? esPanel.staffLeadsHint : esPanel.adminLeadsHint}
        </p>
        {staffOnly ? null : (
          <>
            <RememberView name={ADMIN_LEAD_VIEW_COOKIE} value={view} />
            <nav className="panel-chips" aria-label={esTriage.leadViewLabel}>
              {ADMIN_LEAD_VIEWS.map((v) => (
                <Link
                  key={v}
                  href={linkTo({
                    vista: v,
                    tipo: activeType,
                    sitio: activeSite,
                    estado: activeStatus,
                    q,
                    agrupar: grouped,
                    fuente: reportsOnly ? "reportes" : undefined,
                  })}
                  className={`panel-chip${v === view ? " panel-chip--active" : ""}`}
                  aria-current={v === view ? "page" : undefined}
                >
                  {esTriage.leadView[v]}
                </Link>
              ))}
              <span className="panel-chips__label">{esTriage.leadViewHint[view]}</span>
            </nav>
          </>
        )}
        {/* Says what the tab badge is counting — a bare number next to
            "Consultas" would read as the all-time total. */}
        {badges.leads > 0 ? (
          <p className="panel-note">
            <Link href={linkTo({ estado: "new" })}>{esTriage.leadsBadgeNote(badges.leads)}</Link>
          </p>
        ) : null}
        {recentLeads > 0 ? (
          <p className="panel-note">{esPanel.adminLeadsRecent(recentLeads)}</p>
        ) : null}

        <WhatsappLeadForm
          sites={waSites}
          defaultSite={door.key}
          types={WA_FORM_TYPES.map((value) => ({
            value,
            label: LEAD_TYPE_LABEL[value] ?? value,
          }))}
        />

        <nav className="panel-chips">
          {LEAD_TYPES.map((t) => {
            const href = linkTo({
              tipo: t,
              sitio: activeSite,
              estado: activeStatus,
              q,
              agrupar: grouped,
            });
            const count = counts[t] ?? 0;
            return (
              <Link
                key={t}
                href={href}
                className={`panel-chip${t === activeType ? " panel-chip--active" : ""}`}
              >
                {LEAD_TYPE_LABEL[t]}
                <span className="panel-tab__count">{count}</span>
              </Link>
            );
          })}
          {/* Listing reports from "Reportar este aviso" (A3) — a subset of
              "Consulta", marked by utm.source rather than a type of its own. */}
          <Link
            href={linkTo({
              tipo: activeType,
              sitio: activeSite,
              estado: activeStatus,
              q,
              agrupar: grouped,
              fuente: reportsOnly ? undefined : "reportes",
            })}
            className={`panel-chip${reportsOnly ? " panel-chip--active" : ""}`}
          >
            {esA3.admin.reportsChip}
            <span className="panel-tab__count">{reportCount}</span>
          </Link>
        </nav>

        {/* Who the lead is from: the visitor's own "¿Quién sos?" answer read
            with the lead type (src/lib/contact-kind.ts). Counts across every
            type and site, like the chips above. */}
        <nav className="panel-chips" aria-label={esTriage.contactFilterLabel}>
          <span className="panel-chips__label">{esTriage.contactFilterLabel}</span>
          <Link
            href={linkTo({ tipo: activeType, sitio: activeSite, estado: activeStatus, q, agrupar: grouped, quien: "" })}
            className={`panel-chip${activeKind ? "" : " panel-chip--active"}`}
          >
            {esTriage.contactAll}
          </Link>
          {CONTACT_KINDS.filter((k) => kindCounts[k] > 0 || k === activeKind).map((k) => (
            <Link
              key={k}
              href={linkTo({ tipo: activeType, sitio: activeSite, estado: activeStatus, q, agrupar: grouped, quien: k })}
              className={`panel-chip${k === activeKind ? " panel-chip--active" : ""}`}
            >
              {esTriage.contact[k]}
              <span className="panel-tab__count">{kindCounts[k]}</span>
            </Link>
          ))}
        </nav>

        {/* Who published the lead's listing (src/lib/publisher-kind.ts). */}
        <nav className="panel-chips" aria-label={esTriage.leadPublisherFilterLabel}>
          <span className="panel-chips__label">{esTriage.leadPublisherFilterLabel}</span>
          <Link
            href={linkTo({ tipo: activeType, sitio: activeSite, estado: activeStatus, q, agrupar: grouped, publico: "" })}
            className={`panel-chip${activePublisher ? "" : " panel-chip--active"}`}
          >
            {esTriage.contactAll}
          </Link>
          {LEAD_PUBLISHER_KINDS.filter((k) => publisherCounts[k] > 0 || k === activePublisher).map((k) => (
            <Link
              key={k}
              href={linkTo({ tipo: activeType, sitio: activeSite, estado: activeStatus, q, agrupar: grouped, publico: k })}
              className={`panel-chip${k === activePublisher ? " panel-chip--active" : ""}`}
            >
              {esTriage.leadPublisherChip[k]}
              <span className="panel-tab__count">{publisherCounts[k]}</span>
            </Link>
          ))}
        </nav>

        {/* Which door captured the lead. Counts are per site across every
            type, the same way the type chips count across every site. */}
        {siteCounts.length > 1 ? (
          <nav className="panel-chips" aria-label="Sitio">
            <Link
              href={linkTo({ tipo: activeType, estado: activeStatus, q, agrupar: grouped })}
              className={`panel-chip${activeSite ? "" : " panel-chip--active"}`}
            >
              Todos los sitios
              <span className="panel-tab__count">{counts.all ?? 0}</span>
            </Link>
            {siteCounts.map((s) => (
              <Link
                key={s.vertical}
                href={linkTo({
                  tipo: activeType,
                  sitio: s.vertical,
                  estado: activeStatus,
                  q,
                  agrupar: grouped,
                })}
                className={`panel-chip${s.vertical === activeSite ? " panel-chip--active" : ""}`}
              >
                {siteLabel(s.vertical)}
                <span className="panel-tab__count">{s.n}</span>
              </Link>
            ))}
          </nav>
        ) : null}

        {/* Follow-up state. "Nuevas" is the inbox: what nobody answered yet. */}
        <nav className="panel-chips" aria-label="Estado">
          <Link
            href={linkTo({ tipo: activeType, sitio: activeSite, q, agrupar: grouped })}
            className={`panel-chip${activeStatus ? "" : " panel-chip--active"}`}
          >
            Todos los estados
          </Link>
          {FOLLOW_UP.map((st) => (
            <Link
              key={st}
              href={linkTo({
                tipo: activeType,
                sitio: activeSite,
                estado: st,
                q,
                agrupar: grouped,
              })}
              className={`panel-chip${st === activeStatus ? " panel-chip--active" : ""}`}
            >
              {FOLLOW_UP_CHIP[st]}
              <span className="panel-tab__count">{statusCounts[st] ?? 0}</span>
            </Link>
          ))}
          <Link
            href={linkTo({ tipo: activeType, sitio: activeSite, estado: "spam", q, agrupar: grouped })}
            className={`panel-chip${activeStatus === "spam" ? " panel-chip--active" : ""}`}
          >
            {esPanel.spamChip}
            <span className="panel-tab__count">{statusCounts.spam ?? 0}</span>
          </Link>
        </nav>

        {/* Same shape as the listings search on /admin/propiedades. */}
        <form action="/admin/leads" className="panel-form">
          {activeType !== "all" ? (
            <input type="hidden" name="tipo" value={activeType} />
          ) : null}
          {activeSite ? (
            <input type="hidden" name="sitio" value={activeSite} />
          ) : null}
          {activeStatus ? (
            <input type="hidden" name="estado" value={activeStatus} />
          ) : null}
          {grouped ? <input type="hidden" name="agrupar" value="1" /> : null}
          {reportsOnly ? <input type="hidden" name="fuente" value="reportes" /> : null}
          {activeKind ? <input type="hidden" name="quien" value={activeKind} /> : null}
          {activePublisher ? <input type="hidden" name="publico" value={activePublisher} /> : null}
          <input type="hidden" name="vista" value={view} />
          <label className="panel-form__field" style={{ flexBasis: "280px" }}>
            <span className="auth-field__label">
              {esPanel.adminLeadsSearchLabel}
            </span>
            <input
              className="auth-field__input"
              name="q"
              type="search"
              defaultValue={q ?? ""}
            />
          </label>
          <label className="panel-form__field" style={{ flexBasis: "180px" }}>
            <span className="auth-field__label">{esTriage.sortLabel}</span>
            <select className="panel-select" name="orden" defaultValue={activeSort}>
              {LEAD_SORTS.map((o) => (
                <option key={o} value={o}>
                  {esTriage.sort[o]}
                </option>
              ))}
            </select>
          </label>
          <div className="panel-form__field panel-form__field--action">
            <button className="panel-btn" type="submit">
              {esPanel.searchSubmit}
            </button>
          </div>
        </form>

        <nav className="panel-chips" aria-label={esA1.groupToggle}>
          <Link
            href={linkTo({
              tipo: activeType,
              sitio: activeSite,
              estado: activeStatus,
              tel: activeTel,
              q,
              agrupar: !grouped,
            })}
            className={`panel-chip${grouped ? " panel-chip--active" : ""}`}
          >
            {grouped ? esA1.groupToggleOff : esA1.groupToggle}
          </Link>
          {rows.length > 0 ? (
            <a
              className="panel-chip"
              href={`/admin/leads/export${exportQuery ? `?${exportQuery}` : ""}`}
              title={esA1.exportHint}
              download
            >
              {esA1.exportCsv}
            </a>
          ) : null}
        </nav>

        {activeTel ? (
          <p className="panel-note">
            {esPanel.leadsSamePhoneFilter}{" "}
            <Link href={linkTo({ tipo: activeType, sitio: activeSite, estado: activeStatus, q, agrupar: grouped })}>
              {esPanel.leadsSamePhoneClear}
            </Link>
          </p>
        ) : null}

        {board.length > 0 ? (
          <details className="panel-card">
            <summary>
              <strong>{esPanel.shareBoardTitle}</strong>
            </summary>
            <div className="panel-table__wrap">
              <table className="panel-table">
                <thead>
                  <tr>
                    {esPanel.shareBoardHead.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {board.map((b) => (
                    <tr key={`${b.kind}:${b.targetName}`}>
                      <td className="panel-table__name">{b.targetName}</td>
                      <td>{b.active}</td>
                      <td>{b.pending}</td>
                      <td>{b.overdue > 0 ? <strong>{b.overdue}</strong> : 0}</td>
                      <td>{b.answered}</td>
                      <td>{b.avgHours ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}

        {rows.length > 0 && shareTargets.length > 0 ? (
          <form id={BULK_SHARE_FORM} action={shareLeadsAction} className="panel-form panel-card">
            <input type="hidden" name="back" value={backHref} />
            <label className="panel-form__field">
              <span className="auth-field__label">{esPanel.shareBulkTitle}</span>
              <ShareTargetSelect targets={shareTargets} />
            </label>
            <label className="panel-form__field" style={{ flexGrow: 1 }}>
              <span className="auth-field__label">{esPanel.shareNoteLabel}</span>
              <input className="auth-field__input" name="shareNote" maxLength={280} />
            </label>
            <div className="panel-form__field panel-form__field--action">
              <button className="panel-btn panel-btn--primary" type="submit">
                {esPanel.shareBulkSubmit}
              </button>
            </div>
            <p className="panel-note" style={{ flexBasis: "100%" }}>{esPanel.shareHint}</p>
          </form>
        ) : null}

        {rows.length === 0 ? (
          <p className="panel-empty">{esPanel.adminLeadsEmpty}</p>
        ) : !grouped ? (
          rows.map(leadCard)
        ) : (
          groupByPhone(rows).map((group) => (
            <div key={`group-${group[0].id}`}>
              {leadCard(group[0])}
              {group.length > 1 ? (
                <details className="panel-card">
                  <summary>{esA1.groupOlder(group.length - 1)}</summary>
                  {group.slice(1).map(leadCard)}
                </details>
              ) : null}
            </div>
          ))
        )}
      </main>
    </>
  );
}
