/**
 * The rows behind /admin/calidad: every published or in-review listing with
 * what `scoreIssues()` needs, in two reads — the listings, then one grouped
 * read of their photos. Not cached: an operator opens it to see the state now,
 * after chasing an agency for photos.
 */
import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { agencies, listingImages, listings } from "@/db/schema";
import { qualityScore, scoreIssues, type QualityIssue } from "@/lib/listing-score";

/** Published and in review: what a buyer sees or is about to. */
const CHECKED_STATUSES = ["published", "pending_review"] as const;
/** A ceiling, not a page: the portal is far below it. */
const MAX_ROWS = 5000;

export interface QualityRow {
  id: number;
  publicId: string;
  slug: string;
  title: string;
  status: string;
  agencyId: number | null;
  agencyName: string | null;
  issues: QualityIssue[];
  score: number;
}

const num = (v: string | number | null) => (v == null ? null : Number(v));

export async function listQualityRows(): Promise<QualityRow[]> {
  const rows = await db
    .select({
      id: listings.id,
      publicId: listings.publicId,
      slug: listings.slug,
      title: listings.title,
      status: listings.status,
      priceAmount: listings.priceAmount,
      propertyType: listings.propertyType,
      // Scoring only asks whether the trimmed text reaches 150 characters
      // (listing-quality.ts), so a prefix is enough — not 5 000 full
      // descriptions per render (audit 2026-10 P4).
      description: sql<string | null>`left(${listings.descriptionEs}, 400)`,
      lat: listings.lat,
      displayLat: listings.displayLat,
      areaM2: listings.areaM2,
      landM2: listings.landM2,
      bedrooms: listings.bedrooms,
      agencyId: listings.agencyId,
      agentId: listings.agentId,
      ownerUserId: listings.ownerUserId,
      agencyName: agencies.name,
    })
    .from(listings)
    .leftJoin(agencies, eq(listings.agencyId, agencies.id))
    .where(inArray(listings.status, [...CHECKED_STATUSES]))
    .limit(MAX_ROWS);
  if (rows.length === 0) return [];

  const photos = await db
    .select({
      listingId: listingImages.listingId,
      n: sql<number>`COUNT(*)`,
      // The cover is position 0; MAX over a CASE picks its score out of the group.
      coverWatermark: sql<number | null>`MAX(CASE WHEN ${listingImages.position} = 0 THEN ${listingImages.watermarkScore} END)`,
    })
    .from(listingImages)
    .where(inArray(listingImages.listingId, rows.map((r) => r.id)))
    .groupBy(listingImages.listingId);
  const byListing = new Map(photos.map((p) => [p.listingId, p]));

  return rows.map((r) => {
    const p = byListing.get(r.id);
    const issues = scoreIssues({
      propertyType: r.propertyType,
      title: r.title,
      description: r.description,
      priceAmount: Number(r.priceAmount),
      photoCount: Number(p?.n ?? 0),
      coverWatermark: num(p?.coverWatermark ?? null),
      // Same three states the form's checklist reads (listing-quality-server.ts).
      map: r.lat != null ? "exact" : r.displayLat != null ? "approx" : "none",
      areaM2: num(r.areaM2),
      landM2: num(r.landM2),
      bedrooms: r.bedrooms,
      hasContact: r.agencyId != null || r.agentId != null || r.ownerUserId != null,
    });
    return {
      id: r.id,
      publicId: r.publicId,
      slug: r.slug,
      title: r.title,
      status: r.status,
      agencyId: r.agencyId,
      agencyName: r.agencyName,
      issues,
      score: qualityScore(issues),
    };
  });
}
