import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { RentalContact } from "@/components/RentalContact";
import { rentalContactMetadata, rentalRouteGate } from "@/lib/rental-routes";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return rentalContactMetadata();
}

/**
 * The rental business's contact page at its **English** URL (R2) — the twin of
 * the rental branch inside `app/contacto/page.tsx`; see `app/about/page.tsx`
 * for why the marketplace half stays where it is.
 */
export default async function ContactPage() {
  const vertical = await rentalRouteGate("contact", "en");
  return <RentalContact d={await dict()} locale={vertical.locale} />;
}
