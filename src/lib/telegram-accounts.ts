/**
 * `users.telegram_chat_id` — the only module that writes it (plan-agency
 * batch 4). Linked by the bot's webhook after a user opens their own signed
 * start link (`src/lib/telegram.ts`), cleared by the user on /agencia/perfil
 * or by `/stop` in the chat.
 */
import "server-only";
import { eq } from "drizzle-orm";
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

/**
 * Tie `chatId` to the user a verified start token named. False when that user
 * no longer exists. A chat may serve more than one account (someone with two
 * logins); `/stop` clears them all.
 */
export async function linkTelegramChat(userId: number, chatId: string): Promise<boolean> {
  if (!isChatId(chatId)) return false;
  const [res] = await db
    .update(users)
    .set({ telegramChatId: chatId })
    .where(eq(users.id, userId));
  return res.affectedRows > 0;
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
