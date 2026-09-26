import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBar } from "@/components/panel/PanelBar";
import { EmailMessageView } from "@/components/panel/EmailThread";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { isStaff, isSuperAdmin } from "@/lib/auth/roles";
import { countRecentLeads, countReviewQueue } from "@/lib/panel-queries";
import {
  countUnreadInbox,
  getInboxThread,
  isThreadKey,
  markInboxThreadRead,
  replyRecipient,
} from "@/lib/inbox";
import { isEmailConfigured, isRootSendingEnabled, senderAddress } from "@/lib/email";
import { guessWhatsapp } from "@/lib/inbox-address";
import { LEAD_EMAIL_FLASH } from "@/lib/inbox-access";
import { esInbox } from "@/i18n/es-e2";
import styles from "@/components/panel/inbox.module.css";
import { adminTabs } from "../../tabs";
import { archiveAction, convertToLeadAction, replyInboxAction } from "../actions";

export const metadata: Metadata = {
  title: esInbox.admin.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const t = esInbox.admin;

const FLASH: Record<string, { text: string; error?: boolean }> = {
  ...LEAD_EMAIL_FLASH,
  unarchived: { text: esInbox.flash.unarchived },
  convert_invalid: { text: esInbox.flash.convertInvalid, error: true },
};

/** The lead types an email can become — the public form's, minus the partner sign-ups. */
const CONVERT_TYPES: Array<[string, string]> = [
  ["question", "Consulta"],
  ["buyer", "Compra"],
  ["renter", "Alquiler"],
  ["seller", "Venta"],
  ["valuation", "Tasación"],
  ["landlord", "Alquilar su propiedad"],
];

export default async function AdminInboxThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ thread: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ thread }, { msg }, user] = await Promise.all([params, searchParams, requireStaffOrAbove()]);
  if (!isThreadKey(thread) || thread.startsWith("lead-")) notFound();
  const viewer = { userId: user.id, superAdmin: isSuperAdmin(user.role) };
  const messages = await getInboxThread(viewer, thread);
  if (!messages) notFound();

  // Opening the thread is reading it.
  await markInboxThreadRead(viewer, thread);
  const [reviewCount, recentLeads, unread] = await Promise.all([
    countReviewQueue(),
    countRecentLeads(24, isStaff(user.role)),
    countUnreadInbox(viewer),
  ]);

  const flash = msg ? FLASH[msg] : undefined;
  const to = replyRecipient(messages);
  const mailbox = [...messages].reverse().find((m) => m.direction === "in")?.mailbox ?? messages[0].mailbox;
  const archived = messages.every((m) => m.archivedAt);
  const firstIn = messages.find((m) => m.direction === "in");
  const subject = messages[messages.length - 1].subject || messages[0].subject;

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
          <Link href="/admin/inbox">← {t.back}</Link>
        </p>
        <h2 className="panel-section__title" style={{ overflowWrap: "anywhere" }}>
          {subject || esInbox.thread.noBody}
        </h2>

        <div className={styles.row} style={{ marginBottom: 12 }}>
          <span className="panel-note" style={{ margin: 0 }}>{mailbox}</span>
          <form action={archiveAction}>
            <input type="hidden" name="thread" value={thread} />
            <input type="hidden" name="archive" value={archived ? "0" : "1"} />
            <button className="panel-btn" type="submit">
              {archived ? t.unarchive : t.archive}
            </button>
          </form>
        </div>

        <div className={styles.list}>
          {messages.map((m) => (
            <EmailMessageView key={m.id} m={m} />
          ))}
        </div>

        {isEmailConfigured() && to ? (
          <section className="panel-card">
            <h3 className="panel-card__title">{t.replyTitle}</h3>
            <form action={replyInboxAction} className={`panel-form ${styles.reply}`}>
              <input type="hidden" name="thread" value={thread} />
              <label className="panel-form__field" style={{ flexBasis: "100%" }}>
                <span className="auth-field__label">{t.replyTo(to)}</span>
                <textarea className="auth-field__input" name="body" required maxLength={10_000} />
              </label>
              <p className="panel-note" style={{ flexBasis: "100%", margin: 0 }}>
                {isRootSendingEnabled() ? t.rootSendingOn(mailbox) : t.rootSendingOff(mailbox, senderAddress()?.address ?? "")}
              </p>
              <div className="panel-form__field panel-form__field--action">
                <button className="panel-btn panel-btn--primary" type="submit">
                  {t.send}
                </button>
              </div>
            </form>
          </section>
        ) : !isEmailConfigured() ? (
          <p className="panel-note">{t.sendingNotConfigured}</p>
        ) : null}

        {firstIn ? (
          <details className="panel-card">
            <summary>
              <strong>{t.convertTitle}</strong>
            </summary>
            <p className="panel-note">{t.convertHint}</p>
            <form action={convertToLeadAction} className="panel-form">
              <input type="hidden" name="thread" value={thread} />
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
                <input className="auth-field__input" name="name" maxLength={140} defaultValue={firstIn.fromName ?? ""} />
              </label>
              <label className="panel-form__field">
                <span className="auth-field__label">{t.convertWhatsapp}</span>
                <input
                  className="auth-field__input"
                  name="whatsapp"
                  required
                  minLength={6}
                  maxLength={30}
                  inputMode="tel"
                  defaultValue={guessWhatsapp(messages.map((m) => m.textBody ?? "").join("\n"))}
                />
              </label>
              <div className="panel-form__field panel-form__field--action">
                <button className="panel-btn" type="submit">
                  {t.convertSubmit}
                </button>
              </div>
            </form>
          </details>
        ) : null}
      </main>
    </>
  );
}
