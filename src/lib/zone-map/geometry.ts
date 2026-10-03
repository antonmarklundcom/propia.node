/**
 * Plane geometry for the zone maps (docs/plan-category-pages-build.md,
 * phases 6–7). Pure: no fs, no network, no dependencies — `maps:fetch`,
 * `maps:render` and `verify:maps` all import it.
 *
 * Coordinates are GeoJSON order, `[lng, lat]`, in degrees. Everything that
 * measures distance does it in a local equirectangular plane (x scaled by
 * cos(latitude)), which is exact enough at city scale and is the same
 * projection the renderer draws with.
 */

export type LngLat = [number, number];
/** A closed ring: first point === last point, at least 4 points. */
export type Ring = LngLat[];
export interface Polygon {
  outer: Ring;
  holes: Ring[];
}
export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/** Metres per degree of latitude (mean). */
export const METRES_PER_DEGREE = 111_320;

/** Round to 5 decimals (~1.1 m) — the precision the geo files are stored at. */
export function round5(n: number): number {
  const r = Math.round(n * 1e5) / 1e5;
  return Object.is(r, -0) ? 0 : r;
}

export function roundPoint(p: LngLat): LngLat {
  return [round5(p[0]), round5(p[1])];
}

function samePoint(a: LngLat, b: LngLat): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function pointKey(p: LngLat): string {
  return `${p[0]},${p[1]}`;
}

/** Drop consecutive duplicate points (rounding creates them). */
export function dedupe(line: LngLat[]): LngLat[] {
  const out: LngLat[] = [];
  for (const p of line) {
    if (out.length === 0 || !samePoint(out[out.length - 1], p)) out.push(p);
  }
  return out;
}

/**
 * Join way segments into closed rings by matching endpoints, reversing a
 * segment where needed — what an OSM multipolygon's members have to go
 * through, since a relation's outer boundary is usually split over many ways
 * in no particular order or direction.
 *
 * Returns the closed rings plus the number of chains that could not be closed
 * (a member way missing from the response, or a broken relation). An open
 * chain is never "closed" by drawing a straight line: it is reported and left
 * out.
 */
export function assembleRings(ways: LngLat[][]): { rings: Ring[]; open: number } {
  const pending = ways.map(dedupe).filter((w) => w.length >= 2);
  const rings: Ring[] = [];
  let open = 0;

  // Already-closed ways are rings on their own.
  const segments: LngLat[][] = [];
  for (const w of pending) {
    if (w.length >= 4 && samePoint(w[0], w[w.length - 1])) rings.push(w);
    else segments.push(w);
  }

  const used = new Array<boolean>(segments.length).fill(false);
  // Endpoint index: point key → segment indices touching it.
  const byEnd = new Map<string, number[]>();
  segments.forEach((s, i) => {
    for (const p of [s[0], s[s.length - 1]]) {
      const k = pointKey(p);
      const list = byEnd.get(k);
      if (list) list.push(i);
      else byEnd.set(k, [i]);
    }
  });

  for (let start = 0; start < segments.length; start++) {
    if (used[start]) continue;
    used[start] = true;
    const chain = segments[start].slice();
    for (;;) {
      if (chain.length >= 4 && samePoint(chain[0], chain[chain.length - 1])) break;
      const tail = chain[chain.length - 1];
      const candidates = byEnd.get(pointKey(tail)) ?? [];
      const next = candidates.find((i) => !used[i]);
      if (next === undefined) break;
      used[next] = true;
      const seg = segments[next];
      const forward = samePoint(seg[0], tail) ? seg : seg.slice().reverse();
      for (let i = 1; i < forward.length; i++) chain.push(forward[i]);
    }
    if (chain.length >= 4 && samePoint(chain[0], chain[chain.length - 1])) rings.push(chain);
    else open++;
  }
  return { rings, open };
}

/** Signed area in the local plane (positive = counter-clockwise), degrees². */
export function ringArea(ring: Ring): number {
  const lat0 = meanLat(ring);
  const k = Math.cos((lat0 * Math.PI) / 180);
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    a += x1 * k * y2 - x2 * k * y1;
  }
  return a / 2;
}

export function polygonArea(p: Polygon): number {
  return Math.abs(ringArea(p.outer)) - p.holes.reduce((s, h) => s + Math.abs(ringArea(h)), 0);
}

function meanLat(points: LngLat[]): number {
  if (points.length === 0) return 0;
  return points.reduce((s, p) => s + p[1], 0) / points.length;
}

