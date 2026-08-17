import { headers } from "next/headers";
import { VERTICALS, resolveVertical, type VerticalConfig } from "@/config/verticals";

/**
 * Read the vertical the middleware resolved for this request.
 *
 * The fallback is `resolveVertical(null)` — the CANONICAL_HOST entry, the host
 * this deployment actually answers to, never a disabled feeder domain. A
 * request that somehow reaches a page without the middleware header (a route
 * outside the matcher, a direct render in a test) must not be described by a
 * vertical that serves no traffic. Going through `resolveVertical` also keeps
 * this in step with the middleware's own no-host fallback.
 */
export async function currentVertical(): Promise<VerticalConfig> {
  const h = await headers();
  const key = h.get("x-vertical");
  const v = key
    ? Object.values(VERTICALS).find((v) => v.key === key)
    : undefined;
  return v ?? resolveVertical(null);
}
