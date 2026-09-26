import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import { listAdminEvents, type AdminEventRow } from "@/lib/admin-events";
import { esPanel } from "@/i18n/es";
import { esA5 } from "@/i18n/es-a5";
import { adminTabs } from "../tabs";

export const metadata: Metadata = {
  title: `Historial`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Where the thing an event touched can be looked at now. */
function targetHref(e: AdminEventRow): string | null {
  if (e.targetType === "listing") return `/admin/propiedades/${e.targetId}`;
  if (e.targetType === "user") return "/admin/usuarios";
  if (e.targetType === "lead") return "/admin/leads";
  if (e.targetType === "agency") return "/admin/agentes";
  return null;
}

function detailText(e: AdminEventRow): string {
  if (!e.detail) return "";
  return Object.entries(e.detail)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

/**
 * Who did what in /admin (admin_events). Super-admin only: it names staff
 * members and what they did, which is the owner's business, not theirs.
 */
export default async function AdminHistoryPage() {
  const user = await requireSuperAdmin();
  const [reviewCount, events] = await Promise.all([
    countReviewQueue(),
    listAdminEvents({ limit: 300 }),
  ]);

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("history", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{esPanel.historyTitle}</h2>
        <p className="panel-note">{esPanel.historyHint}</p>
        {events.length === 0 ? (
          <p className="panel-empty">{esPanel.historyEmpty}</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>{esPanel.historyWhen}</th>
                  <th>{esPanel.historyWho}</th>
                  <th>{esPanel.historyWhat}</th>
                  <th>{esPanel.historyTarget}</th>
                  <th>{esPanel.historyDetail}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const href = targetHref(e);
                  const label = `${esPanel.historyTargetLabel[e.targetType] ?? esA5.historyTargetLabel[e.targetType] ?? e.targetType} #${e.targetId}`;
                  return (
                    <tr key={e.id}>
                      <td>{formatWhen(e.createdAt)}</td>
                      <td>{e.actorName ?? e.actorEmail ?? "—"}</td>
                      <td>{esPanel.historyAction[e.action] ?? esA5.historyAction[e.action] ?? e.action}</td>
                      <td>{href ? <Link href={href}>{label}</Link> : label}</td>
                      <td>{detailText(e)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
