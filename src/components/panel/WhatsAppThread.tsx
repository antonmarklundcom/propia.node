/**
 * WhatsApp conversations (docs/log/whatsapp-inbox.md): under a lead card in
 * /admin/leads and /agencia/leads, and on an /admin/inbox/whatsapp chat page.
 * Server component; the caller has already decided the viewer may see these
 * messages. Same look as the email thread (`inbox.module.css`).
 *
 * Text is shown as text. Media links to the one authenticated download route.
 * An automatic message (sent_by_user_id NULL) carries the "automático" label.
 */
import type { ReactNode } from "react";
import { esWhatsApp } from "@/i18n/es-whatsapp";
import { aiReplyButtonLabels, esAiReply } from "@/i18n/es-ai";
import { formatEmailWhen } from "@/lib/inbox";
import { BRAND_NAME } from "@/lib/brand";
import { waLink } from "@/lib/wa";
import { enabledTemplates, renderTemplateBody } from "@/lib/whatsapp-templates";
import { WHATSAPP_TEXT_MAX, WHATSAPP_WINDOW_MS } from "@/lib/whatsapp-webhook";
import type { WhatsAppMessage } from "@/lib/whatsapp-inbox";
import type { SuggestOutcome } from "@/lib/ai-reply-prompt";
import { AiReplyTextarea } from "./AiReplyTextarea";
import styles from "./inbox.module.css";

const t = esWhatsApp.thread;

export function WhatsAppMessageView({ m }: { m: WhatsAppMessage }) {
  const unread = m.direction === "in" && !m.readAt;
  const typeLabel = m.type !== "text" ? (t.types[m.type] ?? m.type) : null;
  return (
    <article className={`${styles.msg}${m.direction === "out" ? ` ${styles.msgOut}` : ""}${unread ? ` ${styles.unread}` : ""}`}>
      <div className={styles.head}>
        <strong>
          {m.direction === "out" ? t.outbound : t.customer}
          {m.direction === "out" && m.sentByUserId == null ? ` · ${t.automatic}` : ""}
        </strong>
        <span>{formatEmailWhen(m.createdAt)}</span>
        {m.direction === "out" && m.status ? <span>{t.status[m.status] ?? m.status}</span> : null}
        {typeLabel ? <span>{typeLabel}</span> : null}
      </div>
      {m.body ? <pre className={styles.text}>{m.body}</pre> : !typeLabel ? <pre className={styles.text}>{t.noBody}</pre> : null}
      {m.type !== "text" && m.type !== "location" && m.type !== "reaction" ? (
        <p className={styles.snippet} style={{ margin: "6px 0 0" }}>
          📎{" "}
          {m.hasMedia ? (
            <a href={`/api/whatsapp-media/${m.id}`} download>
              {m.mediaFilename || typeLabel || t.media}
            </a>
          ) : (
            <span>
              {m.mediaFilename || typeLabel || t.media} — {t.mediaNotStored}
            </span>
          )}
        </p>
      ) : null}
      {m.status === "failed" || (m.direction === "out" && m.error) ? (
        <p className={styles.error}>{t.notSent(m.error ?? "")}</p>
      ) : null}
    </article>
  );
}

/** Until when a free-form reply is allowed, or null when the window is closed. */
export function windowUntil(lastInboundAt: Date | null, now = Date.now()): Date | null {
  if (!lastInboundAt) return null;
  const until = lastInboundAt.getTime() + WHATSAPP_WINDOW_MS;
  return until > now ? new Date(until) : null;
}

/**
 * The reply box, or — outside Meta's 24-hour window — the approved templates
 * the founder has enabled (`WHATSAPP_TEMPLATES`), one small form each, plus the
 * wa.me link to write from a phone instead. With none enabled it is the link
 * alone, as before. Server-rendered on purpose: one form per template needs no
 * client script.
 */
