/**
 * The text of every partner Telegram message, in the partner's language —
 * pure (no database, no `next/*`), so `npm run verify:telegram` checks it and
 * the webhook route picks its reply copy here without pulling in a query.
 *
 * **Never buyer data**: a message is what happened, at most the listing's
 * title, and the panel link. Nothing here takes a name, phone, email or
 * message text as an argument.
 */
import type { Dictionary, Locale } from "@/i18n";
import { enTelegram } from "@/i18n/en-telegram";
import { esTelegram } from "@/i18n/es-telegram";

export type TelegramCopy = Dictionary["telegram"];

const COPY: Record<Locale, TelegramCopy> = { es: esTelegram, en: enTelegram };

/** The Telegram copy for a locale; Spanish for anything unknown. */
export function telegramCopy(locale: string | null | undefined): TelegramCopy {
  return locale === "en" ? COPY.en : COPY.es;
}

/** The listing title as a reader of `locale` sees it: English when translated, else Spanish. */
export function titleIn(
  locale: Locale,
  t: { title: string; titleEn: string | null } | null | undefined,
): string | null {
  if (!t) return null;
  return locale === "en" ? (t.titleEn ?? t.title) : t.title;
}

function compose(locale: Locale, head: string, title: string | null, url: string): string {
  const t = telegramCopy(locale).alert;
  return [head, title ? t.listing(title) : null, t.open(url)]
    .filter((l): l is string => Boolean(l))
    .join("\n");
}

/** The share-notice text for one chat. Pure; `npm run verify:telegram` checks it. */
export function shareText(p: { locale: Locale; count: number; title: string | null; url: string }): string {
  return compose(p.locale, telegramCopy(p.locale).alert.shared(p.count), p.title, p.url);
}

/** The buyer-replied text for one chat. */
export function emailReplyText(p: { locale: Locale; title: string | null; url: string }): string {
  return compose(p.locale, telegramCopy(p.locale).alert.emailReply, p.title, p.url);
}

/** The reminder text for one chat: `count` pending shares, the title only when there is exactly one. */
export function reminderText(p: {
  locale: Locale;
  count: number;
  hours: number;
  title: string | null;
  url: string;
}): string {
  return compose(
    p.locale,
    telegramCopy(p.locale).alert.reminder(p.count, p.hours),
    p.count === 1 ? p.title : null,
    p.url,
  );
}
