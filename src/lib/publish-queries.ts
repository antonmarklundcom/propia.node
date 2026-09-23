/**
 * Publish-wizard data access (ARCHITECTURE.md §3, M5). A draft is a `listings`
 * row with status='draft' owned by the publisher — no separate drafts table
 * (the schema STOP gate is closed; status='draft' is the intended shape). Every
 * write is scoped to ownerUserId in the WHERE clause, so a publisher can only
 * ever touch their own draft, whatever the client submits. Reference data
 * (locations, nearby projects, financing programs) feeds the wizard's selects.
 */
import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  agencies, agents, financingPrograms, listings, locations, projects,
} from "@/db/schema";
import type { FinancingProgram } from "@/lib/cuota";
import { makePublicId, toPriceUsd } from "@/lib/import/normalize";
import { syncDisplayCoords } from "@/lib/geo";
import { slugify } from "@/lib/slug";
import { getUsdToPygRate } from "@/lib/fx";
import type { Operation, PropertyType } from "@/lib/import/types";

export { getUsdToPygRate };

/** A missing professional row is intentional for private sellers. */
async function resolvePublisher(userId: number) {
  const [agent] = await db
    .select({ agentId: agents.id, agencyId: agents.agencyId })
    .from(agents)
    .where(eq(agents.userId, userId))
    .limit(1);
  return agent ?? { agentId: null, agencyId: null };
}

export interface PublishContact {
  professional: boolean;
  whatsapp: string | null;
}

/** Match the detail page's agent → agency contact chain, using persisted IDs. */
export async function getPublishContact(
  userId: number,
  draftId: number | null,
): Promise<PublishContact | null> {
  let identity: { agentId: number | null; agencyId: number | null };
  if (draftId != null) {
    const [draft] = await db
      .select({ agentId: listings.agentId, agencyId: listings.agencyId })
      .from(listings)
      .where(and(
        eq(listings.id, draftId),
        eq(listings.ownerUserId, userId),
        eq(listings.status, "draft"),
      ))
      .limit(1);
    if (!draft) return null;
    identity = draft;
  } else {
    identity = await resolvePublisher(userId);
  }
  const [agent, agency] = await Promise.all([
    identity.agentId == null ? null : db
      .select({ whatsapp: agents.whatsapp }).from(agents)
      .where(eq(agents.id, identity.agentId)).limit(1).then(rows => rows[0]),
    identity.agencyId == null ? null : db
      .select({ whatsapp: agencies.whatsapp }).from(agencies)
      .where(eq(agencies.id, identity.agencyId)).limit(1).then(rows => rows[0]),
  ]);
  return {
    professional: identity.agentId != null || identity.agencyId != null,
    whatsapp: agent?.whatsapp ?? agency?.whatsapp ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Reference data for the wizard selects                               */
/* ------------------------------------------------------------------ */

export interface PublishLocation {
  id: number;
  label: string; // "Recoleta, Asunción" (barrio) or "Asunción" (ciudad)
}

/**
 * Ciudad + barrio options for the location step, each labelled with its parent
 * city so duplicate barrio names stay distinguishable. Ordered city-first.
 */
export async function listPublishLocations(): Promise<PublishLocation[]> {
  const rows = await db
    .select({
      id: locations.id,
      level: locations.level,
      name: locations.name,
      parentId: locations.parentId,
    })
    .from(locations)
    .orderBy(asc(locations.name));

  const nameById = new Map(rows.map((r) => [r.id, r.name]));
  return rows
    .filter((r) => r.level === "ciudad" || r.level === "barrio")
    .map((r) => ({
      id: r.id,
      label:
        r.level === "barrio" && r.parentId
          ? `${r.name}, ${nameById.get(r.parentId) ?? ""}`.replace(/, $/, "")
          : r.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

export interface NearbyProject {
  id: number;
  name: string;
  locationId: number;
}

/** Projects for the "proyecto cercano" autocomplete (preventa units attach to a building). */
export async function listNearbyProjects(): Promise<NearbyProject[]> {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      locationId: projects.locationId,
    })
    .from(projects)
    .orderBy(asc(projects.name));
}

/** Active financing programs as plain numbers for the client-side cuota preview. */
export async function listActiveFinancingPrograms(): Promise<FinancingProgram[]> {
  const rows = await db
    .select()
    .from(financingPrograms)
    .where(eq(financingPrograms.active, true));
  return rows.map((p) => ({
    code: p.code,
    name: p.name,
    annualRate: Number(p.annualRate),
    maxTermMonths: p.maxTermMonths,
    maxAmountGs: p.maxAmountGs != null ? Number(p.maxAmountGs) : null,
    minDownPct: Number(p.minDownPct),
    active: p.active,
  }));
}

/* ------------------------------------------------------------------ */
/* Draft CRUD — every operation scoped to the owning user              */
/* ------------------------------------------------------------------ */

/** The wizard's persisted core. Optional fields are null until their step. */
export interface DraftInput {
  operation: Operation;
  propertyType: PropertyType;
  title: string;
  descriptionEs?: string | null;
  priceAmount: number;
  priceCurrency: "USD" | "PYG";
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking?: number | null;
  areaM2?: number | null;
  landM2?: number | null;
  locationId: number;
  projectId?: number | null;
  videoUrl?: string | null;
  foreignExposure: boolean;
}

export interface DraftRow extends DraftInput {
  id: number;
  publicId: string;
  slug: string;
  status: (typeof listings.$inferSelect)["status"];
}

/** Hydrate a draft the user owns (for resuming the wizard); null otherwise. */
export async function getUserDraft(
  userId: number,
  draftId: number,
): Promise<DraftRow | null> {
  const [row] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, draftId), eq(listings.ownerUserId, userId)))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    publicId: row.publicId,
    slug: row.slug,
    status: row.status,
    operation: row.operation,
    propertyType: row.propertyType,
    title: row.title,
    descriptionEs: row.descriptionEs,
    priceAmount: Number(row.priceAmount),
    priceCurrency: row.priceCurrency,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking,
    areaM2: row.areaM2 != null ? Number(row.areaM2) : null,
    landM2: row.landM2 != null ? Number(row.landM2) : null,
    locationId: row.locationId,
    projectId: row.projectId,
    videoUrl: row.videoUrl,
    foreignExposure: row.foreignExposure,
  };
}

