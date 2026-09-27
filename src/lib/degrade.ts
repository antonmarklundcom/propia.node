/**
 * Degrade a non-essential section instead of failing the page, when — and
 * only when — the database is saturated rather than broken.
 *
 * Why this exists: the pool in `src/db/index.ts` is deliberately bounded (6
 * connections, 24 queued) so a request that cannot get a connection fails in
 * milliseconds instead of hanging until the account's process cap fills (the
 * 503 spiral, PLAN.md). The price is that a burst of cold renders right after
 * a deploy can be told "Queue limit reached" — and before this module one
 * home rail hitting that failed the whole home with a 500
 * (fable/KNOWN-ISSUES.md, 2026-09-27).
 *
 * Three rules, each one there so a real outage is never dressed up as a page:
 *
 * 1. **Only pool pressure degrades.** A queue-limit rejection, a connect or
 *    query timeout, a dropped connection or MySQL's own connection cap. A SQL
 *    error — a column the deployed code selects but the database lacks, the
 *    one CLAUDE.md warns 500s every page — still throws.
 * 2. **If every section failed, the page fails.** That is an outage, not
 *    pressure, and an empty 200 home is worse than a 500: a crawler retries a
 *    5xx and indexes a 200.
 * 3. **A degraded result is never cached.** `loadSections()` throws a
 *    `PartialResult` from inside the `unstable_cache` callback — a callback
 *    that throws stores nothing — and the caller unwraps it outside with
 *    `acceptPartial()`. The next request tries again.
 *
 * Pure: no `next/*`, no drizzle, safe to import anywhere.
 */

/** Error codes mysql2 / MySQL use for "busy or unreachable right now". */
const PRESSURE_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "PROTOCOL_CONNECTION_LOST",
  "PROTOCOL_SEQUENCE_TIMEOUT",
  "ER_CON_COUNT_ERROR",
  "ER_TOO_MANY_USER_CONNECTIONS",
  "ER_USER_LIMIT_REACHED",
]);

function* causes(err: unknown): Generator<{ message?: unknown; code?: unknown }> {
  let e: unknown = err;
  // drizzle wraps the driver error as `cause`; five levels is generous.
  for (let depth = 0; depth < 5 && e && typeof e === "object"; depth++) {
    yield e as { message?: unknown; code?: unknown };
    e = (e as { cause?: unknown }).cause;
  }
}

/** mysql2's immediate rejection when the pool's queue is full. */
function isQueueRejection(err: unknown): boolean {
  for (const e of causes(err)) {
    if (typeof e.message === "string" && e.message.startsWith("Queue limit reached")) return true;
  }
  return false;
}

/** True for a pool-queue rejection, a timeout or a connection cap — not for a SQL error. */
export function isPoolPressureError(err: unknown): boolean {
  if (isQueueRejection(err)) return true;
  for (const e of causes(err)) {
    if (typeof e.code === "string" && PRESSURE_CODES.has(e.code)) return true;
  }
  return false;
}

/**
 * A queue rejection costs nothing and says "not this millisecond", so a
 * section gets one more try after a short, jittered pause. Without it, a
 * render that met a full queue burned through all its sections in the same
 * few milliseconds and — every section failed — answered 500 for what was a
 * momentary burst. Timeouts are not retried: they already took seconds, and a
 * request must fail in seconds (the 503 spiral).
 */
const QUEUE_RETRY_MS = 150;

async function retryOnceOnQueueRejection<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (err) {
    if (!isQueueRejection(err)) throw err;
    await new Promise((resolve) => setTimeout(resolve, QUEUE_RETRY_MS + Math.random() * QUEUE_RETRY_MS));
    return load();
  }
}

/**
 * The driver's own reason, never drizzle's wrapper: that message carries the
 * query and its parameters, and a log line must not.
 */
function reasonOf(err: unknown): string {
  let last: { message?: unknown; code?: unknown } | null = null;
  for (const e of causes(err)) last = e;
  if (!last) return String(err).slice(0, 80);
  if (typeof last.code === "string") return last.code;
  return typeof last.message === "string" ? last.message.split("\n")[0].slice(0, 80) : "unknown";
}

/** One line per degraded section. Names the section and the driver's reason, nothing else. */
export function logDegraded(section: string, err: unknown): void {
  console.warn(`[degraded] ${section}: ${reasonOf(err)}`);
}

/**
 * Thrown from inside a cached loader when some sections degraded, so
 * `unstable_cache` stores nothing; carries what did load for this request.
 */
export class PartialResult<T> extends Error {
  declare readonly value: T;

  constructor(
    value: T,
    readonly degraded: readonly string[],
  ) {
    super(`partial result, degraded: ${degraded.join(", ")}`);
    this.name = "PartialResult";
    // Not enumerable: when this is thrown while Next refreshes a stale entry,
    // Next logs the error (and keeps serving the stale value), and a logged
    // error prints its own enumerable fields — the whole payload, otherwise.
    Object.defineProperty(this, "value", { value, enumerable: false });
  }
}

/** Unwraps a `PartialResult`; rethrows anything else. `degraded` is true when a section fell back. */
export async function acceptPartial<T>(read: Promise<T>): Promise<{ value: T; degraded: boolean }> {
  try {
    return { value: await read, degraded: false };
  } catch (err) {
    if (err instanceof PartialResult) return { value: err.value as T, degraded: true };
    throw err;
  }
}

/**
 * `Promise.allSettled` with at most `limit` tasks running at once. One page
 * render firing every query it needs at the same moment is what let four
 * renders fill a 6 + 24 pool; capped, a render holds at most `limit`
 * connections and the rest of the burst gets a turn.
 */
export async function settleLimited<T>(
  tasks: readonly (() => Promise<T>)[],
  limit: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await tasks[i]() };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, tasks.length)) }, worker));
  return results;
}

/**
 * Loads named sections with bounded concurrency. A section rejected by a full
 * pool queue is retried once after a short pause; one that still fails with
 * pool pressure takes its `fallback` value and logs one line; then this throws
 * a `PartialResult` so a surrounding `unstable_cache` stores nothing. Any other
 * error, or every section failing, is rethrown as-is (see the module header).
 */
export async function loadSections<T extends Record<string, unknown>>(
  label: string,
  loaders: { [K in keyof T]: () => Promise<T[K]> },
  fallback: T,
  concurrency: number,
): Promise<T> {
  const keys = Object.keys(loaders) as (keyof T & string)[];
  const settled = await settleLimited<unknown>(
    keys.map((k) => () => retryOnceOnQueueRejection(loaders[k])),
    concurrency,
  );
  const out: T = { ...fallback };
  const failed: { key: string; reason: unknown }[] = [];
  settled.forEach((r, i) => {
    const key = keys[i];
    if (r.status === "fulfilled") out[key] = r.value as T[typeof key];
    else failed.push({ key, reason: r.reason });
  });
  if (failed.length === 0) return out;

  const hard = failed.find((f) => !isPoolPressureError(f.reason));
  if (hard) throw hard.reason;
  if (failed.length === keys.length) throw failed[0].reason;

  for (const f of failed) logDegraded(`${label}:${f.key}`, f.reason);
  throw new PartialResult(out, failed.map((f) => f.key));
}

/**
 * A single non-essential read that falls back under pool pressure, for a
 * section outside any cache (a count in the chrome, an aside). Other errors
 * still throw.
 */
export async function orDegraded<T>(section: string, read: Promise<T>, fallback: T): Promise<T> {
  try {
    return await read;
  } catch (err) {
    if (!isPoolPressureError(err)) throw err;
    logDegraded(section, err);
    return fallback;
  }
}
