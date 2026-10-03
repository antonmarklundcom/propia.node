import type { Metadata } from "next";
import { SellerLanding, sellerMetadata } from "@/components/SellerLanding";

// Reads the live city list; the DB isn't reachable at build time on Hostinger
// (same reason /tasacion and /para-inmobiliarias carry this).
export const dynamic = "force-dynamic";

export const generateMetadata = (): Promise<Metadata> => sellerMetadata();

export default function VenderPage() {
  return <SellerLanding route="/vender" />;
}
