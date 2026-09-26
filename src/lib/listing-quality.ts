/**
 * The pre-submit quality check for the listing form (plan-build A4,
 * Agency 10). Pure — the checklist is a client component that re-runs this
 * as the agent types, and nothing here may pull in `server-only` code.
 *
 * **Warnings, not blocks**, with one exception: the items the save already
 * refuses (`readListingForm` — a title under 8 characters, no price) are
 * `block`, so the checklist says the same thing the server will. Everything
 * else is advice: the review queue does not reject a listing for having four
 * photos, and a checklist that pretended it did would be a second, drifting
 * set of rules.
 */
import type { PropertyType } from "@/lib/import/types";

export const QUALITY_RULES = {
  minPhotos: 5,
  /** readListingForm refuses shorter — keep the two in step. */
  titleHardMin: 8,
  titleMin: 20,
  titleMax: 100,
  descriptionMin: 150,
} as const;

/** Where the map pin sits: own coordinates, a centroid, or nowhere. */
export type MapPosition = "exact" | "approx" | "none";

export type QualityLevel = "pass" | "warn" | "block";

export type QualityKey =
  | "title"
  | "price"
  | "photos"
  | "map"
  | "area"
  | "description";

/** `block` = the save itself refuses it; `warn` = advice only. */
export interface QualityItem {
  key: QualityKey;
  level: QualityLevel;
}

export interface QualityInput {
  title: string;
  description: string;
  priceAmount: number;
  propertyType: PropertyType | string;
  areaM2: number | null;
  landM2: number | null;
  photoCount: number;
  map: MapPosition;
}

const positive = (n: number | null): boolean =>
  n != null && Number.isFinite(n) && n > 0;

export function listingQualityChecks(input: QualityInput): QualityItem[] {
  const r = QUALITY_RULES;
  const title = input.title.trim();
  const description = input.description.trim();
  // A plot has no built area; its size is the land.
  const size = input.propertyType === "terreno"
    ? positive(input.landM2)
    : positive(input.areaM2) || positive(input.landM2);

  return [
    {
      key: "title",
      level:
        title.length < r.titleHardMin
          ? "block"
          : title.length < r.titleMin || title.length > r.titleMax
            ? "warn"
            : "pass",
    },
    {
      key: "price",
      level: positive(input.priceAmount) ? "pass" : "block",
    },
    {
      key: "photos",
      level: input.photoCount >= r.minPhotos ? "pass" : "warn",
    },
    {
      key: "map",
      level: input.map === "exact" ? "pass" : "warn",
    },
    { key: "area", level: size ? "pass" : "warn" },
    {
      key: "description",
      level: description.length >= r.descriptionMin ? "pass" : "warn",
    },
  ];
}

export function countWarnings(items: QualityItem[]): number {
  return items.filter((i) => i.level !== "pass").length;
}
