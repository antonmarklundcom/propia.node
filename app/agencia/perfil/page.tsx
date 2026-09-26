import type { Metadata } from "next";
import { AccountForm } from "@/components/panel/AccountForm";
import { PanelBar } from "@/components/panel/PanelBar";
import { canManageTeam, requireAgencyContext } from "@/lib/auth/guards";
import { getAgencyProfile } from "@/lib/profile-queries";
import {
  getEditableAgent,
  listEditableAgents,
  type AgentEditor,
} from "@/lib/agent-profile-edit";
import { listCities } from "@/lib/queries";
import { AgentPicker, AgentProfileForm } from "@/components/panel/AgentProfileForm";
import { esA4 } from "@/i18n/es-a4";
import { BRAND_NAME } from "@/lib/brand";
import { esPanel } from "@/i18n/es";
import { agencyTabs } from "../tabs";
import {
  updateAccountAction,
  updateAgencyProfileAction,
  updateAgentProfileAction,
} from "./actions";

export const metadata: Metadata = {
  title: `Tu perfil`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  saved: { text: esPanel.profileSaved },
  agency_saved: { text: esPanel.profileAgencySaved },
  account_saved: { text: esPanel.profileAccountSaved },
  password: { text: esPanel.profilePasswordChanged },
  taken: { text: esPanel.profileEmailTaken, error: true },
  invalid: { text: esPanel.profileInvalid, error: true },
  bad_password: { text: esPanel.profileBadPassword, error: true },
  forbidden: { text: esPanel.profileForbidden, error: true },
  agent_saved: { text: esA4.profile.savedColleague },
  agent_not_found: { text: esA4.profile.notFound, error: true },
  photo: { text: esA4.profile.photoRejected, error: true },
  years: { text: esA4.profile.yearsRejected, error: true },
};

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`panel-profile__badge${verified ? "" : " panel-profile__badge--pending"}`}
    >
      {verified ? esPanel.profileVerifiedNote(BRAND_NAME) : esPanel.profilePendingNote}
    </span>
  );
}

export default async function AgencyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; agente?: string }>;
}) {
  const [{ msg, agente }, ctx] = await Promise.all([
    searchParams,
    requireAgencyContext(),
  ]);

  // `?agente=` is a request, not a permission: it is resolved through the
  // same predicate the save uses, and anything outside reach falls back to
  // the caller's own row with a "not found" note.
  const editor: AgentEditor = {
    userId: ctx.user.id,
    role: ctx.user.role,
    agencyId: ctx.agencyId,
  };
  const requestedId = Number(agente);
  const wanted =
    Number.isInteger(requestedId) && requestedId > 0 ? requestedId : null;

  const [agency, requested, ownAgent, editable, cities] = await Promise.all([
    ctx.agencyId != null ? getAgencyProfile(ctx.agencyId) : null,
    wanted != null ? getEditableAgent(editor, wanted) : null,
    getEditableAgent(editor, null),
    canManageTeam(ctx) ? listEditableAgents(editor) : [],
    listCities().catch(() => []),
  ]);
  const agent = requested ?? ownAgent;
  const ownRow = agent != null && agent.userId === ctx.user.id;

  const flash = msg
    ? FLASH[msg]
    : wanted != null && requested == null
      ? FLASH.agent_not_found
      : undefined;
  const canEditAgency = ctx.user.role === "agency_admin";

  return (
    <>
      <PanelBar
        title="Panel de la inmobiliaria"
        role={ctx.user.role}
        userName={ctx.user.name}
        tabs={agencyTabs("profile", canManageTeam(ctx))}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>
            {flash.text}
          </p>
        ) : null}

        <div className="panel-profile">
          {/* The company record — agency-admin only. */}
          <article className="panel-card">
            <h2 style={{ fontSize: 18, margin: "0 0 .5rem" }}>
              {esPanel.profileAgencyTitle}
            </h2>

            {agency == null ? (
              <p style={{ color: "#55655F", margin: 0 }}>
                {esPanel.profileNoAgency}
              </p>
            ) : (
              <>
                <p style={{ margin: "0 0 1rem" }}>
                  <VerifiedBadge verified={agency.isVerified} />
                </p>

                {!canEditAgency && (
                  <p style={{ color: "#55655F", fontSize: 13 }}>
                    {esPanel.profileAgencyReadOnly}
                  </p>
                )}

                <form action={updateAgencyProfileAction} className="panel-form">
                  <label
                    className="panel-form__field"
                    style={{ flexBasis: "100%" }}
                  >
                    <span className="auth-field__label">
                      {esPanel.nameLabel}
                    </span>
                    <input
                      className="auth-field__input"
                      name="name"
                      type="text"
                      defaultValue={agency.name}
                      maxLength={160}
                      required
                      disabled={!canEditAgency}
                    />
                  </label>

                  <label className="panel-form__field">
                    <span className="auth-field__label">
                      {esPanel.profileWhatsappLabel}
                    </span>
                    <input
                      className="auth-field__input"
                      name="whatsapp"
                      type="tel"
                      inputMode="tel"
                      defaultValue={agency.whatsapp ?? ""}
                      maxLength={30}
                      disabled={!canEditAgency}
                    />
                  </label>

                  <label className="panel-form__field">
                    <span className="auth-field__label">
                      {esPanel.profileEmailLabel}
                    </span>
                    <input
                      className="auth-field__input"
                      name="email"
                      type="email"
                      defaultValue={agency.email ?? ""}
                      maxLength={190}
                      disabled={!canEditAgency}
                    />
                  </label>

                  <label
                    className="panel-form__field"
                    style={{ flexBasis: "100%" }}
                  >
                    <span className="auth-field__label">
                      {esPanel.profileLogoLabel}
                    </span>
                    <input
                      className="auth-field__input"
                      name="logoUrl"
                      type="url"
                      defaultValue={agency.logoUrl ?? ""}
                      maxLength={500}
                      placeholder="https://…"
                      disabled={!canEditAgency}
                    />
                  </label>

                  {canEditAgency && (
                    <button
                      className="panel-btn panel-btn--primary"
                      type="submit"
                    >
                      {esPanel.profileSave}
                    </button>
                  )}
                </form>
              </>
            )}
          </article>

          {/* A public agent profile — the caller's own, or (agency admin)
              a colleague's picked below. */}
          {agent && (
            <article className="panel-card">
              <h2 style={{ fontSize: 18, margin: "0 0 .5rem" }}>
                {ownRow ? esPanel.profileAgentTitle : agent.name}
              </h2>
              {editable.length > 1 ? (
                <AgentPicker
                  agents={editable}
                  currentId={agent.id}
                  ownUserId={ctx.user.id}
                />
              ) : null}
              {!ownRow ? (
                <p className="panel-card__meta">
                  {esA4.profile.editingColleague(agent.name)}
                </p>
              ) : null}
              <p style={{ margin: "0 0 1rem" }}>
                <VerifiedBadge verified={agent.isVerified} />
              </p>

              <AgentProfileForm
                key={agent.id}
                agent={agent}
                own={ownRow}
                cities={cities}
                action={updateAgentProfileAction}
              />
            </article>
          )}

          {/* The login itself. */}
          <article className="panel-card">
            <h2 style={{ fontSize: 18, margin: "0 0 1rem" }}>
              {esPanel.profileAccountTitle}
            </h2>

            <AccountForm
              action={updateAccountAction}
              name={ctx.user.name}
              email={ctx.user.email}
            />
          </article>
        </div>
      </main>
    </>
  );
}
