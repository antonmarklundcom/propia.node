import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBar } from "@/components/panel/PanelBar";
import { WhatsAppMessageView, WhatsAppReplyBox } from "@/components/panel/WhatsAppThread";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { isStaff, isSuperAdmin } from "@/lib/auth/roles";
import { countRecentLeads, countReviewQueue } from "@/lib/panel-queries";
import { countUnreadInbox } from "@/lib/inbox";
import { isAiReplyEnabled } from "@/lib/ai-reply";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { getWhatsAppChat, getWhatsAppContact, markWhatsAppChatRead } from "@/lib/whatsapp-inbox";
import { normalizeWaPhone } from "@/lib/whatsapp-webhook";
import { LEAD_WHATSAPP_FLASH } from "@/lib/whatsapp-access";
import { esWhatsApp } from "@/i18n/es-whatsapp";
import styles from "@/components/panel/inbox.module.css";
import { adminTabs } from "../../../tabs";
import { convertWhatsAppToLeadAction, replyWhatsAppChatAction, suggestWhatsAppChatReplyAction } from "../../actions";

export const metadata: Metadata = {
  title: esWhatsApp.admin.view,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const t = esWhatsApp.admin;

/** The lead types a chat can become — the email inbox's list. */
const CONVERT_TYPES: Array<[string, string]> = [
  ["question", "Consulta"],
  ["buyer", "Compra"],
  ["renter", "Alquiler"],
  ["seller", "Venta"],
  ["valuation", "Tasación"],
  ["landlord", "Alquilar su propiedad"],
];

/**
 * One unattached WhatsApp chat on the business number (staff or above — the
 * number is the business's, like hola@). A chat that belongs to a lead is
 * shown under the lead instead, to whoever may see it.
 */
export default async function AdminWhatsAppChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ phone: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ phone: raw }, { msg }, user] = await Promise.all([params, searchParams, requireStaffOrAbove()]);
  const phone = normalizeWaPhone(raw);
  if (!phone || phone !== raw) notFound();
  const messages = await getWhatsAppChat(phone);
  if (!messages) notFound();

  // Opening the chat is reading it.
  await markWhatsAppChatRead(phone);
  const viewer = { userId: user.id, superAdmin: isSuperAdmin(user.role) };
  const [contact, reviewCount, recentLeads, unread] = await Promise.all([
    getWhatsAppContact(phone),
    countReviewQueue(),
    countRecentLeads(24, isStaff(user.role)),
    countUnreadInbox(viewer),
  ]);
  const flash = msg ? LEAD_WHATSAPP_FLASH[msg] : undefined;
  const who = contact?.name ? `${contact.name} (+${phone})` : `+${phone}`;

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("inbox", reviewCount, undefined, recentLeads, unread)}
      />
      <main className="panel site-main">
        {flash ? <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p> : null}
        <p>
          <Link href="/admin/inbox?vista=whatsapp">← {t.back}</Link>
        </p>
        <h2 className="panel-section__title" style={{ overflowWrap: "anywhere" }}>
          {t.chatWith(who)}
        </h2>

        <div className={styles.list}>
          {messages.map((m) => (
            <WhatsAppMessageView key={m.id} m={m} />
          ))}
        </div>

        {isWhatsAppConfigured() ? (
          <section className="panel-card">
            <WhatsAppReplyBox
              action={replyWhatsAppChatAction}
              hidden={{ phone }}
              phone={phone}
              lastInboundAt={contact?.lastInboundAt ?? null}
              suggest={isAiReplyEnabled() ? suggestWhatsAppChatReplyAction.bind(null, phone) : undefined}
            />
          </section>
        ) : (
          <p className="panel-note">{esWhatsApp.flash.notConfigured}</p>
        )}

        <details className="panel-card">
          <summary>
            <strong>{t.convertTitle}</strong>
          </summary>
          <p className="panel-note">{t.convertHint}</p>
          <form action={convertWhatsAppToLeadAction} className="panel-form">
            <input type="hidden" name="phone" value={phone} />
            <label className="panel-form__field">
              <span className="auth-field__label">{t.convertType}</span>
              <select className="auth-field__input" name="leadType" defaultValue="question">
                {CONVERT_TYPES.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="panel-form__field">
              <span className="auth-field__label">{t.convertName}</span>
              <input className="auth-field__input" name="name" maxLength={140} defaultValue={(contact?.name ?? "").slice(0, 140)} />
            </label>
            <div className="panel-form__field panel-form__field--action">
              <button className="panel-btn" type="submit">
                {t.convertSubmit}
              </button>
            </div>
          </form>
        </details>
      </main>
    </>
  );
}
