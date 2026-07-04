/**
 * Lead capture (ARCHITECTURE.md §5). Order matters: record in MySQL first
 * (source of truth for the money report), THEN push to GHL through the
 * crm.ts boundary. A GHL failure never loses the lead — it's already stored.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, listings } from "@/db/schema";
import { getCrm, type LeadPayload } from "@/lib/crm";
import { listingUrl } from "@/lib/urls";

const CANONICAL_ORIGIN = () =>
  `https://${process.env.NEXT_PUBLIC_CANONICAL_HOST ?? "propia.com.py"}`;

const bodySchema = z.object({
  leadType: z.enum([
    "buyer",
    "renter",
    "seller",
    "valuation",
    "developer",
    "agent_signup",
  ]),
  listingPublicId: z.string().length(10).optional(),
  name: z.string().max(140).optional(),
  whatsapp: z.string().min(6).max(30),
  email: z.string().email().max(190).optional(),
  message: z.string().max(2000).optional(),
  utm: z.record(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "invalid payload", detail: String(e) },
      { status: 400 },
    );
  }

  const vertical = req.headers.get("x-vertical") ?? "propia";

  // Resolve listing context (for routing + CRM payload) if one was given.
  let listing: typeof listings.$inferSelect | null = null;
  if (parsed.listingPublicId) {
    const [row] = await db
      .select()
      .from(listings)
      .where(eq(listings.publicId, parsed.listingPublicId))
      .limit(1);
    listing = row ?? null;
  }

  const routedTo: LeadPayload["routedTo"] = listing?.agentId
    ? "agent"
    : listing?.agencyId
      ? "agency"
      : "internal";

  // 1. Record in MySQL first.
  const [res] = await db.insert(leads).values({
    leadType: parsed.leadType,
    vertical,
    listingId: listing?.id,
    projectId: listing?.projectId,
    name: parsed.name,
    whatsapp: parsed.whatsapp,
    email: parsed.email,
    message: parsed.message,
    utm: parsed.utm,
    routedTo,
  });
  const leadId = Number((res as unknown as { insertId: number }).insertId);

  // 2. Push to GHL (best effort — never blocks the stored lead).
  const payload: LeadPayload = {
    leadType: parsed.leadType,
    vertical,
    name: parsed.name,
    whatsapp: parsed.whatsapp,
    email: parsed.email,
    message: parsed.message,
    utm: parsed.utm,
    routedTo,
    listing: listing
      ? {
          publicId: listing.publicId,
          title: listing.title,
          url: `${CANONICAL_ORIGIN()}${listingUrl(listing)}`,
          priceUsd: Number(listing.priceUsd),
          operation: listing.operation,
        }
      : undefined,
  };

  const crmResult = await getCrm().pushLead(payload);
  if (crmResult.ok && crmResult.contactId) {
    await db
      .update(leads)
      .set({ ghlContactId: crmResult.contactId })
      .where(eq(leads.id, leadId));
  }

  return NextResponse.json({ ok: true, leadId, crm: crmResult.ok });
}
