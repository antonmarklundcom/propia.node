"use client";

/**
 * One operations job: simulate, read what would change, then run it.
 *
 * **"Ejecutar" only appears after a simulation of the same job.** Not as
 * ceremony — as the only honest way to press a button that writes to a live
 * database with no staging environment behind it. The counts on screen were
 * produced by the same function the second press calls, so what the operator
 * approves is what happens.
 *
 * Changing the limit clears the simulation. A preview computed for 25 rows is
 * not a preview of 500, and leaving it on screen next to an enabled button would
 * be the one lie this whole design exists to prevent.
 */
import { useState } from "react";
import { esPanel } from "@/i18n/es";
import type { OpsResult } from "@/lib/ops/types";
import type { OpsJobMeta } from "../../../app/admin/operaciones/jobs";
import type { OpsRunInput, OpsRunOutcome } from "../../../app/admin/operaciones/actions";

/**
 * Last-run summary. **`when` arrives already formatted**, and that is not laziness.
 *
 * A `Date` does not survive the boundary to a client component, so it had to be a
 * string either way — and formatting it *here* means calling `Intl` twice for the
 * same instant, once in Node during SSR and once in the browser on hydration. The
 * two do not agree: their ICU versions differ on the space before "p. m." (one
 * emits U+202F), and React throws a hydration mismatch over that one invisible
 * character (error #418, observed). Formatting on the server once removes the
 * second call, and with it the whole class of bug. `formatOpsWhen` in the page is
 * the one formatter, pinned to Paraguay time because the operator is in Asunción
 * and the server is not.
 */
export interface LastRunView {
  when: string;
  dry: boolean;
  ok: boolean | null;
  finished: boolean;
}

function CountsTable({ result }: { result: OpsResult }) {
  const keys = Object.keys(result.counts);
  if (keys.length === 0) return null;
  return (
    <div className="panel-table__wrap" style={{ marginTop: 12 }}>
      <table className="panel-table">
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td>{k.replace(/_/g, " ")}</td>
              <td className="panel-table__num">
                {result.counts[k].toLocaleString("es-PY")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OpsJobCard({
  meta,
  lastRun,
  followUpLabel,
  action,
}: {
  meta: OpsJobMeta;
  lastRun: LastRunView | null;
  /** Label of the job to run next, when this one leaves work behind. */
  followUpLabel: string | null;
  action: (input: OpsRunInput) => Promise<OpsRunOutcome>;
}) {
  const [limit, setLimit] = useState<string>(
    meta.defaultLimit ? String(meta.defaultLimit) : "",
  );
  const [busy, setBusy] = useState<null | "dry" | "real">(null);
  const [dryResult, setDryResult] = useState<OpsResult | null>(null);
  const [realResult, setRealResult] = useState<OpsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function press(dry: boolean) {
    setBusy(dry ? "dry" : "real");
    setError(null);
    if (dry) setRealResult(null);
    try {
      const outcome = await action({
        job: meta.job,
        dry,
        limit: limit === "" ? undefined : Number(limit),
      });
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      if (dry) {
        setDryResult(outcome.result);
      } else {
        setRealResult(outcome.result);
        // The simulation described a database that no longer exists.
        setDryResult(null);
      }
    } catch {
      setError(esPanel.opsError);
    } finally {
      setBusy(null);
    }
  }

  const shown = realResult ?? dryResult;
  const canRun = dryResult !== null && meta.disabledReason === null;

  return (
    <article className="panel-card">
      <div className="panel-card__head">
        <div>
          <h3 className="panel-card__title">{meta.label}</h3>
          <div className="panel-card__meta">
            <span>{meta.job}</span>
            <span>
              {esPanel.opsLastRun}:{" "}
              {lastRun
                ? `${lastRun.when}${
                    lastRun.dry ? ` (${esPanel.opsLastRunDry})` : ""
                  }${
                    !lastRun.finished
                      ? ` — ${esPanel.opsLastRunUnfinished}`
                      : lastRun.ok === false
                        ? ` — ${esPanel.opsLastRunFailed}`
                        : ""
                  }`
                : esPanel.opsLastRunNever}
            </span>
          </div>
        </div>
      </div>

      <div className="panel-card__body">
        <p style={{ marginTop: 0 }}>{meta.description}</p>
        <p className="panel-card__meta" style={{ marginTop: 0 }}>
          <strong>{esPanel.opsWritesLabel}:</strong> {meta.writes}
        </p>

        {meta.disabledReason ? (
          <p className="panel-note">{meta.disabledReason}</p>
        ) : null}

        {meta.requiresLimit ? (
          <label className="panel-form__field" style={{ maxWidth: 260 }}>
            <span className="auth-field__label">{esPanel.opsLimitLabel}</span>
            <input
              className="auth-field__input"
              type="number"
              min={1}
              max={500}
              value={limit}
              onChange={(e) => {
                setLimit(e.target.value);
                // A preview for a different number of rows is not this preview.
                setDryResult(null);
                setRealResult(null);
              }}
            />
            <span className="panel-card__meta">{esPanel.opsLimitHint}</span>
          </label>
        ) : null}

        <div className="panel-actions">
          <button
            className="panel-btn"
            type="button"
            disabled={busy !== null}
            onClick={() => press(true)}
          >
            {busy === "dry" ? esPanel.opsRunning : esPanel.opsSimulate}
          </button>
          <button
            className="panel-btn panel-btn--primary"
            type="button"
            disabled={busy !== null || !canRun}
            onClick={() => {
              if (confirm(esPanel.opsRunConfirm)) void press(false);
            }}
          >
            {busy === "real" ? esPanel.opsRunning : esPanel.opsRun}
          </button>
        </div>

        {!canRun && meta.disabledReason === null && realResult === null ? (
          <p className="panel-card__meta" style={{ marginTop: 8 }}>
            {esPanel.opsSimulateFirst}
          </p>
        ) : null}

        {error ? <p className="auth-error">{error}</p> : null}

        {shown ? (
          <section style={{ marginTop: 16 }}>
            <h4 className="panel-section__title" style={{ marginTop: 0 }}>
              {shown.dry ? esPanel.opsDryHeading : esPanel.opsRealHeading}
            </h4>
            <CountsTable result={shown} />
            {shown.notes.length > 0 ? (
              <pre
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "#F4F6F5",
                  borderRadius: 6,
                  fontSize: 12,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  overflowX: "auto",
                }}
              >
                {shown.notes.join("\n")}
              </pre>
            ) : null}
            <p className="panel-card__meta">
              {esPanel.opsDurationLabel}: {(shown.durationMs / 1000).toFixed(1)}s
            </p>
            {!shown.dry && followUpLabel ? (
              <p className="panel-note">{esPanel.opsFollowUp(followUpLabel)}</p>
            ) : null}
          </section>
        ) : null}
      </div>
    </article>
  );
}
