/**
 * The rows behind /admin/proyectos: every project with its developer and how
 * many published sale listings sit in it — the listings whose cuota the
 * Che Róga Porã switch changes (`programsForListing()`, `src/lib/cuota.ts`).
 * Uncached on purpose: an operator flips a switch and reloads.
 */
import "server-only";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { developers, financingPrograms, listings, projects } from "@/db/schema";
import { CHE_ROGA_CODE } from "@/lib/cuota";

export interface AdminProjectRow {
  id: number;
  name: string;
  projectType: string;
  developerName: string | null;
  saleListings: number;
  cheRogaApproved: boolean;
}

export async function listAdminProjects(): Promise<{ rows: AdminProjectRow[]; programLoaded: boolean }> {
  const [base, counts, program] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        projectType: projects.projectType,
        developerName: developers.name,
        cheRogaApproved: projects.cheRogaApproved,
      })
      .from(projects)
      .leftJoin(developers, eq(developers.id, projects.developerId))
      .orderBy(projects.name),
    db
      .select({ projectId: listings.projectId, n: count() })
      .from(listings)
      .where(and(eq(listings.operation, "venta"), inArray(listings.status, ["published"])))
      .groupBy(listings.projectId),
    db.select({ code: financingPrograms.code }).from(financingPrograms).where(eq(financingPrograms.code, CHE_ROGA_CODE)).limit(1),
  ]);
  const byProject = new Map(counts.filter((c) => c.projectId != null).map((c) => [c.projectId as number, Number(c.n)]));
  return {
    rows: base.map((r) => ({ ...r, saleListings: byProject.get(r.id) ?? 0 })),
    programLoaded: program.length > 0,
  };
}

export async function getProjectName(id: number): Promise<string | null> {
  const [row] = await db.select({ name: projects.name }).from(projects).where(eq(projects.id, id)).limit(1);
  return row?.name ?? null;
}
