/**
 * `users.telegram_chat_id` — the only module that writes it (plan-agency
 * batch 4). Linked by the bot's webhook after a user opens their own signed
 * start link (`src/lib/telegram.ts`), cleared by the user on /agencia/perfil
 * or by `/stop` in the chat.
 */
import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isChatId } from "@/lib/telegram";

/** The chat this user linked, or null. */
export async function telegramChatFor(userId: number): Promise<string | null> {
  const [row] = await db
    .select({ chat: users.telegramChatId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.chat ?? null;
}

export type LinkOutcome =
  /** The chat is now (or already was) this user's alert chat. */
  | { status: "linked"; locale: "es" | "en" }
  /** The user has a different chat linked; nothing was changed. */
  | { status: "other_chat"; locale: "es" | "en" }
  /** The user the token named no longer exists (or the chat id is malformed). */
  | { status: "missing" };

/**
 * Tie `chatId` to the user a verified start token named — but never over a
 * DIFFERENT chat that user already linked: that is how a forwarded link
 * would silently move someone's alerts to another phone. The partner
 * disconnects on /agencia/perfil (or sends /stop from the old chat) first.
 * The guard is in the UPDATE's own WHERE, so two racing /start messages
 * cannot both win. A chat may serve more than one account (someone with two
 * logins); `/stop` clears them all.
 */
export async function linkTelegramChat(userId: number, chatId: string): Promise<LinkOutcome> {
  if (!isChatId(chatId)) return { status: "missing" };
  await db
    .update(users)
    .set({ telegramChatId: chatId })
    .where(and(eq(users.id, userId), isNull(users.telegramChatId)));
  // Read back rather than trust affectedRows: re-linking the same chat changes
  // no row, and whether that counts as "affected" depends on a driver flag.
  const [row] = await db
    .select({ chat: users.telegramChatId, locale: users.locale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return { status: "missing" };
  const locale = row.locale === "en" ? "en" : "es";
  return row.chat === chatId ? { status: "linked", locale } : { status: "other_chat", locale };
}

/** `/stop` in the chat: every account using it stops receiving alerts. Rows cleared. */
export async function unlinkTelegramChat(chatId: string): Promise<number> {
  if (!isChatId(chatId)) return 0;
  const [res] = await db
    .update(users)
    .set({ telegramChatId: null })
    .where(eq(users.telegramChatId, chatId));
  return res.affectedRows;
}

/** "Desconectar" on /agencia/perfil — this user only, whatever the form says. */
export async function clearTelegramForUser(userId: number): Promise<void> {
  await db.update(users).set({ telegramChatId: null }).where(eq(users.id, userId));
}
