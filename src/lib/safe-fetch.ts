/**
 * Fetching a URL a *user* supplied, safely.
 *
 * This is the dangerous half of "paste your listing link". The server makes the
 * request, so without a guard a user could point it at
 * `http://127.0.0.1:3306`, `http://169.254.169.254/latest/meta-data/`
 * (cloud credentials) or any host inside the hosting network, and read the
 * response through our own preview UI. That is SSRF, and it is the reason this
 * module exists rather than a bare `fetch()` at the call site.
 *
 * What it enforces:
 *  - http/https only (no file:, no gopher:, no data:)
 *  - the resolved IP must be public — checked for the original host *and*
 *    after every redirect hop, because a public URL can 302 to 127.0.0.1
 *  - a byte cap, so a multi-gigabyte response cannot exhaust the box
 *  - a timeout, so a hanging server cannot hold a request handler open
 *
 * DNS resolution happens here explicitly: checking the hostname string is not
 * enough, since `localtest.me` and countless other names resolve to loopback.
 */
import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const MAX_BYTES = 2 * 1024 * 1024; // a listing page; not a download
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 4;

export type FetchRejection =
  | "bad_url"
  | "blocked_host"
  | "too_many_redirects"
  | "too_large"
  | "not_html"
  | "unreachable"
  | "http_error";

export class UnsafeUrlError extends Error {
  constructor(readonly reason: FetchRejection) {
    super(`refused to fetch: ${reason}`);
    this.name = "UnsafeUrlError";
  }
}

/**
 * Private, loopback, link-local and other non-routable ranges. Written out
 * rather than pulled from a package because the list is short, stable, and
 * worth being able to read in review.
 */
function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // unparseable → treat as unsafe
  }
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true; // this-host, private, loopback
  if (a === 169 && b === 254) return true; // link-local (cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a === 192 && b === 0) return true; // protocol assignments / test nets
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true; // unspecified, loopback
  if (v.startsWith("fe80")) return true; // link-local
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique local
  // IPv4-mapped (::ffff:127.0.0.1) — check the embedded address.
  const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

async function hostResolvesPublic(hostname: string): Promise<boolean> {
  const literal = isIP(hostname);
  if (literal === 4) return !isPrivateIPv4(hostname);
  if (literal === 6) return !isPrivateIPv6(hostname);

  try {
    const results = await lookup(hostname, { all: true, verbatim: true });
    if (results.length === 0) return false;
    // EVERY address must be public: a name with one public and one loopback
    // record would otherwise be a coin flip.
    return results.every((r) =>
      r.family === 6 ? !isPrivateIPv6(r.address) : !isPrivateIPv4(r.address),
    );
  } catch {
    return false;
  }
}

/** Parse + validate, without fetching. Exported so the UI can pre-check. */
export async function assertFetchableUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new UnsafeUrlError("bad_url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("bad_url");
  }
  if (!(await hostResolvesPublic(url.hostname))) {
    throw new UnsafeUrlError("blocked_host");
  }
  return url;
}

export interface FetchedPage {
  url: string;
  html: string;
}

/**
 * Fetch an HTML page from a user-supplied URL.
 *
 * Redirects are followed manually (`redirect: "manual"`) so each hop's host can
 * be re-validated — `fetch`'s automatic following would happily land on
 * localhost after a 302 that we never saw.
 */
export async function fetchUserUrl(raw: string): Promise<FetchedPage> {
  let url = await assertFetchableUrl(raw);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          // Honest about who we are; some sites 403 an unidentified client.
          "user-agent": "propia-listing-import/1.0 (+https://propia.com.py)",
          accept: "text/html,application/xhtml+xml",
        },
      });
    } catch {
      throw new UnsafeUrlError("unreachable");
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new UnsafeUrlError("http_error");
      url = await assertFetchableUrl(new URL(location, url).toString());
      continue;
    }

    if (!res.ok) throw new UnsafeUrlError("http_error");

    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml/i.test(type)) {
      throw new UnsafeUrlError("not_html");
    }

    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) throw new UnsafeUrlError("too_large");

    // Content-Length can lie or be absent, so cap while reading too.
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new UnsafeUrlError("too_large");

    return {
      url: url.toString(),
      html: new TextDecoder("utf-8").decode(buf),
    };
  }

  throw new UnsafeUrlError("too_many_redirects");
}
