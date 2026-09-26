/**
 * The hourly scheduler's door (docs/plan-agency-2026-09-26.md batch 4). The
 * only caller is the Cloudflare Worker's cron trigger
 * (`workers/inbound-email/`, `scheduled`), which POSTs here with
 * `Authorization: Bearer <CRON_SECRET>`.
 *
 * - **Off until configured**: no `CRON_SECRET` (or one under 16 characters)
 *   → 503, and nothing runs.
 * - **Constant-time** secret check (`secretMatches()`): both sides hashed
 *   first, so neither timing nor length says anything about the secret.
 * - The answer is the per-task summary (`runCronTick()`), which carries counts
 *   and notes only — no lead or person data — so `wrangler tail` stays clean.
 */
import { NextRequest, NextResponse } from "next/server";
import { runCronTick } from "@/lib/cron-tick";
import { secretMatches } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const MIN_SECRET_LENGTH = 16;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return json(503, { ok: false, error: "cron not configured" });
  }
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;
  if (!secretMatches(token, secret)) return json(401, { ok: false, error: "unauthorized" });

  const results = await runCronTick();
  return json(200, { ok: true, results });
}
