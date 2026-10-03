/**
 * Review invitation links (plan-admin-next O7) — stateless and signed, no
 * table. A token is `base64url("<leadId>.<kind>.<targetId>.<expiresUnix>.<mac>")`:
 *
 *   mac = base64url(HMAC-SHA256(AUTH_TOKEN_SECRET,
 *           "review.v1|<leadId>|<kind>|<targetId>|<expiresUnix>"))
 *
 * Only the operator mints one (/admin/leads, for a lead the partner actually
 * worked), so a valid token is the proof that its holder was a real buyer of
 * that partner. Single use comes from the database, not the token: `reviews`
 * has one row per (lead, target), and a second submit is refused.
 *
 * The `review.v1|` prefix is domain separation from the password-reset MAC
 * (`pwreset.v1|`, src/lib/auth/reset-token.ts) that shares the secret: one can
 * never verify as the other. This file reads the secret itself and imports
 * nothing from auth.
 *
 * Pure apart from reading the environment. `npm run verify:reviews` drives it.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const REVIEW_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 60;
const MIN_SECRET_LENGTH = 32;
const MAC_DOMAIN = "review.v1";

export type ReviewTargetKind = "agency" | "agent";

export interface ReviewInvite {
  leadId: number;
  kind: ReviewTargetKind;
  targetId: number;
  expires: number;
}

/** `AUTH_TOKEN_SECRET`, or null when unset or too short to be a key. */
export function reviewSecret(): string | null {
  const s = process.env.AUTH_TOKEN_SECRET?.trim();
  return s && s.length >= MIN_SECRET_LENGTH ? s : null;
}

function mac(secret: string, i: Omit<ReviewInvite, never>): Buffer {
  return createHmac("sha256", secret)
    .update(`${MAC_DOMAIN}|${i.leadId}|${i.kind}|${i.targetId}|${i.expires}`)
    .digest();
}

export function mintReviewToken(
  p: { leadId: number; kind: ReviewTargetKind; targetId: number },
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  const invite: ReviewInvite = { ...p, expires: nowSeconds + REVIEW_TOKEN_TTL_SECONDS };
  const body = `${invite.leadId}.${invite.kind}.${invite.targetId}.${invite.expires}`;
  return Buffer.from(`${body}.${mac(secret, invite).toString("base64url")}`).toString("base64url");
}

export type ReviewTokenError = "malformed" | "bad_signature" | "expired";

export function verifyReviewToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): { ok: true; invite: ReviewInvite } | { ok: false; error: ReviewTokenError } {
  if (typeof token !== "string" || token.length === 0 || token.length > 400) return { ok: false, error: "malformed" };
  let raw: string;
  try {
    raw = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return { ok: false, error: "malformed" };
  }
  const m = /^(\d{1,12})\.(agency|agent)\.(\d{1,12})\.(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(raw);
  if (!m) return { ok: false, error: "malformed" };
  const invite: ReviewInvite = {
    leadId: Number(m[1]),
    kind: m[2] as ReviewTargetKind,
    targetId: Number(m[3]),
    expires: Number(m[4]),
  };
  if (!(invite.leadId > 0 && invite.targetId > 0)) return { ok: false, error: "malformed" };
  const want = mac(secret, invite);
  const got = Buffer.from(m[5], "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return { ok: false, error: "bad_signature" };
  if (invite.expires < nowSeconds) return { ok: false, error: "expired" };
  return { ok: true, invite };
}

/** The review form's input, bounded; null when the rating is missing or out of range. */
export interface ReviewInput {
  rating: number;
  body: string | null;
  authorName: string;
}

export const REVIEW_BODY_MAX = 2000;
export const REVIEW_NAME_MAX = 80;

export function parseReviewForm(get: (name: string) => unknown): ReviewInput | null {
  const rating = Number(get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  const name = typeof get("authorName") === "string" ? String(get("authorName")).trim().replace(/\s+/g, " ") : "";
  if (name.length < 2) return null;
  const body = typeof get("body") === "string" ? String(get("body")).trim() : "";
  return {
    rating,
    authorName: name.slice(0, REVIEW_NAME_MAX),
    body: body ? body.slice(0, REVIEW_BODY_MAX) : null,
  };
}

/** "4,6" / "4.6" — one decimal, the request's number locale. */
export function formatRating(avg: number, numberLocale: string): string {
  return avg.toLocaleString(numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
