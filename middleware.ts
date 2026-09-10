import { NextRequest, NextResponse } from "next/server";
import {
  MARKETPLACE_PRIMARY_HOST,
  resolveVertical,
} from "@/config/verticals";
import { MARKETPLACE_PATH_ROOTS } from "@/config/site-nav";
import { marketplacePagesEnabled } from "@/design/sections";
import { bareHostFrom } from "@/lib/host";
import { cspHeader, newNonce } from "@/lib/csp";

/**
 * Host-based vertical routing (ARCHITECTURE.md §2.8).
 * Resolves the Host header to a vertical and injects it into the request
 * context; every query and copy string downstream flows from that one value.
 * The host is read via the same helper origin.ts uses (x-forwarded-host
 * first), so brand and canonical can never split-brain (audit F31).
 */
export function middleware(req: NextRequest) {
  const vertical = resolveVertical(bareHostFrom(req.headers));

  /**
   * A door that serves no marketplace page type sends those requests to the
   * Spanish marketplace primary (the directory door — D1, plan §5.2 (f)).
   *
   * **Here rather than in `next.config.ts`'s `redirects()`** even though that
   * is where the rental family's 301 map lives: this rule is per *door*, not
   * per host string, and the middleware is the one place that has already
   * resolved the Host header to a vertical. So it reads the same
   * `marketplacePagesEnabled()` predicate the sitemap reads, and a door added
   * to the directory family later is covered without a second list of hosts to
   * keep in step. A host-scoped `has` rule would also have to be repeated for
   * the `www.` form of every such host.
   *
   * **Absolute, and 308.** A relative redirect would resolve against this same
   * host and loop. 308 keeps the method and says "permanent" — these paths are
   * never coming back to this door.
   */
  if (!marketplacePagesEnabled(vertical.key)) {
    const root = req.nextUrl.pathname.split("/")[1] ?? "";
    if (MARKETPLACE_PATH_ROOTS.includes(root)) {
      const target = new URL(
        `${req.nextUrl.pathname}${req.nextUrl.search}`,
        `https://${MARKETPLACE_PRIMARY_HOST}`,
      );
      return NextResponse.redirect(target, 308);
    }
  }

  const headers = new Headers(req.headers);
  headers.set("x-vertical", vertical.key);
  headers.set("x-locale", vertical.locale);
  // Server components can't read the pathname (no usePathname outside client
  // components), and the root layout needs it to keep the pre-launch notice off
  // /admin and /agencia. Carrying it as a header keeps that decision on the
  // server — a client-side check would render the strip and then hide it.
  headers.set("x-pathname", req.nextUrl.pathname);

  // CSP (audit F20). The nonce goes on the *request* headers as well as the
  // response: that is how Next finds it and stamps its own inline hydration
  // scripts, and how <JsonLd> reads it back through next/headers. The other
  // security headers are static and live in next.config.ts.
  const nonce = newNonce();
  const csp = cspHeader(nonce, process.env.NODE_ENV !== "production");
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set("content-security-policy", csp);
  return res;
}

export const config = {
  // Skip static assets and Next internals — including everything under
  // public/ (images, fonts) and the icon/sitemap files, which don't consume
  // the vertical headers (audit F51). sitemap.xml and robots.txt read the
  // Host header directly via origin.ts, not the middleware's x-vertical.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|robots\\.txt|sitemap\\.xml|img/|fonts/).*)",
  ],
};
