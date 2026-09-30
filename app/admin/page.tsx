import Link from "next/link";
import { isStaff, isSuperAdmin } from "@/lib/auth/roles";
import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { HealthSection } from "@/components/panel/HealthSection";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { getHealth } from "@/lib/health";
import { countRecentLeads, getReviewQueue } from "@/lib/panel-queries";
import { esPanel } from "@/i18n/es";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import { adminTabs } from "./tabs";
import { countUnreadInbox } from "@/lib/inbox";
import { approveAction, approveManyAction, rejectAction, rejectManyAction } from "./actions";
import { ReviewSelectAll } from "@/components/panel/ReviewSelectAll";

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

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ bulk?: string; n?: string }>;
}) {
  const { bulk, n: nParam } = await searchParams;
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
  const [queue, recentLeads, unreadEmail, health] = await Promise.all([
    getReviewQueue(),
    countRecentLeads(24, isStaff(user.role)),
    countUnreadInbox({ userId: user.id, superAdmin: isSuperAdmin(user.role) }),
    /**
     * Cached for five minutes and never tagged (`src/lib/health.ts`), so this
     * adds a handful of counts to the first render of each window and nothing to
     * the rest. It goes above the review queue because a missing column is more
     * urgent than an unreviewed listing, and because a section nobody scrolls to
     * is a section nobody reads.
     */
    isSuperAdmin(user.role) ? getHealth() : Promise.resolve(null),
  ]);

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("review", queue.length, undefined, recentLeads, unreadEmail)}
      />
      <main className="panel site-main">
        {health ? <HealthSection health={health} /> : null}

        <h2 className="panel-section__title">{esPanel.adminReviewTitle}</h2>

        {bulkFlash ? (
          <p className={bulkFlash.error ? "auth-error" : "panel-flash"}>{bulkFlash.text}</p>
        ) : null}

        {/* One bulk form for the whole queue. The cards hold their own approve /
            reject forms, so their checkboxes join this one by `form=`. */}
        {queue.length > 0 && isSuperAdmin(user.role) ? (
          <form id={BULK_FORM} className="panel-form panel-card">
            <ReviewSelectAll label={esPanel.bulkSelectAll} />
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

        {queue.length === 0 ? (
          <p className="panel-empty">{esPanel.adminReviewEmpty}</p>
        ) : (
          queue.map((row) => (
            <article className="panel-card" key={row.id}>
              <div className="panel-card__head">
                <div>
                  <h3 className="panel-card__title">
                    {isSuperAdmin(user.role) ? (
                      <input
                        type="checkbox"
                        name="listingIds"
                        value={row.id}
                        form={BULK_FORM}
                        aria-label={`${esPanel.bulkSelectListing}: ${row.title}`}
                        style={{ marginRight: 8 }}
                      />
                    ) : null}
                    {row.title}
                  </h3>
                  <div className="panel-card__meta">
                    <span>{OPERATION_LABEL[row.operation] ?? row.operation}</span>
                    <span>{PROPERTY_TYPE_LABELS[row.propertyType]}</span>
                    {row.locationName ? <span>{row.locationName}</span> : null}
                    <span>{row.agencyName ?? "Particular"}</span>
                    <span>#{row.publicId}</span>
                  </div>
                </div>
                <span className="panel-card__price">
                  {formatPrice({
                    priceAmount: row.priceAmount,
                    priceCurrency: row.priceCurrency,
                  })}
                </span>
              </div>

              <div className="panel-card__body">
                {isSuperAdmin(user.role) ? (
                  <div className="panel-actions">
                    <form action={approveAction}>
                      <input type="hidden" name="listingId" value={row.id} />
                      <button className="panel-btn panel-btn--primary" type="submit">
                        {esPanel.approve}
                      </button>
                    </form>

                    <details>
                      <summary className="panel-btn panel-btn--danger">
                        {esPanel.reject}
                      </summary>
                      <form action={rejectAction} className="panel-reject">
                        <input type="hidden" name="listingId" value={row.id} />
                        <label
                          className="auth-field__label"
                          htmlFor={`reason-${row.id}`}
                        >
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
                          <button
                            className="panel-btn panel-btn--danger"
                            type="submit"
                          >
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
              </div>
            </article>
          ))
        )}
      </main>
    </>
  );
}
