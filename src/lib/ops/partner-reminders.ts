/**
 * Unanswered shared leads (docs/plan-agency-2026-09-26.md batch 4): a share
 * still `pending` `REMIND_AFTER_HOURS` after the operator made it pings the
 * partner once on Telegram, and the operator once, then never again.
 *
 * One pass, the same in both modes (AGENTS.md §4): select the due shares,
 * resolve each one's linked chats, group them per chat. A real run then claims
 * each share (`reminded_at = now()`), sends one message per chat and one
 * operator alert; a dry run stops before the claim and says what it would
 * send. The only number a dry run cannot know is `ya_tomadas` — a share a
 * concurrent run, an answer or a revoke took between the select and the claim.
 *
 * `reminded_at` is stamped whether or not the partner has Telegram: it records
 * that the reminder *step* ran — the partner pinged if linked, the operator
 * told either way — so the next hourly run does not alert the operator about
 * the same share again. The counters say how many had a chat.
 *
 * Scheduled by the Cloudflare Worker's cron → `/api/cron/tick`
 * (`src/lib/cron-tick.ts`); also `npm run cron:reminders` and a card on
 * /admin/operaciones. No cache tag: nothing a visitor reads changes.
 */
import "server-only";
import { CANONICAL_HOST } from "@/config/verticals";
import { alertOperator } from "@/lib/crm";
import { esTelegram } from "@/i18n/es-telegram";
import {
  claimShareReminder,
  listingTitlesForLeads,
  sharesToRemind,
  type ShareTarget,
} from "@/lib/lead-assignments";
import {
  reminderText,
  sendToChats,
  telegramChatsFor,
  titleIn,
  type TelegramChat,
} from "@/lib/partner-alerts";
import { telegramBotToken } from "@/lib/telegram";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

/** Hours a share may stay `pending` before its one reminder. */
export const REMIND_AFTER_HOURS = 4;

/** Shares handled per run when no limit is given; the rest wait an hour. */
const DEFAULT_LIMIT = 200;

export async function runPartnerReminders(opts: OpsOptions): Promise<OpsResult> {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`invalid limit '${opts.limit}'`);

  return opsRun("cron:reminders", opts.dry, async (out) => {
    out.track("pendientes", "con_telegram", "sin_telegram", "mensajes");
    out.note(`cutoff ${REMIND_AFTER_HOURS} h`);

    // Request-free on purpose (CLI and Worker tick): the panel lives on the primary.
    const origin = `https://${CANONICAL_HOST}`;
    const due = await sharesToRemind({ olderThanHours: REMIND_AFTER_HOURS, limit });

    const chatsByTarget = new Map<string, TelegramChat[]>();
    const chatsOf = async (target: ShareTarget) => {
      const key = `${target.kind}:${target.id}`;
      let chats = chatsByTarget.get(key);
      if (!chats) {
        chats = await telegramChatsFor([target]);
        chatsByTarget.set(key, chats);
      }
      return chats;
    };

    /** chat id → its reader's language and the leads it is reminded about. */
    const perChat = new Map<string, { chat: TelegramChat; leadIds: number[] }>();
    let reminded = 0;
    for (const share of due) {
      if (!opts.dry && !(await claimShareReminder(share.id))) {
        out.count("ya_tomadas");
        continue;
      }
      reminded += 1;
      out.count("pendientes");
      const chats = await chatsOf(share.target);
      out.count(chats.length > 0 ? "con_telegram" : "sin_telegram");
      for (const chat of chats) {
        const entry = perChat.get(chat.chat) ?? { chat, leadIds: [] };
        entry.leadIds.push(share.leadId);
        perChat.set(chat.chat, entry);
      }
    }
    out.count("mensajes", perChat.size);

    if (perChat.size > 0 && !telegramBotToken()) {
      out.note("TELEGRAM_BOT_TOKEN is not set: no partner message can be sent.");
    }
    if (opts.dry) {
      out.note("--dry: nothing marked, nothing sent.");
      return;
    }

    const singles = [...perChat.values()]
      .filter((e) => e.leadIds.length === 1)
      .map((e) => e.leadIds[0]);
    const titles = await listingTitlesForLeads([...new Set(singles)]);
    let sent = 0;
    for (const { chat, leadIds } of perChat.values()) {
      sent += await sendToChats([chat], (locale) =>
        reminderText({
          locale,
          count: leadIds.length,
          hours: REMIND_AFTER_HOURS,
          title: leadIds.length === 1 ? titleIn(locale, titles.get(leadIds[0])) : null,
          url: `${origin}/agencia/leads`,
        }),
      );
    }
    // Accepted by Telegram — not attempted.
    out.count("enviados", sent);

    if (reminded > 0) {
      const o = esTelegram.operator;
      await alertOperator({
        kind: "share_reminder",
        title: o.remindersTitle(reminded),
        detail: o.remindersDetail(REMIND_AFTER_HOURS, sent),
        url: `${origin}/admin/leads`,
        site: CANONICAL_HOST,
      });
      // alertOperator() never reports back, so this says it was handed over, not delivered.
      out.note("operator alert handed to the configured channels (if any)");
    }
  });
}
