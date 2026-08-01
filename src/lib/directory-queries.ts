/**
 * Read queries for the public directory + institutional pages
 * (/inmobiliarias, /proyectos, /financiamiento).
 *
 * Separate from queries.ts on purpose: that module is the hot path for
 * search, category and detail pages. These run on a handful of low-traffic
 * pages and aggregate across whole tables, so keeping them apart keeps the
 * hot module's surface honest.
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  agencies,
  agents,
  developers,
  financingPrograms,
  listings,
  locations,
  projects,
} from "../db/schema";
import { projectCardsFrom } from "./queries";
import type { ProjectCard } from "./queries";

export interface AgencyDirectoryRow {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  isVerified: boolean;
  plan: "free" | "destacado" | "partner";
  listingCount: number;
  agentCount: number;
  /** Cities where this agency has published inventory, most listings first. */
  cities: string[];
}

/**
 * Every agency that has at least one published listing, ordered by plan then
 * inventory size. Agencies with nothing live are excluded — a directory of
 * empty profiles is worse than a short directory.
 */
export async function listAgenciesForDirectory(): Promise<AgencyDirectoryRow[]> {
  const rows = await db
    .select({
      id: agencies.id,
      name: agencies.name,
      slug: agencies.slug,
      logoUrl: agencies.logoUrl,
      isVerified: agencies.isVerified,
      plan: agencies.plan,
      listingCount: sql<number>`COUNT(DISTINCT ${listings.id})`,
    })
    .from(agencies)
    .innerJoin(
      listings,
      and(
        eq(listings.agencyId, agencies.id),
        eq(listings.status, "published"),
      ),
    )
    .groupBy(
      agencies.id,
      agencies.name,
      agencies.slug,
      agencies.logoUrl,
      agencies.isVerified,
      agencies.plan,
    )
    .orderBy(desc(sql`COUNT(DISTINCT ${listings.id})`));

  if (rows.length === 0) return [];

  // City spread + team size, one query each rather than N per agency.
  // Listings hang off either a ciudad or one of its barrios, so the location
  // names are rolled up to ciudad level in memory — a directory card saying
  // "Recoleta · Villa Morra" instead of "Asunción" reads as noise.
  const [locRows, listingLocRows, agentRows] = await Promise.all([
    db
      .select({
        id: locations.id,
        name: locations.name,
        level: locations.level,
        parentId: locations.parentId,
      })
      .from(locations),
    db
      .select({
        agencyId: listings.agencyId,
        locationId: listings.locationId,
        n: sql<number>`COUNT(*)`,
      })
      .from(listings)
      .where(eq(listings.status, "published"))
      .groupBy(listings.agencyId, listings.locationId),
    db
      .select({ agencyId: agents.agencyId, n: sql<number>`COUNT(*)` })
      .from(agents)
      .groupBy(agents.agencyId),
  ]);

  const locById = new Map(locRows.map((l) => [l.id, l]));
  const cityNameOf = (locationId: number): string | null => {
    const loc = locById.get(locationId);
    if (!loc) return null;
    if (loc.level === "ciudad") return loc.name;
    const parent = loc.parentId != null ? locById.get(loc.parentId) : undefined;
    return parent?.level === "ciudad" ? parent.name : null;
  };

  // Rank cities by how much inventory the agency has there, keep the top 3.
  const cityTotals = new Map<number, Map<string, number>>();
  for (const r of listingLocRows) {
    if (r.agencyId == null) continue;
    const city = cityNameOf(r.locationId);
    if (!city) continue;
    const totals = cityTotals.get(r.agencyId) ?? new Map<string, number>();
    totals.set(city, (totals.get(city) ?? 0) + Number(r.n));
    cityTotals.set(r.agencyId, totals);
  }
  const citiesByAgency = new Map<number, string[]>(
    [...cityTotals].map(([agencyId, totals]) => [
      agencyId,
      [...totals]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name),
    ]),
  );
  const agentsByAgency = new Map(
    agentRows
      .filter((r) => r.agencyId != null)
      .map((r) => [r.agencyId as number, Number(r.n)]),
  );

  const planRank: Record<string, number> = { partner: 0, destacado: 1, free: 2 };
  return rows
    .map((r) => ({
      ...r,
      listingCount: Number(r.listingCount),
      agentCount: agentsByAgency.get(r.id) ?? 0,
      cities: citiesByAgency.get(r.id) ?? [],
    }))
    .sort(
      (a, b) =>
        (planRank[a.plan] ?? 9) - (planRank[b.plan] ?? 9) ||
        b.listingCount - a.listingCount,
    );
}

/** Every project, newest first — the /proyectos index. */
export async function listAllProjects(limit = 60): Promise<ProjectCard[]> {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      projectType: projects.projectType,
      stage: projects.stage,
      deliveryDate: projects.deliveryDate,
      heroImageUrl: projects.heroImageUrl,
      developerName: developers.name,
      cityName: locations.name,
    })
    .from(projects)
    .leftJoin(developers, eq(projects.developerId, developers.id))
    .leftJoin(locations, eq(projects.locationId, locations.id))
    .orderBy(desc(projects.id))
    .limit(limit);
  return projectCardsFrom(rows);
}

export type FinancingProgramRow = typeof financingPrograms.$inferSelect;

/** Active financing programs, cheapest rate first — /financiamiento. */
export async function listFinancingPrograms(): Promise<FinancingProgramRow[]> {
  return db
    .select()
    .from(financingPrograms)
    .where(eq(financingPrograms.active, true))
    .orderBy(asc(financingPrograms.annualRate));
}

export interface PortalStats {
  listings: number;
  agencies: number;
  cities: number;
  projects: number;
}

/**
 * Headline counts for /nosotros and /para-inmobiliarias. Real numbers only —
 * whatever the DB says is what the page shows, including zero.
 */
export async function getPortalStats(): Promise<PortalStats> {
  const [[l], [a], [c], [p]] = await Promise.all([
    db
      .select({ n: sql<number>`COUNT(*)` })
      .from(listings)
      .where(eq(listings.status, "published")),
    db
      .select({ n: sql<number>`COUNT(DISTINCT ${listings.agencyId})` })
      .from(listings)
      .where(eq(listings.status, "published")),
    db
      .select({ n: sql<number>`COUNT(DISTINCT ${listings.locationId})` })
      .from(listings)
      .where(eq(listings.status, "published")),
    db.select({ n: sql<number>`COUNT(*)` }).from(projects),
  ]);
  return {
    listings: Number(l?.n ?? 0),
    agencies: Number(a?.n ?? 0),
    cities: Number(c?.n ?? 0),
    projects: Number(p?.n ?? 0),
  };
}
