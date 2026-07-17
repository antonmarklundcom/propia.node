import type maplibregl from "maplibre-gl";

/**
 * Free ($0) raster OSM style — no API key. Fine for current traffic; revisit
 * (MapTiler/Stadia free tier) per OSM's tile usage policy if traffic grows
 * (ARCHITECTURE.md §1: MapLibre + OSM, "token swap" to a paid tile provider
 * later needs no code change beyond this style object). Shared by every
 * MapLibre instance (listing detail pin, category map view) so a provider
 * swap is a one-file change.
 */
export const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};
