"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { OSM_STYLE } from "@/lib/mapStyle";

/**
 * Approximate-location map for the listing detail page. Deliberately centers
 * on the barrio/city, never the listing's exact lat/lng (schema.ts: precise
 * coordinates are "never shown publicly at full precision") — a soft circle
 * marker signals "somewhere around here", not a pin on the exact building.
 */
export function ListingMap({ lat, lng, zoom = 14 }: { lat: number; lng: number; zoom?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [lng, lat],
      zoom,
      attributionControl: false,
      interactive: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    const marker = document.createElement("div");
    marker.className = "listing-map__marker";
    new maplibregl.Marker({ element: marker }).setLngLat([lng, lat]).addTo(map);

    return () => map.remove();
  }, [lat, lng, zoom]);

  return <div ref={containerRef} className="listing-map" />;
}
