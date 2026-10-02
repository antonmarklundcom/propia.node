/**
 * The ONE way a request's host is read (audit F31). middleware.ts used to
 * read `host` while origin.ts preferred `x-forwarded-host` (and only it
 * split proxy comma-lists) — when the two disagreed behind Hostinger's
 * proxy, the page rendered one brand while emitting the other's canonical.
 *
 * Pure and edge-safe: callable from middleware (web Headers) and from
 * next/headers' ReadonlyHeaders alike.
 *
 * `x-forwarded-host` is only believed when `src/lib/proxy-trust.ts` says so:
 * always while `ORIGIN_PROXY_SECRET` is unset, and only from the Cloudflare
 * Worker once it is (docs/hosting-process-cap.md).
 */
import { mayReadForwardedHost } from "./proxy-trust";

/**
 * The host the visitor typed, as sent (case, `www.` and port kept), first
 * entry of a proxy list. For links that must open in a browser
 * (`request-origin.ts`); everything else wants `rawHostFrom`.
 */
export function visitorHostFrom(h: {
  get(name: string): string | null;
}): string | null {
  const forwarded = mayReadForwardedHost(h) ? h.get("x-forwarded-host") : null;
  const raw = (forwarded ?? h.get("host") ?? "").split(",")[0].trim();
  return raw || null;
}

/** Lowercased, www-stripped first host of the chain, with port kept. */
export function rawHostFrom(h: {
  get(name: string): string | null;
}): string | null {
  const raw = (visitorHostFrom(h) ?? "").toLowerCase().replace(/^www\./, "");
  return raw || null;
}

/** Port-free form — the shape VERTICALS is keyed by. */
export function bareHostFrom(h: {
  get(name: string): string | null;
}): string | null {
  return rawHostFrom(h)?.split(":")[0] ?? null;
}
