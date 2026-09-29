import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBar } from "@/components/panel/PanelBar";
import { EmailMessageView } from "@/components/panel/EmailThread";
import { requireUser } from "@/lib/auth/guards";
import { isEmailConfigured, senderAddress } from "@/lib/email";
import {
  getInboxThread,
  isThreadKey,
  markInboxThreadRead,
  replyRecipient,
  viewerMayWriteMailbox,
} from "@/lib/inbox";
import { inboxViewerFor } from "@/lib/inbox-viewer";
import { LEAD_EMAIL_FLASH } from "@/lib/inbox-access";
import { mayBeSentAsMailbox } from "@/lib/mail-address";
import { sitesSending } from "@/lib/mail-sites";
import { esInbox } from "@/i18n/es-e2";
import { esMailSites } from "@/i18n/es-mail-sites";
import styles from "@/components/panel/inbox.module.css";
import { archiveMemberAction, replyMemberAction } from "../actions";

export const metadata: Metadata = {
  title: esMailSites.member.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const t = esInbox.admin;
const m = esMailSites.member;

const FLASH: Record<string, { text: string; error?: boolean }> = {
  ...LEAD_EMAIL_FLASH,
  unarchived: { text: esInbox.flash.unarchived },
};

export default async function MemberInboxThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ thread: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ thread }, { msg }, user] = await Promise.all([params, searchParams, requireUser("/correo")]);
  if (!isThreadKey(thread) || thread.startsWith("lead-")) notFound();
  const viewer = await inboxViewerFor(user);
  const messages = await getInboxThread(viewer, thread);
  if (!messages) notFound();

  // Opening the thread is reading it.
  await markInboxThreadRead(viewer, thread);

  const flash = msg ? FLASH[msg] : undefined;
  const to = replyRecipient(messages);
  const mailbox = [...messages].reverse().find((x) => x.direction === "in")?.mailbox ?? messages[0].mailbox;
  const canWrite = viewerMayWriteMailbox(viewer, mailbox);
  const archived = messages.every((x) => x.archivedAt);
  const subject = messages[messages.length - 1].subject || messages[0].subject;
  const asItself = mayBeSentAsMailbox(await sitesSending().catch(() => []), mailbox);

  return (
    <>
      <PanelBar
        title={m.title}
        role={user.role}
        userName={user.name}
        tabs={[{ href: "/correo", label: m.tab, active: true }]}
      />
      <main className="panel site-main">
        {flash ? <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p> : null}
        <p>
          <Link href="/correo">← {t.back}</Link>
        </p>
        <h2 className="panel-section__title" style={{ overflowWrap: "anywhere" }}>
          {subject || esInbox.thread.noBody}
        </h2>

        <div className={styles.row} style={{ marginBottom: 12 }}>
          <span className="panel-note" style={{ margin: 0 }}>{mailbox}</span>
          <form action={archiveMemberAction}>
            <input type="hidden" name="thread" value={thread} />
            <input type="hidden" name="archive" value={archived ? "0" : "1"} />
            <button className="panel-btn" type="submit">
              {archived ? t.unarchive : t.archive}
            </button>
          </form>
        </div>

        <div className={styles.list}>
          {messages.map((x) => (
            <EmailMessageView key={x.id} m={x} />
          ))}
        </div>

        {!canWrite ? (
          <p className="panel-note">{m.readOnlyNote}</p>
        ) : isEmailConfigured() && to ? (
          <section className="panel-card">
            <h3 className="panel-card__title">{t.replyTitle}</h3>
            <form action={replyMemberAction} className={`panel-form ${styles.reply}`}>
              <input type="hidden" name="thread" value={thread} />
              <label className="panel-form__field" style={{ flexBasis: "100%" }}>
                <span className="auth-field__label">{t.replyTo(to)}</span>
                <textarea className="auth-field__input" name="body" required maxLength={10_000} />
              </label>
              <p className="panel-note" style={{ flexBasis: "100%", margin: 0 }}>
                {m.replyFrom(mailbox, senderAddress()?.address ?? "", asItself)}
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
      </main>
    </>
  );
}
