import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue, leadPhoneKey } from "@/lib/panel-queries";
import { dealSummary, listDeals, type DealListRow } from "@/lib/deals";
import { formatPaidDate, formatPct, formatUsd } from "@/lib/deal-form";
import { esDeals } from "@/i18n/es-deals";
import { adminTabs } from "../tabs";

export const metadata: Metadata = {
  title: esDeals.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** The lead's card on /admin/leads: filtered to its phone number, scrolled to it. */
function leadHref(d: DealListRow): string {
  const key = leadPhoneKey(d.leadWhatsapp);
  const qs = /^\d{6,9}$/.test(key) ? `?tel=${key}` : "";
  return `/admin/leads${qs}#lead-${d.leadId}`;
}

/**
 * The deal and commission ledger (plan-agency batch 6). Super-admin only: it
 * is the owner's money, typed by the owner from each written agreement. Plain
 * tables, no chart — every figure is a count or a sum of what was typed.
 */
export default async function AdminDealsPage() {
  const user = await requireSuperAdmin();
  const [reviewCount, summary, deals] = await Promise.all([
    countReviewQueue(),
    dealSummary(),
    listDeals(),
  ]);

  const openStages = (["open", "viewing", "offer", "reserved"] as const).filter(
    (s) => summary.byStage[s] > 0,
  );

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("deals", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{esDeals.title}</h2>
        <p className="panel-note">{esDeals.hint}</p>

        <section className="panel-card">
          <h3 className="panel-card__title">{esDeals.kpiTitle}</h3>
          <div className="panel-table__wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  {esDeals.kpiHead.map((h, i) => (
                    <th key={i} className={i > 0 ? "panel-table__num" : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openStages.map((s) => (
                  <tr key={s}>
                    <td>{esDeals.kpiOpenByStage(esDeals.stage[s])}</td>
                    <td className="panel-table__num">—</td>
                    <td className="panel-table__num">{summary.byStage[s].toLocaleString("es-PY")}</td>
                  </tr>
                ))}
                <tr>
                  <td>{esDeals.kpiWon}</td>
                  <td className="panel-table__num">{summary.wonMonth.toLocaleString("es-PY")}</td>
                  <td className="panel-table__num">{summary.wonAll.toLocaleString("es-PY")}</td>
                </tr>
                <tr>
                  <td>{esDeals.kpiUnpaid}</td>
                  <td className="panel-table__num">{formatUsd(summary.unpaidMonthUsd)}</td>
                  <td className="panel-table__num">{formatUsd(summary.unpaidAllUsd)}</td>
                </tr>
                <tr>
                  <td>{esDeals.kpiPaid}</td>
                  <td className="panel-table__num">{formatUsd(summary.paidMonthUsd)}</td>
                  <td className="panel-table__num">{formatUsd(summary.paidAllUsd)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="panel-note">{esDeals.kpiNote}</p>
        </section>

        <h3 className="panel-section__title" style={{ marginTop: 28 }}>{esDeals.dealsTitle}</h3>
        {deals.length > 0 ? (
          <p className="panel-note">
            <a className="panel-chip" href="/admin/negocios/export" title={esDeals.exportHint} download>
              {esDeals.exportCsv}
            </a>
          </p>
        ) : null}
        {deals.length === 0 ? (
          <p className="panel-empty">{esDeals.dealsEmpty}</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  {esDeals.dealsHead.map((h, i) => (
                    <th key={h} className={i >= 4 && i <= 7 ? "panel-table__num" : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id}>
                    <td className="panel-table__name">
                      <Link href={leadHref(d)}>{d.leadName ?? d.leadWhatsapp}</Link>
                    </td>
                    <td>{d.listingTitle ?? "—"}</td>
                    <td>{d.partnerName ?? esDeals.noPartner}</td>
                    <td>
                      <span className={`panel-chip${d.stage === "won" ? " panel-chip--active" : ""}`}>
                        {esDeals.stage[d.stage]}
                      </span>
                      {d.stage === "lost" && d.lostReason ? (
                        <span className="panel-card__meta" style={{ display: "block" }}>
                          {esDeals.lostReason[d.lostReason]}
                        </span>
                      ) : null}
                    </td>
                    <td className="panel-table__num">{formatUsd(d.salePriceUsd)}</td>
                    <td className="panel-table__num">{formatPct(d.commissionPct)}</td>
                    <td className="panel-table__num">{formatPct(d.mySharePct)}</td>
                    <td className="panel-table__num">{formatUsd(d.myShareUsd)}</td>
                    <td>{formatPaidDate(d.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 className="panel-section__title" style={{ marginTop: 28 }}>{esDeals.partnersTitle}</h3>
        {summary.partners.length === 0 ? (
          <p className="panel-empty">{esDeals.dealsEmpty}</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  {esDeals.partnersHead.map((h, i) => (
                    <th key={h} className={i > 0 ? "panel-table__num" : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.partners.map((p) => (
                  <tr key={p.key}>
                    <td className="panel-table__name">{p.name ?? esDeals.noPartner}</td>
                    <td className="panel-table__num">{p.deals.toLocaleString("es-PY")}</td>
                    <td className="panel-table__num">{p.won.toLocaleString("es-PY")}</td>
                    <td className="panel-table__num">{formatUsd(p.paidUsd)}</td>
                    <td className="panel-table__num">{formatUsd(p.unpaidUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="panel-note">
          <Link href="/admin/leads">{esDeals.responseBoardLink}</Link>
        </p>

        <h3 className="panel-section__title" style={{ marginTop: 28 }}>{esDeals.lostTitle}</h3>
        {summary.lostReasons.length === 0 ? (
          <p className="panel-empty">{esDeals.lostEmpty}</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  {esDeals.lostHead.map((h, i) => (
                    <th key={h} className={i > 0 ? "panel-table__num" : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.lostReasons.map((r) => (
                  <tr key={r.reason ?? "none"}>
                    <td>{r.reason ? esDeals.lostReason[r.reason] : esDeals.lostUnknown}</td>
                    <td className="panel-table__num">{r.n.toLocaleString("es-PY")}</td>
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
