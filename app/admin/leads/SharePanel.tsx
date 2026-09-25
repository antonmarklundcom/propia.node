import { esPanel } from "@/i18n/es";
import type { ShareRow, ShareTargetOption } from "@/lib/lead-assignments";
import { waLink } from "@/lib/wa";
import { revokeShareAction, shareLeadsAction } from "./actions";

/** The target picker, shared by the per-card form and the bulk bar. */
export function ShareTargetSelect({
  targets,
  form,
}: {
  targets: ShareTargetOption[];
  /** For the bulk bar, whose inputs live outside its <form>. */
  form?: string;
}) {
  const agencyOpts = targets.filter((t) => t.kind === "agency");
  const agentOpts = targets.filter((t) => t.kind === "agent");
  return (
    <select className="panel-select" name="target" defaultValue="" required form={form}>
      <option value="" disabled>
        {esPanel.shareTargetPlaceholder}
      </option>
      {agencyOpts.length > 0 ? (
        <optgroup label={esPanel.adminAgenciesTitle}>
          {agencyOpts.map((t) => (
            <option key={`agency:${t.id}`} value={`agency:${t.id}`}>
              {t.name}
            </option>
          ))}
        </optgroup>
      ) : null}
      {agentOpts.length > 0 ? (
        <optgroup label={esPanel.adminAgentsTitle}>
          {agentOpts.map((t) => (
            <option key={`agent:${t.id}`} value={`agent:${t.id}`}>
              {t.agencyName ? `${t.name} (${t.agencyName})` : t.name}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}

/**
 * One lead's shares on /admin/leads: who has it, what they answered, a
 * WhatsApp "go look" to them, revoke — and a form to share it with someone
 * else. Server component; the WhatsApp link is the only notification, and
 * nothing records it as sent (the realtor's answer is the signal).
 */
export function SharePanel({
  leadId,
  shares,
  targets,
  back,
  panelUrl,
  leadName,
}: {
  leadId: number;
  shares: ShareRow[];
  targets: ShareTargetOption[];
  back: string;
  panelUrl: string;
  leadName: string | null;
}) {
  return (
    <div className="panel-card__body">
      <strong>{esPanel.shareTitle}</strong>
      {shares.length > 0 ? (
        <ul style={{ margin: "0.5rem 0", paddingLeft: "1.1rem" }}>
          {shares.map((s) => {
            const notify = s.revokedAt
              ? null
              : waLink(
                  s.targetWhatsapp,
                  esPanel.shareNotifyMessage({ name: leadName, panelUrl }),
                );
            return (
              <li key={s.id} style={{ marginBottom: 6 }}>
                {s.targetName}{" "}
                <span className="panel-chip">
                  {s.revokedAt ? esPanel.shareRevokedLabel : esPanel.shareStateLabel[s.state]}
                </span>{" "}
                {notify ? (
                  <a
                    className="panel-btn panel-btn--whatsapp"
                    href={notify}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {esPanel.shareNotify}
                  </a>
                ) : null}{" "}
                {s.revokedAt ? null : (
                  <form action={revokeShareAction} style={{ display: "inline" }}>
                    <input type="hidden" name="assignmentId" value={s.id} />
                    <input type="hidden" name="back" value={back} />
                    <button className="panel-btn" type="submit">
                      {esPanel.shareRevoke}
                    </button>
                  </form>
                )}
                {s.note ? (
                  <span className="panel-card__meta" style={{ display: "block" }}>
                    {s.note}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {targets.length === 0 ? (
        <p className="panel-note">{esPanel.shareNoTargets}</p>
      ) : (
        <form action={shareLeadsAction} className="panel-form">
          <input type="hidden" name="leadIds" value={leadId} />
          <input type="hidden" name="back" value={back} />
          <label className="panel-form__field">
            <span className="auth-field__label">{esPanel.shareTargetLabel}</span>
            <ShareTargetSelect targets={targets} />
          </label>
          <label className="panel-form__field" style={{ flexGrow: 1 }}>
            <span className="auth-field__label">{esPanel.shareNoteLabel}</span>
            <input className="auth-field__input" name="shareNote" maxLength={280} />
          </label>
          <div className="panel-form__field panel-form__field--action">
            <button className="panel-btn" type="submit">
              {esPanel.shareSubmit}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
