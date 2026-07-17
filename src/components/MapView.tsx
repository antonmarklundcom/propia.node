"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import { OSM_STYLE } from "@/lib/mapStyle";
import type { Operation, PropertyType } from "@/lib/import/types";

interface PointProps {
  id: number;
  url: string;
  title: string;
  priceLabel: string;
  bedrooms: number | null;
  coverUrl: string | null;
}

export interface MapViewQuery {
  operation: Operation;
  locationIds: number[];
  type?: PropertyType;
  priceMin?: number;
  priceMax?: number;
  minBedrooms?: number;
}

const cluster = new Supercluster<PointProps>({ radius: 60, maxZoom: 17 });

function fetchUrl(bounds: maplibregl.LngLatBounds, q: MapViewQuery): string {
  const params = new URLSearchParams({
    minLat: String(bounds.getSouth()),
    maxLat: String(bounds.getNorth()),
    minLng: String(bounds.getWest()),
    maxLng: String(bounds.getEast()),
    operation: q.operation,
    locationIds: q.locationIds.join(","),
  });
  if (q.type) params.set("type", q.type);
  if (q.priceMin != null) params.set("precioMin", String(q.priceMin));
  if (q.priceMax != null) params.set("precioMax", String(q.priceMax));
  if (q.minBedrooms != null) params.set("dormitorios", String(q.minBedrooms));
  return `/api/listings/map?${params}`;
}

/**
 * Split map view for a category page (ARCHITECTURE.md §6 M4). Fetches
 * listings inside the current viewport on every pan/zoom, clusters them
 * client-side with supercluster, and renders plain DOM markers — no React
 * reconciliation for potentially hundreds of pins. Same operation/type/
 * location/price/bedroom narrowing as the list view (see MapViewQuery),
 * so switching tabs never shows a different result set.
 */
export function MapView({
  center,
  zoom = 12,
  query,
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  query: MapViewQuery;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    let cancelled = false;

    function clearMarkers() {
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
    }

    async function refresh() {
      const bounds = map.getBounds();
      const res = await fetch(fetchUrl(bounds, query));
      if (cancelled || !res.ok) return;
      const geojson = await res.json();
      cluster.load(geojson.features);
      render();
    }

    function render() {
      clearMarkers();
      const b = map.getBounds();
      const bbox: [number, number, number, number] = [
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth(),
      ];
      const items = cluster.getClusters(bbox, Math.round(map.getZoom()));

      for (const item of items) {
        const [lng, lat] = item.geometry.coordinates;
        const el = document.createElement("div");

        if ("cluster" in item.properties) {
          const clusterItem = item as Supercluster.ClusterFeature<PointProps>;
          const count = clusterItem.properties.point_count;
          el.className = "map-view__cluster";
          el.textContent = String(clusterItem.properties.point_count_abbreviated);
          el.style.width = el.style.height = `${28 + Math.min(count, 50)}px`;
          el.onclick = () => {
            const expansionZoom = Math.min(
              cluster.getClusterExpansionZoom(clusterItem.properties.cluster_id),
              20,
            );
            map.easeTo({ center: [lng, lat], zoom: expansionZoom });
          };
        } else {
          const p = item.properties as PointProps;
          el.className = "map-view__pin";
          el.textContent = p.priceLabel;
          el.onclick = () => {
            window.location.href = p.url;
          };
        }

        markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map));
      }
    }

    let debounceTimer: ReturnType<typeof setTimeout>;
    const onMoveEnd = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(refresh, 250);
    };

    map.on("load", refresh);
    map.on("moveend", onMoveEnd);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
      clearMarkers();
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- query/center/zoom are the initial viewport; the map owns pan/zoom state after mount
  }, []);

  return <div ref={containerRef} className="map-view" />;
}
