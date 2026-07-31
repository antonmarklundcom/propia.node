/**
 * In-memory login throttle. loginAction() had nothing between a wrong
 * password and the next attempt — scrypt's cost factor slows a single guess
 * but nothing capped how many guesses an attacker got against one account.
 *
 * Per-process Map, not a DB table: this app runs as a single Node process on
 * shared hosting (no horizontal scaling to split state across), so it's a
 * real defense without a schema migration. It resets on deploy/restart,
 * which is an acceptable trade for a pre-launch site — revisit if the app
 * ever runs multiple instances.
 */
import "server-only";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

interface Entry {
  count: number;
  windowStart: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, Entry>();

// The map is unbounded otherwise: every distinct email ever tried (including
// ones that don't exist) leaves an entry forever. Sweep opportunistically.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, e] of attempts) {
    const stale = (e.lockedUntil ?? 0) < now && now - e.windowStart > WINDOW_MS;
    if (stale) attempts.delete(key);
  }
}

/** Checked before verifying a password. True if this email is locked out. */
export function isLoginLocked(email: string): boolean {
  const now = Date.now();
  sweep(now);
  const e = attempts.get(email);
  return e?.lockedUntil != null && e.lockedUntil > now;
}

/** Call after a failed password check. */
export function recordLoginFailure(email: string): void {
  const now = Date.now();
  const e = attempts.get(email);
  if (!e || now - e.windowStart > WINDOW_MS) {
    attempts.set(email, { count: 1, windowStart: now, lockedUntil: null });
    return;
  }
  e.count += 1;
  if (e.count >= MAX_ATTEMPTS) {
    e.lockedUntil = now + LOCKOUT_MS;
  }
}

/** Call after a successful login — a legitimate owner shouldn't stay throttled. */
export function clearLoginAttempts(email: string): void {
  attempts.delete(email);
}
