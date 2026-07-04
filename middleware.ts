import { NextRequest, NextResponse } from "next/server";
import { resolveVertical } from "@/config/verticals";

/**
 * Host-based vertical routing (ARCHITECTURE.md §2.8).
 * Resolves the Host header to a vertical and injects it into the request
 * context; every query and copy string downstream flows from that one value.
 */
export function middleware(req: NextRequest) {
  const vertical = resolveVertical(req.headers.get("host"));
  const headers = new Headers(req.headers);
  headers.set("x-vertical", vertical.key);
  headers.set("x-locale", vertical.locale);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip static assets and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
