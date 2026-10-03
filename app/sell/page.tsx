import type { Metadata } from "next";
import { SellerLanding, sellerMetadata } from "@/components/SellerLanding";

// The English door's address for the seller page (Spanish: /vender). Same
// component; SellerLanding redirects the wrong spelling to the right one.
export const dynamic = "force-dynamic";

export const generateMetadata = (): Promise<Metadata> => sellerMetadata();

export default function SellPage() {
  return <SellerLanding route="/sell" />;
}
