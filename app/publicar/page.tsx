import type { Metadata } from "next";
import { homeForRole, requireUser } from "@/lib/auth/guards";
import {
  getUserDraft,
  listActiveFinancingPrograms,
  listNearbyProjects,
  listPublishLocations,
  USD_TO_PYG,
} from "@/lib/publish-queries";
import { esPublish } from "@/i18n/es";
import {
  PublishWizard,
  type InitialDraft,
} from "@/components/publish/PublishWizard";
import { listListingImages, type ListingImageRow } from "@/lib/listing-images";

export const metadata: Metadata = {
  title: "Publicá tu propiedad — Homes Paraguay",
  robots: { index: false, follow: false },
};

// Draft state is per-user; never statically cache the wizard.
export const dynamic = "force-dynamic";

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const user = await requireUser("/publicar");
  const { draft } = await searchParams;

  const [locations, projects, programs] = await Promise.all([
    listPublishLocations(),
    listNearbyProjects(),
    listActiveFinancingPrograms(),
  ]);

  // Resume an existing draft only if it belongs to the signed-in user.
  let initialDraft: InitialDraft | null = null;
  let initialPhotos: ListingImageRow[] = [];
  const draftId = Number(draft);
  if (Number.isInteger(draftId) && draftId > 0) {
    const row = await getUserDraft(user.id, draftId);
    if (row) {
      initialDraft = {
        draftId: row.id,
        operation: row.operation,
        propertyType: row.propertyType,
        title: row.title,
        descriptionEs: row.descriptionEs ?? "",
        bedrooms: row.bedrooms != null ? String(row.bedrooms) : "",
        bathrooms: row.bathrooms != null ? String(row.bathrooms) : "",
        parking: row.parking != null ? String(row.parking) : "",
        areaM2: row.areaM2 != null ? String(row.areaM2) : "",
        landM2: row.landM2 != null ? String(row.landM2) : "",
        locationId: row.locationId,
        projectId: row.projectId,
        priceCurrency: row.priceCurrency,
        priceAmount: String(row.priceAmount),
        videoUrl: row.videoUrl ?? "",
        foreignExposure: row.foreignExposure,
      };
      // Same owner scope the upload action uses, so a resumed draft shows the
      // photos already stored for it.
      initialPhotos = await listListingImages(row.id, {
        kind: "owner",
        userId: user.id,
      });
    }
  }

  return (
    <main className="site-main wizard-wrap">
      <header className="wizard-head">
        <h1 className="wizard-head__title">{esPublish.pageTitle}</h1>
        <p className="wizard-head__subtitle">{esPublish.pageSubtitle}</p>
      </header>
      <PublishWizard
        locations={locations}
        projects={projects}
        programs={programs}
        usdToPyg={USD_TO_PYG}
        initialDraft={initialDraft}
        initialPhotos={initialPhotos}
        homeHref={homeForRole(user)}
      />
    </main>
  );
}
