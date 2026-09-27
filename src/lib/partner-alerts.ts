/**
 * Telegram alerts to partner realtors (docs/plan-agency-2026-09-26.md batch 4):
 * a lead was shared with you, the buyer of a shared lead replied by email, and
 * the unanswered-share reminder (`src/lib/ops/partner-reminders.ts`).
 *
 * Who receives one is decided by `shareRecipients()` — the same people the
 * share-notice email goes to, i.e. the people who see the share in
 * `/agencia/leads` — narrowed to those who linked a chat on /agencia/perfil.
 * Each chat is written to in its owner's `users.locale` (`esTelegram` /
 * `enTelegram`), like the share-notice email.
 *
 * **Never buyer data.** Every text is built by `src/lib/telegram-text.ts`
 * from the `alert` namespace: what happened, at most the listing's title, and
 * the panel link. A name, phone, email or message never enters this module's
 * arguments.
 *
 * Same contract as `alertOperator()`: never throws, returns how many messages
 * Telegram *accepted* (never how many were attempted), and does nothing —
 * not even a query — when no bot token is configured.
 */
import "server-only";
import type { Locale } from "@/i18n";
import {
  activeShareTargets,
  listingTitlesForLeads,
  shareRecipients,
  type ShareTarget,
} from "@/lib/lead-assignments";
import { sendTelegramTo, telegramBotToken } from "@/lib/telegram";
import { emailReplyText, shareText, titleIn } from "@/lib/telegram-text";

export { reminderText, titleIn } from "@/lib/telegram-text";

/** One linked chat and the language its owner reads. */
export interface TelegramChat {
  chat: string;
  locale: Locale;
}

/**
 * Linked chats of everyone who sees shares made to these targets,
 * deduplicated by chat. A chat shared by two logins (one person, two
 * accounts) keeps the locale of the first one met.
 */
export async function telegramChatsFor(targets: ShareTarget[]): Promise<TelegramChat[]> {
  const chats = new Map<string, Locale>();
  for (const target of targets) {
    for (const r of await shareRecipients(target)) {
      if (r.telegramChatId && !chats.has(r.telegramChatId)) {
        chats.set(r.telegramChatId, r.locale === "en" ? "en" : "es");
      }
    }
  }
  return [...chats].map(([chat, locale]) => ({ chat, locale }));
}

/** Send each chat its own text; the number Telegram accepted. Never throws. */
export async function sendToChats(
  chats: TelegramChat[],
  textFor: (locale: Locale) => string,
): Promise<number> {
  const results = await Promise.allSettled(chats.map((c) => sendTelegramTo(c.chat, textFor(c.locale))));
  return results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
}

/**
 * "A lead was shared with you" to the people behind `target`. Called in
 * `after()` by the share action, once the share rows exist.
 */
export async function telegramShareNotice(p: {
  target: ShareTarget;
  leadIds: number[];
  inboxUrl: string;
}): Promise<number> {
  if (!telegramBotToken() || p.leadIds.length === 0) return 0;
  try {
    const chats = await telegramChatsFor([p.target]);
    if (chats.length === 0) return 0;
    const title =
      p.leadIds.length === 1 ? (await listingTitlesForLeads(p.leadIds)).get(p.leadIds[0]) : undefined;
    return await sendToChats(chats, (locale) =>
      shareText({ locale, count: p.leadIds.length, title: titleIn(locale, title), url: p.inboxUrl }),
    );
  } catch {
    return 0; // the share row is the record; an unsent ping is not an incident
  }
}

/**
 * "The buyer replied by email" to everyone who holds an active share of the
 * lead (wave E2's thread; `docs/decisions-needed.md` 2026-09-26 E2/E3 item 4).
 * A revoked share is not told: `activeShareTargets()` skips it.
 */
export async function telegramEmailReplyNotice(p: {
  leadId: number;
  inboxUrl: string;
}): Promise<number> {
  if (!telegramBotToken()) return 0;
  try {
    const chats = await telegramChatsFor(await activeShareTargets(p.leadId));
    if (chats.length === 0) return 0;
    const title = (await listingTitlesForLeads([p.leadId])).get(p.leadId);
    return await sendToChats(chats, (locale) =>
      emailReplyText({ locale, title: titleIn(locale, title), url: p.inboxUrl }),
    );
  } catch {
    return 0;
  }
}
