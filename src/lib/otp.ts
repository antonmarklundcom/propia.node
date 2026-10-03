/**
 * WhatsApp OTP core (ARCHITECTURE.md §2.7). Six-digit codes, 10-minute
 * expiry, a resend cooldown and an attempt cap — stored in `otp_codes`,
 * delivered by GHL through the CRM boundary (src/lib/crm.ts). This module
 * owns the rules; server actions only orchestrate (create → send, verify →
 * publish). Node runtime only (touches MySQL + node:crypto).
 */
import "server-only";
import { randomInt } from "node:crypto";
import { and, desc, eq, gt, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { canonPhone } from "@/lib/import/normalize";

const TTL_MS = 10 * 60 * 1000; // 10-minute code lifetime
const RESEND_COOLDOWN_MS = 60 * 1000; // one code per number per minute
const MAX_ATTEMPTS = 5; // wrong guesses before a code is burned

/** When a code was issued — otp_codes has no created_at, so derive it. */
function issuedAt(expiresAt: Date): number {
  return expiresAt.getTime() - TTL_MS;
}

export type CreateOtpResult =
  | { ok: true; code: string; whatsapp: string }
  | { ok: false; cooldownMs: number };

/**
 * Issue a fresh code for a number, honoring the resend cooldown. Returns the
 * plaintext code for the caller to hand to crm.sendOtp() — it is never
 * exposed to the client. Older unconsumed codes for the number are left to
 * expire; verifyOtp only ever reads the newest, so they cannot be reused.
 */
export async function createOtp(rawWhatsapp: string): Promise<CreateOtpResult> {
  const whatsapp = canonPhone(rawWhatsapp);
  const now = Date.now();

  const [latest] = await db
    .select({ expiresAt: otpCodes.expiresAt })
    .from(otpCodes)
    .where(and(eq(otpCodes.whatsapp, whatsapp), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.expiresAt))
    .limit(1);

  if (latest) {
    const sinceIssued = now - issuedAt(latest.expiresAt);
    if (sinceIssued < RESEND_COOLDOWN_MS) {
      return { ok: false, cooldownMs: RESEND_COOLDOWN_MS - sinceIssued };
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(otpCodes).values({
    whatsapp,
    code,
    expiresAt: new Date(now + TTL_MS),
  });
  return { ok: true, code, whatsapp };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "mismatch" | "too_many" };

/**
 * Verify a code against the newest unconsumed, unexpired code for the number.
 * A correct code is consumed (single use); a wrong one increments attempts and
 * burns the code once MAX_ATTEMPTS is reached, forcing a resend.
 */
export async function verifyOtp(
  rawWhatsapp: string,
  input: string,
): Promise<VerifyOtpResult> {
  const whatsapp = canonPhone(rawWhatsapp);
  const code = input.replace(/\D/g, "");
  const now = new Date();

  const [row] = await db
    .select({
      id: otpCodes.id,
      code: otpCodes.code,
      attempts: otpCodes.attempts,
      expiresAt: otpCodes.expiresAt,
    })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.whatsapp, whatsapp),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.expiresAt, now),
      ),
    )
    .orderBy(desc(otpCodes.expiresAt))
    .limit(1);

  if (!row) return { ok: false, reason: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many" };

  /**
   * Claim one attempt atomically BEFORE comparing (audit 2026-10 A3). The old
   * read-then-write let N concurrent guesses all read the same count and each
   * write `attempts + 1`, so a code got about N guesses instead of five. Now
   * every guess must win this conditional increment, and the database counts.
   */
  const [claim] = await db
    .update(otpCodes)
    .set({ attempts: sql`${otpCodes.attempts} + 1` })
    .where(
      and(
        eq(otpCodes.id, row.id),
        isNull(otpCodes.consumedAt),
        lt(otpCodes.attempts, MAX_ATTEMPTS),
      ),
    );
  if (claim.affectedRows !== 1) return { ok: false, reason: "too_many" };

  if (row.code !== code) {
    // Burn the code once the database's count reaches the limit, so it can't
    // be brute-forced further — decided by the row, not by the count this
    // request read, which concurrent guesses have already moved.
    const [burn] = await db
      .update(otpCodes)
      .set({ consumedAt: now })
      .where(
        and(
          eq(otpCodes.id, row.id),
          isNull(otpCodes.consumedAt),
          gte(otpCodes.attempts, MAX_ATTEMPTS),
        ),
      );
    return { ok: false, reason: burn.affectedRows === 1 ? "too_many" : "mismatch" };
  }

  // Consumed once: a second concurrent correct guess finds it gone.
  const [used] = await db
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(and(eq(otpCodes.id, row.id), isNull(otpCodes.consumedAt)));
  if (used.affectedRows !== 1) return { ok: false, reason: "expired" };
  return { ok: true };
}
