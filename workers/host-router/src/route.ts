/**
 * The host router's decision, pure (no Cloudflare types) so the app's
 * `npm run verify:proxy` can check it without wrangler.
 *
 * Every door's hostname is routed to this Worker; it sends the request on to
 * ONE origin hostname (`ORIGIN_HOST`, the Node app's main domain on Hostinger),
 * so Hostinger's launcher sees one virtual host for the whole app instead of
 * one per parked domain (docs/hosting-process-cap.md). The door the visitor
 * typed travels in `x-forwarded-host`, their IP in `x-client-ip`, and the
 * shared secret in `x-origin-auth` — the app believes the first two only with
 * the third (`src/lib/proxy-trust.ts`).
 */

export interface RouterConfig {
  /** The one hostname Hostinger serves the app on, e.g. realestateinparaguay.com. */
  originHost: string;
  /** Same value as ORIGIN_PROXY_SECRET in hPanel. */
  secret: string;
}

export type RoutePlan =
  | { kind: "redirect"; status: 308; location: string }
  | { kind: "refuse"; status: number; body: string }
  | { kind: "forward"; url: string; headers: Headers; cacheable: boolean };

/**
 * Whole-host redirects answered here, without touching the origin. Mirrors
 * the `landDuplicateRedirect` rule in next.config.ts (which stays, for the day
 * a request reaches Hostinger directly).
 */
export const HOST_REDIRECTS: Readonly<Record<string, string>> = {
  "landforsaleinparaguay.com": "landforsaleparaguay.com",
};

/** Headers a client must never be able to hand the origin through us. */
const STRIPPED = ["host", "x-origin-auth", "x-client-ip", "x-forwarded-host", "x-forwarded-proto"];

export const MIN_SECRET_LENGTH = 16;

export function planRoute(
  requestUrl: string,
  requestHeaders: Headers,
  clientIp: string | null,
  cfg: RouterConfig,
): RoutePlan {
  if (!cfg.secret || cfg.secret.length < MIN_SECRET_LENGTH || !cfg.originHost) {
    return { kind: "refuse", status: 503, body: "host-router: ORIGIN_HOST / ORIGIN_PROXY_SECRET not configured" };
  }
  // Our own forwarded request coming back in: the origin hostname has this
  // Worker on a route too. Refuse loudly instead of looping.
  if (requestHeaders.get("x-origin-auth") === cfg.secret) {
    return { kind: "refuse", status: 508, body: "host-router: loop — do not route ORIGIN_HOST to this Worker" };
  }

  const url = new URL(requestUrl);
  const host = url.hostname.toLowerCase();
  const bare = host.replace(/^www\./, "");
  if (bare === cfg.originHost.toLowerCase()) {
    return { kind: "refuse", status: 508, body: "host-router: ORIGIN_HOST must not be routed to this Worker" };
  }

  const redirectTo = HOST_REDIRECTS[bare];
  if (redirectTo) {
    return { kind: "redirect", status: 308, location: `https://${redirectTo}${url.pathname}${url.search}` };
  }

  const headers = new Headers(requestHeaders);
  for (const name of STRIPPED) headers.delete(name);
  headers.set("x-forwarded-host", host);
  headers.set("x-forwarded-proto", "https");
  headers.set("x-origin-auth", cfg.secret);
  if (clientIp) headers.set("x-client-ip", clientIp);

  return {
    kind: "forward",
    url: `https://${cfg.originHost}${url.pathname}${url.search}`,
    headers,
    // Content-hashed build files are identical on every door, so Cloudflare
    // may cache them under the origin URL. NOTHING else: robots.txt, the
    // sitemap, the manifest and every page differ per door, and the cache key
    // is the origin URL, which does not say which door asked.
    cacheable: url.pathname.startsWith("/_next/static/"),
  };
}
