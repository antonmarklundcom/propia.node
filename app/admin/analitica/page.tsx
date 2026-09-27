import type { Metadata } from "next";
import Link from "next/link";
import { inArray } from "drizzle-orm";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { VERTICALS } from "@/config/verticals";
import { listingUrl } from "@/lib/urls";
import {
  analyticsWindow,
  byDay,
  byDevice,
  summaryByVertical,
  topListings,
  topPages,
  topReferrers,
  topUtmCampaigns,
  topUtmSources,
  type DimRow,
} from "@/lib/analytics-queries";
import { esAnalytics } from "@/i18n/es-analytics";
import { adminTabs } from "../tabs";

export const metadata: Metadata = {
  title: esAnalytics.title,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;

/** `vertical` key → its domain, the label an operator recognises. */
const HOST_BY_VERTICAL: Record<string, string> = Object.fromEntries(
  Object.entries(VERTICALS).map(([host, v]) => [v.key, host]),
);

const fmt = (v: number) => v.toLocaleString("es-PY");
const pct = (part: number, whole: number) =>
  whole > 0 ? `${((part / whole) * 100).toLocaleString("es-PY", { maximumFractionDigits: 1 })} %` : "—";

function DimTable({
  title,
  head,
  rows,
  label,
  cells,
}: {
  title: string;
  head: readonly string[];
  rows: DimRow[];
  label: (r: DimRow) => React.ReactNode;
  cells: (r: DimRow) => number[];
}) {
  if (rows.length === 0) return null;
  return (
    <article className="panel-card">
      <h3 className="panel-section__title">{title}</h3>
      <div className="panel-table__wrap">
        <table className="panel-table">
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.value}>
                <td>{label(r)}</td>
                {cells(r).map((c, i) => (
                  <td key={i}>{fmt(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

/**
 * First-party analytics (docs/plan-agency-2026-09-26.md batch 5). Super-admin
 * only: it is the business's own numbers, not staff's.
 */
export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string; sitio?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  const t = esAnalytics;
  const days = RANGES.includes(Number(params.dias) as (typeof RANGES)[number]) ? Number(params.dias) : 30;
  const knownKeys = new Set(Object.values(VERTICALS).map((v) => v.key));
  const vertical = params.sitio && knownKeys.has(params.sitio as never) ? params.sitio : null;

  const w = await analyticsWindow(days, vertical);
  const [reviewCount, summary, daily, pages, listingRows, referrers, utmSources, campaigns, devices] =
    await Promise.all([
      countReviewQueue(),
      summaryByVertical(w),
      byDay(w),
      topPages(w),
      topListings(w),
      topReferrers(w),
      topUtmSources(w),
      topUtmCampaigns(w),
      byDevice(w),
    ]);

  const ids = listingRows.map((r) => Number(r.value)).filter((id) => Number.isInteger(id) && id > 0);
  const titles = new Map(
    ids.length
      ? (
          await db
            .select({ id: listings.id, title: listings.title, slug: listings.slug, publicId: listings.publicId })
            .from(listings)
            .where(inArray(listings.id, ids))
        ).map((l) => [l.id, l])
      : [],
  );

  const total = summary.reduce(
    (acc, s) => ({
      visitors: acc.visitors + s.visitors,
      pageViews: acc.pageViews + s.pageViews,
      listingViews: acc.listingViews + s.listingViews,
      listingViewers: acc.listingViewers + s.listingViewers,
      waClicks: acc.waClicks + s.waClicks,
      waClickers: acc.waClickers + s.waClickers,
      leads: acc.leads + s.leads,
    }),
    { visitors: 0, pageViews: 0, listingViews: 0, listingViewers: 0, waClicks: 0, waClickers: 0, leads: 0 },
  );

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("analytics", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{t.title}</h2>
        <p className="panel-note">{t.intro}</p>

        <form className="panel-form panel-card" method="get" style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <label className="panel-form__field">
            <span className="auth-field__label">{t.rangeLabel}</span>
            <select className="auth-field__input" name="dias" defaultValue={String(days)}>
              {RANGES.map((r) => (
                <option key={r} value={r}>
                  {t.ranges[String(r)]}
                </option>
              ))}
            </select>
          </label>
          <label className="panel-form__field">
            <span className="auth-field__label">{t.siteLabel}</span>
            <select className="auth-field__input" name="sitio" defaultValue={vertical ?? ""}>
              <option value="">{t.allSites}</option>
              {Object.entries(VERTICALS)
                .filter(([, v]) => v.enabled)
                .map(([host, v]) => (
                  <option key={v.key} value={v.key}>
                    {host}
                  </option>
                ))}
            </select>
          </label>
          <button className="panel-btn panel-btn--primary" type="submit">
            {t.apply}
          </button>
        </form>

        {summary.length === 0 ? (
          <p className="panel-empty">{t.empty}</p>
        ) : (
          <>
            <article className="panel-card">
              <h3 className="panel-section__title">{t.funnelTitle}</h3>
              <div className="panel-table__wrap">
                <table className="panel-table">
                  <thead>
                    <tr>
                      {t.funnelSteps.map((s) => (
                        <th key={s}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{fmt(total.visitors)}</td>
                      <td>
                        {fmt(total.listingViewers)} ({pct(total.listingViewers, total.visitors)})
                      </td>
                      <td>
                        {fmt(total.waClickers)} ({pct(total.waClickers, total.visitors)})
                      </td>
                      <td>
                        {fmt(total.leads)} ({pct(total.leads, total.visitors)})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="panel-note">{t.funnelNote}</p>
            </article>

            <article className="panel-card">
              <h3 className="panel-section__title">{t.summaryTitle}</h3>
              <div className="panel-table__wrap">
                <table className="panel-table">
                  <thead>
                    <tr>
                      {t.summaryHead.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s) => (
                      <tr key={s.vertical}>
                        <td>
                          <Link href={`/admin/analitica?dias=${days}&sitio=${s.vertical}`}>
                            {HOST_BY_VERTICAL[s.vertical] ?? s.vertical}
                          </Link>
                        </td>
                        <td>{fmt(s.visitors)}</td>
                        <td>{fmt(s.pageViews)}</td>
                        <td>{fmt(s.listingViews)}</td>
                        <td>{fmt(s.waClicks)}</td>
                        <td>{fmt(s.leads)}</td>
                        <td>{pct(s.waClickers, s.visitors)}</td>
                      </tr>
                    ))}
                    {summary.length > 1 && (
                      <tr>
                        <td>
                          <strong>{t.totalRow}</strong>
                        </td>
                        <td>{fmt(total.visitors)}</td>
                        <td>{fmt(total.pageViews)}</td>
                        <td>{fmt(total.listingViews)}</td>
                        <td>{fmt(total.waClicks)}</td>
                        <td>{fmt(total.leads)}</td>
                        <td>{pct(total.waClickers, total.visitors)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <DimTable
              title={t.listingsTitle}
              head={t.listingsHead}
              rows={listingRows}
              label={(r) => {
                const l = titles.get(Number(r.value));
                return l ? <Link href={listingUrl(l)}>{l.title}</Link> : t.listingRemoved(r.value);
              }}
              cells={(r) => [r.pageViews, r.waClicks, r.leads]}
            />

            <DimTable
              title={t.pagesTitle}
              head={t.pagesHead}
              rows={pages}
              label={(r) => r.value}
              cells={(r) => [r.pageViews]}
            />

            <DimTable
              title={t.sourcesTitle}
              head={t.sourcesHead}
              rows={referrers}
              label={(r) => r.value || t.direct}
              cells={(r) => [r.visitors]}
            />

            <DimTable
              title={t.utmSourcesTitle}
              head={t.campaignsHead}
              rows={utmSources}
              label={(r) => r.value}
              cells={(r) => [r.visitors, r.waClicks, r.leads]}
            />

            <DimTable
              title={t.campaignsTitle}
              head={t.campaignsHead}
              rows={campaigns}
              label={(r) => r.value}
              cells={(r) => [r.visitors, r.waClicks, r.leads]}
            />

            <DimTable
              title={t.devicesTitle}
              head={t.devicesHead}
              rows={devices}
              label={(r) => t.devices[r.value] ?? r.value}
              cells={(r) => [r.visitors]}
            />

            <article className="panel-card">
              <h3 className="panel-section__title">{t.dailyTitle}</h3>
              <div className="panel-table__wrap">
                <table className="panel-table">
                  <thead>
                    <tr>
                      {t.dailyHead.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {daily.map((d) => (
                      <tr key={d.day}>
                        <td>{d.day}</td>
                        <td>{fmt(d.visitors)}</td>
                        <td>{fmt(d.pageViews)}</td>
                        <td>{fmt(d.waClicks)}</td>
                        <td>{fmt(d.leads)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </>
        )}
      </main>
    </>
  );
}
