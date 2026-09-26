import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { canManageTeam, panelScope, requireAgencyContext } from "@/lib/auth/guards";
import type { EditScope } from "@/lib/listing-edit";
import { getPanelLeads } from "@/lib/panel-queries";
import { esPanel } from "@/i18n/es";
import { listingUrl } from "@/lib/urls";
import { leadReplyHref } from "@/lib/lead-reply";
import { panelShowsOwnLeads } from "@/lib/lead-export";
import { listingCanonicalOrigin } from "@/lib/origin";
import { esA1 } from "@/i18n/es-a1";
import { agencyTabs } from "../tabs";
import {
  getSharedLeads,
  REALTOR_STATES,
  type PanelViewer,
} from "@/lib/lead-assignments";
import { setShareStateAction } from "./actions";

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
};

export default async function AgencyLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, ctx, origin] = await Promise.all([
    searchParams,
    requireAgencyContext(),
    // The door that owns the detail page — the listing link in a reply.
    listingCanonicalOrigin(),
  ]);
  const { user, agencyId } = ctx;
  const scope = panelScope(ctx);
  const flash = msg ? FLASH[msg] : undefined;

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

        {/* Exactly what this page shows, as a spreadsheet (lead-export.ts). */}
        <p className="panel-note">
          <a className="panel-btn" href="/agencia/leads/export" download>
            {esA1.exportCsv}
          </a>{" "}
          {esA1.exportHint}
        </p>

        <SharedLeads viewer={{ agencyId, userId: user.id }} origin={origin} />

        <h2 className="panel-section__title">{esPanel.agencyLeadsTitle}</h2>

        {!panelShowsOwnLeads(ctx) ? (
          <p className="panel-empty">{esPanel.agencyNoLink}</p>
        ) : (
          <AgencyLeads scope={scope} origin={origin} />
        )}
      </main>
    </>
  );
}

async function AgencyLeads({ scope, origin }: { scope: EditScope; origin: string }) {
  const leads = await getPanelLeads(scope);
  if (leads.length === 0) {
    return <p className="panel-empty">{esPanel.agencyLeadsEmpty}</p>;
  }

  return (
    <>
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
            <div className="panel-card__body">{lead.message}</div>
          ) : null}
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

  return (
    <>
      <h2 className="panel-section__title">{esPanel.sharedLeadsTitle}</h2>
      <p className="panel-note">{esPanel.sharedLeadsHint}</p>
      {shared.map((lead) => (
        <article className="panel-card" key={`share-${lead.assignmentId}`}>
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
            <div className="panel-card__body">{lead.message}</div>
          ) : null}

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
        </article>
      ))}
    </>
  );
}
