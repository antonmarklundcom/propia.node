import { headers } from "next/headers";
import { VERTICALS, resolveVertical, type VerticalConfig } from "@/config/verticals";

/**
 * Read the vertical the middleware resolved for this request.
 *
 * The fallback is `resolveVertical(null)` — the CANONICAL_HOST entry, the host
 * this deployment actually answers to — not `propia.com.py`, which is a
 * disabled entry for a domain the founder does not own (CLAUDE.md). Falling
 * back there meant a request that somehow reached a page without the middleware
 * header (a route outside the matcher, a direct render in a test) was described
 * by a vertical that serves no traffic. Going through `resolveVertical` also
 * keeps this in step with the middleware's own no-host fallback.
 */
export async function currentVertical(): Promise<VerticalConfig> {
  const h = await headers();
  const key = h.get("x-vertical");
  const v = key
    ? Object.values(VERTICALS).find((v) => v.key === key)
    : undefined;
  return v ?? resolveVertical(null);
}
