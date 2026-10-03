import type { Metadata } from "next";
import { PlaceGuide, placeMetadata } from "@/components/place/PlaceGuide";

// Reads the Host header (door, brand, canonical), like every public route.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ciudad: string }> };

/** A city guide: `/zonas/<ciudad>` (plan phase 4, decision P-1). */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { ciudad } = await params;
  return placeMetadata(ciudad);
}

export default async function CityPlacePage({ params }: Params) {
  const { ciudad } = await params;
  return <PlaceGuide citySlug={ciudad} />;
}
