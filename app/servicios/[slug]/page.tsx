import type { Metadata } from "next";
import { RentalServiceBody, rentalServiceMetadata } from "@/lib/rental-routes";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return rentalServiceMetadata(slug, "es");
}

/** One service page at its Spanish URL — see `app/servicios/page.tsx`. */
export default async function ServicioPage({ params }: Params) {
  const { slug } = await params;
  return <RentalServiceBody slug={slug} routeLocale="es" />;
}
