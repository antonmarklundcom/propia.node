import { getAdminBadges } from "@/lib/admin-badges";
import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import {
  isSearchConsoleConfigured,
  reportWindow,
  searchConsoleReports,
  serviceAccountEmail,
  type GscRow,
} from "@/lib/search-console";
import { esPanel } from "@/i18n/es";
import { adminTabs } from "../tabs";

export const metadata: Metadata = {
  title: "Google",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const n = (v: number) => Math.round(v).toLocaleString("es-PY");
const pct = (v: number) => `${(v * 100).toLocaleString("es-PY", { maximumFractionDigits: 1 })} %`;
const pos = (v: number) => (v > 0 ? v.toLocaleString("es-PY", { maximumFractionDigits: 1 }) : "—");

function RowsTable({ first, rows }: { first: string; rows: (GscRow & { label?: string })[] }) {
  if (rows.length === 0) return <p className="panel-empty">{esPanel.gscNoData}</p>;
  return (
    <div className="panel-table__wrap">
      <table className="panel-table">
        <thead>
          <tr>
            <th>{first}</th>
            <th>{esPanel.gscClicks}</th>
            <th>{esPanel.gscImpressions}</th>
            <th>{esPanel.gscCtr}</th>
            <th>{esPanel.gscPosition}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label ?? r.key}>
              <td className="panel-table__name">{r.label ?? r.key}</td>
              <td>{n(r.clicks)}</td>
              <td>{n(r.impressions)}</td>
              <td>{r.impressions > 0 ? pct(r.ctr) : "—"}</td>
              <td>{pos(r.position)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * /admin/google — Search Console per domain (`src/lib/search-console.ts`):
 * totals, the evergreen pages this domain owns (the pages built to rank),
 * top pages and top searches. Setup steps while no key is configured.
 */
export default async function AdminGooglePage() {
  const user = await requireSuperAdmin();
  const badges = await getAdminBadges(user);
  const configured = isSearchConsoleConfigured();
  const reports = configured ? await searchConsoleReports() : [];
  const window = reportWindow();
  const email = serviceAccountEmail();

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("google", badges)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{esPanel.gscTitle}</h2>

        {!configured ? (
          <article className="panel-card">
            <h3 className="panel-card__title">{esPanel.gscSetupTitle}</h3>
            <ol>
              {esPanel.gscSetupSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="panel-card__meta">{esPanel.gscSetupNote}</p>
          </article>
        ) : (
          <>
            <p className="panel-card__meta">{esPanel.gscIntro(window.startDate, window.endDate)}</p>
            {email ? <p className="panel-card__meta">{esPanel.gscAccount(email)}</p> : null}
            {reports.map((r) => (
              <section key={r.property} style={{ marginTop: 28 }}>
                <h3 className="panel-section__title">{r.host ?? r.property}</h3>
                {r.error ? (
                  <>
                    <p className="auth-error">{esPanel.gscError(r.error)}</p>
                    <p className="panel-card__meta">{esPanel.gscErrorHint}</p>
                  </>
                ) : (
                  <>
                    {r.totals ? (
                      <p>
                        <strong>{n(r.totals.clicks)}</strong> {esPanel.gscClicks.toLowerCase()} ·{" "}
                        <strong>{n(r.totals.impressions)}</strong> {esPanel.gscImpressions.toLowerCase()} ·{" "}
                        {esPanel.gscCtr.toLowerCase()} {r.totals.impressions > 0 ? pct(r.totals.ctr) : "—"} ·{" "}
                        {esPanel.gscPosition.toLowerCase()} {pos(r.totals.position)}
                      </p>
                    ) : null}
                    {r.evergreen.length > 0 ? (
                      <>
                        <h4 className="panel-card__title">{esPanel.gscEvergreen}</h4>
                        <RowsTable
                          first={esPanel.gscColPage}
                          rows={[...r.evergreen]
                            .sort((a, b) => b.impressions - a.impressions)
                            .map((e) => ({ ...e, label: e.path }))}
                        />
                      </>
                    ) : null}
                    <h4 className="panel-card__title">{esPanel.gscTopPages}</h4>
                    <RowsTable
                      first={esPanel.gscColPage}
                      rows={r.topPages.map((p) => {
                        let label = p.key;
                        try {
                          label = new URL(p.key).pathname;
                        } catch {
                          // keep the raw key
                        }
                        return { ...p, label };
                      })}
                    />
                    <h4 className="panel-card__title">{esPanel.gscTopQueries}</h4>
                    <RowsTable first={esPanel.gscColQuery} rows={r.topQueries} />
                  </>
                )}
              </section>
            ))}
          </>
        )}
      </main>
    </>
  );
}
