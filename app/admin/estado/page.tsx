import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import {
  getContentHealth,
  ROUTES,
  type HealthCheck,
  type HealthStatus,
} from "@/lib/health-queries";
import { adminTabs } from "../tabs";

export const metadata: Metadata = {
  title: `Estado del contenido`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<HealthStatus, string> = {
  ok: "Listo",
  warn: "Falta algo",
  blocked: "Bloqueado",
};

/**
 * Ordered worst-first: the point of opening this page is to find the next
 * thing to do, and `blocked` items are the ones that need a decision rather
 * than a command.
 */
const STATUS_RANK: Record<HealthStatus, number> = {
  blocked: 0,
  warn: 1,
  ok: 2,
};

function StatusPill({ status }: { status: HealthStatus }) {
  return (
    <span className={`health-pill health-pill--${status}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function CheckCard({ check }: { check: HealthCheck }) {
  return (
    <article className={`health-card health-card--${check.status}`}>
      <div className="health-card__head">
        <h3 className="health-card__title">{check.label}</h3>
        <StatusPill status={check.status} />
      </div>
      <p className="health-card__value">{check.value}</p>
      {check.note && <p className="health-card__note">{check.note}</p>}
      {check.action && (
        <p className="health-card__action">
          <span className="health-card__action-label">Para resolverlo</span>
          <code className="health-card__cmd">{check.action}</code>
        </p>
      )}
      <p className="health-card__affects">
        Afecta: {check.affects.join(" · ")}
      </p>
    </article>
  );
}

export default async function AdminEstadoPage() {
  const user = await requireSuperAdmin();
  const [reviewCount, checks] = await Promise.all([
    countReviewQueue(),
    getContentHealth(),
  ]);

  const byId = new Map(checks.map((c) => [c.id, c]));
  const sorted = [...checks].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  );
  const needsWork = sorted.filter((c) => c.status !== "ok").length;

  /** Worst status among a route's dependencies — a page is as healthy as its
   *  weakest input. A route with no dependencies is static copy: always ok. */
  const routeStatus = (deps: string[]): HealthStatus =>
    deps.reduce<HealthStatus>((worst, id) => {
      const s = byId.get(id)?.status ?? "ok";
      return STATUS_RANK[s] < STATUS_RANK[worst] ? s : worst;
    }, "ok");

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("health", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">Estado del contenido</h2>
        <p style={{ color: "#55655F", fontSize: 13, marginTop: 0, maxWidth: "72ch" }}>
          Qué páginas del sitio tienen con qué llenarse y cuáles están vacías
          porque les falta un dato. Varias secciones del portal se ocultan solas
          cuando no hay nada que mostrar — es lo correcto, pero desde afuera no
          se distingue de un error. Acá se distingue.{" "}
          {needsWork === 0
            ? "Ahora mismo no hay nada pendiente."
            : `Ahora mismo hay ${needsWork} punto${needsWork === 1 ? "" : "s"} pendiente${needsWork === 1 ? "" : "s"}.`}
        </p>

        <div className="health-grid">
          {sorted.map((c) => (
            <CheckCard key={c.id} check={c} />
          ))}
        </div>

        <h2 className="panel-section__title" style={{ marginTop: 40 }}>
          Páginas del sitio
        </h2>
        <p style={{ color: "#55655F", fontSize: 13, marginTop: 0, maxWidth: "72ch" }}>
          Todas las páginas públicas y de qué dato depende cada una. «Listo»
          quiere decir que la página tiene con qué llenarse, no que el texto
          esté terminado.
        </p>

        <div className="panel-table__wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Página</th>
                <th>Ruta</th>
                <th>Depende de</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ROUTES.map((r) => {
                const status = routeStatus(r.dependsOn);
                return (
                  <tr key={r.path}>
                    <td className="panel-table__name">{r.label}</td>
                    <td>
                      {r.kind === "público" && !r.path.includes("[") ? (
                        <Link href={r.path}>{r.path}</Link>
                      ) : (
                        <span style={{ color: "#7D857F" }}>{r.path}</span>
                      )}
                    </td>
                    <td style={{ color: "#55655F", fontSize: 12 }}>
                      {r.dependsOn.length > 0
                        ? r.dependsOn
                            .map((id) => byId.get(id)?.label ?? id)
                            .join(", ")
                        : "Solo texto fijo"}
                    </td>
                    <td>
                      <StatusPill status={status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
