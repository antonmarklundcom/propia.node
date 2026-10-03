import type { Metadata } from "next";
import { PlaceGuide, placeMetadata } from "@/components/place/PlaceGuide";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ ciudad: string; barrio: string }> };

/** A barrio guide: `/zonas/<ciudad>/<barrio>` (plan phase 4, decision P-1). */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { ciudad, barrio } = await params;
  return placeMetadata(ciudad, barrio);
}

export default async function BarrioPlacePage({ params }: Params) {
  const { ciudad, barrio } = await params;
  return <PlaceGuide citySlug={ciudad} barrioSlug={barrio} />;
}
