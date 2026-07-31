import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import {
  countReviewQueue,
  listAgencies,
  listAgents,
} from "@/lib/panel-queries";
import { esPanel } from "@/i18n/es";
import { BRAND_NAME } from "@/lib/brand";
import { adminTabs } from "../tabs";
import {
  toggleAgencyVerifiedAction,
  toggleAgentVerifiedAction,
} from "../actions";

export const metadata: Metadata = {
  title: `Inmobiliarias y agentes — ${BRAND_NAME}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function VerifiedPill({ on }: { on: boolean }) {
  return (
    <span className={`panel-verified${on ? "" : " panel-verified--off"}`}>
      {on ? esPanel.verifiedBadge : esPanel.notVerifiedBadge}
    </span>
  );
}

export default async function AdminAgenciesPage() {
  const user = await requireSuperAdmin();
  const [reviewCount, agencies, agents] = await Promise.all([
    countReviewQueue(),
    listAgencies(),
    listAgents(),
  ]);

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("agencies", reviewCount)}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">Inmobiliarias</h2>
        {agencies.length === 0 ? (
          <p className="panel-empty">Todavía no hay inmobiliarias.</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Plan</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a) => (
                  <tr key={a.id}>
                    <td className="panel-table__name">{a.name}</td>
                    <td>{a.plan}</td>
                    <td>{a.whatsapp ?? a.email ?? "—"}</td>
                    <td>
                      <VerifiedPill on={a.isVerified} />
                    </td>
                    <td>
                      <form action={toggleAgencyVerifiedAction}>
                        <input type="hidden" name="agencyId" value={a.id} />
                        <input
                          type="hidden"
                          name="verified"
                          value={a.isVerified ? "0" : "1"}
                        />
                        <button className="panel-btn" type="submit">
                          {a.isVerified ? esPanel.unverify : esPanel.verify}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="panel-section__title" style={{ marginTop: 32 }}>
          Agentes
        </h2>
        {agents.length === 0 ? (
          <p className="panel-empty">Todavía no hay agentes.</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Inmobiliaria</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id}>
                    <td className="panel-table__name">{a.name}</td>
                    <td>{a.agencyName ?? "Independiente"}</td>
                    <td>{a.whatsapp ?? "—"}</td>
                    <td>
                      <VerifiedPill on={a.isVerified} />
                    </td>
                    <td>
                      <form action={toggleAgentVerifiedAction}>
                        <input type="hidden" name="agentId" value={a.id} />
                        <input
                          type="hidden"
                          name="verified"
                          value={a.isVerified ? "0" : "1"}
                        />
                        <button className="panel-btn" type="submit">
                          {a.isVerified ? esPanel.unverify : esPanel.verify}
                        </button>
                      </form>
                    </td>
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
