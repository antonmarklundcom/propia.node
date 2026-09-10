import type { Metadata } from "next";
import { RentalServiceBody, rentalServiceMetadata } from "@/lib/rental-routes";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return rentalServiceMetadata(slug, "en");
}

/** One service page at its English URL — see `app/servicios/[slug]/page.tsx`. */
export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  return <RentalServiceBody slug={slug} routeLocale="en" />;
}
