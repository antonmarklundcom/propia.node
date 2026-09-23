"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/i18n";

/**
 * Same reason as ListingMapLazy: keeps maplibre-gl (~270kB) out of the
 * category page's hydration bundle, so the list view — which is what most
 * visitors and every crawler see — never downloads the map engine.
 */
const CategoryMap = dynamic(
  () => import("./CategoryMap").then((m) => m.CategoryMap),
  { ssr: false, loading: () => <div className="map-view map-view--loading" /> },
);

export function CategoryMapLazy(props: {
  centerLat: number;
  centerLng: number;
  zoom?: number;
  query: Record<string, string>;
  locale: Locale;
}) {
  return <CategoryMap {...props} />;
}
