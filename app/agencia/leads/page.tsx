import type { Metadata } from "next";
import { cookies } from "next/headers";
import { RememberView } from "../../admin/leads/RememberView";
import {
  AGENCY_LEAD_VIEW_COOKIE,
  agencyLeadViewParam,
  panelLeadAccess,
  parseAgencyLeadView,
} from "@/lib/panel-lead-access";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { canManageTeam, panelScope, requireAgencyContext } from "@/lib/auth/guards";
import type { EditScope } from "@/lib/listing-edit";
import { getPanelLeads, PANEL_LEADS_LIMIT } from "@/lib/panel-queries";
import { esPanel } from "@/i18n/es";
import { listingUrl } from "@/lib/urls";
import { leadReplyHref } from "@/lib/lead-reply";
import { panelShowsOwnLeads } from "@/lib/lead-export";
import { listingCanonicalOrigin } from "@/lib/origin";
import { esA1 } from "@/i18n/es-a1";
import { agencyTabs } from "../tabs";
import {
  getSharedLeads,
  PARTNER_NOTE_MAX,
  REALTOR_STATES,
  type PanelViewer,
} from "@/lib/lead-assignments";
import { leadEmailAction, leadWhatsAppAction, setDealStageAction, setPartnerNoteAction, setShareStateAction, suggestLeadReplyAction } from "./actions";
import { LeadWhatsAppThread } from "@/components/panel/WhatsAppThread";
import { listLeadWhatsApp, type WhatsAppMessage } from "@/lib/whatsapp-inbox";
import { LEAD_WHATSAPP_FLASH } from "@/lib/whatsapp-access";
import { isAiReplyEnabled } from "@/lib/ai-reply";
import { esTelegram } from "@/i18n/es-telegram";
import { esInbox } from "@/i18n/es-e2";
import { leadReplyRecipient, listLeadThreads, type InboxMessage } from "@/lib/inbox";
import { LEAD_EMAIL_FLASH, leadEmailReplyAvailable } from "@/lib/inbox-access";
import { LeadEmailThread } from "@/components/panel/EmailThread";
import { getPartnerDealStages, type PartnerDealStage } from "@/lib/deals";
import { LOST_REASONS, PARTNER_STAGES } from "@/lib/deal-form";
import { esDeals } from "@/i18n/es-deals";

