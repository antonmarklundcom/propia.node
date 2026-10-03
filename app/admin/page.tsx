import Link from "next/link";
import { isSuperAdmin } from "@/lib/auth/roles";
import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { HealthSection } from "@/components/panel/HealthSection";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { getHealth } from "@/lib/health";
import { getRuntimeHealth } from "@/lib/runtime-health";
import { getReviewQueue } from "@/lib/panel-queries";
import { getAdminBadges } from "@/lib/admin-badges";
import { esPanel } from "@/i18n/es";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import { adminTabs } from "./tabs";
import { getCoverThumbs } from "@/lib/admin-covers";
import { CoverThumb } from "@/components/panel/CoverThumb";
import { ReviewShortcuts } from "@/components/panel/ReviewShortcuts";
import { approveAction, approveManyAction, rejectAction, rejectManyAction } from "./actions";
import { ReviewSelectAll, ReviewSelectedCount } from "@/components/panel/ReviewSelectAll";
import { isPublisherKind, PUBLISHER_KINDS, type PublisherKind } from "@/lib/publisher-kind";
import { esTriage } from "@/i18n/es-triage";

export const metadata: Metadata = {
  title: `Cola de revisión`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const OPERATION_LABEL: Record<string, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporal: "Alquiler temporal",
};

const BULK_FORM = "bulk-review";

/** The queue's own filters, carried through a bulk action (see actions.ts). */
interface QueueFilter {
  q: string;
  op: string;
  tipo: string;
  quien: PublisherKind | "";
}

