/**
 * Parse + validate the shared listing edit form (src/components/panel/ListingForm).
 *
 * Lives apart from the two server actions that use it so admin and agency edits
 * can never drift into validating the same form differently. This only shapes
 * the payload — *authorisation* is the caller's EditScope, enforced in the
 * query layer's WHERE clause.
 */
import type { ListingEditInput, ListingStatusValue } from "@/lib/listing-edit";
import { ADMIN_STATUSES } from "@/lib/listing-edit";
import {
  OPERATIONS,
  PROPERTY_TYPES,
  type Operation,
  type PropertyType,
} from "@/lib/import/types";

/**
 * Column bounds (audit 2026-10 S3). `price_amount` is DECIMAL(14,2) and
 * `price_usd` DECIMAL(12,2), so a US$ price must stay under 1e10 and a
 * Guaraní one under 1e12; past that MySQL errors (a 500) or, under the
 * production non-strict sql_mode, stores a clamped value. `title` is
 * varchar(180); `description_es` is TEXT (65 535 bytes — 16 000 characters
 * fit even at four bytes each).
 */
export const LISTING_TITLE_MAX = 180;
export const LISTING_DESCRIPTION_MAX = 16_000;

export function priceWithinBounds(amount: number, currency: string): boolean {
  return Number.isFinite(amount) && amount < (currency === "PYG" ? 1e12 : 1e10);
}

function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

/** Blank input → NULL; otherwise a non-negative integer, else NULL. */
function optInt(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** Blank input → NULL; otherwise a positive number, else NULL. */
function optNum(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export type ListingFormResult =
  | { ok: true; id: number; input: ListingEditInput }
  | { ok: false; id: number };

export function readListingForm(formData: FormData): ListingFormResult {
  const id = Number(formData.get("listingId"));
  const safeId = Number.isInteger(id) && id > 0 ? id : 0;

  const title = str(formData.get("title")).slice(0, LISTING_TITLE_MAX);
  const operation = str(formData.get("operation")) as Operation;
  const propertyType = str(formData.get("propertyType")) as PropertyType;
  const priceAmount = Number(str(formData.get("priceAmount")));
  const priceCurrency = str(formData.get("priceCurrency")) === "PYG" ? "PYG" : "USD";
  const locationId = Number(str(formData.get("locationId")));
  const status = str(formData.get("status")) as ListingStatusValue;

  const valid =
    safeId > 0 &&
    title.length >= 8 &&
    OPERATIONS.includes(operation) &&
    PROPERTY_TYPES.includes(propertyType) &&
    Number.isFinite(priceAmount) &&
    priceAmount > 0 &&
    priceWithinBounds(priceAmount, priceCurrency) &&
    Number.isInteger(locationId) &&
    locationId > 0 &&
    ADMIN_STATUSES.includes(status);

  if (!valid) return { ok: false, id: safeId };

  return {
    ok: true,
    id: safeId,
    input: {
      title,
      descriptionEs: str(formData.get("descriptionEs")).slice(0, LISTING_DESCRIPTION_MAX) || null,
      operation,
      propertyType,
      priceAmount,
      priceCurrency,
      bedrooms: optInt(formData.get("bedrooms")),
      bathrooms: optInt(formData.get("bathrooms")),
      parking: optInt(formData.get("parking")),
      areaM2: optNum(formData.get("areaM2")),
      landM2: optNum(formData.get("landM2")),
      locationId,
      videoUrl: str(formData.get("videoUrl")).slice(0, 500) || null,
      foreignExposure: formData.get("foreignExposure") === "1",
      status,
    },
  };
}
