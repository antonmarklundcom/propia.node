import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireUser } from "@/lib/auth/guards";
import { formatEmailWhen, listInboxThreads } from "@/lib/inbox";
import { inboxViewerFor } from "@/lib/inbox-viewer";
import { LEAD_EMAIL_FLASH } from "@/lib/inbox-access";
import { esInbox } from "@/i18n/es-e2";
import { esMailSites } from "@/i18n/es-mail-sites";
import styles from "@/components/panel/inbox.module.css";

export const metadata: Metadata = {
  title: esMailSites.member.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const t = esInbox.admin;
const m = esMailSites.member;

const FLASH: Record<string, { text: string; error?: boolean }> = {
  ...LEAD_EMAIL_FLASH,
  archived: { text: esInbox.flash.archived },
};

/**
 * /correo — the inbox of whoever was given a mailbox (`mailbox_members`).
 * Any signed-in user may open it; what they see is decided by the viewer, so a
 * user with no membership sees an empty state, and a member sees only their
 * own mailboxes (never the portal's `hola@`/`contacto@` unless they are staff).
 */
export default async function MemberInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; msg?: string }>;
}) {
  const [{ vista, msg }, user] = await Promise.all([searchParams, requireUser("/correo")]);
  const viewer = await inboxViewerFor(user);
  const archived = vista === "archivados";
  const mine = viewer.mailboxes ?? [];
  const threads = mine.length > 0 || viewer.shared !== false || viewer.superAdmin
    ? await listInboxThreads(viewer, { archived })
    : [];
  const flash = msg ? FLASH[msg] : undefined;

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
        <h2 className="panel-section__title">{m.title}</h2>
        {mine.length > 0 ? <p className="panel-note">{m.hint(mine.join(", "))}</p> : null}

        {mine.length === 0 && viewer.shared === false ? (
          <p className="panel-empty">{m.none}</p>
        ) : (
          <>
            <nav className="panel-chips">
              <Link href="/correo" className={`panel-chip${archived ? "" : " panel-chip--active"}`}>
                {t.viewInbox}
              </Link>
              <Link href="/correo?vista=archivados" className={`panel-chip${archived ? " panel-chip--active" : ""}`}>
                {t.viewArchived}
              </Link>
            </nav>
            {threads.length === 0 ? (
              <p className="panel-empty">{archived ? t.emptyArchived : t.empty}</p>
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
                        href={`/correo/${th.threadKey}`}
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
          </>
        )}
      </main>
    </>
  );
}