/** Ray casting. Points exactly on the edge count either way. */
export function pointInRing(pt: LngLat, ring: Ring): boolean {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function pointInPolygon(pt: LngLat, p: Polygon): boolean {
  return pointInRing(pt, p.outer) && !p.holes.some((h) => pointInRing(pt, h));
}

export function pointInPolygons(pt: LngLat, ps: Polygon[]): boolean {
  return ps.some((p) => pointInPolygon(pt, p));
}

/**
 * Outer rings with their holes: every inner ring goes to the smallest outer
 * ring that contains its first point. An inner ring no outer contains is
 * dropped (broken data, not something to draw as land).
 */
export function buildPolygons(outers: Ring[], inners: Ring[]): Polygon[] {
  const polys: Polygon[] = outers.map((outer) => ({ outer, holes: [] }));
  const areas = polys.map((p) => Math.abs(ringArea(p.outer)));
  for (const inner of inners) {
    let best = -1;
    for (let i = 0; i < polys.length; i++) {
      if (!pointInRing(inner[0], polys[i].outer)) continue;
      if (best === -1 || areas[i] < areas[best]) best = i;
    }
    if (best !== -1) polys[best].holes.push(inner);
  }
  return polys;
}

export function bboxOf(points: Iterable<LngLat>): BBox | null {
  let b: BBox | null = null;
  for (const [lng, lat] of points) {
    if (!b) b = { minLng: lng, minLat: lat, maxLng: lng, maxLat: lat };
    else {
      if (lng < b.minLng) b.minLng = lng;
      if (lat < b.minLat) b.minLat = lat;
      if (lng > b.maxLng) b.maxLng = lng;
      if (lat > b.maxLat) b.maxLat = lat;
    }
  }
  return b;
}

export function* polygonPoints(ps: Polygon[]): Generator<LngLat> {
  for (const p of ps) yield* p.outer;
}

/** Grow a bbox by a fraction of its size on every side (min `minDeg`). */
export function padBBox(b: BBox, fraction: number, minDeg = 0): BBox {
  const dx = Math.max((b.maxLng - b.minLng) * fraction, minDeg);
  const dy = Math.max((b.maxLat - b.minLat) * fraction, minDeg);
  return { minLng: b.minLng - dx, minLat: b.minLat - dy, maxLng: b.maxLng + dx, maxLat: b.maxLat + dy };
}

/** A bbox of `radiusM` metres around a point. */
export function bboxAround(center: LngLat, radiusM: number): BBox {
  const dLat = radiusM / METRES_PER_DEGREE;
  const dLng = dLat / Math.max(Math.cos((center[1] * Math.PI) / 180), 1e-6);
  return { minLng: center[0] - dLng, minLat: center[1] - dLat, maxLng: center[0] + dLng, maxLat: center[1] + dLat };
}

/**
 * Area-weighted centroid of the largest polygon's outer ring — where a label
 * goes and the point "a barrio lies inside its city" is tested with. Falls
 * back to the vertex mean for a degenerate ring.
 */
export function polygonsCentroid(ps: Polygon[]): LngLat | null {
  if (ps.length === 0) return null;
  let biggest = ps[0];
  let biggestArea = -1;
  for (const p of ps) {
    const a = Math.abs(ringArea(p.outer));
    if (a > biggestArea) {
      biggest = p;
      biggestArea = a;
    }
  }
  const ring = biggest.outer;
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-14) {
    const pts = ring.slice(0, -1);
    return [pts.reduce((s, p) => s + p[0], 0) / pts.length, meanLat(pts)];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

/** Perpendicular distance from p to segment a–b, in metres (local plane). */
export function segmentDistanceM(p: LngLat, a: LngLat, b: LngLat, k: number): number {
  const px = p[0] * k;
  const py = p[1];
  const ax = a[0] * k;
  const ay = a[1];
  const bx = b[0] * k;
  const by = b[1];
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const ex = px - (ax + t * dx);
  const ey = py - (ay + t * dy);
  return Math.sqrt(ex * ex + ey * ey) * METRES_PER_DEGREE;
}

/**
 * Douglas–Peucker on an open polyline, tolerance in metres. Iterative (a
 * stack, not recursion), so a 20 000-node river does not blow the stack.
 * Every kept point is an original point; the end points are always kept.
 */
export function simplifyLine(line: LngLat[], toleranceM: number): LngLat[] {
  if (line.length <= 2 || toleranceM <= 0) return line.slice();
  const k = Math.cos((meanLat(line) * Math.PI) / 180);
  const keep = new Uint8Array(line.length);
  keep[0] = 1;
  keep[line.length - 1] = 1;
  const stack: [number, number][] = [[0, line.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxD = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = segmentDistanceM(line[i], line[first], line[last], k);
      if (d > maxD) {
        maxD = d;
        index = i;
      }
    }
    if (index !== -1 && maxD > toleranceM) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return line.filter((_, i) => keep[i] === 1);
}

/**
 * Douglas–Peucker on a closed ring. The ring is split at the vertex farthest
 * from its first point, so the two halves are simplified as open lines and a
 * ring never collapses onto its own chord. A result with fewer than 4 points
 * (a triangle plus closure) means the ring is smaller than the tolerance:
 * the original is returned rather than a degenerate shape.
 */
export function simplifyRing(ring: Ring, toleranceM: number): Ring {
  if (ring.length <= 4) return ring.slice();
  const k = Math.cos((meanLat(ring) * Math.PI) / 180);
  let far = 1;
  let farD = -1;
  for (let i = 1; i < ring.length - 1; i++) {
    const d = segmentDistanceM(ring[i], ring[0], ring[0], k);
    if (d > farD) {
      farD = d;
      far = i;
    }
  }
  const a = simplifyLine(ring.slice(0, far + 1), toleranceM);
  const b = simplifyLine(ring.slice(far), toleranceM);
  const out = a.concat(b.slice(1));
  return out.length >= 4 ? out : ring.slice();
}

/** Round to 5 decimals, drop the duplicates that creates, keep it closed. */
export function roundRing(ring: Ring): Ring | null {
  const r = dedupe(ring.map(roundPoint));
  if (r.length < 4) return null;
  if (!samePoint(r[0], r[r.length - 1])) r.push(r[0]);
  return r.length >= 4 ? r : null;
}

export function roundLine(line: LngLat[]): LngLat[] | null {
  const r = dedupe(line.map(roundPoint));
  return r.length >= 2 ? r : null;
}

/** Simplify then round every ring of every polygon; drop what degenerates. */
export function simplifyPolygons(ps: Polygon[], toleranceM: number): Polygon[] {
  const out: Polygon[] = [];
  for (const p of ps) {
    const outer = roundRing(simplifyRing(p.outer, toleranceM));
    if (!outer) continue;
    const holes = p.holes
      .map((h) => roundRing(simplifyRing(h, toleranceM)))
      .filter((h): h is Ring => h !== null);
    out.push({ outer, holes });
  }
  return out;
}

/**
 * Sutherland–Hodgman clip of a ring to a rectangle. Water bodies are
 * clipped to the city's frame before they are stored: the Paraguay River's
 * riverbank is hundreds of kilometres long, and only the bit beside the city
 * is ever drawn.
 */
export function clipRing(ring: Ring, b: BBox): Ring | null {
  type Edge = { inside: (p: LngLat) => boolean; cut: (p: LngLat, q: LngLat) => LngLat };
  const lerpAtLng = (p: LngLat, q: LngLat, lng: number): LngLat => [lng, p[1] + ((q[1] - p[1]) * (lng - p[0])) / (q[0] - p[0])];
  const lerpAtLat = (p: LngLat, q: LngLat, lat: number): LngLat => [p[0] + ((q[0] - p[0]) * (lat - p[1])) / (q[1] - p[1]), lat];
  const edges: Edge[] = [
    { inside: (p) => p[0] >= b.minLng, cut: (p, q) => lerpAtLng(p, q, b.minLng) },
    { inside: (p) => p[0] <= b.maxLng, cut: (p, q) => lerpAtLng(p, q, b.maxLng) },
    { inside: (p) => p[1] >= b.minLat, cut: (p, q) => lerpAtLat(p, q, b.minLat) },
    { inside: (p) => p[1] <= b.maxLat, cut: (p, q) => lerpAtLat(p, q, b.maxLat) },
  ];
  let pts = ring.slice(0, -1);
  for (const e of edges) {
    if (pts.length === 0) break;
    const input = pts;
    pts = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const curIn = e.inside(cur);
      const prevIn = e.inside(prev);
      if (curIn) {
        if (!prevIn) pts.push(e.cut(prev, cur));
        pts.push(cur);
      } else if (prevIn) {
        pts.push(e.cut(prev, cur));
      }
    }
  }
  if (pts.length < 3) return null;
  return [...pts, pts[0]];
}

export function clipPolygons(ps: Polygon[], b: BBox): Polygon[] {
  const out: Polygon[] = [];
  for (const p of ps) {
    const outer = clipRing(p.outer, b);
    if (!outer) continue;
    const holes = p.holes.map((h) => clipRing(h, b)).filter((h): h is Ring => h !== null);
    out.push({ outer, holes });
  }
  return out;
}

function inBBox(p: LngLat, b: BBox): boolean {
  return p[0] >= b.minLng && p[0] <= b.maxLng && p[1] >= b.minLat && p[1] <= b.maxLat;
}

/**
 * Cut a polyline to the parts that touch a rectangle. Each kept run carries
 * one point outside the box at either end, so a road still runs to the frame
 * edge instead of stopping short of it. Coarse on purpose: the renderer clips
 * exactly; this only keeps the stored file small.
 */
export function clipLine(line: LngLat[], b: BBox): LngLat[][] {
  const runs: LngLat[][] = [];
  let run: LngLat[] = [];
  for (let i = 0; i < line.length; i++) {
    const p = line[i];
    if (inBBox(p, b)) {
      if (run.length === 0 && i > 0) run.push(line[i - 1]);
      run.push(p);
    } else if (run.length > 0) {
      run.push(p);
      runs.push(run);
      run = [];
    }
  }
  if (run.length >= 2) runs.push(run);
  return runs.filter((r) => r.length >= 2);
}
