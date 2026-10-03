"use server";

/**
 * /resena — a buyer's review of an agency or agent (plan-admin-next O7). The
 * token is re-checked by `submitReview()` (signature, expiry, the lead still
 * worked by that partner, not reviewed yet): the form's hidden field is not
 * trusted for anything the token does not sign.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIpFrom } from "@/lib/client-ip";
import { allowRequest } from "@/lib/rate-limit";
import { currentLocale } from "@/i18n/server";
import { siteOrigin } from "@/lib/origin";
import { parseReviewForm } from "@/lib/review-token";
import { submitReview } from "@/lib/reviews";

/** Per IP: generous for a person, a wall for a script. */
const REVIEW_MAX = 10;
const REVIEW_WINDOW_MS = 10 * 60 * 1000;

export async function submitReviewAction(formData: FormData): Promise<void> {
  const token = String(formData.get("t") ?? "");
  const back = `/resena?t=${encodeURIComponent(token)}`;
  const ip = clientIpFrom(await headers());
  if (!allowRequest(`review|${ip}`, REVIEW_MAX, REVIEW_WINDOW_MS)) redirect(`${back}&error=limit`);
  const input = parseReviewForm((k) => formData.get(k));
  if (!input) redirect(`${back}&error=form`);
  const origin = await siteOrigin();
  const result = await submitReview({
    token,
    input,
    locale: await currentLocale(),
    adminUrl: `${origin}/admin/resenas`,
    site: new URL(origin).host,
  });
  redirect(result === "ok" ? `${back}&enviada=1` : back);
}
