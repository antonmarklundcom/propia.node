import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { clientIpFrom } from "@/lib/client-ip";
import { allowRequest } from "@/lib/rate-limit";
import { readCappedText } from "@/lib/request-body";
import { rawHostFrom } from "@/lib/host";
import { currentVertical } from "@/lib/vertical-context";
import { emailLinkOrigin } from "@/lib/origin";
import { isEmailConfigured, isPlausibleEmail } from "@/lib/email";
import { normalizeCriteria } from "@/lib/saved-search-criteria";
import {
  alertsPageUrl,
  describeSearch,
  emailSearchConfirmation,
  placeNames,
  saveSearch,
} from "@/lib/saved-searches";

/**
 * POST /api/alertas — save a search and mail the confirmation link.
 *
 * Same guards as /api/leads (same-origin, JSON only, per-IP limit) plus a
 * per-address limit, because this endpoint sends mail to an address the caller
 * typed. The response never says whether the address was already subscribed.
 */
const IP_MAX = 8;
const IP_WINDOW_MS = 10 * 60_000;
const EMAIL_MAX = 3;
const EMAIL_WINDOW_MS = 60 * 60_000;
/** An address and a handful of search criteria; refused past this, unbuffered. */
const BODY_MAX_BYTES = 8 * 1024;

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host.replace(/^www\./, "") === rawHostFrom(req.headers);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (!(req.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 415 });
  }
  // No sender, no alerts: refuse rather than store searches that can never be mailed.
  if (!isEmailConfigured()) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }
  if (!allowRequest(`alerts|${clientIpFrom(req.headers)}`, IP_MAX, IP_WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: "too many requests" }, { status: 429, headers: { "retry-after": "600" } });
  }

  const raw = await readCappedText(req, BODY_MAX_BYTES);
  if (raw === null) return NextResponse.json({ ok: false, error: "too large" }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not an object");
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const criteria = normalizeCriteria(body);
  if (!criteria) return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  if (!isPlausibleEmail(email) || email.length > 190) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (!allowRequest(`alerts-email|${email}`, EMAIL_MAX, EMAIL_WINDOW_MS)) {
    // Same answer as a success: this must not reveal anything about the address.
    return NextResponse.json({ ok: true });
  }

  const door = await currentVertical();
  const outcome = await saveSearch({ email, vertical: door.key, locale: door.locale, criteria });
  if (outcome.status !== "exists") {
    const origin = await emailLinkOrigin();
    const names = await placeNames(criteria);
    after(async () => {
      await emailSearchConfirmation({
        to: email,
        locale: door.locale,
        brand: door.brand,
        summary: describeSearch(criteria, door.locale, names),
        confirmUrl: alertsPageUrl(origin, outcome.token),
      });
    });
  }
  return NextResponse.json({ ok: true });
}
