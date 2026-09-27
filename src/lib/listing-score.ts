/**
 * How complete a listing is, as a score for /admin/calidad — so the operator
 * knows which agency to chase for photos, a real description or a position
 * on the map.
 *
 * Built on `listingQualityChecks()` (src/lib/listing-quality.ts), the same
 * rules the listing form's checklist shows the agent as they type, so the
 * admin score and the agent's checklist can never disagree about what "too
 * few photos" means. Three checks are added that only the operator acts on:
 * a watermarked cover, a dwelling without bedrooms, and a listing nobody
 * receives the enquiry for.
 *
 * Score = 100 minus the weight of each issue, never below 0. The weights are
 * a judgement about what costs enquiries most. Pure: no `next/*`, no drizzle.
 */
import { listingQualityChecks, type MapPosition } from "./listing-quality";

export type QualityIssue =
  | "no_price"
  | "no_photos"
  | "few_photos"
  | "watermark_cover"
  | "short_description"
  | "short_title"
  | "no_position"
  | "approx_position"
  | "no_area"
  | "no_bedrooms"
  | "no_contact";

export const ISSUE_WEIGHT: Record<QualityIssue, number> = {
  no_price: 30,
  no_photos: 30,
  few_photos: 10,
  watermark_cover: 10,
  short_description: 20,
  short_title: 5,
  no_position: 15,
  approx_position: 5,
  no_area: 10,
  no_bedrooms: 5,
  no_contact: 15,
};

/** `listing_images.watermark_score` from which a cover counts as marked. */
export const WATERMARK_THRESHOLD = 50;

/** Types where bedrooms are what a buyer asks first. */
const DWELLINGS: ReadonlySet<string> = new Set(["casa", "departamento", "duplex", "quinta"]);

export interface ScoreInput {
  propertyType: string;
  title: string;
  description: string | null;
  priceAmount: number;
  photoCount: number;
  /** `watermark_score` of the cover (position 0), null when unscored. */
  coverWatermark: number | null;
  map: MapPosition;
  areaM2: number | null;
  landM2: number | null;
  bedrooms: number | null;
  /** An agency, an agent or an owner the enquiry is routed to. */
  hasContact: boolean;
}

export function scoreIssues(l: ScoreInput): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const item of listingQualityChecks({
    title: l.title,
    description: l.description ?? "",
    priceAmount: l.priceAmount,
    propertyType: l.propertyType,
    areaM2: l.areaM2,
    landM2: l.landM2,
    photoCount: l.photoCount,
    map: l.map,
  })) {
    if (item.level === "pass") continue;
    switch (item.key) {
      case "title":
        issues.push("short_title");
        break;
      case "price":
        issues.push("no_price");
        break;
      case "photos":
        issues.push(l.photoCount === 0 ? "no_photos" : "few_photos");
        break;
      case "map":
        issues.push(l.map === "none" ? "no_position" : "approx_position");
        break;
      case "area":
        issues.push("no_area");
        break;
      case "description":
        issues.push("short_description");
        break;
    }
  }
  if (l.photoCount > 0 && l.coverWatermark != null && l.coverWatermark >= WATERMARK_THRESHOLD) {
    issues.push("watermark_cover");
  }
  if (DWELLINGS.has(l.propertyType) && l.bedrooms == null) issues.push("no_bedrooms");
  if (!l.hasContact) issues.push("no_contact");
  return issues;
}

export function qualityScore(issues: readonly QualityIssue[]): number {
  return Math.max(0, 100 - issues.reduce((sum, i) => sum + ISSUE_WEIGHT[i], 0));
}
