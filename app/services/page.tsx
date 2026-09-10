import type { Metadata } from "next";
import { RentalHubBody, rentalHubMetadata } from "@/lib/rental-routes";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return rentalHubMetadata();
}

/**
 * The rental family's services index, at its **English** URL (R2) — the twin
 * of `app/servicios/page.tsx`, which carries the explanation. `rentparaguay.com`
 * serves this one; `alquiler.com.py` is redirected to the Spanish path and
 * every non-rental door to `/`.
 */
export default function ServicesPage() {
  return <RentalHubBody routeLocale="en" />;
}