export const metadata: Metadata = {
  title: `Consultas`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const LEAD_TYPE_LABEL: Record<string, string> = {
  buyer: "Compra",
  renter: "Alquiler",
  seller: "Venta",
  valuation: "Tasación",
  developer: "Desarrolladora",
  agent_signup: "Alta de agente",
  landlord: "Alquilar su propiedad",
  question: "Consulta",
};

function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const FLASH: Record<string, { text: string; error?: boolean }> = {
  share_saved: { text: esPanel.sharedLeadSaved },
  share_invalid: { text: esPanel.sharedLeadInvalid, error: true },
  note_saved: { text: esTelegram.note.saved },
  note_invalid: { text: esTelegram.note.invalid, error: true },
  ...LEAD_EMAIL_FLASH,
  ...LEAD_WHATSAPP_FLASH,
  ...Object.fromEntries(
    Object.entries(esDeals.partnerFlash).map(([k, text]) => [k, { text, error: k !== "deal_saved" }]),
  ),
};

/**
 * The deal stage selector on a shared lead (plan-agency batch 6). Stage and
 * lost reason only: the partner never sees or sends a money field, nor the
 * operator's share. Rendered only when `getPartnerDealStages()` says this
 * viewer may move the deal (it is theirs, or nobody's yet).
 */
function DealStageForm({ leadId, deal }: { leadId: number; deal: PartnerDealStage | null }) {
  return (
    <form action={setDealStageAction} className="panel-form">
      <input type="hidden" name="leadId" value={leadId} />
      <label className="panel-form__field">
        <span className="auth-field__label">{esDeals.partnerTitle}</span>
        <select
          className="auth-field__input"
          name="stage"
          defaultValue={deal && deal.stage !== "open" ? deal.stage : ""}
          required
        >
          <option value="" disabled>
            {deal ? esDeals.stage[deal.stage] : esDeals.blockNone}
          </option>
          {PARTNER_STAGES.map((st) => (
            <option key={st} value={st}>
              {esDeals.stage[st]}
            </option>
          ))}
        </select>
      </label>
      <label className="panel-form__field">
        <span className="auth-field__label">{esDeals.lostReasonLabel}</span>
        <select className="auth-field__input" name="lostReason" defaultValue={deal?.lostReason ?? ""}>
          <option value="">{esDeals.lostReasonNone}</option>
          {LOST_REASONS.map((r) => (
            <option key={r} value={r}>
              {esDeals.lostReason[r]}
            </option>
          ))}
        </select>
      </label>
      <div className="panel-form__field panel-form__field--action">
        <button className="panel-btn" type="submit">
          {esDeals.partnerSave}
        </button>
      </div>
    </form>
  );
}

/**
 * A lead's WhatsApp messages on the business number, read-only for a partner
 * (they answer from their own WhatsApp). Nothing when the customer never wrote
 * there. A read failure (migration 0021 not applied) shows nothing.
 */
function WhatsAppBlock({ leadId, threads }: { leadId: number; threads: Map<number, WhatsAppMessage[]> }) {
  return (
    <LeadWhatsAppThread
      messages={threads.get(leadId) ?? []}
      action={leadWhatsAppAction}
      hidden={{ leadId }}
      canReply={false}
      phone={null}
      lastInboundAt={null}
    />
  );
}

/** A lead's email thread (wave E2) under its card; nothing when there is none and no way to start one. */
function EmailBlock({ leadId, email, threads }: { leadId: number; email: string | null; threads: Map<number, InboxMessage[]> }) {
  const messages = threads.get(leadId) ?? [];
  return (
    <LeadEmailThread
      messages={messages}
      action={leadEmailAction}
      hidden={{ leadId }}
      replyTo={leadReplyRecipient(messages, email)}
      unavailable={leadEmailReplyAvailable() ? null : esInbox.thread.replyUnavailable}
      suggest={isAiReplyEnabled() ? suggestLeadReplyAction.bind(null, leadId) : undefined}
    />
  );
}

export default async function AgencyLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; vista?: string }>;
}) {
  const [{ msg, vista }, ctx, origin, jar] = await Promise.all([
    searchParams,
    requireAgencyContext(),
    // The door that owns the detail page — the listing link in a reply.
    listingCanonicalOrigin(),
    cookies(),
  ]);
  const { user } = ctx;
  const scope = panelScope(ctx);
  const flash = msg ? FLASH[msg] : undefined;
  // An agent reads only their own; an agency admin picks "Mis consultas" or
  // "Todo el equipo" (remembered per browser). One resolver for the page, its
  // CSV and every answer the page posts (src/lib/panel-lead-access.ts).
  const access = await panelLeadAccess(
    ctx,
    parseAgencyLeadView(vista, jar.get(AGENCY_LEAD_VIEW_COOKIE)?.value),
  );
  const viewParam = agencyLeadViewParam(access.view);

  return (
    <>
      <PanelBar
        title="Panel de la inmobiliaria"
        role={user.role}
        userName={user.name}
        tabs={agencyTabs("leads", canManageTeam(ctx))}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p>
        ) : null}

        {access.canChooseView ? (
          <>
            <RememberView name={AGENCY_LEAD_VIEW_COOKIE} value={viewParam} path="/agencia" />
            <nav className="panel-chips" aria-label={esPanel.agencyLeadsViewLabel} data-lead-view={viewParam}>
              {(["mine", "team"] as const).map((v) => (
                <Link
                  key={v}
                  href={`/agencia/leads?vista=${agencyLeadViewParam(v)}`}
                  className={`panel-chip${access.view === v ? " panel-chip--active" : ""}`}
                  aria-current={access.view === v ? "page" : undefined}
                >
                  {v === "mine" ? esPanel.agencyLeadsViewMine : esPanel.agencyLeadsViewTeam}
                </Link>
              ))}
            </nav>
            {access.view === "mine" ? <p className="panel-note">{esPanel.agencyLeadsViewMineHint}</p> : null}
          </>
        ) : access.onlyAgentId != null ? (
          <p className="panel-note">{esPanel.agencyLeadsAgentHint}</p>
        ) : null}

        {/* Exactly what this page shows, as a spreadsheet (lead-export.ts). */}
        <p className="panel-note">
          <a className="panel-btn" href={`/agencia/leads/export?vista=${viewParam}`} download>
            {esA1.exportCsv}
          </a>{" "}
          {esA1.exportHint}
        </p>

        <SharedLeads viewer={access.viewer} origin={origin} />

        <h2 className="panel-section__title">{esPanel.agencyLeadsTitle}</h2>

        {!panelShowsOwnLeads(ctx) ? (
          <p className="panel-empty">{esPanel.agencyNoLink}</p>
        ) : (
          <AgencyLeads scope={scope} onlyAgentId={access.onlyAgentId} origin={origin} />
        )}
      </main>
    </>
  );
}

