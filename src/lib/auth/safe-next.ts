/**
 * Only same-origin relative paths are honored as post-login targets.
 *
 * `//evil.com` is the obvious protocol-relative case; `/\evil.com` is the one
 * that used to get through (audit F35), because browsers normalise a backslash
 * to a forward slash in the authority position and follow it off-site. Control
 * characters are rejected for the same reason — a stripped newline or tab can
 * re-form into `//` after the check has already passed.
 */
export function safeNext(next: string): string | null {
  if (!next.startsWith("/")) return null;
  if (/^\/[/\\]/.test(next)) return null;
  if (/[\u0000-\u001f\u007f]/.test(next)) return null;
  return next;
}

