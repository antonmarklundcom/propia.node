import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { InstallApp } from "@/components/panel/InstallApp";
import { canManageTeam, requireAgencyContext, requireUser } from "@/lib/auth/guards";
import { esAgency } from "@/i18n/es-agency";
import { agencyTabs } from "../tabs";

export const metadata: Metadata = {
  title: esAgency.install.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The link the operator sends a partner: `/agencia/app`. Sign-in first (and
 * back here after it), then the install button / steps for the panel app.
 */
export default async function InstallAppPage() {
  await requireUser("/agencia/app");
  const ctx = await requireAgencyContext();
  return (
    <>
      <PanelBar
        title="Panel de la inmobiliaria"
        role={ctx.user.role}
        userName={ctx.user.name}
        tabs={agencyTabs("profile", canManageTeam(ctx))}
      />
      <main className="panel site-main">
        <InstallApp />
      </main>
    </>
  );
}
