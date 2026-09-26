import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import {
  countReviewQueue,
  listAgencies,
  listAgencyReadiness,
  listAgents,
  type AgencyReadiness,
  type AgencyRow,
} from "@/lib/panel-queries";
import { esPanel } from "@/i18n/es";
import { adminTabs } from "../tabs";
import {
  toggleAgencyVerifiedAction,
  toggleAgentVerifiedAction,
} from "../actions";
import { createAgencyAction } from "./actions";

export const metadata: Metadata = {
  title: `Inmobiliarias y agentes`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function VerifiedPill({ on }: { on: boolean }) {
  return (
    <span className={`panel-verified${on ? "" : " panel-verified--off"}`}>
      {on ? esPanel.verifiedBadge : esPanel.notVerifiedBadge}
    </span>
  );
}

/** Plan values as the founder reads them, not as the enum spells them. */
const PLAN_OPTIONS: { value: "free" | "destacado" | "partner"; label: string }[] = [
  { value: "free", label: "Gratis" },
  { value: "destacado", label: "Destacado" },
  { value: "partner", label: "Partner" },
];

/**
 * The partner checklist: what an agency still lacks before shared leads and
 * its profile page work well. Order is the order the founder fixes them in.
 */
function readinessGaps(a: AgencyRow, r: AgencyReadiness | undefined): string[] {
  const gaps: string[] = [];
  if (!a.isVerified) gaps.push(esPanel.readyNotVerified);
  if (!a.whatsapp) gaps.push(esPanel.readyNoWhatsapp);
  if (!r || r.logins === 0) gaps.push(esPanel.readyNoLogin);
  if (!r?.hasLogo) gaps.push(esPanel.readyNoLogo);
  if (!r || r.withBio === 0) gaps.push(esPanel.readyNoBio);
  if (!r || r.published === 0) gaps.push(esPanel.readyNoListing);
  return gaps;
}

const READY_TOTAL = 6;

function planLabel(plan: string): string {
  return PLAN_OPTIONS.find((p) => p.value === plan)?.label ?? plan;
}

/** Flash messages keyed by the ?msg= code createAgencyAction redirects with. */
const FLASH: Record<string, { text: string; error?: boolean }> = {
  agency_created: { text: esPanel.agencyCreated },
  invalid: { text: esPanel.agencyInvalid, error: true },
};

export default async function AdminAgenciesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, user] = await Promise.all([searchParams, requireStaffOrAbove()]);
  const [reviewCount, agencies, agents, readiness] = await Promise.all([
    countReviewQueue(),
    listAgencies(),
    listAgents(),
    listAgencyReadiness(),
  ]);

  const flash = msg ? FLASH[msg] : undefined;

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("agencies", reviewCount)}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p>
        ) : null}

        <h2 className="panel-section__title">{esPanel.adminAgencyNewTitle}</h2>
        <article className="panel-card">
          <p className="panel-card__meta">{esPanel.adminAgencyNewHint}</p>
          <form action={createAgencyAction} className="panel-form">
            <label className="panel-form__field">
              <span className="auth-field__label">{esPanel.agencyNameLabel}</span>
              <input
                className="auth-field__input"
                name="name"
                type="text"
                required
                minLength={2}
              />
            </label>
            <label className="panel-form__field">
              <span className="auth-field__label">{esPanel.agencyEmailLabel}</span>
              <input className="auth-field__input" name="email" type="email" />
            </label>
            <label className="panel-form__field">
              <span className="auth-field__label">{esPanel.agencyWhatsappLabel}</span>
              <input className="auth-field__input" name="whatsapp" type="tel" />
            </label>
            <label className="panel-form__field">
              <span className="auth-field__label">{esPanel.planLabel}</span>
              <select className="panel-select" name="plan" defaultValue="free">
                {PLAN_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="panel-form__field panel-form__field--action">
              <button className="panel-btn panel-btn--primary" type="submit">
                {esPanel.createAgency}
              </button>
            </div>
          </form>
        </article>

        <h2 className="panel-section__title" style={{ marginTop: 32 }}>
          Inmobiliarias
        </h2>
        {agencies.length === 0 ? (
          <p className="panel-empty">Todavía no hay inmobiliarias.</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Plan</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th>{esPanel.readyTitle}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a) => {
                  const gaps = readinessGaps(a, readiness.get(a.id));
                  return (
                  <tr key={a.id}>
                    <td className="panel-table__name">{a.name}</td>
                    <td>{planLabel(a.plan)}</td>
                    <td>{a.whatsapp ?? a.email ?? "—"}</td>
                    <td>
                      <VerifiedPill on={a.isVerified} />
                    </td>
                    <td>
                      <strong>
                        {READY_TOTAL - gaps.length}/{READY_TOTAL}
                      </strong>
                      {gaps.length > 0 ? (
                        <span className="panel-card__meta" style={{ display: "block" }}>
                          {esPanel.readyMissing} {gaps.join(" · ")}
                        </span>
                      ) : (
                        <span className="panel-card__meta" style={{ display: "block" }}>
                          {esPanel.readyAll}
                        </span>
                      )}
                    </td>
                    <td>
                      <form action={toggleAgencyVerifiedAction}>
                        <input type="hidden" name="agencyId" value={a.id} />
                        <input
                          type="hidden"
                          name="verified"
                          value={a.isVerified ? "0" : "1"}
                        />
                        <button className="panel-btn" type="submit">
                          {a.isVerified ? esPanel.unverify : esPanel.verify}
                        </button>
                      </form>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="panel-section__title" style={{ marginTop: 32 }}>
          Agentes
        </h2>
        {agents.length === 0 ? (
          <p className="panel-empty">Todavía no hay agentes.</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Inmobiliaria</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id}>
                    <td className="panel-table__name">{a.name}</td>
                    <td>{a.agencyName ?? "Independiente"}</td>
                    <td>{a.whatsapp ?? "—"}</td>
                    <td>
                      <VerifiedPill on={a.isVerified} />
                    </td>
                    <td>
                      <form action={toggleAgentVerifiedAction}>
                        <input type="hidden" name="agentId" value={a.id} />
                        <input
                          type="hidden"
                          name="verified"
                          value={a.isVerified ? "0" : "1"}
                        />
                        <button className="panel-btn" type="submit">
                          {a.isVerified ? esPanel.unverify : esPanel.verify}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
