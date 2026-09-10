import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import {
  countLeadsByType,
  countRecentLeads,
  countReviewQueue,
  listAllLeads,
  type AdminLeadRow,
} from "@/lib/panel-queries";
import { esPanel } from "@/i18n/es";
import { listAgentMatchCandidates } from "@/lib/directory-queries";
import {
  leadCitySlug,
  listMatchesForLeads,
  rankCandidates,
  type LeadMatchRow,
} from "@/lib/matching";
import { listingUrl } from "@/lib/urls";
import { waLink } from "@/lib/wa";
import { adminTabs } from "../tabs";
import { MatchPanel } from "./MatchPanel";

export const metadata: Metadata = {
  title: `Consultas`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const LEAD_TYPES = [
  "all",
  "buyer",
  "renter",
  "seller",
  "valuation",
  "developer",
  "agent_signup",
] as const;

const LEAD_TYPE_LABEL: Record<string, string> = {
  all: esPanel.filterAll,
  buyer: "Compra",
  renter: "Alquiler",
  seller: "Venta",
  valuation: "Tasación",
  developer: "Desarrolladora",
  agent_signup: "Alta de agente",
};

/** Who the lead was routed to — 'internal' means it is yours to work. */
const ROUTED_LABEL: Record<string, string> = {
  agency: "Inmobiliaria",
  agent: "Agente",
  owner: "Particular",
  internal: "Interno",
  developer: "Desarrolladora",
};

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
};

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
  searchParams: Promise<{ tipo?: string; q?: string; msg?: string }>;
}) {
  const [{ tipo, q, msg }, user] = await Promise.all([
    searchParams,
    requireSuperAdmin(),
  ]);

  const activeType = LEAD_TYPES.includes(tipo as (typeof LEAD_TYPES)[number])
    ? (tipo as (typeof LEAD_TYPES)[number])
    : "all";

  const [reviewCount, recentLeads, counts, rows] = await Promise.all([
    countReviewQueue(),
    countRecentLeads(),
    countLeadsByType(),
    listAllLeads({ type: activeType, q }),
  ]);

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
          {esPanel.adminLeadsHint}
        </p>
        {/* Says what the tab badge is counting — a bare number next to
            "Consultas" would read as the all-time total. */}
        {recentLeads > 0 ? (
          <p className="panel-note">{esPanel.adminLeadsRecent(recentLeads)}</p>
        ) : null}

        <nav className="panel-chips">
          {LEAD_TYPES.map((t) => {
            const href =
              t === "all"
                ? "/admin/leads"
                : `/admin/leads?tipo=${t}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
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

        {/* Same shape as the listings search on /admin/propiedades. */}
        <form action="/admin/leads" className="panel-form">
          {activeType !== "all" ? (
            <input type="hidden" name="tipo" value={activeType} />
          ) : null}
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

        {rows.length === 0 ? (
          <p className="panel-empty">{esPanel.adminLeadsEmpty}</p>
        ) : (
          rows.map((lead) => (
            <article className="panel-card" key={lead.id}>
              <div className="panel-card__head">
                <div>
                  <h3 className="panel-card__title">
                    {lead.name ?? "Consulta"}
                  </h3>
                  <div className="panel-card__meta">
                    <span>
                      {LEAD_TYPE_LABEL[lead.leadType] ?? lead.leadType}
                    </span>
                    <span>{formatWhen(lead.createdAt)}</span>
                    <span>{lead.whatsapp}</span>
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
                    <span>{lead.vertical}</span>
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
          ))
        )}
      </main>
    </>
  );
}
