import type { Metadata } from "next";
import { AccountForm } from "@/components/panel/AccountForm";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import { esPanel } from "@/i18n/es";
import { adminTabs } from "../tabs";
import { updateAdminAccountAction } from "./actions";

export const metadata: Metadata = {
  title: `Mi cuenta`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  account_saved: { text: esPanel.profileAccountSaved },
  password: { text: esPanel.profilePasswordChanged },
  taken: { text: esPanel.profileEmailTaken, error: true },
  invalid: { text: esPanel.profileInvalid, error: true },
  bad_password: { text: esPanel.profileBadPassword, error: true },
};

export default async function AdminAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, user] = await Promise.all([searchParams, requireStaffOrAbove()]);
  const reviewCount = await countReviewQueue();
  const flash = msg ? FLASH[msg] : undefined;

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("account", reviewCount)}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p>
        ) : null}
        <h2 className="panel-section__title">{esPanel.profileAccountTitle}</h2>
        <article className="panel-card">
          <AccountForm
            action={updateAdminAccountAction}
            name={user.name}
            email={user.email}
          />
        </article>
      </main>
    </>
  );
}
