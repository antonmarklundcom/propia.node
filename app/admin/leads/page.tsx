import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import {
  countLeadsByType,
  countReviewQueue,
  listAllLeads,
} from "@/lib/panel-queries";
import { esPanel } from "@/i18n/es";
import { listingUrl } from "@/lib/urls";
import { adminTabs } from "../tabs";

export const metadata: Metadata = {
  title: "Consultas — Homes Paraguay",
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
  internal: "Interno",
  developer: "Desarrolladora",
};

function waReplyHref(whatsapp: string): string {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
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
  searchParams: Promise<{ tipo?: string; q?: string }>;
}) {
  const [{ tipo, q }, user] = await Promise.all([
    searchParams,
    requireSuperAdmin(),
  ]);

  const activeType = LEAD_TYPES.includes(tipo as (typeof LEAD_TYPES)[number])
    ? (tipo as (typeof LEAD_TYPES)[number])
    : "all";

  const [reviewCount, counts, rows] = await Promise.all([
    countReviewQueue(),
    countLeadsByType(),
    listAllLeads({ type: activeType, q }),
  ]);

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("leads", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{esPanel.adminLeadsTitle}</h2>
        <p style={{ color: "#55655F", fontSize: 13, marginTop: 0 }}>
          {esPanel.adminLeadsHint}
        </p>

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
                    {/* Who owns the follow-up: an agency, or you. */}
                    <span>
                      {lead.agencyName ??
                        ROUTED_LABEL[lead.routedTo] ??
                        lead.routedTo}
                    </span>
                    {/* Which door captured it — matters once feeders are on. */}
                    <span>{lead.vertical}</span>
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
                <a
                  className="panel-btn panel-btn--whatsapp"
                  href={waReplyHref(lead.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {esPanel.contactLead}
                </a>
              </div>

              {lead.message ? (
                <div className="panel-card__body">{lead.message}</div>
              ) : null}
            </article>
          ))
        )}
      </main>
    </>
  );
}