/** Fields the wizard controls, shared by insert and update. */
async function draftFields(input: DraftInput, agencyId: number | null) {
  return {
    operation: input.operation,
    propertyType: input.propertyType,
    title: input.title.slice(0, 180),
    descriptionEs: input.descriptionEs ?? null,
    priceAmount: input.priceAmount.toFixed(2),
    priceCurrency: input.priceCurrency,
    priceUsd: toPriceUsd(
      input.priceAmount,
      input.priceCurrency,
      await getUsdToPygRate(),
    ).toFixed(2),
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    parking: input.parking ?? null,
    areaM2: input.areaM2 != null ? input.areaM2.toString() : null,
    landM2: input.landM2 != null ? input.landM2.toString() : null,
    locationId: input.locationId,
    projectId: input.projectId ?? null,
    agencyId,
    videoUrl: input.videoUrl ?? null,
    foreignExposure: input.foreignExposure,
  };
}

/**
 * Create or update the caller's draft. On create the row is stamped with a
 * public_id, a title slug and ownerUserId; on update those identity columns are
 * left untouched (never recompute a slug — SEO contract). The update is scoped
 * to (id, ownerUserId, status='draft') so a published/removed row can't be
 * mutated back into a draft, and no other user's draft can be touched.
 * Returns the draft id (0 when an update matched nothing).
 * New rows resolve both professional IDs from the authenticated user's agent
 * profile. Private sellers have no such row, so their agentId stays null.
 */
export async function saveDraft(params: {
  userId: number;
  draftId: number | null;
  input: DraftInput;
}): Promise<number> {
  const { userId, draftId, input } = params;
  const { agentId, agencyId } = await resolvePublisher(userId);
  const fields = await draftFields(input, agencyId);

  if (draftId) {
    const [res] = await db
      .update(listings)
      .set(fields)
      .where(
        and(
          eq(listings.id, draftId),
          eq(listings.ownerUserId, userId),
          eq(listings.status, "draft"),
        ),
      );
    if (res.affectedRows === 0) return 0;
    // The wizard has no coordinate field, so a draft is plotted at its
    // location's centroid — and step 2 is where the visitor can change that
    // location. src/lib/geo.ts owns the rule.
    await syncDisplayCoords(db, draftId);
    return draftId;
  }

  const [res] = await db.insert(listings).values({
    publicId: makePublicId(),
    slug: slugify(input.title) || "propiedad",
    status: "draft",
    ownerUserId: userId,
    agentId,
    ...fields,
  });
  const newId = Number((res as unknown as { insertId: number }).insertId);
  await syncDisplayCoords(db, newId);
  return newId;
}

/**
 * Submit a draft for review after OTP (draft → pending_review). Scoped to the
 * owner and status='draft' so it's idempotent and can't jump a published row
 * back into the queue. `isVerified` reflects the WhatsApp-verified publisher
 * (the ✓ badge basis). Returns rows affected.
 */
export async function submitDraftForReview(params: {
  userId: number;
  draftId: number;
  verified: boolean;
}): Promise<number> {
  const [res] = await db
    .update(listings)
    .set({ status: "pending_review", isVerified: params.verified })
    .where(
      and(
        eq(listings.id, params.draftId),
        eq(listings.ownerUserId, params.userId),
        eq(listings.status, "draft"),
        // A draft may be saved before its price step (saveDraftAction), but it
        // never reaches the review queue without one.
        sql`${listings.priceAmount} > 0`,
      ),
    );
  return res.affectedRows;
}
