/**
 * Which forwarding headers may be believed (docs/hosting-process-cap.md).
 *
 * Today Hostinger's LiteSpeed sits in front of the Node process and the Host
 * header is the visitor's. The process-cap plan puts a Cloudflare Worker
 * (`workers/host-router/`) in front of every door instead: it sends every
 * request to ONE origin hostname, so Hostinger's launcher sees one virtual
 * host per app, and carries the door the visitor typed in `x-forwarded-host`
 * and their IP in `x-client-ip`. Anyone can send those headers, so the Worker
 * also sends `x-origin-auth: <ORIGIN_PROXY_SECRET>`, and this module is the
 * one place that decides whether a request carries it.
 *
 * - `ORIGIN_PROXY_SECRET` unset (or shorter than 16 characters): nothing
 *   changes — `x-forwarded-host` is read as it always was, `x-client-ip` is
 *   ignored. This is the state until the Worker is live.
 * - Set: `x-forwarded-host` and `x-client-ip` count only on a request whose
 *   `x-origin-auth` matches; any other request is read by its own Host
 *   header and its proxy's last `x-forwarded-for` hop.
 *
 * Pure and edge-safe (middleware reads it): no Node crypto, so the comparison
 * is a hand-rolled constant-time loop. `process.env` is the runtime
 * environment in middleware too on a self-hosted `next start`.
 */

type HeaderBag = { get(name: string): string | null };

const MIN_SECRET_LENGTH = 16;

export function proxySecret(): string | null {
  const s = process.env.ORIGIN_PROXY_SECRET?.trim();
  return s && s.length >= MIN_SECRET_LENGTH ? s : null;
}

function sameString(a: string, b: string): boolean {
  // Length is not secret-dependent here (the secret's length is fixed), and
  // the loop always walks the longer string so timing says nothing else.
  const n = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0);
  return diff === 0;
}

/** True when the request came through our own Worker. */
export function fromTrustedProxy(h: HeaderBag): boolean {
  const secret = proxySecret();
  if (!secret) return false;
  const sent = h.get("x-origin-auth");
  return sent != null && sameString(sent.trim(), secret);
}

/**
 * Whether `x-forwarded-host` may be read on this request: always while no
 * secret is configured (today's behaviour), and only from the Worker once one
 * is.
 */
export function mayReadForwardedHost(h: HeaderBag): boolean {
  return proxySecret() === null || fromTrustedProxy(h);
}
