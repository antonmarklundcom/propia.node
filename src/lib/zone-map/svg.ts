/**
 * Zone-map SVG builder (docs/plan-category-pages-build.md, phase 7). Pure: a
 * geo file and a page reference in, an SVG string out — no fs, no fonts, no
 * clock, no randomness, so the same input gives a byte-identical SVG
 * (`verify:maps` hashes it). `maps:render` turns the string into WebP with
 * sharp; nothing here runs at request time.
 *
 * Copy is never decided here: the badge's words arrive in the ref
 * (`operation`), already in the page's language. The one fixed string is the
 * in-image credit, "© OpenStreetMap", which the ODbL attribution requires on
 * the image itself so a shared or hot-linked copy keeps it.
 */
import type { PropertyType } from "../import/types";
import { bboxAround, bboxOf, polygonPoints, polygonsCentroid, type BBox, type LngLat, type Polygon, type Ring } from "./geometry";
import { isCircle, type GeoFile, type PlaceGeo } from "./types";

export interface ZoneMapRef {
  citySlug: string;
  barrioSlug?: string;
  /** The badge's words in the page's language, e.g. "Casas en venta". Shown only with `type`. */
  operation?: string;
  /** Draws the type badge (icon + `operation`) when set. */
  type?: PropertyType;
}

export type ZoneMapVariant = "4:3" | "og";

/** Internal coordinate space; the pixel size is only the width/height attributes. */
export const VIEWBOX: Record<ZoneMapVariant, { w: number; h: number }> = {
  "4:3": { w: 1200, h: 900 },
  og: { w: 1200, h: 630 },
};

export const IMAGE_CREDIT = "© OpenStreetMap";

/**
 * Colours, hard-coded from the site's design tokens: the `:root` block of
 * `app/globals.css` (design tokens v4 "Editorial" — both marketplace doors
 * render it since the per-door overrides were deleted, see
 * docs/visual-identity-2026-09.md §1). A token that has no map equivalent is
 * a mix of two tokens, named in its comment.
 */
export const PALETTE = {
  /** --color-background */
  background: "#F6F3EC",
  /** --color-surface: land inside the city */
  land: "#FFFFFF",
  /** --color-primary: outlines, badge ground */
  primary: "#0E1F17",
  /** --color-accent: the page's zone, badge icon */
  accent: "#C19A4D",
  /** --color-accent-soft: label halos on land */
  accentSoft: "#F1EDE4",
  /** --color-ink: the zone's label */
  ink: "#16211B",
  /** --color-ink-secondary: neighbour labels, credit */
  inkSecondary: "#56605A",
  /** --color-ink-muted: barrio outlines, roads */
  inkMuted: "#7D857F",
  /** --color-primary at 14% over --color-background: water, cool and quiet */
  water: "#D6D7D0",
  /** white: badge text (on --color-primary, 17:1) */
  onPrimary: "#FFFFFF",
} as const;

const FONT = "DejaVu Sans, Verdana, Arial, Helvetica, sans-serif";
const MARGIN = 28;
/** A fallback circle's radius: a city ~2.5 km, a barrio ~600 m. */
const CIRCLE_RADIUS_M = { city: 2500, barrio: 600 } as const;

/**
 * One icon per property type, 24×24, stroked. `Record<PropertyType, …>` so a
 * new type is a type error here until it has an icon.
 */
export const TYPE_ICONS: Record<PropertyType, string> = {
  casa: "M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-6h4v6",
  departamento: "M6 21V3h12v18M4 21h16M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2",
  terreno: "M3 19l4-10h14l-4 10H3zM12 9V3l4 2-4 2",
  duplex: "M2 12l5.5-5 5.5 5M11 12l5.5-5 5.5 5M3.5 11v9h17v-9M12 20v-8M6 20v-4h3v4M15 20v-4h3v4",
  comercial: "M3 9l2-5h14l2 5H3zM3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8M10 20v-5h4v5",
  oficina: "M3 8h18v12H3zM8 8V5h8v3M3 13h18M11 13v2h2v-2",
  deposito: "M2 10l10-6 10 6M4 9v11h16V9M8 20v-7h8v7M8 16h8",
  quinta: "M7 20v-5M7 15a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM12 13l5-4 5 4M13 12v8h8v-8M2 20h20",
};

