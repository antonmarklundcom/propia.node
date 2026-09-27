/**
 * Server errors → the operator's phone (Telegram) and inbox, from Next's
 * `onRequestError` hook (`instrumentation.ts`). Before this, a page that
 * threw was invisible until a visitor complained.
 *
 * Throttled in memory, because the errors that matter come in bursts (a pool
 * that is out of connections fails every request at once):
 * - the same error on the same kind of page alerts **once an hour**, with a
 *   count of how often it repeated in the next alert;
 * - at most `MAX_PER_HOUR` alerts an hour in total, then one "muted" line.
 * A restart forgets the throttle — at worst one repeat alert after a deploy.
 *
 * Never throws, never awaits anything a request waits on (the hook runs after
 * the response has failed), and sends nothing when no channel is configured.
 */
import "server-only";
import { alertOperatorSystem } from "@/lib/crm";

const HOUR = 60 * 60 * 1000;
const MAX_PER_HOUR = 10;

/** key → when it last alerted, and how many repeats were swallowed since. */
const seen = new Map<string, { at: number; repeats: number }>();
let windowStart = 0;
let sentInWindow = 0;
let mutedNoticeSent = false;

/** Digits and hex ids out of a path or message, so one bug is one key. */
export function errorKey(message: string, path: string): string {
  const norm = (s: string) =>
    s
      .replace(/[0-9a-f]{16,}/gi, ":id")
      .replace(/\d+/g, ":n")
      .slice(0, 160);
  return `${norm(message)}|${norm(path.split("?")[0])}`;
}

/** Errors Next uses for control flow, which must never page anyone. */
function isControlFlow(err: unknown): boolean {
  const digest = (err as { digest?: unknown })?.digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") || digest === "NEXT_NOT_FOUND")
  );
}

export interface ErrorContext {
  path: string;
  method: string;
  host: string | null;
  /** Next's routeType: render, route, action, middleware. */
  routeType?: string;
}

/**
 * Decide whether this error alerts, and with what text. Pure apart from the
 * throttle state; exported for the throttle check in `verify:telegram`-style
 * tests.
 */
export function planErrorAlert(err: unknown, ctx: ErrorContext, now = Date.now()): { title: string; detail: string } | null {
  if (isControlFlow(err)) return null;
  const e = err instanceof Error ? err : new Error(String(err));
  const key = errorKey(e.message, ctx.path);

  if (now - windowStart >= HOUR) {
    windowStart = now;
    sentInWindow = 0;
    mutedNoticeSent = false;
  }

  const prev = seen.get(key);
  if (prev && now - prev.at < HOUR) {
    prev.repeats += 1;
    return null;
  }
  if (sentInWindow >= MAX_PER_HOUR) {
    if (mutedNoticeSent) return null;
    mutedNoticeSent = true;
    return {
      title: "🔴 Muchos errores en el servidor",
      detail: `Se enviaron ${MAX_PER_HOUR} avisos esta hora; los demás se silencian hasta la próxima.`,
    };
  }

  sentInWindow += 1;
  seen.set(key, { at: now, repeats: 0 });
  if (seen.size > 500) seen.delete(seen.keys().next().value as string);

  const digest = (err as { digest?: unknown })?.digest;
  const lines = [
    `${ctx.method} ${ctx.host ?? ""}${ctx.path}`,
    `${e.name}: ${e.message}`.slice(0, 400),
    ctx.routeType ? `tipo: ${ctx.routeType}` : null,
    typeof digest === "string" ? `digest: ${digest}` : null,
    prev?.repeats ? `(se repitió ${prev.repeats} veces en la última hora)` : null,
    "El mismo error vuelve a avisar como mucho una vez por hora.",
  ].filter((l): l is string => Boolean(l));
  return { title: "🔴 Error en el servidor", detail: lines.join("\n") };
}

export async function reportServerError(err: unknown, ctx: ErrorContext): Promise<void> {
  try {
    const plan = planErrorAlert(err, ctx);
    if (plan) await alertOperatorSystem(plan);
  } catch {
    /* an alert that failed must never become a second error */
  }
}

/** Test hook: forget the throttle. */
export function resetErrorThrottle(): void {
  seen.clear();
  windowStart = 0;
  sentInWindow = 0;
  mutedNoticeSent = false;
}
