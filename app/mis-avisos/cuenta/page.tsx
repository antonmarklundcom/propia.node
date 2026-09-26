import type { Metadata } from "next";
import { AccountForm } from "@/components/panel/AccountForm";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireOwnerContext } from "@/lib/auth/guards";
import { esOwner, esPanel } from "@/i18n/es";
import { esA2 } from "@/i18n/es-a2";
import { ownerTabs } from "../tabs";
import { updateOwnerAccountAction } from "./actions";

export const metadata: Metadata = {
  title: esA2.accountTitle,
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

export default async function OwnerAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, { user }] = await Promise.all([searchParams, requireOwnerContext()]);
  const flash = msg ? FLASH[msg] : undefined;

  return (
    <>
      <PanelBar
        title={esOwner.panelTitle}
        role={user.role}
        userName={user.name}
        tabs={ownerTabs("account")}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p>
        ) : null}
        <h2 className="panel-section__title">{esA2.accountTitle}</h2>
        <p className="panel-note">{esA2.accountNote}</p>
        <article className="panel-card">
          <AccountForm
            action={updateOwnerAccountAction}
            name={user.name}
            email={user.email}
          />
        </article>
      </main>
    </>
  );
}
