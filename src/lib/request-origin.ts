/**
 * The origin to paste into WhatsApp — taken from the request, not from
 * siteOrigin().
 *
 * siteOrigin() answers "which domain owns this page for SEO" and falls back to
 * PRIMARY_ORIGIN (= CANONICAL_HOST) for any host that is not an enabled
 * vertical — including preview deploys and *.hostingersite.com, which is not
 * where the founder is actually looking (CLAUDE.md, "Domains"). An invite link
 * has to open in a browser, so it is built from the request's own host.
 */
import "server-only";
import { headers } from "next/headers";
import { visitorHostFrom } from "./host";

export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = visitorHostFrom(h);
  if (!host) return "";
  const proto =
    (h.get("x-forwarded-proto") ?? "").split(",")[0].trim() ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}
