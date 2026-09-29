/**
 * Cloudflare Email Sending's limits, as pure code (no `next/*`, no database,
 * no network — `email.ts` imports it and `npm run verify:inbox` drives it).
 *
 * What Cloudflare documents (verified 2026-09-29, beta — it can change):
 *
 * - a **daily sending quota per ACCOUNT**, 200 to start, shared by every
 *   domain, growing on its own with reputation;
 * - **50 recipients** per message (To + CC + BCC together);
 * - **5 MiB** per message including attachments.
 *
 * Two guards, and what each is honest about:
 *
 * 1. `emailLimitError()` refuses a message that could never be accepted, before
 *    the round-trip, with a reason that names the limit.
 * 2. The daily counter is **per server process and per UTC day**. It is a
 *    smoke alarm, not the meter: a restart resets it, and Cloudflare's own day
 *    may roll over at another hour. The dashboard is authoritative. What is
 *    definitive is Cloudflare *refusing* a send (`isQuotaRefusal`) — that alerts
 *    whatever the counter says.
 *
 * When Cloudflare raises the quota, set `EMAIL_DAILY_QUOTA` (hPanel) to match.
 */

export const CLOUDFLARE_MAX_RECIPIENTS = 50;
export const CLOUDFLARE_MAX_MESSAGE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_DAILY_QUOTA = 200;
/** Warn when this share of the day's quota has been used. */
export const WARN_FRACTION = 0.8;

/** `EMAIL_DAILY_QUOTA` when it is a positive integer, else Cloudflare's starting 200. */
export function dailyQuota(raw: string | undefined = process.env.EMAIL_DAILY_QUOTA): number {
  const n = Number.parseInt((raw ?? "").trim(), 10);
  return Number.isFinite(n) && n >= 1 && String(n) === (raw ?? "").trim() ? n : DEFAULT_DAILY_QUOTA;
}

/** Recipients in the API body `emailRequestBody()` builds: `to` plus `cc`. */
export function recipientCount(body: { to?: unknown; cc?: unknown }): number {
  const to = Array.isArray(body.to) ? body.to.length : body.to ? 1 : 0;
  const cc = Array.isArray(body.cc) ? body.cc.length : 0;
  return to + cc;
}

/**
 * Why this body cannot be sent, or `null`. The size is the JSON body's byte
 * length — an upper bound on the message (JSON escaping and base64-free), so a
 * body under the limit is safely under it.
 */
export function emailLimitError(body: Record<string, unknown>): string | null {
  const recipients = recipientCount(body);
  if (recipients > CLOUDFLARE_MAX_RECIPIENTS) {
    return `too many recipients (${recipients}, limit ${CLOUDFLARE_MAX_RECIPIENTS})`;
  }
  const bytes = Buffer.byteLength(JSON.stringify(body), "utf8");
  if (bytes > CLOUDFLARE_MAX_MESSAGE_BYTES) {
    return `message too large (${Math.ceil(bytes / 1024)} KiB, limit ${CLOUDFLARE_MAX_MESSAGE_BYTES / 1024} KiB)`;
  }
  return null;
}

/**
 * Whether a failed send was Cloudflare saying "not today": HTTP 429, or an
 * error message that names a quota or a rate limit. Deliberately loose on the
 * message — the exact code is not documented.
 */
export function isQuotaRefusal(status: number, errors: { message?: string }[] | undefined): boolean {
  if (status === 429) return true;
  return (errors ?? []).some((e) => /quota|rate.?limit|too many (requests|emails)|(daily|sending) (\w+ ){0,2}limit/i.test(e.message ?? ""));
}

export interface QuotaState {
  /** UTC calendar day, `YYYY-MM-DD`. */
  day: string;
  /** Emails Cloudflare accepted (or hard-bounced, which counts too) this day, by this process. */
  sent: number;
  warned: boolean;
  full: boolean;
  refused: boolean;
}

export type QuotaAlert =
  | { level: "warn"; sent: number; quota: number }
  | { level: "full"; sent: number; quota: number }
  | { level: "refused"; sent: number; quota: number };

export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function freshQuotaState(now: Date): QuotaState {
  return { day: utcDay(now), sent: 0, warned: false, full: false, refused: false };
}

function rolled(state: QuotaState, now: Date): QuotaState {
  return state.day === utcDay(now) ? state : freshQuotaState(now);
}

/**
 * One email counted. Returns the next state and, the FIRST time in a day the
 * count reaches 80% and then 100% of `quota`, the alert to raise — never twice.
 */
export function recordSent(
  prev: QuotaState,
  now: Date,
  quota: number,
): { state: QuotaState; alert: QuotaAlert | null } {
  const state = { ...rolled(prev, now) };
  state.sent += 1;
  if (state.sent >= quota && !state.full) {
    state.full = true;
    state.warned = true;
    return { state, alert: { level: "full", sent: state.sent, quota } };
  }
  if (state.sent >= Math.ceil(quota * WARN_FRACTION) && !state.warned && !state.full) {
    state.warned = true;
    return { state, alert: { level: "warn", sent: state.sent, quota } };
  }
  return { state, alert: null };
}

/** Cloudflare refused a send for quota. Alerts once per day, whatever the counter says. */
export function recordRefusal(
  prev: QuotaState,
  now: Date,
  quota: number,
): { state: QuotaState; alert: QuotaAlert | null } {
  const state = { ...rolled(prev, now) };
  if (state.refused) return { state, alert: null };
  state.refused = true;
  return { state, alert: { level: "refused", sent: state.sent, quota } };
}

/** The operator alert, in the operator's Spanish (same as the rest of `crm.ts`). */
export function quotaAlertText(a: QuotaAlert): { title: string; detail: string } {
  if (a.level === "refused") {
    return {
      title: "Cloudflare rechazó un correo: límite diario de envío",
      detail:
        "Cloudflare Email Sending devolvió un rechazo por cuota. Los correos de hoy no salen hasta que se renueve el límite (se ve en el panel de Cloudflare → Email Service → Sending). " +
        "Piden aumento de cuota si es recurrente. Los avisos por Telegram siguen funcionando.",
    };
  }
  if (a.level === "full") {
    return {
      title: "Correo: se alcanzó el límite diario de envío",
      detail: `Este servidor envió ${a.sent} correos hoy (UTC) y el límite configurado es ${a.quota}. Los siguientes pueden ser rechazados por Cloudflare.`,
    };
  }
  return {
    title: "Correo: cerca del límite diario de envío",
    detail: `Este servidor envió ${a.sent} de ${a.quota} correos hoy (UTC). El contador se reinicia con el servidor; el panel de Cloudflare es el dato exacto.`,
  };
}
