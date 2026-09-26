import { isStaff } from "@/lib/auth/roles";
import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import {
  countLeadsByStatus,
  countLeadsByPhoneKey,
  countLeadsByType,
  countLeadsByVertical,
  countRecentLeads,
  countReviewQueue,
  leadPhoneKey,
  type AdminLeadRow,
  type LeadFollowUp,
} from "@/lib/panel-queries";
import {
  ADMIN_LEAD_TYPES,
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
import { updateLeadAction } from "./actions";

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
};

const FOLLOW_UP_CHIP: Record<LeadFollowUp, string> = {
  new: "Nuevas",
  contacted: "Contactadas",
  closed: "Cerradas",
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
}): string {
  const sp = new URLSearchParams();
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
  if (!lead.ownerWhatsapp) return null;
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
  }>;
}) {
  const [{ tipo, sitio, estado, tel, q, msg, agrupar }, user] = await Promise.all([
    searchParams,
    requireStaffOrAbove(),
  ]);

  const internalOnly = isStaff(user.role);
  const [reviewCount, recentLeads, counts, siteCounts, statusCounts] =
    await Promise.all([
      countReviewQueue(),
      countRecentLeads(24, internalOnly),
      countLeadsByType(internalOnly),
      countLeadsByVertical(internalOnly),
      countLeadsByStatus(internalOnly),
    ]);
  // One parser for the page and its CSV export (src/lib/lead-export.ts): a
  // site is only a value some lead actually carries, a number only a
  // well-formed key — never free text.
  const filter = parseAdminLeadFilter(
    { tipo, sitio, estado, tel, q },
    siteCounts.map((s) => s.vertical),
  );
  const {
    type: activeType,
    vertical: activeSite,
    status: activeStatus,
    phoneKey: activeTel,
  } = filter;
  // Superadmin 7: one card per WhatsApp number. Display only — every lead
  // keeps its own row, status, note and shares.
  const grouped = agrupar === "1";
  const rows = await adminLeadRows(filter, internalOnly);
  const exportQuery = adminLeadFilterQuery(filter);
  // Which numbers on this page wrote more than once (one GROUP BY), who each
  // lead is shared with, the partners it could be shared with, and — for the
  // super-admin — how those partners answer. One query each for the page.
  const [repeats, sharesByLead, shareTargets, board, origin] = await Promise.all([
    countLeadsByPhoneKey(
      rows.map((r) => leadPhoneKey(r.whatsapp)),
      internalOnly,
    ),
    listSharesForLeads(rows.map((r) => r.id)),
    listShareTargets(),
    isSuperAdmin(user.role) ? listShareBoard() : Promise.resolve([]),
    siteOrigin(),
  ]);
  const partnerPanelUrl = `${origin}/agencia/leads`;
  // Where "Guardar" on a card sends the operator back to.
  const backHref = leadsHref({
    tipo: activeType,
    sitio: activeSite,
    estado: activeStatus,
    tel: activeTel,
    q,
    agrupar: grouped,
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
    <article className="panel-card" key={lead.id}>
      <div className="panel-card__head">
        <div>
          <h3 className="panel-card__title">
            {shareTargets.length > 0 ? (
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
            <span>{formatWhen(lead.createdAt)}</span>
            <span>{lead.whatsapp}</span>
            {/* The same person writing again — or the same bot. */}
            {(() => {
              const key = leadPhoneKey(lead.whatsapp);
              const n = repeats.get(key);
              return n && !activeTel ? (
                <Link
                  className="panel-chip panel-chip--active"
                  href={leadsHref({ tel: key })}
                >
                  {esPanel.leadsSamePhone(n)}
                </Link>
              ) : null;
            })()}
            {lead.email ? <span>{lead.email}</span> : null}
            {/* Who owns the follow-up: an agency, a particular
                seller who has no panel yet, or you. */}
            <span>
              {lead.agencyName ??
                (lead.ownerWhatsapp
                  ? `${esPanel.leadOwnerRouted}: ${lead.ownerName ?? lead.ownerWhatsapp}`
                  : (ROUTED_LABEL[lead.routedTo] ?? lead.routedTo))}
            </span>
            {/* Which door captured it — matters once feeders are on. */}
            <span>{siteLabel(lead.vertical)}</span>
            {/* No dedicated `leads.source` column — /vender (PR4)
                stamps utm.source instead (VenderForm.tsx). */}
            {lead.utm?.source === "vender" ? (
              <span className="panel-chip panel-chip--active">
                /vender
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
        <div className="panel-card__body">{lead.message}</div>
      ) : null}

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

      <SharePanel
        leadId={lead.id}
        shares={sharesByLead.get(lead.id) ?? ([] as ShareRow[])}
        targets={shareTargets}
        back={backHref}
        panelUrl={partnerPanelUrl}
        leadName={lead.name}
      />

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
        tabs={adminTabs("leads", reviewCount, undefined, recentLeads)}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>
            {flash.text}
          </p>
        ) : null}

        <h2 className="panel-section__title">{esPanel.adminLeadsTitle}</h2>
        <p style={{ color: "#55655F", fontSize: 13, marginTop: 0 }}>
          {internalOnly ? esPanel.staffLeadsHint : esPanel.adminLeadsHint}
        </p>
        {/* Says what the tab badge is counting — a bare number next to
            "Consultas" would read as the all-time total. */}
        {recentLeads > 0 ? (
          <p className="panel-note">{esPanel.adminLeadsRecent(recentLeads)}</p>
        ) : null}

        <nav className="panel-chips">
          {LEAD_TYPES.map((t) => {
            const href = leadsHref({
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
        </nav>

        {/* Which door captured the lead. Counts are per site across every
            type, the same way the type chips count across every site. */}
        {siteCounts.length > 1 ? (
          <nav className="panel-chips" aria-label="Sitio">
            <Link
              href={leadsHref({ tipo: activeType, estado: activeStatus, q, agrupar: grouped })}
              className={`panel-chip${activeSite ? "" : " panel-chip--active"}`}
            >
              Todos los sitios
              <span className="panel-tab__count">{counts.all ?? 0}</span>
            </Link>
            {siteCounts.map((s) => (
              <Link
                key={s.vertical}
                href={leadsHref({
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
            href={leadsHref({ tipo: activeType, sitio: activeSite, q, agrupar: grouped })}
            className={`panel-chip${activeStatus ? "" : " panel-chip--active"}`}
          >
            Todos los estados
          </Link>
          {FOLLOW_UP.map((st) => (
            <Link
              key={st}
              href={leadsHref({
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
          <div className="panel-form__field panel-form__field--action">
            <button className="panel-btn" type="submit">
              {esPanel.searchSubmit}
            </button>
          </div>
        </form>

        <nav className="panel-chips" aria-label={esA1.groupToggle}>
          <Link
            href={leadsHref({
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
            <Link href={leadsHref({ tipo: activeType, sitio: activeSite, estado: activeStatus, q, agrupar: grouped })}>
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
