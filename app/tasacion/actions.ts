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
import { alertOperator, getCrm } from "@/lib/crm";
import { siteOrigin } from "@/lib/origin";
import { esPanel } from "@/i18n/es";
import { canonPhone } from "@/lib/import/normalize";
import { estimateValue, type ValuationResult } from "@/lib/valuation";
import { OPERATIONS, PROPERTY_TYPES } from "@/lib/import/types";
import type { Operation, PropertyType } from "@/lib/import/types";

export async function estimateAction(input: {
  citySlug: string;
  propertyType: string;
  operation: string;
  areaM2: number;
}): Promise<ValuationResult> {
  // Everything is re-validated here; the form is not a trust boundary.
  if (!PROPERTY_TYPES.includes(input.propertyType as PropertyType)) {
    return { ok: false, reason: "no_data" };
  }
  if (!OPERATIONS.includes(input.operation as Operation)) {
    return { ok: false, reason: "no_data" };
  }
  return estimateValue({
    citySlug: String(input.citySlug),
    propertyType: input.propertyType as PropertyType,
    operation: input.operation as Operation,
    areaM2: Number(input.areaM2),
  });
}

export type ValuationLeadResult = { ok: true } | { ok: false };

export async function requestValuationContactAction(input: {
  name: string;
  whatsapp: string;
  /** What they asked about, so the follow-up starts informed. */
  context: string;
}): Promise<ValuationLeadResult> {
  const whatsapp = canonPhone(input.whatsapp);
  if (whatsapp.length < 6) return { ok: false };

  const vertical = (await headers()).get("x-vertical") ?? DEFAULT_VERTICAL_KEY;

  // MySQL first, provider second — defer the push with after() like /api/leads,
  // so a visitor never waits on the webhook and a failed push never loses the lead.
  await db.insert(leads).values({
    leadType: "valuation",
    vertical,
    name: input.name.trim().slice(0, 140) || null,
    whatsapp,
    message: input.context.slice(0, 2000),
    // A valuation lead belongs to no agency: it is a seller the portal itself
    // should work, and it shows up under "Interno" in /admin/leads.
    routedTo: "internal",
  });

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
      await getCrm().pushLead({
        leadType: "valuation",
        vertical,
        name: input.name.trim() || undefined,
        whatsapp,
        message: input.context,
        routedTo: "internal",
      });
    } catch {
      /* the lead row is the record; a failed copy is not an incident */
    }
  });

  return { ok: true };
}
