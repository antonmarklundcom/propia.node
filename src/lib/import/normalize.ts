/**
 * Normalization + hashing (ARCHITECTURE.md §2.4) — the heart of dedup.
 * Pure functions, no DB, so the "re-runs produce zero duplicates" guarantee
 * (M2 gate) is unit-testable in isolation.
 *
 * Two hashes, two jobs:
 *  - contentHash: did THIS source row change? → decides update vs unchanged.
 *  - dedupKey: is this the SAME property as one we already have (from any
 *    source)? → decides create vs attach-as-another-source. Deliberately
 *    fuzzy (bucketed price/area) so the same flat re-listed at a slightly
 *    different price still collapses to one listing.
 */
import { createHash } from "node:crypto";
import type { RawListing } from "./types";

const sha1 = (s: string) => createHash("sha1").update(s).digest("hex");

/** Normalize free text for hashing: lowercase, strip accents, collapse ws. */
export function canon(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Digits only — phone formatting (0981 123-456 vs +595981123456) varies. */
export function canonPhone(s: string | undefined | null): string {
  if (!s) return "";
  const digits = s.replace(/\D/g, "");
  // Normalize Paraguay forms: strip country code 595 and a leading 0 so
  // 0981123456, 595981123456 and 981123456 all collapse to the same key.
  let d = digits;
  if (d.startsWith("595")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Normalized USD price used for every filter and for dedup bucketing. */
export function toPriceUsd(
  amount: number,
  currency: "USD" | "PYG",
  usdToPyg: number,
): number {
  if (currency === "USD") return Math.round(amount);
  return Math.round(amount / usdToPyg);
}

/** Coarse buckets absorb small listing-to-listing price/area differences. */
export function priceBucket(priceUsd: number): number {
  return Math.round(priceUsd / 5000) * 5000; // 5k USD granularity
}
export function areaBucket(m2: number | undefined): number {
  if (!m2 || m2 <= 0) return 0;
  return Math.round(m2 / 10) * 10; // 10 m² granularity
}

/**
 * contentHash — change detection for a single source row. Any field that,
 * if edited at the source, should re-publish the listing goes in here.
 */
export function contentHash(raw: RawListing, priceUsd: number): string {
  return sha1(
    [
      canon(raw.title),
      priceUsd,
      raw.areaM2 ?? "",
      raw.landM2 ?? "",
      raw.bedrooms ?? "",
      raw.bathrooms ?? "",
      canon(raw.descriptionEs),
      raw.propertyState ?? "",
    ].join("|"),
  );
}

/**
 * dedupKey — cross-source identity of a property. Same phone + same coarse
 * price + same coarse area + same location ⇒ treated as the same listing.
 * locationId is resolved against the DB before this is called.
 */
export function dedupKey(
  raw: RawListing,
  priceUsd: number,
  locationId: number,
): string {
  const area = raw.areaM2 ?? raw.landM2;
  return sha1(
    [
      canonPhone(raw.contactPhone),
      priceBucket(priceUsd),
      areaBucket(area),
      locationId,
      raw.operation,
      raw.propertyType,
    ].join("|"),
  );
}

const PUBLIC_ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
/** 10-char URL id for /propiedad/{slug}-{public_id}. Collisions are ~nil. */
export function makePublicId(): string {
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += PUBLIC_ID_ALPHABET[Math.floor(Math.random() * PUBLIC_ID_ALPHABET.length)];
  }
  return out;
}
