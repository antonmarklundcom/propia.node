import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { RentalAbout } from "@/components/RentalAbout";
import { rentalAboutMetadata, rentalRouteGate } from "@/lib/rental-routes";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return rentalAboutMetadata();
}

/**
 * The rental business's "about" page at its **English** URL (R2).
 *
 * Deliberately not a branch of `app/nosotros/page.tsx`: that route's other
 * half is the *marketplace's* about page, which `realestateinparaguay.com`
 * serves in English at `/nosotros` and which R2 does not touch. Two page types
 * that happen to answer the same question are not one route.
 */
export default async function AboutPage() {
  await rentalRouteGate("about", "en");
  return <RentalAbout d={await dict()} />;
}
