/**
 * npm run maps:contact-sheet [-- --out <file.svg>] [-- --only <city-slug>]
 *
 * One SVG with every outline `maps:fetch` stored — each city, and each of its
 * tree barrios — with its name, how it was matched (OSM relation id and
 * admin_level, or "circle fallback"), so the founder can eyeball the shapes
 * against the places as people know them before `maps:render` turns them
 * into images (docs/plan-category-pages-build.md §5.5). Open it in a browser.
 *
 * Writes `maps-contact-sheet.svg` in the current directory by default
 * (git-ignored: it is a review aid built from ODbL data, not a site file).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { PALETTE, VIEWBOX, renderZoneMapSvg, type ZoneMapRef } from "../src/lib/zone-map/svg";
import { isCircle, type GeoFile, type PlaceGeo } from "../src/lib/zone-map/types";
import { onlyFlag, readGeoFiles } from "./maps-common";

const COLS = 4;
const CELL_W = 360;
const CELL_MAP_H = Math.round((CELL_W * VIEWBOX["4:3"].h) / VIEWBOX["4:3"].w);
const CAPTION_H = 44;
const GAP = 16;

function outFlag(): string {
  const argv = process.argv.slice(2);
  const eq = argv.find((a) => a.startsWith("--out="));
  if (eq) return eq.slice("--out=".length);
  const i = argv.indexOf("--out");
  return i !== -1 && argv[i + 1] ? argv[i + 1] : "maps-contact-sheet.svg";
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function how(p: PlaceGeo): string {
  return isCircle(p) ? "circle fallback (tree centroid)" : `OSM ${p.osmType} ${p.osmId}, admin_level ${p.adminLevel ?? "?"}`;
}

function main(): void {
  const only = onlyFlag();
  const geos: GeoFile[] = readGeoFiles().filter((g) => !only || g.citySlug === only);
  const cells: { geo: GeoFile; ref: ZoneMapRef; title: string; sub: string }[] = [];
  for (const geo of geos) {
    cells.push({ geo, ref: { citySlug: geo.citySlug }, title: geo.city.name, sub: how(geo.city) });
    for (const b of geo.barrios) {
      if (!b.inTree) continue;
      cells.push({ geo, ref: { citySlug: geo.citySlug, barrioSlug: b.slug }, title: `${geo.city.name} / ${b.name}`, sub: how(b) });
    }
  }
  const rows = Math.max(1, Math.ceil(cells.length / COLS));
  const width = COLS * CELL_W + (COLS + 1) * GAP;
  const height = rows * (CELL_MAP_H + CAPTION_H) + (rows + 1) * GAP;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="DejaVu Sans, Verdana, Arial, sans-serif">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
  ];
  if (cells.length === 0) {
    parts.push(`<text x="${GAP}" y="${GAP + 20}" font-size="16" fill="${PALETTE.ink}">No geo files yet: run npm run maps:fetch first.</text>`);
  }
  cells.forEach((c, i) => {
    const x = GAP + (i % COLS) * (CELL_W + GAP);
    const y = GAP + Math.floor(i / COLS) * (CELL_MAP_H + CAPTION_H + GAP);
    const svg = renderZoneMapSvg(c.geo, c.ref, { pixelWidth: CELL_W, idPrefix: `c${i}-` });
    // Nest the map as a positioned <svg>: swap its root attributes for x/y.
    parts.push(svg.replace(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" /, `<svg x="${x}" y="${y}" `));
    parts.push(
      `<text x="${x}" y="${y + CELL_MAP_H + 18}" font-size="14" font-weight="700" fill="${PALETTE.ink}">${esc(c.title)}</text>`,
      `<text x="${x}" y="${y + CELL_MAP_H + 36}" font-size="12" fill="${PALETTE.inkSecondary}">${esc(c.sub)}</text>`,
    );
  });
  parts.push("</svg>\n");
  const out = path.resolve(outFlag());
  writeFileSync(out, parts.join("\n"));
  console.log(`${cells.length} outline(s) → ${out}`);
}

main();