function queueHref(f: QueueFilter, patch: Partial<QueueFilter> = {}): string {
  const next = { ...f, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set("q", next.q);
  if (next.op) sp.set("op", next.op);
  if (next.tipo) sp.set("tipo", next.tipo);
  if (next.quien) sp.set("quien", next.quien);
  const qs = sp.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

function formatReceived(d: Date): string {
  return new Intl.DateTimeFormat("es-PY", { day: "2-digit", month: "short" }).format(new Date(d));
}

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ bulk?: string; n?: string; q?: string; op?: string; tipo?: string; quien?: string }>;
}) {
  const { bulk, n: nParam, ...raw } = await searchParams;
  const n = Math.max(0, Math.min(100, Number(nParam) || 0));
  const bulkFlash =
    bulk === "approved" && n > 0
      ? { text: esPanel.bulkFlash.approved(n), error: false }
      : bulk === "rejected" && n > 0
        ? { text: esPanel.bulkFlash.rejected(n), error: false }
        : bulk === "none"
          ? { text: esPanel.bulkFlash.none, error: true }
          : bulk === "reason"
            ? { text: esPanel.bulkFlash.reason, error: true }
            : null;
  const user = await requireStaffOrAbove();
  const [queue, badges, health, runtime] = await Promise.all([
    getReviewQueue(),
    getAdminBadges(user),
    /**
     * Cached for five minutes and never tagged (`src/lib/health.ts`), so this
     * adds a handful of counts to the first render of each window and nothing to
     * the rest. It goes above the review queue because a missing column is more
     * urgent than an unreviewed listing, and because a section nobody scrolls to
     * is a section nobody reads.
     */
    isSuperAdmin(user.role) ? getHealth() : Promise.resolve(null),
    /**
     * Live, uncached connection and process numbers (`src/lib/runtime-health.ts`):
     * per process by nature, so never through the shared data cache. Each read
     * degrades on its own; the catch is the last guard so /admin never 500s
     * over a diagnostic.
     */
    isSuperAdmin(user.role) ? getRuntimeHealth().catch(() => null) : Promise.resolve(null),
  ]);
  const superAdmin = isSuperAdmin(user.role);
  const t = esTriage.review;

  // The whole queue is one read (it is a queue, not a catalogue), so the
  // filters and their counts run here rather than as a query per chip. Only
  // values the queue actually holds are offered.
  const operations = [...new Set(queue.map((r) => r.operation))];
  const types = [...new Set(queue.map((r) => r.propertyType))];
  const filter: QueueFilter = {
    q: (raw.q ?? "").trim().slice(0, 100),
    op: operations.includes(raw.op as never) ? (raw.op as string) : "",
    tipo: types.includes(raw.tipo as never) ? (raw.tipo as string) : "",
    quien: isPublisherKind(raw.quien) ? raw.quien : "",
  };
  const needle = filter.q.toLowerCase();
  const beforePublisher = queue.filter(
    (r) =>
      (!needle || r.title.toLowerCase().includes(needle) || r.publicId.toLowerCase().includes(needle)) &&
      (!filter.op || r.operation === filter.op) &&
      (!filter.tipo || r.propertyType === filter.tipo),
  );
  const rows = filter.quien ? beforePublisher.filter((r) => r.publisherKind === filter.quien) : beforePublisher;
  const publisherCounts = new Map<PublisherKind, number>();
  for (const r of beforePublisher) publisherCounts.set(r.publisherKind, (publisherCounts.get(r.publisherKind) ?? 0) + 1);
  const filtered = Boolean(filter.q || filter.op || filter.tipo || filter.quien);
  const back = queueHref(filter).replace(/^\/admin\??/, "");
  // One read for the covers of the rows on screen.
  const covers = await getCoverThumbs(rows.map((r) => r.id));

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("review", badges)}
      />
      <main className="panel site-main">
        {health ? <HealthSection health={health} runtime={runtime} /> : null}

        <h2 className="panel-section__title">{esPanel.adminReviewTitle}</h2>

        {bulkFlash ? (
          <p className={bulkFlash.error ? "auth-error" : "panel-flash"}>{bulkFlash.text}</p>
        ) : null}

        {queue.length === 0 ? (
          <p className="panel-empty">{esPanel.adminReviewEmpty}</p>
        ) : (
          <>
            <form action="/admin" className="panel-form">
              {filter.quien ? <input type="hidden" name="quien" value={filter.quien} /> : null}
              <label className="panel-form__field" style={{ flexBasis: "240px" }}>
                <span className="auth-field__label">{t.searchLabel}</span>
                <input className="auth-field__input" name="q" type="search" defaultValue={filter.q} />
              </label>
              <label className="panel-form__field" style={{ flexBasis: "160px" }}>
                <span className="auth-field__label">{t.operationLabel}</span>
                <select className="panel-select" name="op" defaultValue={filter.op}>
                  <option value="">{t.anyOption}</option>
                  {operations.map((o) => (
                    <option key={o} value={o}>
                      {OPERATION_LABEL[o] ?? o}
                    </option>
                  ))}
                </select>
              </label>
              <label className="panel-form__field" style={{ flexBasis: "160px" }}>
                <span className="auth-field__label">{t.typeLabel}</span>
                <select className="panel-select" name="tipo" defaultValue={filter.tipo}>
                  <option value="">{t.anyType}</option>
                  {types.map((ty) => (
                    <option key={ty} value={ty}>
                      {PROPERTY_TYPE_LABELS[ty]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="panel-form__field panel-form__field--action">
                <button className="panel-btn" type="submit">
                  {t.filterSubmit}
                </button>
              </div>
              {filtered ? (
                <div className="panel-form__field panel-form__field--action">
                  <Link className="panel-btn" href="/admin">
                    {t.clearFilters}
                  </Link>
                </div>
              ) : null}
            </form>

            <nav className="panel-chips" aria-label={esTriage.publisherFilterLabel}>
              <span className="panel-chips__label">{esTriage.publisherColumn}</span>
              <Link
                href={queueHref(filter, { quien: "" })}
                className={`panel-chip${filter.quien ? "" : " panel-chip--active"}`}
              >
                {esTriage.publisherAll}
                <span className="panel-tab__count">{beforePublisher.length}</span>
              </Link>
              {PUBLISHER_KINDS.filter((k) => publisherCounts.has(k) || k === filter.quien).map((k) => (
                <Link
                  key={k}
                  href={queueHref(filter, { quien: k })}
                  className={`panel-chip${k === filter.quien ? " panel-chip--active" : ""}`}
                >
                  {esTriage.publisherChip[k]}
                  <span className="panel-tab__count">{publisherCounts.get(k) ?? 0}</span>
                </Link>
              ))}
            </nav>

            {/* One bulk form for the whole queue. Each row holds its own
                approve / reject forms, so its checkbox joins this one by `form=`. */}
            {superAdmin ? (
              <form id={BULK_FORM} className="panel-form panel-card">
                <input type="hidden" name="back" value={back} />
                <div className="panel-form__field" style={{ flex: "1 1 100%" }}>
                  <ReviewSelectedCount />
                  <span className="panel-bulk__hint">{t.bulkHint}</span>
                </div>
                <label className="panel-form__field" style={{ flexBasis: "320px", flexGrow: 1 }}>
                  <span className="auth-field__label">{esPanel.bulkReasonLabel}</span>
                  <textarea className="auth-field__input" name="reason" rows={2} maxLength={280} />
                </label>
                <div className="panel-form__field panel-form__field--action">
                  <button className="panel-btn panel-btn--primary" type="submit" formAction={approveManyAction}>
                    {esPanel.bulkApprove}
                  </button>{" "}
                  <button className="panel-btn panel-btn--danger" type="submit" formAction={rejectManyAction}>
                    {esPanel.bulkReject}
                  </button>
                </div>
              </form>
            ) : null}

            <p className="panel-card__meta">{t.showing(rows.length, queue.length)}</p>

            {rows.length === 0 ? (
              <p className="panel-empty">{t.emptyFiltered}</p>
            ) : (
              <>
              <ReviewShortcuts {...esTriage.shortcuts} />
              <div className="panel-table__wrap">
                <table className="panel-table panel-table--stack" data-review-table>
                  <thead>
                    <tr>
                      {superAdmin ? (
                        <th className="panel-table__check">
                          <ReviewSelectAll label={esPanel.bulkSelectAll} hideLabel />
                        </th>
                      ) : null}
                      <th aria-label={esTriage.noCover}></th>
                      <th>{t.colListing}</th>
                      <th>{t.colOperation}</th>
                      <th>{t.colType}</th>
                      <th>{esTriage.publisherColumn}</th>
                      <th>{t.colPrice}</th>
                      <th>{t.colReceived}</th>
                      <th>{t.colActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        {superAdmin ? (
                          <td className="panel-table__check">
                            <input
                              type="checkbox"
                              name="listingIds"
                              value={row.id}
                              form={BULK_FORM}
                              aria-label={`${esPanel.bulkSelectListing}: ${row.title}`}
                            />
                          </td>
                        ) : null}
                        <td className="panel-table__thumb">
                          <CoverThumb src={covers.get(row.id)} />
                        </td>
                        <td className="panel-table__name">
                          {/* The full record: photos, description, every field. */}
                          <Link href={`/admin/propiedades/${row.id}`}>{row.title}</Link>
                          <div className="panel-card__meta">
                            <span>#{row.publicId}</span>
                            {row.locationName ? <span>{row.locationName}</span> : null}
                          </div>
                        </td>
                        <td data-label={t.colOperation}>{OPERATION_LABEL[row.operation] ?? row.operation}</td>
                        <td data-label={t.colType}>{PROPERTY_TYPE_LABELS[row.propertyType]}</td>
                        <td data-label={esTriage.publisherColumn}>
                          <span className={`panel-kind panel-kind--${row.publisherKind}`}>
                            {esTriage.publisher[row.publisherKind]}
                          </span>
                          <div className="panel-card__meta">
                            <span>{row.agencyName ?? row.publisherName ?? "—"}</span>
                          </div>
                        </td>
                        <td data-label={t.colPrice}>
                          {formatPrice({
                            priceAmount: row.priceAmount,
                            priceCurrency: row.priceCurrency,
                          })}
                        </td>
                        <td data-label={t.colReceived}>{formatReceived(row.createdAt)}</td>
                        <td data-label={t.colActions}>
                          {superAdmin ? (
                            <div className="panel-actions">
                              <form action={approveAction} data-review-approve>
                                <input type="hidden" name="listingId" value={row.id} />
                                <button className="panel-btn panel-btn--primary" type="submit">
                                  {esPanel.approve}
                                </button>
                              </form>

                              <details>
                                <summary className="panel-btn panel-btn--danger">{esPanel.reject}</summary>
                                <form action={rejectAction} className="panel-reject">
                                  <input type="hidden" name="listingId" value={row.id} />
                                  <label className="auth-field__label" htmlFor={`reason-${row.id}`}>
                                    {esPanel.rejectReasonLabel}
                                  </label>
                                  <textarea
                                    id={`reason-${row.id}`}
                                    name="reason"
                                    className="panel-reject__textarea"
                                    placeholder={esPanel.rejectReasonPlaceholder}
                                    required
                                  />
                                  <div>
                                    <button className="panel-btn panel-btn--danger" type="submit">
                                      {esPanel.reject}
                                    </button>
                                  </div>
                                </form>
                              </details>
                            </div>
                          ) : (
                            <Link className="panel-btn" href={`/admin/propiedades/${row.id}`}>
                              {esPanel.staffEditListing}
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
