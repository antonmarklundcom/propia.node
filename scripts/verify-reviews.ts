/**
 * Pure checks for plan-admin-next O7's review links and form
 * (src/lib/review-token.ts). No DB, no network. In verify:local and the
 * pre-push hook.
 */
import { createHmac } from "node:crypto";
import {
  REVIEW_TOKEN_TTL_SECONDS,
  formatRating,
  mintReviewToken,
  parseReviewForm,
  verifyReviewToken,
} from "../src/lib/review-token";

let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    failed++;
    console.error(`FAIL ${name}:\n  got  ${g}\n  want ${w}`);
  }
}

const secret = "s".repeat(40);
const now = 1_800_000_000;
const tok = mintReviewToken({ leadId: 42, kind: "agency", targetId: 7 }, secret, now);

eq("round trip", verifyReviewToken(tok, secret, now), {
  ok: true,
  invite: { leadId: 42, kind: "agency", targetId: 7, expires: now + REVIEW_TOKEN_TTL_SECONDS },
});
eq("wrong secret", verifyReviewToken(tok, "t".repeat(40), now), { ok: false, error: "bad_signature" });
eq("expired", verifyReviewToken(tok, secret, now + REVIEW_TOKEN_TTL_SECONDS + 1), { ok: false, error: "expired" });
eq("garbage", verifyReviewToken("not-a-token", secret, now), { ok: false, error: "malformed" });
eq("empty", verifyReviewToken("", secret, now), { ok: false, error: "malformed" });

// Changing any signed field breaks the MAC: lead, kind, target, expiry.
const raw = Buffer.from(tok, "base64url").toString("utf8");
const [, , , exp, mac] = raw.split(".");
for (const [name, body] of [
  ["other lead", `43.agency.7.${exp}`],
  ["other kind", `42.agent.7.${exp}`],
  ["other target", `42.agency.8.${exp}`],
  ["later expiry", `42.agency.7.${Number(exp) + 1000}`],
] as const) {
  const forged = Buffer.from(`${body}.${mac}`).toString("base64url");
  eq(`tampered: ${name}`, verifyReviewToken(forged, secret, now), { ok: false, error: "bad_signature" });
}

// Domain separation: a MAC over the password-reset layout never verifies here.
const resetStyleMac = createHmac("sha256", secret).update(`pwreset.v1|42|${exp}|`).digest().toString("base64url");
eq(
  "a reset-style MAC is refused",
  verifyReviewToken(Buffer.from(`42.agency.7.${exp}.${resetStyleMac}`).toString("base64url"), secret, now),
  { ok: false, error: "bad_signature" },
);

const form = (o: Record<string, string>) => (k: string) => (k in o ? o[k] : null);
eq("form ok", parseReviewForm(form({ rating: "5", authorName: "  María   G. ", body: " Muy bien " })), {
  rating: 5,
  authorName: "María G.",
  body: "Muy bien",
});
eq("no body", parseReviewForm(form({ rating: "3", authorName: "Ana" })), { rating: 3, authorName: "Ana", body: null });
eq("rating 0 refused", parseReviewForm(form({ rating: "0", authorName: "Ana" })), null);
eq("rating 6 refused", parseReviewForm(form({ rating: "6", authorName: "Ana" })), null);
eq("rating 4.5 refused", parseReviewForm(form({ rating: "4.5", authorName: "Ana" })), null);
eq("name too short", parseReviewForm(form({ rating: "4", authorName: "A" })), null);
eq("body bounded", parseReviewForm(form({ rating: "4", authorName: "Ana", body: "x".repeat(5000) }))?.body?.length, 2000);
eq("name bounded", parseReviewForm(form({ rating: "4", authorName: "x".repeat(200) }))?.authorName.length, 80);
eq("rating es", formatRating(4.666, "es-PY"), "4,7");
eq("rating en", formatRating(4, "en-US"), "4.0");

if (failed) {
  console.error(`verify:reviews — ${failed} failed`);
  process.exit(1);
}
console.log("verify:reviews — OK");
