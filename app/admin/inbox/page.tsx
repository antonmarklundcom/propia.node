import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { isStaff, isSuperAdmin } from "@/lib/auth/roles";
import { countRecentLeads, countReviewQueue } from "@/lib/panel-queries";
import {
  composeMailboxes,
  countUnreadInbox,
  formatEmailWhen,
  listInboxThreads,
  listRecentLeadReplies,
} from "@/lib/inbox";
import { isInboundConfigured, SHARED_MAILBOXES, rootDomain } from "@/lib/inbox-address";
import { isEmailConfigured, isRootSendingEnabled, senderAddress } from "@/lib/email";
import { LEAD_EMAIL_FLASH } from "@/lib/inbox-access";
import { esInbox } from "@/i18n/es-e2";
import styles from "@/components/panel/inbox.module.css";
import { adminTabs } from "../tabs";
import { composeAction } from "./actions";

export const metadata: Metadata = {
  title: esInbox.admin.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const t = esInbox.admin;

const FLASH: Record<string, { text: string; error?: boolean }> = {
  ...LEAD_EMAIL_FLASH,
  archived: { text: esInbox.flash.archived },
};

type View = "bandeja" | "archivados" | "consultas";

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; msg?: string; redactar?: string }>;
}) {
  const [{ vista, msg, redactar }, user] = await Promise.all([searchParams, requireStaffOrAbove()]);
  const viewer = { userId: user.id, superAdmin: isSuperAdmin(user.role) };
  const internalOnly = isStaff(user.role);
  const view: View = vista === "archivados" || vista === "consultas" ? vista : "bandeja";

  const [reviewCount, recentLeads, unread, mailboxes, threads, leadReplies] = await Promise.all([
    countReviewQueue(),
    countRecentLeads(24, internalOnly),
    countUnreadInbox(viewer),
    composeMailboxes(viewer),
    view === "consultas" ? Promise.resolve([]) : listInboxThreads(viewer, { archived: view === "archivados" }),
    view === "consultas" ? listRecentLeadReplies(internalOnly) : Promise.resolve([]),
  ]);
  const flash = msg ? FLASH[msg] : undefined;
  const sender = senderAddress()?.address ?? "";
  const shownMailboxes = viewer.superAdmin
    ? mailboxes.join(", ")
    : SHARED_MAILBOXES.map((l) => `${l}@${rootDomain()}`).join(", ");

  const chip = (v: View, label: string) => (
    <Link
      href={v === "bandeja" ? "/admin/inbox" : `/admin/inbox?vista=${v}`}
      className={`panel-chip${view === v ? " panel-chip--active" : ""}`}
    >
      {label}
      {v === "bandeja" && unread > 0 ? <span className="panel-tab__count">{unread}</span> : null}
    </Link>
  );

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

        <h2 className="panel-section__title">{t.title}</h2>
        <p className="panel-note">{t.hint(shownMailboxes)}</p>
        {!isInboundConfigured() ? <p className="panel-note">{t.notConfigured}</p> : null}
        {!isEmailConfigured() ? <p className="panel-note">{t.sendingNotConfigured}</p> : null}

        <nav className="panel-chips">
          {chip("bandeja", t.viewInbox)}
          {chip("archivados", t.viewArchived)}
          {chip("consultas", t.viewLeads)}
        </nav>

        {isEmailConfigured() ? (
          <details className="panel-card" open={redactar === "1"}>
            <summary>
              <strong>{t.compose}</strong>
            </summary>
            <form action={composeAction} className={`panel-form ${styles.reply}`}>
              <label className="panel-form__field">
                <span className="auth-field__label">{t.from}</span>
                <select className="auth-field__input" name="mailbox" defaultValue={mailboxes[0]}>
                  {mailboxes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="panel-form__field" style={{ flexBasis: "260px", flexGrow: 1 }}>
                <span className="auth-field__label">{t.to}</span>
                <input className="auth-field__input" name="to" type="email" required maxLength={254} />
              </label>
              <label className="panel-form__field" style={{ flexBasis: "260px", flexGrow: 1 }}>
                <span className="auth-field__label">{t.cc}</span>
                <input className="auth-field__input" name="cc" maxLength={1000} />
              </label>
              <label className="panel-form__field" style={{ flexBasis: "100%" }}>
                <span className="auth-field__label">{t.subject}</span>
                <input className="auth-field__input" name="subject" required maxLength={250} />
              </label>
              <label className="panel-form__field" style={{ flexBasis: "100%" }}>
                <span className="auth-field__label">{t.body}</span>
                <textarea className="auth-field__input" name="body" required maxLength={10_000} />
              </label>
              <p className="panel-note" style={{ flexBasis: "100%", margin: 0 }}>
                {isRootSendingEnabled() ? t.rootSendingOn(mailboxes[0]) : t.rootSendingOff(mailboxes[0], sender)}
              </p>
              <div className="panel-form__field panel-form__field--action">
                <button className="panel-btn panel-btn--primary" type="submit">
                  {t.send}
                </button>
              </div>
            </form>
          </details>
        ) : null}

        {view === "consultas" ? (
          leadReplies.length === 0 ? (
            <p className="panel-empty">{t.leadRepliesEmpty}</p>
          ) : (
            <ul className={`panel-card ${styles.threadList}`}>
              {leadReplies.map((r) => (
                <li key={r.id}>
                  <Link
                    className={`${styles.threadItem}${r.readAt ? "" : ` ${styles.threadUnread}`}`}
                    href={`/admin/leads?q=${encodeURIComponent(r.leadWhatsapp)}`}
                  >
                    <div className={styles.row}>
                      <span className={styles.threadSubject}>{r.subject || esInbox.thread.noBody}</span>
                      <span className={styles.snippet}>{formatEmailWhen(r.createdAt)}</span>
                    </div>
                    <div className={styles.snippet}>
                      {r.fromName ?? r.fromAddress} · {t.leadLabel(r.leadName ?? r.leadWhatsapp)} · {t.openLead}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : threads.length === 0 ? (
          <p className="panel-empty">{view === "archivados" ? t.emptyArchived : t.empty}</p>
        ) : (
          <ul className={`panel-card ${styles.threadList}`}>
            {threads.map((th) => {
              const who =
                th.last.direction === "in"
                  ? (th.last.fromName ?? th.last.fromAddress)
                  : `${t.to}: ${th.last.toAddresses ?? ""}`;
              return (
                <li key={th.threadKey}>
                  <Link
                    className={`${styles.threadItem}${th.unread ? ` ${styles.threadUnread}` : ""}`}
                    href={`/admin/inbox/${th.threadKey}`}
                  >
                    <div className={styles.row}>
                      <span className={styles.threadSubject}>{th.last.subject || esInbox.thread.noBody}</span>
                      <span className={styles.snippet}>{formatEmailWhen(th.last.createdAt)}</span>
                    </div>
                    <div className={styles.snippet}>
                      {who} · {th.last.mailbox} · {t.messages(th.count)}
                      {th.unread ? ` · ${t.unreadCount(th.unread)}` : ""}
                    </div>
                    {th.last.snippet ? <div className={styles.snippet}>{th.last.snippet}</div> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
