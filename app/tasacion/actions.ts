"use server";

/**
 * Valuation actions.
 *
 * Two separate steps on purpose. The estimate is free and needs no contact
 * details — gating a number behind a phone number is the pattern that makes
 * people distrust portals. The lead is only created if the visitor asks to be
 * contacted, and it carries the valuation context so whoever follows up knows
 * what was asked without having to ask again.
 */
import { headers } from "next/headers";
import { after } from "next/server";
import { DEFAULT_VERTICAL_KEY } from "@/config/verticals";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { alertOperator, deliverLead } from "@/lib/crm";
import { siteOrigin } from "@/lib/origin";
import { esPanel } from "@/i18n/es";
import { canonPhone } from "@/lib/import/normalize";
import { estimateValue, type ValuationResult } from "@/lib/valuation";
import { OPERATIONS, PROPERTY_TYPES } from "@/lib/import/types";
import type { Operation, PropertyType } from "@/lib/import/types";
import { allowRequest } from "@/lib/rate-limit";
import { clientIpFrom } from "@/lib/client-ip";

/**
 * Both actions are public. The estimate is a cached read, but its cache key is
 * the arguments: bounded and normalised here so a loop of unique values can
 * neither miss the cache every time nor grow it without end (audit 2026-10
 * S2). The contact request writes a lead, alerts the operator and copies to
 * the CRM, so it gets `/api/leads`' own per-IP bound (S1).
 */
const ESTIMATE_MAX = 60;
const ESTIMATE_WINDOW_MS = 10 * 60_000;
const CONTACT_MAX = 10;
const CONTACT_WINDOW_MS = 10 * 60_000;
const SLUG = /^[a-z0-9-]{1,80}$/;

async function ip(): Promise<string> {
  return clientIpFrom(await headers());
}

export async function estimateAction(input: {
  citySlug: string;
  propertyType: string;
  operation: string;
  areaM2: number;
}): Promise<ValuationResult> {
  // Everything is re-validated here; the form is not a trust boundary.
  const citySlug = typeof input?.citySlug === "string" ? input.citySlug : "";
  const areaM2 = Math.round(Number(input?.areaM2));
  if (!SLUG.test(citySlug) || !Number.isFinite(areaM2) || areaM2 < 1 || areaM2 > 1_000_000) {
    return { ok: false, reason: "no_data" };
  }
  if (!allowRequest(`valuation-estimate|${await ip()}`, ESTIMATE_MAX, ESTIMATE_WINDOW_MS)) {
    return { ok: false, reason: "no_data" };
  }
  if (!PROPERTY_TYPES.includes(input.propertyType as PropertyType)) {
    return { ok: false, reason: "no_data" };
  }
  if (!OPERATIONS.includes(input.operation as Operation)) {
    return { ok: false, reason: "no_data" };
  }
  return estimateValue({
    citySlug,
    propertyType: input.propertyType as PropertyType,
    operation: input.operation as Operation,
    areaM2,
  });
}

export type ValuationLeadResult = { ok: true } | { ok: false };

export async function requestValuationContactAction(input: {
  name: string;
  whatsapp: string;
  /** What they asked about, so the follow-up starts informed. */
  context: string;
}): Promise<ValuationLeadResult> {
  if (
    typeof input?.name !== "string" ||
    typeof input.whatsapp !== "string" ||
    typeof input.context !== "string"
  ) {
    return { ok: false };
  }
  const whatsapp = canonPhone(input.whatsapp.slice(0, 40));
  // 6–15 digits: the public form's lower bound, E.164's upper one.
  const digits = whatsapp.replace(/\D/g, "").length;
  if (digits < 6 || digits > 15) return { ok: false };
  if (!allowRequest(`valuation-contact|${await ip()}`, CONTACT_MAX, CONTACT_WINDOW_MS)) {
    return { ok: false };
  }

  const vertical = (await headers()).get("x-vertical") ?? DEFAULT_VERTICAL_KEY;

  // MySQL first, provider second — defer the push with after() like /api/leads,
  // so a visitor never waits on the webhook and a failed push never loses the lead.
  const [res] = await db.insert(leads).values({
    leadType: "valuation",
    vertical,
    name: input.name.trim().slice(0, 140) || null,
    whatsapp,
    message: input.context.slice(0, 2000),
    // A valuation lead belongs to no agency: it is a seller the portal itself
    // should work, and it shows up under "Interno" in /admin/leads.
    routedTo: "internal",
  });
  const leadId = Number((res as unknown as { insertId: number }).insertId);

  // The site the visitor is on, for the operator alert's link — read here,
  // inside the request, because after() runs once the headers are gone.
  const adminUrl = `${await siteOrigin()}/admin/leads`;

  after(async () => {
    // Every other lead writer pings the operator; a valuation request is a
    // seller asking to be called, the lead the portal most wants to answer.
    await alertOperator({
      kind: "new_lead",
      title: esPanel.alertNewLeadTitle,
      detail: esPanel.alertNewLeadDetail({
        leadType: "valuation",
        name: input.name.trim() || null,
        whatsapp,
        listingTitle: null,
      }),
      url: adminUrl,
      site: new URL(adminUrl).host,
    });

    try {
      await deliverLead({
        leadId,
        leadType: "valuation",
        vertical,
        // The same bounded values the row stores, not the raw input.
        name: input.name.trim().slice(0, 140) || undefined,
        whatsapp,
        message: input.context.slice(0, 2000),
        routedTo: "internal",
      });
    } catch {
      /* the lead row is the record; a failed copy is not an incident */
    }
  });

  return { ok: true };
}