function fmt(n: number): string {
  const s = n.toFixed(1);
  return s === "-0.0" ? "0.0" : s;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Rough text width: average glyph ≈ 0.6 em (0.68 em bold) in DejaVu Sans, the widest likely fallback. Crude on purpose. */
function textWidth(s: string, size: number, bold = false): number {
  return [...s].length * size * (bold ? 0.68 : 0.6);
}

class Projection {
  readonly k: number;
  readonly scale: number;
  readonly cLng: number;
  readonly cLat: number;
  constructor(
    frame: BBox,
    readonly w: number,
    readonly h: number,
  ) {
    this.cLng = (frame.minLng + frame.maxLng) / 2;
    this.cLat = (frame.minLat + frame.maxLat) / 2;
    this.k = Math.cos((this.cLat * Math.PI) / 180);
    const fw = Math.max((frame.maxLng - frame.minLng) * this.k, 1e-9);
    const fh = Math.max(frame.maxLat - frame.minLat, 1e-9);
    this.scale = Math.min((w - 2 * MARGIN) / fw, (h - 2 * MARGIN) / fh);
  }
  x(lng: number): number {
    return this.w / 2 + (lng - this.cLng) * this.k * this.scale;
  }
  y(lat: number): number {
    return this.h / 2 - (lat - this.cLat) * this.scale;
  }
  /** Metres → viewBox units. */
  metres(m: number): number {
    return (m / 111_320) * this.scale;
  }
  visible(b: BBox): boolean {
    return !(this.x(b.maxLng) < 0 || this.x(b.minLng) > this.w || this.y(b.minLat) < 0 || this.y(b.maxLat) > this.h);
  }
}

function ringPath(r: Ring, p: Projection): string {
  let d = "";
  for (let i = 0; i < r.length - 1; i++) d += `${i === 0 ? "M" : "L"}${fmt(p.x(r[i][0]))} ${fmt(p.y(r[i][1]))}`;
  return d + "Z";
}

function polygonsPath(ps: Polygon[], p: Projection): string {
  let d = "";
  for (const poly of ps) {
    const b = bboxOf(poly.outer);
    if (!b || !p.visible(b)) continue;
    d += ringPath(poly.outer, p);
    for (const h of poly.holes) d += ringPath(h, p);
  }
  return d;
}

function linePath(l: LngLat[], p: Projection): string {
  return l.map((pt, i) => `${i === 0 ? "M" : "L"}${fmt(p.x(pt[0]))} ${fmt(p.y(pt[1]))}`).join("");
}

function placeBBox(place: PlaceGeo, radiusM: number): BBox {
  if (isCircle(place)) return bboxAround([place.lng, place.lat], radiusM);
  return bboxOf(polygonPoints(place.polygons))!;
}

function placeAnchor(place: PlaceGeo): LngLat | null {
  return isCircle(place) ? [place.lng, place.lat] : polygonsCentroid(place.polygons);
}

/** The place a ref points at, or throws: rendering a map of the wrong place is worse than none. */
export function zoneOf(geo: GeoFile, ref: ZoneMapRef): { zone: PlaceGeo; isBarrio: boolean } {
  if (geo.citySlug !== ref.citySlug) {
    throw new Error(`zone map: geo file is ${geo.citySlug}, ref asks for ${ref.citySlug}`);
  }
  if (!ref.barrioSlug) return { zone: geo.city, isBarrio: false };
  const zone = geo.barrios.find((b) => b.slug === ref.barrioSlug && b.inTree);
  if (!zone) throw new Error(`zone map: ${ref.citySlug}/${ref.barrioSlug} not in the geo file`);
  return { zone, isBarrio: true };
}

/** The frame a map shows: the city with a thin margin, or the barrio with room for its neighbours. */
export function frameFor(geo: GeoFile, ref: ZoneMapRef): BBox {
  const { zone, isBarrio } = zoneOf(geo, ref);
  const b = placeBBox(zone, isBarrio ? CIRCLE_RADIUS_M.barrio : CIRCLE_RADIUS_M.city);
  const fx = isBarrio ? 0.9 : 0.06;
  const minDeg = isBarrio ? 0.004 : 0.002;
  const dx = Math.max((b.maxLng - b.minLng) * fx, minDeg);
  const dy = Math.max((b.maxLat - b.minLat) * fx, minDeg);
  return { minLng: b.minLng - dx, minLat: b.minLat - dy, maxLng: b.maxLng + dx, maxLat: b.maxLat + dy };
}

export interface RenderOptions {
  variant?: ZoneMapVariant;
  /** The `width` attribute in pixels (height follows the variant's ratio). Default: the viewBox width. */
  pixelWidth?: number;
  /** Prefix for element ids, so several maps can sit in one document (the contact sheet). */
  idPrefix?: string;
}

export function renderZoneMapSvg(geo: GeoFile, ref: ZoneMapRef, opts: RenderOptions = {}): string {
  const variant = opts.variant ?? "4:3";
  const { w, h } = VIEWBOX[variant];
  const pixelWidth = opts.pixelWidth ?? w;
  const pixelHeight = Math.round((pixelWidth * h) / w);
  const { zone, isBarrio } = zoneOf(geo, ref);
  const proj = new Projection(frameFor(geo, ref), w, h);
  const clipId = `${opts.idPrefix ?? ""}frame`;

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelWidth}" height="${pixelHeight}" viewBox="0 0 ${w} ${h}">`,
    `<defs><clipPath id="${clipId}"><rect x="0" y="0" width="${w}" height="${h}"/></clipPath></defs>`,
    `<rect x="0" y="0" width="${w}" height="${h}" fill="${PALETTE.background}"/>`,
    `<g clip-path="url(#${clipId})">`,
  );

  // Land inside the city.
  if (!isCircle(geo.city)) {
    const d = polygonsPath(geo.city.polygons, proj);
    if (d) out.push(`<path d="${d}" fill="${PALETTE.land}" fill-rule="evenodd"/>`);
  }
  // The page's zone, filled under the water and roads (a lake in a barrio
  // stays water); its outline goes on top at the end.
  let zoneOutline: string;
  if (isCircle(zone)) {
    const cx = fmt(proj.x(zone.lng));
    const cy = fmt(proj.y(zone.lat));
    const r = fmt(proj.metres(isBarrio ? CIRCLE_RADIUS_M.barrio : CIRCLE_RADIUS_M.city));
    out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PALETTE.accent}" fill-opacity="0.28"/>`);
    zoneOutline = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${PALETTE.accent}" stroke-width="2.4" stroke-dasharray="8 6"/>`;
  } else {
    const d = polygonsPath(zone.polygons, proj);
    out.push(`<path d="${d}" fill="${PALETTE.accent}" fill-opacity="0.34" fill-rule="evenodd"/>`);
    zoneOutline = `<path d="${d}" fill="none" stroke="${PALETTE.primary}" stroke-width="3" stroke-linejoin="round"/>`;
  }
  // Water.
  const water = geo.water.map((f) => polygonsPath(f.polygons, proj)).join("");
  if (water) out.push(`<path d="${water}" fill="${PALETTE.water}" fill-rule="evenodd"/>`);
  // Main roads.
  const roads = geo.roads
    .flatMap((r) => r.lines)
    .filter((l) => {
      const b = bboxOf(l);
      return b !== null && proj.visible(b);
    })
    .map((l) => linePath(l, proj))
    .join("");
  if (roads) {
    out.push(
      `<path d="${roads}" fill="none" stroke="${PALETTE.inkMuted}" stroke-opacity="0.35" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  }
  // Other barrios: outlines (polygons) or a dot (circle fallbacks).
  const others = geo.barrios.filter((b) => b !== zone);
  const outlines = others
    .map((b) => (isCircle(b) ? "" : polygonsPath(b.polygons, proj)))
    .join("");
  if (outlines) {
    out.push(
      `<path d="${outlines}" fill="none" stroke="${PALETTE.inkMuted}" stroke-opacity="0.7" stroke-width="1.4" stroke-linejoin="round"/>`,
    );
  }
  for (const b of others) {
    if (!isCircle(b)) continue;
    out.push(`<circle cx="${fmt(proj.x(b.lng))}" cy="${fmt(proj.y(b.lat))}" r="4" fill="${PALETTE.inkMuted}"/>`);
  }
  // The city's own outline.
  if (!isCircle(geo.city)) {
    const d = polygonsPath(geo.city.polygons, proj);
    if (d) {
      out.push(
        `<path d="${d}" fill="none" stroke="${PALETTE.primary}" stroke-opacity="${isBarrio ? "0.5" : "0.9"}" stroke-width="${isBarrio ? "1.6" : "2.4"}" stroke-linejoin="round"/>`,
      );
    }
  }
  // The page's zone, outline on top of everything else.
  out.push(zoneOutline);
  out.push(`</g>`);

  // Reserved boxes: badge (top left) and credit (bottom right).
  const reserved: Box[] = [];
  const badge = ref.type ? badgeSvg(ref.type, ref.operation ?? "") : null;
  if (badge) {
    reserved.push(badge.box);
  }
  const creditSize = 16;
  const creditW = textWidth(IMAGE_CREDIT, creditSize) + 16;
  const creditBox: Box = { x: w - creditW - 8, y: h - creditSize - 18, w: creditW, h: creditSize + 10 };
  reserved.push(creditBox);

  // Labels: the zone first, then neighbours largest-first; a label that would
  // overlap one already placed (or leave the frame) is skipped.
  const placed: Box[] = [...reserved];
  const labels: string[] = [];
  const tryLabel = (text: string, at: LngLat, size: number, bold: boolean, fill: string): void => {
    if (!text) return;
    const tw = textWidth(text, size, bold);
    const cx = proj.x(at[0]);
    const cy = proj.y(at[1]);
    const box: Box = { x: cx - tw / 2 - 4, y: cy - size * 0.8, w: tw + 8, h: size * 1.1 };
    if (box.x < 6 || box.y < 6 || box.x + box.w > w - 6 || box.y + box.h > h - 6) return;
    if (placed.some((p) => overlaps(p, box))) return;
    placed.push(box);
    labels.push(
      `<text x="${fmt(cx)}" y="${fmt(cy + size * 0.3)}" font-size="${size}"${bold ? ' font-weight="700"' : ""} fill="${fill}" stroke="${PALETTE.accentSoft}" stroke-width="${bold ? 5 : 4}" stroke-linejoin="round" paint-order="stroke" text-anchor="middle">${esc(text)}</text>`,
    );
  };
  const zoneAnchor = placeAnchor(zone);
  if (zoneAnchor) tryLabel(zone.name, zoneAnchor, isBarrio ? 30 : 34, true, PALETTE.ink);
  const ranked = others
    .map((b) => ({ b, anchor: placeAnchor(b), size: isCircle(b) ? 0 : polygonsSpan(b.polygons) }))
    .filter((x): x is { b: PlaceGeo; anchor: LngLat; size: number } => x.anchor !== null)
    .sort((a, b) => b.size - a.size || a.b.slug.localeCompare(b.b.slug));
  for (const { b, anchor } of ranked) tryLabel(b.name, anchor, 19, false, PALETTE.inkSecondary);
  out.push(`<g font-family="${FONT}">`, ...labels);

  if (badge) out.push(badge.svg);
  out.push(
    `<rect x="${fmt(creditBox.x)}" y="${fmt(creditBox.y)}" width="${fmt(creditBox.w)}" height="${fmt(creditBox.h)}" fill="${PALETTE.background}" fill-opacity="0.85"/>`,
    `<text x="${fmt(creditBox.x + 8)}" y="${fmt(creditBox.y + creditSize + 1)}" font-size="${creditSize}" fill="${PALETTE.inkSecondary}">${esc(IMAGE_CREDIT)}</text>`,
    `</g>`,
    `</svg>`,
  );
  return out.join("\n") + "\n";
}

/** Width + height of a polygon set's bbox, in degrees — a cheap "how big" for label priority. */
function polygonsSpan(ps: Polygon[]): number {
  const b = bboxOf(polygonPoints(ps));
  return b ? b.maxLng - b.minLng + (b.maxLat - b.minLat) : 0;
}

function badgeSvg(type: PropertyType, words: string): { svg: string; box: Box } {
  const x = 24;
  const y = 24;
  const iconSize = 40;
  const pad = 14;
  const fontSize = 28;
  const textW = words ? textWidth(words, fontSize, true) : 0;
  const width = pad + iconSize + (words ? pad + textW : 0) + pad;
  const height = iconSize + 2 * pad;
  const s = iconSize / 24;
  const svg = [
    `<g data-badge="${type}">`,
    `<rect x="${x}" y="${y}" width="${fmt(width)}" height="${height}" fill="${PALETTE.primary}"/>`,
    `<rect x="${x}" y="${y + height - 3}" width="${fmt(width)}" height="3" fill="${PALETTE.accent}"/>`,
    `<path transform="translate(${x + pad} ${y + pad}) scale(${s.toFixed(4)})" d="${TYPE_ICONS[type]}" fill="none" stroke="${PALETTE.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    words
      ? `<text x="${fmt(x + pad + iconSize + pad)}" y="${fmt(y + pad + iconSize / 2 + fontSize * 0.35)}" font-size="${fontSize}" font-weight="700" fill="${PALETTE.onPrimary}">${esc(words)}</text>`
      : "",
    `</g>`,
  ]
    .filter(Boolean)
    .join("\n");
  return { svg, box: { x, y, w: width, h: height } };
}
