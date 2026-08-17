import { NextRequest, NextResponse } from "next/server";
import { resolveVertical } from "@/config/verticals";
import { bareHostFrom } from "@/lib/host";

/**
 * Host-based vertical routing (ARCHITECTURE.md §2.8).
 * Resolves the Host header to a vertical and injects it into the request
 * context; every query and copy string downstream flows from that one value.
 * The host is read via the same helper origin.ts uses (x-forwarded-host
 * first), so brand and canonical can never split-brain (audit F31).
 */
export function middleware(req: NextRequest) {
  const vertical = resolveVertical(bareHostFrom(req.headers));
  const headers = new Headers(req.headers);
  headers.set("x-vertical", vertical.key);
  headers.set("x-locale", vertical.locale);
  // Server components can't read the pathname (no usePathname outside client
  // components), and the root layout needs it to keep the pre-launch notice off
  // /admin and /agencia. Carrying it as a header keeps that decision on the
  // server — a client-side check would render the strip and then hide it.
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
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
