import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { getAdminBadges } from "@/lib/admin-badges";
import { listReviewsForModeration, reviewsEnabled } from "@/lib/reviews";
import { esReviewsAdmin } from "@/i18n/es-reviews-admin";
import { adminTabs } from "../tabs";
import { moderateReviewAction } from "./actions";

export const metadata: Metadata = {
  title: `Reseñas`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  approved: { text: esReviewsAdmin.approved },
  rejected: { text: esReviewsAdmin.rejected },
  not_found: { text: esReviewsAdmin.notFound, error: true },
};

/**
 * Partner reviews (plan-admin-next O7): every pending review first, then the
 * latest decided ones. Nothing a buyer writes shows anywhere until approved
 * here; an approved one can be taken down the same way.
 */
export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const [{ msg }, user] = await Promise.all([searchParams, requireStaffOrAbove()]);
  const t = esReviewsAdmin;
  const [badges, rows] = await Promise.all([
    getAdminBadges(user),
    listReviewsForModeration().catch(() => null),
  ]);
  const flash = msg ? FLASH[msg] : undefined;

  return (
    <>
      <PanelBar title="Panel de administración" role={user.role} userName={user.name} tabs={adminTabs("reviews", badges)} />
      <main className="panel site-main">
        {flash ? <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p> : null}
        <h2 className="panel-section__title">{t.title}</h2>
        <p className="panel-note">{t.hint}</p>
        {!reviewsEnabled() ? <p className="panel-note">{t.disabled}</p> : null}

        {!rows || rows.length === 0 ? (
          <p className="panel-empty">{t.empty}</p>
        ) : (
          rows.map((r) => (
            <article className="panel-card" key={r.id} id={`resena-${r.id}`} data-review-id={r.id}>
              <div className="panel-card__head">
                <div>
                  <h3 className="panel-card__title">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)} · {r.authorName}
                  </h3>
                  <div className="panel-card__meta">
                    <span className={`panel-status panel-status--${r.status === "approved" ? "published" : r.status === "rejected" ? "removed" : "pending_review"}`} data-review-status={r.status}>
                      {t.status[r.status]}
                    </span>
                    <Link href={r.targetKind === "agency" ? "/admin/inmobiliarias" : "/admin/agentes"}>
                      {t.about(r.targetKind, r.targetName)}
                    </Link>
                    <Link href={`/admin/leads?vista=todas#lead-${r.leadId}`}>{t.fromLead(r.leadId, r.leadName)}</Link>
                    <span>{new Date(r.createdAt).toLocaleDateString("es-PY")}</span>
                  </div>
                </div>
                <div className="panel-actions">
                  {r.status !== "approved" ? (
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button className="panel-btn panel-btn--primary" type="submit">
                        {t.approve}
                      </button>
                    </form>
                  ) : null}
                  {r.status !== "rejected" ? (
                    <form action={moderateReviewAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <button className="panel-btn" type="submit">
                        {r.status === "approved" ? t.takeDown : t.reject}
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
              <div className="panel-card__body panel-card__body--message">{r.body ?? t.noText}</div>
            </article>
          ))
        )}
      </main>
    </>
  );
}
