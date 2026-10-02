import { getAdminBadges } from "@/lib/admin-badges";
import type { Metadata } from "next";
import Link from "next/link";
import { inArray } from "drizzle-orm";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
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
  topUtmCampaigns,
  sourceTable,
  type DimRow,
} from "@/lib/analytics-queries";
import { esAnalytics } from "@/i18n/es-analytics";
import { webVitalsSummary, type VitalSummary } from "@/lib/web-vitals";
import { PAGE_TYPES, VITAL_METRICS, vitalRating, type VitalMetric, type VitalRating } from "@/lib/web-vitals-shared";
import { adminTabs } from "../tabs";
import { esTriage } from "@/i18n/es-triage";
import { deltaOf } from "@/lib/analytics-delta";
import { dayMinus } from "@/lib/ops/analytics";

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

function DimTable<R extends { value: string } = DimRow>({
  title,
  head,
  rows,
  label,
  cells,
}: {
  title: string;
  head: readonly string[];
  rows: R[];
  label: (r: R) => React.ReactNode;
  cells: (r: R) => number[];
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

/** Green, amber, red — the pill shape of `.panel-status`, its own colours. */
const RATING_CLASS: Record<VitalRating, string> = {
  good: "panel-status panel-vital--good",
  "needs-improvement": "panel-status panel-vital--mid",
  poor: "panel-status panel-vital--poor",
};

function fmtVital(metric: VitalMetric, v: number): string {
  if (metric === "CLS") return v.toLocaleString("es-PY", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (v < 1000) return `${Math.round(v).toLocaleString("es-PY")} ms`;
  return `${(v / 1000).toLocaleString("es-PY", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} s`;
}

/**
 * Page speed from real visitors (src/lib/web-vitals.ts): p75 per page type
 * and metric over the last 7 days, whatever the page's range selector says —
 * speed is a "how is it now" number, not a trend.
 */
function VitalsSection({
  summary,
  device,
  query,
}: {
  summary: VitalSummary | null;
  device: "mobile" | "desktop";
  query: (device: string) => string;
}) {
  const t = esAnalytics;
  const rows = PAGE_TYPES.filter((p) => summary?.has(p));
  return (
    <article className="panel-card">
      <h3 className="panel-section__title">{t.vitalsTitle}</h3>
      <p className="panel-note">{t.vitalsIntro}</p>
      <nav className="panel-chips" aria-label={t.vitalsTitle}>
        {(["mobile", "desktop"] as const).map((d) => (
          <Link key={d} href={query(d)} className={`panel-chip${d === device ? " panel-chip--active" : ""}`}>
            {t.vitalsDevices[d]}
          </Link>
        ))}
      </nav>
      {summary === null ? (
        <p className="panel-empty">{t.vitalsMissing}</p>
      ) : rows.length === 0 ? (
        <p className="panel-empty">{t.vitalsEmpty}</p>
      ) : (
        <div className="panel-table__wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>{t.vitalsPageHead}</th>
                {VITAL_METRICS.map((m) => (
                  <th key={m}>{t.vitalsMetrics[m]}</th>
                ))}
                <th>{t.vitalsSamplesHead}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const byMetric = summary.get(p)!;
                // Every page load reports TTFB first; the largest count is the page loads measured.
                const samples = Math.max(...[...byMetric.values()].map((c) => c.samples));
                return (
                  <tr key={p}>
                    <td>{t.vitalsPageTypes[p] ?? p}</td>
                    {VITAL_METRICS.map((m) => {
                      const cell = byMetric.get(m);
                      if (!cell || cell.p75 === null) return <td key={m}>—</td>;
                      const rating = vitalRating(m, cell.p75);
                      return (
                        <td key={m}>
                          <span className={RATING_CLASS[rating]} title={`${t.vitalsRatings[rating]} · ${fmt(cell.samples)}`}>
                            {fmtVital(m, cell.p75)}
                          </span>
                        </td>
                      );
                    })}
                    <td>{fmt(samples)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
  searchParams: Promise<{ dias?: string; sitio?: string; disp?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  const t = esAnalytics;
  const days = RANGES.includes(Number(params.dias) as (typeof RANGES)[number]) ? Number(params.dias) : 30;
  const knownKeys = new Set(Object.values(VERTICALS).map((v) => v.key));
  const vertical = params.sitio && knownKeys.has(params.sitio as never) ? params.sitio : null;
  // Google assesses mobile first, so that is the default view.
  const device = params.disp === "desktop" ? "desktop" : "mobile";
  const vitalsQuery = (d: string) =>
    `/admin/analitica?${new URLSearchParams({ dias: String(days), ...(vertical ? { sitio: vertical } : {}), disp: d })}`;

  const w = await analyticsWindow(days, vertical);
  // The period of equal length right before this one, for the +/- on the headline numbers.
  const prevWindow = await analyticsWindow(days, vertical, dayMinus(w.from, 1));
  const [prevSummary, badges, summary, daily, pages, listingRows, sources, campaigns, devices, vitals] =
    await Promise.all([
      summaryByVertical(prevWindow),
      getAdminBadges(user),
      summaryByVertical(w),
      byDay(w),
      topPages(w),
      topListings(w),
      sourceTable(w),
      topUtmCampaigns(w),
      byDevice(w),
      webVitalsSummary({ days: 7, vertical, device }),
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

  const sumOf = (rows: typeof summary) =>
    rows.reduce(
      (acc, s) => ({
        visitors: acc.visitors + s.visitors,
        pageViews: acc.pageViews + s.pageViews,
        listingViews: acc.listingViews + s.listingViews,
        waClicks: acc.waClicks + s.waClicks,
        leads: acc.leads + s.leads,
      }),
      { visitors: 0, pageViews: 0, listingViews: 0, waClicks: 0, leads: 0 },
    );
  const prevTotal = sumOf(prevSummary);
  const prevByVertical = new Map(prevSummary.map((s) => [s.vertical, s]));
  type Metric = "visitors" | "pageViews" | "listingViews" | "waClicks" | "leads";
  /** A number with its change against the previous period, small and muted beside it. */
  const withDelta = (value: number, previous: number) => {
    const d = deltaOf(value, previous);
    const dt = esTriage.delta;
    const text =
      d.kind === "up" ? dt.up(d.pct) : d.kind === "down" ? dt.down(d.pct) : d.kind === "flat" ? dt.flat : d.kind === "fresh" ? dt.fresh : "";
    return (
      <>
        {fmt(value)}
        {text ? (
          <small
            className={`panel-delta panel-delta--${d.kind}`}
            title={`${dt.vsPrevious(days)} · ${dt.title(fmt(previous))}`}
          >
            {text}
          </small>
        ) : null}
      </>
    );
  };
  const siteCell = (s: (typeof summary)[number], m: Metric) =>
    withDelta(s[m], prevByVertical.get(s.vertical)?.[m] ?? 0);

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
        tabs={adminTabs("analytics", badges)}
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
          <input type="hidden" name="disp" value={device} />
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
                        <td data-label={t.summaryHead[0]}>
                          <Link href={`/admin/analitica?dias=${days}&sitio=${s.vertical}`}>
                            {HOST_BY_VERTICAL[s.vertical] ?? s.vertical}
                          </Link>
                        </td>
                        <td data-label={t.summaryHead[1]}>{siteCell(s, "visitors")}</td>
                        <td data-label={t.summaryHead[2]}>{siteCell(s, "pageViews")}</td>
                        <td data-label={t.summaryHead[3]}>{siteCell(s, "listingViews")}</td>
                        <td data-label={t.summaryHead[4]}>{siteCell(s, "waClicks")}</td>
                        <td data-label={t.summaryHead[5]}>{siteCell(s, "leads")}</td>
                        <td data-label={t.summaryHead[6]}>{pct(s.waClickers, s.visitors)}</td>
                      </tr>
                    ))}
                    {summary.length > 1 && (
                      <tr>
                        <td data-label={t.summaryHead[0]}>
                          <strong>{t.totalRow}</strong>
                        </td>
                        <td data-label={t.summaryHead[1]}>{withDelta(total.visitors, prevTotal.visitors)}</td>
                        <td data-label={t.summaryHead[2]}>{withDelta(total.pageViews, prevTotal.pageViews)}</td>
                        <td data-label={t.summaryHead[3]}>{withDelta(total.listingViews, prevTotal.listingViews)}</td>
                        <td data-label={t.summaryHead[4]}>{withDelta(total.waClicks, prevTotal.waClicks)}</td>
                        <td data-label={t.summaryHead[5]}>{withDelta(total.leads, prevTotal.leads)}</td>
                        <td data-label={t.summaryHead[6]}>{pct(total.waClickers, total.visitors)}</td>
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

            {/* One visitor, one source: utm_source, else the site they came
                from, else direct (src/lib/analytics-queries.ts sourceTable). */}
            <DimTable
              title={t.sourcesTitle}
              head={t.sourcesHead}
              rows={sources}
              label={(r) => r.value || t.direct}
              cells={(r) => [r.visitors, r.waClicks, r.leads]}
            />
            {sources.length > 0 ? <p className="panel-note">{t.sourcesNote}</p> : null}

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

        <VitalsSection summary={vitals} device={device} query={vitalsQuery} />
      </main>
    </>
  );
}
