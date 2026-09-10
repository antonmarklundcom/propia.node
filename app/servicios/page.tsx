import type { Metadata } from "next";
import { RentalHubBody, rentalHubMetadata } from "@/lib/rental-routes";

// Reads the request's host and locale, like every other public route here.
export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return rentalHubMetadata();
}

/**
 * The rental family's services index, at its **Spanish** URL. The English
 * rental door serves the same page at `/services` and is redirected there;
 * every non-rental door redirects to `/`. Both rules, and everything the page
 * renders, live in `src/lib/rental-routes.tsx` — see its header for why.
 */
export default function ServiciosPage() {
  return <RentalHubBody routeLocale="es" />;
}
