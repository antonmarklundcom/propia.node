import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { OpsJobCard, type LastRunView } from "@/components/panel/OpsJobCard";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import { lastRunByJob } from "@/lib/ops/runs";
import { esPanel } from "@/i18n/es";
import { adminTabs } from "../tabs";
import { runOpsJob } from "./actions";
import { FOLLOW_UP_JOB, opsJobMeta, opsJobs } from "./jobs";

export const metadata: Metadata = {
  title: `Operaciones`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The one formatter for a run's timestamp, pinned to Paraguay time.
 *
 * Server-side on purpose: the card receives the finished string. Formatting the
 * same instant in Node and again in the browser is a hydration mismatch waiting
 * to happen — the two ICU versions disagree about the space before "p. m." — and
 * `OpsJobCard`'s comment on `LastRunView` has the details.
 */
function formatOpsWhen(d: Date): string {
  return d.toLocaleString("es-PY", {
    timeZone: "America/Asuncion",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The jobs that used to need a terminal, an allowlisted IP and the write
 * credential exported in a shell — `fable-plan-ops.md`'s whole reason for
 * existing.
 *
 * Every card is the same two presses: **Simular**, which runs the real job with
 * `dry: true` and shows what it would change, then **Ejecutar**, which runs the
 * same function for real. Both write an `ops_runs` row. `db:migrate` is
 * deliberately not here — see `./jobs.ts`.
 *
 * `force-dynamic` because "last run" must be the truth as of this render: an
 * operator pressing a button and seeing a stale timestamp cannot tell whether it
 * worked.
 */
export default async function AdminOperacionesPage() {
  const user = await requireSuperAdmin();
  const [reviewCount, lastRuns] = await Promise.all([
    countReviewQueue(),
    lastRunByJob(),
  ]);

  const metas = opsJobMeta();
  /** Labels by job id, so a follow-up hint can name the other card. */
  const labels = new Map(opsJobs().map((j) => [j.job, j.label]));

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("operations", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{esPanel.opsTitle}</h2>
        <p style={{ color: "#55655F", fontSize: 14, marginTop: 0 }}>
          {esPanel.opsSubtitle}
        </p>
        <p className="panel-card__meta">{esPanel.opsHistoryHint}</p>

        {metas.map((meta) => {
          const row = lastRuns.get(meta.job);
          const lastRun: LastRunView | null = row
            ? {
                when: formatOpsWhen(row.startedAt),
                dry: row.dry,
                ok: row.ok,
                finished: row.finishedAt !== null,
              }
            : null;
          const followUp = FOLLOW_UP_JOB[meta.job];
          return (
            <OpsJobCard
              key={meta.job}
              meta={meta}
              lastRun={lastRun}
              followUpLabel={followUp ? labels.get(followUp) ?? null : null}
              action={runOpsJob}
            />
          );
        })}
      </main>
    </>
  );
}
