import { getAdminBadges } from "@/lib/admin-badges";
import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { listQualityRows, type QualityRow } from "@/lib/quality-queries";
import type { QualityIssue } from "@/lib/listing-score";
import { esTriage } from "@/i18n/es-triage";
import { listingUrl } from "@/lib/urls";
import { esPanel, listingStatusLabel } from "@/i18n/es";
import { adminTabs } from "../tabs";
import { filterQualityRows, qualityAgencyKey, worstFirst } from "@/lib/admin-listing-export";

export const metadata: Metadata = {
  title: "Calidad de los avisos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Listings shown in the "needs work" table; the summary counts them all. */
const SHOWN = 200;
/** Below this, a listing counts as weak in the per-agency summary. */
const WEAK = 60;

function mostCommon(rows: QualityRow[]): QualityIssue | null {
  const n = new Map<QualityIssue, number>();
  for (const r of rows) for (const i of r.issues) n.set(i, (n.get(i) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

const avg = (rows: QualityRow[]) =>
  rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;

/**
 * /admin/calidad — how complete each published / in-review listing is
 * (`src/lib/listing-score.ts`), worst first, with a per-agency summary so
 * the operator knows whom to ask for photos, a description or a position.
 * `?agencia=<id>` narrows to one agency, `?agencia=none` to unowned listings;
 * `?problema=<issue>` to the listings with that problem. The two combine.
 */
export default async function AdminQualityPage({
  searchParams,
}: {
  searchParams: Promise<{ agencia?: string; problema?: string }>;
}) {
  const [{ agencia, problema }, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  const [badges, all] = await Promise.all([getAdminBadges(user), listQualityRows()]);

  const agencyKey = qualityAgencyKey;
  const groups = new Map<string, { name: string; rows: QualityRow[] }>();
  for (const r of all) {
    const k = agencyKey(r);
    const g = groups.get(k) ?? { name: r.agencyName ?? esPanel.qualityNoAgency, rows: [] };
    g.rows.push(r);
    groups.set(k, g);
  }
  const summary = [...groups]
    .map(([key, g]) => ({ key, name: g.name, rows: g.rows, average: avg(g.rows) }))
    .sort((a, b) => a.average - b.average);

  // The same narrowing the CSV export runs (src/lib/admin-listing-export.ts).
  const { byAgency, filtered, issueCounts, issue } = filterQualityRows(all, { agencia, problema });
  const worst = worstFirst(filtered).slice(0, SHOWN);
  const exportSp = new URLSearchParams();
  if (agencia) exportSp.set("agencia", agencia);
  if (issue) exportSp.set("problema", issue);
  const exportQs = exportSp.toString();
  const qualityHref = (p: { agencia?: string | null; problema?: string | null }) => {
    const sp = new URLSearchParams();
    const ag = p.agencia === null ? undefined : (p.agencia ?? agencia);
    const pr = p.problema === null ? undefined : (p.problema ?? issue ?? undefined);
    if (ag) sp.set("agencia", ag);
    if (pr) sp.set("problema", pr);
    const qs = sp.toString();
    return qs ? `/admin/calidad?${qs}` : "/admin/calidad";
  };

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("quality", badges)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{esPanel.qualityTitle}</h2>
        <p className="panel-card__meta">{esPanel.qualityIntro}</p>
        <p className="panel-export">
          <a className="panel-btn" href={`/admin/calidad/export${exportQs ? `?${exportQs}` : ""}`} download>
            {esTriage.export.button}
          </a>
          <span className="panel-card__meta">{esTriage.export.hint}</span>
        </p>

        {all.length === 0 ? (
          <p className="panel-empty">{esPanel.qualityEmpty}</p>
        ) : (
          <>
            <nav className="panel-chips" aria-label={esPanel.qualityColAgency}>
              <Link href="/admin/calidad" className={`panel-chip${agencia ? "" : " panel-chip--active"}`}>
                {esPanel.qualityAllAgencies}
                <span className="panel-tab__count">{all.length}</span>
              </Link>
              {agencia ? (
                <Link href={qualityHref({ agencia: null })} className="panel-chip panel-chip--active">
                  {groups.get(agencia)?.name ?? esPanel.qualityNoAgency} ✕
                </Link>
              ) : null}
            </nav>
            {/* Each problem filters the "needs work" table below. */}
            <nav className="panel-chips" aria-label={esTriage.quality.issueFilterLabel}>
              <span className="panel-chips__label">{esTriage.quality.issueFilterLabel}</span>
              <Link
                href={`${qualityHref({ problema: null })}#lista`}
                className={`panel-chip${issue ? "" : " panel-chip--active"}`}
              >
                {esTriage.quality.allIssues}
                <span className="panel-tab__count">{byAgency.length}</span>
              </Link>
              {[...issueCounts]
                .sort((a, b) => b[1] - a[1])
                .map(([i, count]) => (
                  <Link
                    key={i}
                    href={`${qualityHref({ problema: i })}#lista`}
                    className={`panel-chip${i === issue ? " panel-chip--active" : ""}`}
                    aria-current={i === issue ? "true" : undefined}
                  >
                    {esPanel.qualityIssue[i]}
                    <span className="panel-tab__count">{count}</span>
                  </Link>
                ))}
            </nav>

            <h3 className="panel-section__title" style={{ marginTop: 24 }}>
              {esPanel.qualityByAgency}
            </h3>
            <div className="panel-table__wrap">
              <table className="panel-table panel-table--stack">
                <thead>
                  <tr>
                    <th>{esPanel.qualityColAgency}</th>
                    <th>{esPanel.qualityColListings}</th>
                    <th>{esPanel.qualityColAverage}</th>
                    <th>{esPanel.qualityColWeak}</th>
                    <th>{esPanel.qualityColTopIssue}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((g) => {
                    const top = mostCommon(g.rows);
                    return (
                      <tr key={g.key}>
                        <td className="panel-table__name">
                          <Link href={qualityHref({ agencia: g.key })}>{g.name}</Link>
                        </td>
                        <td data-label={esPanel.qualityColListings}>{g.rows.length}</td>
                        <td data-label={esPanel.qualityColAverage}>
                          <strong>{g.average}</strong>
                        </td>
                        <td data-label={esPanel.qualityColWeak}>{g.rows.filter((r) => r.score < WEAK).length}</td>
                        <td data-label={esPanel.qualityColTopIssue}>{top ? esPanel.qualityIssue[top] : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h3 className="panel-section__title" style={{ marginTop: 24 }} id="lista">
              {esPanel.qualityWorst}
              {issue ? ` — ${esPanel.qualityIssue[issue]}` : ""}
            </h3>
            <p className="panel-card__meta">{esPanel.qualityShowing(worst.length, filtered.length)}</p>
            <div className="panel-table__wrap">
              <table className="panel-table panel-table--stack">
                <thead>
                  <tr>
                    <th>{esPanel.qualityColScore}</th>
                    <th>{esPanel.qualityColListing}</th>
                    <th>{esPanel.qualityColAgency}</th>
                    <th>{esPanel.qualityColIssues}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {worst.map((r) => (
                    <tr key={r.id}>
                      <td data-label={esPanel.qualityColScore}>
                        <strong>{r.score}</strong>
                      </td>
                      <td className="panel-table__name">
                        {/* Published: the public page, as a buyer sees it. In
                            review: the record, since the public page 404s. */}
                        {r.status === "published" ? (
                          <a href={listingUrl(r)} target="_blank" rel="noopener noreferrer">
                            {r.title}
                          </a>
                        ) : (
                          <Link href={`/admin/propiedades/${r.id}`}>{r.title}</Link>
                        )}
                        <span className="panel-card__meta" style={{ display: "block" }}>
                          {listingStatusLabel[r.status as keyof typeof listingStatusLabel] ?? r.status}
                        </span>
                      </td>
                      <td data-label={esPanel.qualityColAgency}>{r.agencyName ?? esPanel.qualityNoAgency}</td>
                      <td data-label={esPanel.qualityColIssues}>{r.issues.map((i) => esPanel.qualityIssue[i]).join(" · ") || "—"}</td>
                      <td>
                        <Link className="panel-btn" href={`/admin/propiedades/${r.id}`}>
                          {esPanel.qualityEdit}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
