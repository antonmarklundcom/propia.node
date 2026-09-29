import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import { listAdminProjects } from "@/lib/project-queries";
import { esProjects } from "@/i18n/es-projects";
import { adminTabs } from "../tabs";
import { setProjectCheRogaAction } from "./actions";

export const metadata: Metadata = {
  title: esProjects.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const t = esProjects;

/**
 * /admin/proyectos — which developments are approved for Che Róga Porã.
 * Super-admin only: the switch changes the cuota printed on a project's
 * listings. The programme itself stays off sitewide (CLAUDE.md backlog 7).
 */
export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; n?: string; c?: string }>;
}) {
  const [{ msg, n, c }, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  const [reviewCount, { rows, programLoaded }] = await Promise.all([countReviewQueue(), listAdminProjects()]);

  const name = (n ?? "").slice(0, 160);
  const changed = Number.isFinite(Number(c)) ? Number(c) : 0;
  const flash =
    msg === "approved"
      ? { text: t.flash.approved(name, changed) }
      : msg === "revoked"
        ? { text: t.flash.revoked(name, changed) }
        : msg === "notFound"
          ? { text: t.flash.notFound, error: true }
          : msg === "invalid"
            ? { text: t.flash.invalid, error: true }
            : null;

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("projects", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{t.title}</h2>
        <p className="panel-card__meta">{t.intro}</p>
        {flash ? <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p> : null}
        {!programLoaded ? <p className="auth-error">{t.programMissing}</p> : null}

        {rows.length === 0 ? (
          <p className="panel-empty">{t.empty}</p>
        ) : (
          <table className="panel-table">
            <thead>
              <tr>
                {t.head.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.developerName ?? "—"}</td>
                  <td>{t.types[p.projectType] ?? p.projectType}</td>
                  <td>{p.saleListings}</td>
                  <td>{p.cheRogaApproved ? t.approved : t.notApproved}</td>
                  <td>
                    <form action={setProjectCheRogaAction}>
                      <input type="hidden" name="projectId" value={p.id} />
                      <input type="hidden" name="approve" value={p.cheRogaApproved ? "0" : "1"} />
                      <button className={`panel-btn${p.cheRogaApproved ? "" : " panel-btn--primary"}`} type="submit">
                        {p.cheRogaApproved ? t.revoke : t.approve}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length > 0 ? <p className="panel-note">{t.approveConfirmNote}</p> : null}
      </main>
    </>
  );
}