async function AgencyLeads({
  scope,
  onlyAgentId,
  origin,
}: {
  scope: EditScope;
  onlyAgentId: number | null;
  origin: string;
}) {
  const leads = await getPanelLeads(scope, undefined, PANEL_LEADS_LIMIT, onlyAgentId);
  if (leads.length === 0) {
    return <p className="panel-empty">{esPanel.agencyLeadsEmpty}</p>;
  }
  // Threads of exactly the leads this list shows (wave E2).
  const [threads, waThreads] = await Promise.all([
    listLeadThreads(leads.map((l) => l.id)),
    listLeadWhatsApp(leads.map((l) => l.id)).catch(() => new Map<number, WhatsAppMessage[]>()),
  ]);

  return (
    <>
      {leads.length >= PANEL_LEADS_LIMIT ? (
        <p className="panel-note">{esPanel.panelLeadsTruncated(PANEL_LEADS_LIMIT)}</p>
      ) : null}
      {leads.map((lead) => (
        <article className="panel-card" key={lead.id}>
          <div className="panel-card__head">
            <div>
              <h3 className="panel-card__title">{lead.name ?? "Consulta"}</h3>
              <div className="panel-card__meta">
                <span>{LEAD_TYPE_LABEL[lead.leadType] ?? lead.leadType}</span>
                <span>{formatWhen(lead.createdAt)}</span>
                {lead.email ? <span>{lead.email}</span> : null}
                {lead.listingTitle && lead.listingPublicId && lead.listingSlug ? (
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
              href={leadReplyHref(lead, origin)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {esPanel.contactLead}
            </a>
          </div>

          {lead.message ? (
            <div className="panel-card__body panel-card__body--message">{lead.message}</div>
          ) : null}
          <EmailBlock leadId={lead.id} email={lead.email} threads={threads} />
          <WhatsAppBlock leadId={lead.id} threads={waThreads} />
        </article>
      ))}
    </>
  );
}

/**
 * Leads the portal shared with this agency or agent (lead_assignments). Most
 * have no listing — a general enquiry the operator handed over — which is why
 * they are a section of their own rather than rows of getPanelLeads(), whose
 * listing-ownership rule stays exactly as it was. Renders nothing when none.
 */
async function SharedLeads({ viewer, origin }: { viewer: PanelViewer; origin: string }) {
  const shared = await getSharedLeads(viewer);
  if (shared.length === 0) return null;
  const [threads, dealStages, waThreads] = await Promise.all([
    listLeadThreads(shared.map((l) => l.id)),
    getPartnerDealStages(viewer, shared.map((l) => l.id)),
    listLeadWhatsApp(shared.map((l) => l.id)).catch(() => new Map<number, WhatsAppMessage[]>()),
  ]);

  return (
    <>
      <h2 className="panel-section__title">{esPanel.sharedLeadsTitle}</h2>
      <p className="panel-note">{esPanel.sharedLeadsHint}</p>
      {shared.map((lead) => (
        <article className="panel-card" key={`share-${lead.assignmentId}`} id={`shared-${lead.id}`}>
          <div className="panel-card__head">
            <div>
              <h3 className="panel-card__title">{lead.name ?? "Consulta"}</h3>
              <div className="panel-card__meta">
                <span className={`panel-chip${lead.state === "pending" ? " panel-chip--active" : ""}`}>
                  {esPanel.shareStateLabel[lead.state]}
                </span>
                <span>{LEAD_TYPE_LABEL[lead.leadType] ?? lead.leadType}</span>
                <span>{formatWhen(lead.createdAt)}</span>
                <span>{lead.whatsapp}</span>
                {lead.email ? <span>{lead.email}</span> : null}
                {lead.listingTitle && lead.listingPublicId && lead.listingSlug ? (
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
              href={leadReplyHref(lead, origin)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {esPanel.contactLead}
            </a>
          </div>

          {lead.shareNote ? (
            <p className="panel-note">
              {esPanel.sharedLeadNoteFrom} {lead.shareNote}
            </p>
          ) : null}
          {lead.message ? (
            <div className="panel-card__body panel-card__body--message">{lead.message}</div>
          ) : null}
          <EmailBlock leadId={lead.id} email={lead.email} threads={threads} />
          <WhatsAppBlock leadId={lead.id} threads={waThreads} />

          <form action={setShareStateAction} className="panel-form">
            <input type="hidden" name="assignmentId" value={lead.assignmentId} />
            {REALTOR_STATES.map((st) => (
              <button
                key={st}
                className={`panel-btn${st === lead.state ? " panel-btn--primary" : ""}`}
                type="submit"
                name="state"
                value={st}
              >
                {esPanel.shareStateAction[st]}
              </button>
            ))}
          </form>
          {dealStages.has(lead.id) ? (
            <div className="panel-card__body">
              <DealStageForm leadId={lead.id} deal={dealStages.get(lead.id) ?? null} />
            </div>
          ) : null}

          {/* The realtor's own note — theirs and the operator's to read, never the buyer's. */}
          <form action={setPartnerNoteAction} className="panel-form">
            <input type="hidden" name="assignmentId" value={lead.assignmentId} />
            <label className="panel-form__field" style={{ flexBasis: "100%" }}>
              <span className="auth-field__label">{esTelegram.note.label}</span>
              <textarea
                className="auth-field__input"
                name="partnerNote"
                rows={2}
                maxLength={PARTNER_NOTE_MAX}
                defaultValue={lead.partnerNote ?? ""}
                aria-describedby={`partner-note-hint-${lead.assignmentId}`}
              />
              <span className="panel-card__meta" id={`partner-note-hint-${lead.assignmentId}`}>
                {esTelegram.note.hint}
              </span>
            </label>
            <div className="panel-form__field panel-form__field--action">
              <button className="panel-btn" type="submit">
                {esTelegram.note.save}
              </button>
            </div>
          </form>
        </article>
      ))}
    </>
  );
}
