/**
 * A request body as text, or null once it passes `max` bytes — read
 * incrementally, so neither a lying nor a missing Content-Length makes the
 * process buffer more than the cap.
 *
 * For the public, unauthenticated endpoints (`/api/leads`, `/api/alertas`,
 * `/api/a`). `req.json()` / `req.text()` buffer the whole body before anything
 * can look at its size, and route handlers have no framework-level limit
 * (only server actions do), so without this one POST of a few hundred MB is
 * that much memory in a process the whole account shares. The webhooks keep
 * their own copies, which also hand back raw bytes for signature checks.
 */
export async function readCappedText(req: Request, max: number): Promise<string | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > max) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
