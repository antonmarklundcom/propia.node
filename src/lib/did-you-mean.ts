/**
 * "¿Quisiste decir …?" for a mistyped city or barrio slug on the 404 page
 * (plan phase 3). Pure — `npm run verify:seo` checks it.
 */

/** Levenshtein distance, early-exit once every cell of a row exceeds `max`. */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * The one candidate within `maxDistance` edits of `input`, nearest first. A
 * tie between two different candidates at the best distance suggests nothing:
 * a guess between two places is worse than none.
 */
export function closestSlug(input: string, candidates: readonly string[], maxDistance = 2): string | null {
  if (!input) return null;
  let best: string | null = null;
  let bestD = maxDistance + 1;
  let tie = false;
  for (const c of new Set(candidates)) {
    if (c === input) return null;
    const d = editDistance(input, c, maxDistance);
    if (d < bestD) {
      best = c;
      bestD = d;
      tie = false;
    } else if (d === bestD) {
      tie = true;
    }
  }
  return best && !tie && bestD <= maxDistance ? best : null;
}
