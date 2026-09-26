import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireOwnerContext } from "@/lib/auth/guards";
import { getPanelLeads } from "@/lib/panel-queries";
import { esOwner } from "@/i18n/es";
import { listingUrl } from "@/lib/urls";
import { leadReplyHref } from "@/lib/lead-reply";
import { listingCanonicalOrigin } from "@/lib/origin";
import { ownerTabs } from "../tabs";
import { esInbox } from "@/i18n/es-e2";
import { leadReplyRecipient, listLeadThreads } from "@/lib/inbox";
import { LEAD_EMAIL_FLASH, leadEmailReplyAvailable } from "@/lib/inbox-access";
import { LeadEmailThread } from "@/components/panel/EmailThread";
import { ownerLeadEmailAction } from "../actions";

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

export default async function OwnerLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ user, scope }, { msg }] = await Promise.all([requireOwnerContext(), searchParams]);
  const flash = msg ? LEAD_EMAIL_FLASH[msg] : undefined;
  // Scope-guarded: the WHERE clause joins through the caller's own listings,
  // so this reads their leads and cannot read anyone else's.
  const [leads, origin] = await Promise.all([
    getPanelLeads(scope),
    // The door that owns the detail page — the listing link in a reply.
    listingCanonicalOrigin(),
  ]);
  // Email threads (wave E2) of exactly these leads.
  const threads = await listLeadThreads(leads.map((l) => l.id));
  const replyAvailable = leadEmailReplyAvailable();

  return (
    <>
      <PanelBar
        title={esOwner.panelTitle}
        role={user.role}
        userName={user.name}
        tabs={ownerTabs("leads")}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p>
        ) : null}
        <h2 className="panel-section__title">{esOwner.leadsTitle}</h2>

        {leads.length === 0 ? (
          <p className="panel-empty">{esOwner.leadsEmpty}</p>
        ) : (
          <>
            <p className="panel-note">{esOwner.leadsNote}</p>
            {leads.map((lead) => (
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
                      {lead.email ? <span>{lead.email}</span> : null}
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
                    href={leadReplyHref(lead, origin)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {esOwner.contactLead}
                  </a>
                </div>

                {lead.message ? (
                  <div className="panel-card__body">{lead.message}</div>
                ) : null}
                <LeadEmailThread
                  messages={threads.get(lead.id) ?? []}
                  action={ownerLeadEmailAction}
                  hidden={{ leadId: lead.id }}
                  replyTo={leadReplyRecipient(threads.get(lead.id) ?? [], lead.email)}
                  unavailable={replyAvailable ? null : esInbox.thread.replyUnavailable}
                />
              </article>
            ))}
          </>
        )}
      </main>
    </>
  );
}
