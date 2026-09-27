import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import { listQualityRows, type QualityRow } from "@/lib/quality-queries";
import type { QualityIssue } from "@/lib/listing-score";
import { listingUrl } from "@/lib/urls";
import { esPanel, listingStatusLabel } from "@/i18n/es";
import { adminTabs } from "../tabs";

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
 * `?agencia=<id>` narrows to one agency, `?agencia=none` to unowned listings.
 */
export default async function AdminQualityPage({
  searchParams,
}: {
  searchParams: Promise<{ agencia?: string }>;
}) {
  const [{ agencia }, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  const [reviewCount, all] = await Promise.all([countReviewQueue(), listQualityRows()]);

  const agencyKey = (r: QualityRow) => (r.agencyId == null ? "none" : String(r.agencyId));
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

  const filtered = agencia ? all.filter((r) => agencyKey(r) === agencia) : all;
  const worst = [...filtered].sort((a, b) => a.score - b.score || a.id - b.id).slice(0, SHOWN);

  const issueCounts = new Map<QualityIssue, number>();
  for (const r of filtered) for (const i of r.issues) issueCounts.set(i, (issueCounts.get(i) ?? 0) + 1);

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("quality", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{esPanel.qualityTitle}</h2>
        <p className="panel-card__meta">{esPanel.qualityIntro}</p>

        {all.length === 0 ? (
          <p className="panel-empty">{esPanel.qualityEmpty}</p>
        ) : (
          <>
            <nav className="panel-chips" aria-label={esPanel.qualityColAgency}>
              <Link href="/admin/calidad" className={`panel-chip${agencia ? "" : " panel-chip--active"}`}>
                {esPanel.qualityAllAgencies}
                <span className="panel-tab__count">{all.length}</span>
              </Link>
              {[...issueCounts]
                .sort((a, b) => b[1] - a[1])
                .map(([issue, n]) => (
                  <span key={issue} className="panel-chip">
                    {esPanel.qualityIssue[issue]}
                    <span className="panel-tab__count">{n}</span>
                  </span>
                ))}
            </nav>

            <h3 className="panel-section__title" style={{ marginTop: 24 }}>
              {esPanel.qualityByAgency}
            </h3>
            <div className="panel-table__wrap">
              <table className="panel-table">
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
                          <Link href={`/admin/calidad?agencia=${g.key}`}>{g.name}</Link>
                        </td>
                        <td>{g.rows.length}</td>
                        <td>
                          <strong>{g.average}</strong>
                        </td>
                        <td>{g.rows.filter((r) => r.score < WEAK).length}</td>
                        <td>{top ? esPanel.qualityIssue[top] : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h3 className="panel-section__title" style={{ marginTop: 24 }}>
              {esPanel.qualityWorst}
            </h3>
            <p className="panel-card__meta">{esPanel.qualityShowing(worst.length, filtered.length)}</p>
            <div className="panel-table__wrap">
              <table className="panel-table">
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
                      <td>
                        <strong>{r.score}</strong>
                      </td>
                      <td className="panel-table__name">
                        <a href={listingUrl(r)} target="_blank" rel="noopener noreferrer">
                          {r.title}
                        </a>
                        <span className="panel-card__meta" style={{ display: "block" }}>
                          {listingStatusLabel[r.status as keyof typeof listingStatusLabel] ?? r.status}
                        </span>
                      </td>
                      <td>{r.agencyName ?? esPanel.qualityNoAgency}</td>
                      <td>{r.issues.map((i) => esPanel.qualityIssue[i]).join(" · ") || "—"}</td>
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
