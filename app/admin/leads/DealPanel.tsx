import { esDeals } from "@/i18n/es-deals";
import {
  DEAL_STAGES,
  LOST_REASONS,
  estimateMyShareUsd,
  formatUsd,
  paidDateInput,
  splitPrefill,
} from "@/lib/deal-form";
import { esLedger } from "@/i18n/es-ledger";
import type { DealRow, DealStageRow } from "@/lib/deals";
import type { ShareRow } from "@/lib/lead-assignments";
import { deleteDealAction, saveDealAction } from "./actions";

function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat("es-PY", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

/**
 * Staff see where a deal stands and nothing else: the stage row they are
 * handed was selected without a single money column (`getDealStagesForLeads`).
 */
export function DealStageReadOnly({ deal }: { deal: DealStageRow | undefined }) {
  if (!deal) return null;
  return (
    <div className="panel-card__body">
      <p className="panel-card__meta" style={{ margin: 0 }}>
        <span>{esDeals.staffReadOnly}:</span>
        <span className="panel-chip">{esDeals.stage[deal.stage]}</span>
        {deal.stage === "lost" && deal.lostReason ? (
          <span>{esDeals.lostReason[deal.lostReason]}</span>
        ) : null}
        {deal.stageAt ? <span>{esDeals.stageSince(formatWhen(deal.stageAt))}</span> : null}
      </p>
    </div>
  );
}

/**
 * The super-admin's "Negocio" block on a lead card: a collapsed <details>
 * whose summary says the stage, and the ledger form. The partner picker only
 * offers who this lead was shared with; `upsertOperatorDeal()` enforces the
 * same rule. "Tu parte (US$)" is typed — the ≈ figure beside it is a hint
 * computed from the stored values and never saved.
 */
export function DealPanel({
  leadId,
  deal,
  shares,
  back,
  open,
  terms,
}: {
  leadId: number;
  deal: DealRow | undefined;
  shares: ShareRow[];
  back: string;
  open: boolean;
  /**
   * The usual split of this lead's partner (plan-admin-next O2): the deal's
   * partner, else the one partner it is actively shared with. A suggestion —
   * it only fills a percentage field that is still empty, and is never saved
   * unless the operator presses Guardar.
   */
  terms?: { partnerName: string; commissionPct: string | null; mySharePct: string | null } | null;
}) {
  const current = deal?.agencyId
    ? `agency:${deal.agencyId}`
    : deal?.agentId
      ? `agent:${deal.agentId}`
      : "none";

  // One option per partner, whatever number of times it was shared.
  const options = new Map<string, string>();
  for (const s of shares) {
    const key = `${s.kind}:${s.targetId}`;
    const label = s.revokedAt ? `${s.targetName} ${esDeals.partnerRevoked}` : s.targetName;
    if (!options.has(key) || !s.revokedAt) options.set(key, label);
  }
  if (current !== "none" && !options.has(current)) options.set(current, deal?.partnerName ?? "—");

  const prefill = splitPrefill(deal, terms);

  const estimate = deal
    ? estimateMyShareUsd(deal.salePriceUsd, deal.commissionPct, deal.mySharePct)
    : null;

  return (
    <details className="panel-card__body" open={open}>
      <summary>
        <strong>{esDeals.blockTitle}</strong>{" "}
        <span className={`panel-chip${deal ? " panel-chip--active" : ""}`}>
          {deal ? esDeals.stage[deal.stage] : esDeals.blockNone}
        </span>
      </summary>
      <form action={saveDealAction} className="panel-form">
        <input type="hidden" name="leadId" value={leadId} />
        <input type="hidden" name="back" value={back} />
        <label className="panel-form__field">
          <span className="auth-field__label">{esDeals.stageLabel}</span>
          <select className="auth-field__input" name="stage" defaultValue={deal?.stage ?? "open"}>
            {DEAL_STAGES.map((s) => (
              <option key={s} value={s}>
                {esDeals.stage[s]}
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
        <label className="panel-form__field">
          <span className="auth-field__label">{esDeals.partnerLabel}</span>
          <select className="auth-field__input" name="partner" defaultValue={current}>
            <option value="none">{esDeals.partnerNone}</option>
            {[...options].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{esDeals.salePriceLabel}</span>
          <input
            className="auth-field__input"
            name="salePriceUsd"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            defaultValue={deal?.salePriceUsd ?? ""}
          />
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{esDeals.commissionPctLabel}</span>
          <input
            className="auth-field__input"
            name="commissionPct"
            type="number"
            min={0}
            max={100}
            step="0.01"
            inputMode="decimal"
            defaultValue={prefill.commissionPct ?? ""}
          />
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{esDeals.mySharePctLabel}</span>
          <input
            className="auth-field__input"
            name="mySharePct"
            type="number"
            min={0}
            max={100}
            step="0.01"
            inputMode="decimal"
            defaultValue={prefill.mySharePct ?? ""}
          />
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{esDeals.myShareUsdLabel}</span>
          <input
            className="auth-field__input"
            name="myShareUsd"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            defaultValue={deal?.myShareUsd ?? ""}
          />
          {estimate != null ? (
            <span className="panel-hint">{esDeals.myShareEstimate(formatUsd(estimate))}</span>
          ) : null}
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{esDeals.paidAtLabel}</span>
          <input
            className="auth-field__input"
            name="paidAt"
            type="date"
            defaultValue={paidDateInput(deal?.paidAt ?? null)}
          />
        </label>
        <label className="panel-form__field" style={{ flexBasis: "320px", flexGrow: 1 }}>
          <span className="auth-field__label">{esDeals.noteLabel}</span>
          <textarea
            className="auth-field__input"
            name="note"
            rows={2}
            maxLength={2000}
            defaultValue={deal?.note ?? ""}
          />
        </label>
        <div className="panel-form__field panel-form__field--action">
          <button className="panel-btn panel-btn--primary" type="submit">
            {esDeals.save}
          </button>
        </div>
      </form>
      {prefill.suggested && terms ? (
        <p className="panel-hint" data-split-suggested>{esLedger.suggestionFor(terms.partnerName)}</p>
      ) : null}
      <p className="panel-note">
        {shares.length === 0 ? `${esDeals.partnerHint} ` : null}
        {esDeals.moneyHint}
      </p>
      {deal ? (
        <form action={deleteDealAction} className="panel-form" aria-label={esDeals.deleteTitle}>
          <input type="hidden" name="leadId" value={leadId} />
          <input type="hidden" name="back" value={back} />
          <label className="panel-form__field">
            <span className="auth-field__label">{esDeals.deleteConfirmLabel}</span>
            <input className="auth-field__input" name="confirm" autoComplete="off" />
          </label>
          <div className="panel-form__field panel-form__field--action">
            <button className="panel-btn" type="submit">
              {esDeals.deleteButton}
            </button>
          </div>
          <p className="panel-hint" style={{ flexBasis: "100%" }}>{esDeals.deleteHint}</p>
        </form>
      ) : null}
    </details>
  );
}
