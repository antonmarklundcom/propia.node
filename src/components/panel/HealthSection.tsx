/**
 * The "Salud del sitio" block at the top of `/admin`.
 *
 * A server component, deliberately: every line is a number `src/lib/health.ts`
 * already computed, there is nothing to interact with, and the one thing that
 * would need a client — a refresh button — would only re-render a five-minute
 * cache entry.
 *
 * **Silence is the success state.** With nothing wrong the block is one line, so
 * that a line appearing at all means something. Each finding links to the page
 * that fixes it, because a number an operator cannot act on is decoration.
 *
 * The ordering is severity, not source: a missing column is a live 500 on a page
 * tree, a pending migration is a 500 waiting to happen, and the rest are quality
 * problems that cost traffic rather than the site.
 */
import Link from "next/link";
import { esPanel } from "@/i18n/es";
import type { Health } from "@/lib/health";
import type { OpsJob } from "@/lib/ops/types";

/** One rendered finding. `href` is the page that fixes it, when there is one. */
interface Finding {
  text: string;
  href?: string;
  /** Rendered in red: a live error, or one that starts the moment code deploys. */
  severe?: boolean;
  /** Extra detail an operator needs in order to act (missing column names…). */
  detail?: string;
}

/** Jobs whose last run is worth showing on the dashboard, in reading order. */
const WATCHED_JOBS: { job: OpsJob; label: string }[] = [
  { job: "cron:fx", label: esPanel.opsFxLabel },
  { job: "cron:cuotas", label: esPanel.opsCuotasLabel },
  { job: "cron:medians", label: esPanel.opsMediansLabel },
  { job: "cron:geo", label: esPanel.opsGeoLabel },
  { job: "cron:translate", label: esPanel.opsTranslateLabel },
  { job: "cron:resync", label: esPanel.opsResyncLabel },
  { job: "cron:sessions", label: esPanel.opsSessionsLabel },
];

const HEALTH_TTL_MINUTES = 5;

function findings(health: Health): Finding[] {
  const out: Finding[] = [];
  const { counts, migrations } = health;

  if (migrations.error) {
    out.push({
      text: esPanel.healthMigrationsUnknown,
      detail: migrations.error,
    });
  } else {
    if (migrations.driftTotal > 0) {
      out.push({
        text: esPanel.healthDrift(migrations.driftTotal),
        severe: true,
        detail: [
          ...migrations.drift.missingTables.map((t) => `tabla ${t}`),
          ...migrations.drift.missingColumns,
          ...migrations.drift.missingEnumValues,
        ]
          .slice(0, 12)
          .join(" · "),
      });
    }
    if (migrations.pending !== null && migrations.pending > 0) {
      out.push({
        text: esPanel.healthPendingMigrations(migrations.pending),
        severe: true,
      });
    }
    if (!migrations.journalReadable) {
      out.push({ text: esPanel.healthMigrationsUnknown });
    }
    if (migrations.orphanHashes > 0) {
      out.push({
        text: esPanel.healthOrphanMigrations(migrations.orphanHashes),
        severe: true,
      });
    }
    if (!migrations.sqlModeStrict) {
      out.push({ text: esPanel.healthNotStrict });
    }
  }

  if (counts.leadsWithNoRoute > 0) {
    out.push({
      text: esPanel.healthLeadsNoRoute(counts.leadsWithNoRoute),
      href: "/admin/leads",
      severe: true,
    });
  }
  if (counts.listingsWithoutPosition > 0) {
    out.push({
      text: esPanel.healthNoPosition(counts.listingsWithoutPosition),
      href: "/admin/operaciones",
    });
  }
  if (counts.listingsWithoutPhoto > 0) {
    out.push({
      text: esPanel.healthNoPhoto(counts.listingsWithoutPhoto),
      href: "/admin/propiedades",
    });
  }
  if (counts.listingsWithoutEnglish > 0) {
    out.push({
      text: esPanel.healthNoEnglish(
        counts.listingsWithoutEnglish,
        counts.publishedListings,
      ),
      href: "/admin/operaciones",
    });
  }

  return out;
}

export function HealthSection({ health }: { health: Health }) {
  const items = findings(health);

  return (
    <section className="panel-card" style={{ marginBottom: 24 }}>
      <div className="panel-card__head">
        <h3 className="panel-card__title">{esPanel.healthTitle}</h3>
        <span className="panel-card__meta">
          {esPanel.healthCheckedAt(HEALTH_TTL_MINUTES)}
        </span>
      </div>

      <div className="panel-card__body">
        {items.length === 0 ? (
          <p style={{ marginTop: 0 }}>{esPanel.healthAllGood}</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {items.map((f, i) => (
              <li key={i} style={f.severe ? { color: "#9B2C2C" } : undefined}>
                {f.text}
                {f.href ? (
                  <>
                    {" "}
                    <Link className="panel-post__link" href={f.href}>
                      {esPanel.healthFix}
                    </Link>
                  </>
                ) : null}
                {f.detail ? (
                  <div className="panel-card__meta" style={{ marginTop: 2 }}>
                    {f.detail}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <div className="panel-card__meta" style={{ marginTop: 14 }}>
          <strong>{esPanel.healthJobsTitle}:</strong>{" "}
          {WATCHED_JOBS.map(({ job, label }, i) => {
            const run = health.lastRuns[job];
            return (
              <span key={job}>
                {i > 0 ? " · " : ""}
                {label}:{" "}
                {run
                  ? new Date(run.startedAt).toLocaleDateString("es-PY", {
                      timeZone: "America/Asuncion",
                      day: "2-digit",
                      month: "2-digit",
                    })
                  : esPanel.healthJobNever}
                {run && run.ok === false ? ` (${esPanel.opsLastRunFailed})` : ""}
              </span>
            );
          })}
        </div>

        <div className="panel-card__meta" style={{ marginTop: 4 }}>
          <strong>{esPanel.healthDeployTitle}:</strong>{" "}
          {health.deploy.commit ?? esPanel.healthDeployUnknown}
          {health.deploy.builtAt
            ? ` · ${new Date(health.deploy.builtAt).toLocaleString("es-PY", {
                timeZone: "America/Asuncion",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""}
        </div>
      </div>
    </section>
  );
}