export function WhatsAppReplyBox(props: {
  action: (formData: FormData) => Promise<void>;
  hidden: Record<string, string | number>;
  phone: string;
  lastInboundAt: Date | null;
  suggest?: () => Promise<SuggestOutcome>;
}): ReactNode {
  const until = windowUntil(props.lastInboundAt);
  if (!until) {
    const href = waLink(props.phone);
    const templates = enabledTemplates();
    const link = href ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {t.openWaMe}
      </a>
    ) : null;
    if (templates.length === 0) {
      return (
        <p className="panel-note">
          {t.windowClosed} {link}
        </p>
      );
    }
    return (
      <div>
        <p className="panel-note">{t.windowClosedTemplates}</p>
        {templates.map((tpl) => (
          <form key={tpl.name} action={props.action} className={`panel-form ${styles.reply}`}>
            {Object.entries(props.hidden).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <input type="hidden" name="mode" value="template" />
            <input type="hidden" name="template" value={tpl.name} />
            {tpl.params.map((p, i) => (
              <label key={i} className="panel-form__field">
                <span className="auth-field__label">{p.label}</span>
                <input
                  className="auth-field__input"
                  name={`p${i + 1}`}
                  required
                  maxLength={100}
                  defaultValue={p.prefill === "brand" ? BRAND_NAME : undefined}
                />
              </label>
            ))}
            <p className="panel-note" style={{ flexBasis: "100%", margin: 0 }}>
              {t.templatePreview}: «{renderTemplateBody(tpl, tpl.params.map((p, i) => (p.prefill === "brand" ? BRAND_NAME : `[${p.label}]`)))}»
            </p>
            <div className="panel-form__field panel-form__field--action">
              <button className="panel-btn panel-btn--primary" type="submit">
                {t.templateSubmit}
              </button>
            </div>
          </form>
        ))}
        {link ? (
          <p className="panel-note">
            {t.templateOr} {link}
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <form action={props.action} className={`panel-form ${styles.reply}`}>
      {Object.entries(props.hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="mode" value="reply" />
      <label className="panel-form__field" style={{ flexBasis: "100%" }}>
        <span className="auth-field__label">{t.replyLabel}</span>
        {props.suggest ? (
          <AiReplyTextarea
            className="auth-field__input"
            name="body"
            required
            maxLength={WHATSAPP_TEXT_MAX}
            suggest={props.suggest}
            labels={aiReplyButtonLabels(esAiReply)}
          />
        ) : (
          <textarea className="auth-field__input" name="body" required maxLength={WHATSAPP_TEXT_MAX} />
        )}
      </label>
      <p className="panel-note" style={{ flexBasis: "100%", margin: 0 }}>
        {t.replyFrom} {t.windowOpen(formatEmailWhen(until))}
      </p>
      <div className="panel-form__field panel-form__field--action">
        <button className="panel-btn panel-btn--primary" type="submit">
          {t.replySubmit}
        </button>
      </div>
    </form>
  );
}

/**
 * A lead's WhatsApp messages as a collapsible block under the card. Renders
 * nothing when there are none — a lead that never wrote on the business
 * number has no WhatsApp thread here (its wa.me button is elsewhere on the card).
 */
export function LeadWhatsAppThread(props: {
  messages: WhatsAppMessage[];
  /** The form action (reply / mark read); omitted = read-only. */
  action?: (formData: FormData) => Promise<void>;
  hidden: Record<string, string | number>;
  /** Replying allowed for this viewer (staff and the super-admin, not partners). */
  canReply: boolean;
  phone: string | null;
  lastInboundAt: Date | null;
  suggest?: () => Promise<SuggestOutcome>;
}): ReactNode {
  const { messages } = props;
  if (messages.length === 0) return null;
  const unread = messages.filter((m) => m.direction === "in" && !m.readAt).length;
  return (
    <details className={styles.thread} open={unread > 0}>
      <summary>
        {t.title(messages.length)}
        {unread ? ` · ${t.unread(unread)}` : ""}
      </summary>
      <div className={styles.list}>
        {messages.map((m) => (
          <WhatsAppMessageView key={m.id} m={m} />
        ))}
      </div>
      {unread > 0 && props.action ? (
        <form action={props.action}>
          {Object.entries(props.hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <input type="hidden" name="mode" value="read" />
          <button type="submit" className="panel-btn">
            {t.markRead}
          </button>
        </form>
      ) : null}
      {props.canReply && props.action && props.phone ? (
        <WhatsAppReplyBox
          action={props.action}
          hidden={props.hidden}
          phone={props.phone}
          lastInboundAt={props.lastInboundAt}
          suggest={props.suggest}
        />
      ) : !props.canReply ? (
        <p className="panel-note">{t.partnerReadOnly}</p>
      ) : null}
    </details>
  );
}
