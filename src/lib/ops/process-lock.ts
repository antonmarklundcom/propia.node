/**
 * A lock every Node process of this account can see: a file created with
 * O_EXCL in the OS temp dir (per account on Hostinger), so of N copies of the
 * app that try at the same millisecond exactly one wins. Module state cannot
 * do that — each copy has its own (docs/hosting-process-cap.md: the launcher
 * starts copies in pairs 3 ms apart).
 *
 * - `tryOnce(name)`: the first caller ever (until the temp dir is cleared)
 *   gets `true`; everyone after gets `false`. For "once per build".
 * - `withLock(name, staleMs, fn)`: run `fn` only if no other process holds
 *   `name`; a lock older than `staleMs` (a process killed mid-run) is taken
 *   over. Returns `null` when someone else holds it.
 *
 * Any filesystem error counts as "not acquired": the cost of a skipped check
 * is a missed alert, the cost of a double one is processes against the cap.
 */
import "server-only";
import { closeSync, openSync, rmSync, statSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function lockPath(name: string): string {
  return join(tmpdir(), `portal-lock-${name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`);
}

function create(path: string): boolean {
  try {
    const fd = openSync(path, "wx");
    try {
      writeSync(fd, `${process.pid} ${new Date().toISOString()}\n`);
    } finally {
      closeSync(fd);
    }
    return true;
  } catch {
    return false;
  }
}

export function tryOnce(name: string): boolean {
  return create(lockPath(name));
}

export async function withLock<T>(name: string, staleMs: number, fn: () => Promise<T>): Promise<T | null> {
  const path = lockPath(name);
  if (!create(path)) {
    try {
      if (Date.now() - statSync(path).mtimeMs < staleMs) return null;
      rmSync(path, { force: true });
    } catch {
      return null;
    }
    if (!create(path)) return null;
  }
  try {
    return await fn();
  } finally {
    rmSync(path, { force: true });
  }
}
