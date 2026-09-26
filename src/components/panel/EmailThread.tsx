/**
 * One email conversation (waves E2 + E3): under a lead card in /admin/leads,
 * /agencia/leads and /mis-avisos/consultas, and on an /admin/inbox thread
 * page. Server component; the caller has already decided the viewer may see
 * these messages and passes the reply form's action and hidden fields.
 *
 * Received HTML is shown only through `EmailHtmlFrame` (sandboxed, CSP,
 * remote images off); text is shown as text. Attachments link to the one
 * authenticated download route.
 */
import type { ReactNode } from "react";
import { esInbox } from "@/i18n/es-e2";
import { emailFrameDocument, emailHtmlForView, hasRemoteImages } from "@/lib/inbox-html";
import { formatEmailWhen, type InboxMessage } from "@/lib/inbox";
import { EmailHtmlFrame } from "./EmailHtmlFrame";
import styles from "./inbox.module.css";

const t = esInbox.thread;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("es-PY", { maximumFractionDigits: 1 })} MB`;
}

function MessageBody({ m }: { m: InboxMessage }) {
  // Our own messages are shown as the text we wrote; only received HTML
  // needs the sandboxed frame.
  if (m.htmlBody && !(m.direction === "out" && m.textBody)) {
    const blocked = emailFrameDocument(emailHtmlForView(m.htmlBody, { remoteImages: false }), { remoteImages: false });
    const withImages = hasRemoteImages(m.htmlBody)
      ? emailFrameDocument(emailHtmlForView(m.htmlBody, { remoteImages: true }), { remoteImages: true })
      : null;
    return (
      <EmailHtmlFrame
        title={m.subject || t.noBody}
        blocked={blocked}
        withImages={withImages}
        labels={{ show: t.showImages, hide: t.hideImages, note: t.imagesBlocked }}
      />
    );
  }
  return <pre className={styles.text}>{m.textBody?.trim() || t.noBody}</pre>;
}

export function EmailMessageView({ m, showSubject = true }: { m: InboxMessage; showSubject?: boolean }) {
  const unread = m.direction === "in" && !m.readAt;
  return (
    <article className={`${styles.msg}${m.direction === "out" ? ` ${styles.msgOut}` : ""}${unread ? ` ${styles.unread}` : ""}`}>
      <div className={styles.head}>
        <strong>{m.direction === "out" ? `${t.outbound} · ${m.fromName ?? m.fromAddress}` : (m.fromName ?? m.fromAddress)}</strong>
        {m.direction === "in" && m.fromName ? <span>{m.fromAddress}</span> : null}
        <span>{formatEmailWhen(m.createdAt)}</span>
        {m.toAddresses ? <span>{t.to}: {m.toAddresses}</span> : null}
        {m.ccAddresses ? <span>{t.cc}: {m.ccAddresses}</span> : null}
      </div>
      {showSubject && m.subject ? <p className={styles.subject}>{m.subject}</p> : null}
      <MessageBody m={m} />
      {m.attachments.length ? (
        <ul className={styles.attachments} aria-label={t.attachments}>
          {m.attachments.map((a) => (
            <li key={a.id}>
              📎{" "}
              {a.stored ? (
                <a href={`/api/email-attachment/${a.id}`} download>
                  {a.filename}
                </a>
              ) : (
                <span>{a.filename}</span>
              )}{" "}
              <span>({formatSize(a.sizeBytes)}{a.stored ? "" : ` — ${t.attachmentMetadataOnly}`})</span>
            </li>
          ))}
        </ul>
      ) : null}
      {m.sendError ? <p className={styles.error}>{t.notSent(m.sendError)}</p> : null}
    </article>
  );
}

/**
 * A lead's thread as a collapsible block under the card. Renders nothing when
 * there is neither a message nor a way to write one.
 */
export function LeadEmailThread(props: {
  messages: InboxMessage[];
  /** The reply server action; omitted when this viewer cannot reply here. */
  action?: (formData: FormData) => Promise<void>;
  hidden: Record<string, string | number>;
  /** Where a reply would go; null when there is no address to answer. */
  replyTo: string | null;
  /** Shown instead of the box when replying is not possible yet. */
  unavailable?: string | null;
}): ReactNode {
  const { messages } = props;
  const unread = messages.filter((m) => m.direction === "in" && !m.readAt).length;
  const canReply = !!props.action && !!props.replyTo && !props.unavailable;
  if (messages.length === 0 && !canReply) return null;

  const hidden = Object.entries(props.hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />);
  return (
    <details className={styles.thread} open={unread > 0}>
      <summary>
        {messages.length ? t.title(messages.length) : t.replyLabel}
        {unread ? ` · ${t.unread(unread)}` : ""}
      </summary>
      {messages.length ? (
        <div className={styles.list}>
          {messages.map((m) => (
            <EmailMessageView key={m.id} m={m} />
          ))}
        </div>
      ) : null}
      {unread > 0 && props.action ? (
        <form action={props.action}>
          {hidden}
          <input type="hidden" name="mode" value="read" />
          <button type="submit" className="panel-btn">
            {t.markRead}
          </button>
        </form>
      ) : null}
      {canReply ? (
        <form action={props.action} className={`panel-form ${styles.reply}`}>
          {hidden}
          <input type="hidden" name="mode" value="reply" />
          <label className="panel-form__field" style={{ flexBasis: "100%" }}>
            <span className="auth-field__label">{t.replyLabel}</span>
            <textarea className="auth-field__input" name="body" required maxLength={10_000} />
          </label>
          <p className="panel-note" style={{ flexBasis: "100%", margin: 0 }}>
            {t.replyTo(props.replyTo!)}
          </p>
          <div className="panel-form__field panel-form__field--action">
            <button className="panel-btn panel-btn--primary" type="submit">
              {t.replySubmit}
            </button>
          </div>
        </form>
      ) : props.action && !props.replyTo && messages.length === 0 ? null : props.unavailable ? (
        <p className="panel-note">{props.unavailable}</p>
      ) : props.action && !props.replyTo ? (
        <p className="panel-note">{t.noRecipient}</p>
      ) : null}
    </details>
  );
}
