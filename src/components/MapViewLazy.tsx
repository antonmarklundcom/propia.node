"use client";

import dynamic from "next/dynamic";
import type { MapViewQuery } from "./MapView";

/**
 * Same ssr:false boundary pattern as ListingMapLazy — keeps maplibre-gl and
 * supercluster out of the category page's synchronous bundle.
 */
const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="map-view" />,
});

export function MapViewLazy(props: {
  center: { lat: number; lng: number };
  zoom?: number;
  query: MapViewQuery;
}) {
  return <MapView {...props} />;
}
