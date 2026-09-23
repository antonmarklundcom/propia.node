import type { Page } from "@playwright/test";

/**
 * WCAG AA text contrast for small text (< 24px) on the pages a partner sees
 * first. Plan 2026-09-22 A4: gold (#C19A4D) is for rules, icons and display
 * text; small copy on cream or white must reach 4.5:1.
 *
 * The background is the first opaque-ish ancestor background colour,
 * alpha-composited up the chain. Text that sits on a photo or gradient
 * (any ancestor with a background-image, or inside a positioned media box
 * with an <img>) is skipped: its contrast depends on the pixels, not on CSS.
 */
export async function lowContrast(page: Page) {
  return page.evaluate(() => {
    type RGBA = [number, number, number, number];
    const parse = (c: string): RGBA => {
      const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
      return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1];
    };
    const over = (top: RGBA, under: RGBA): RGBA => {
      const a = top[3] + under[3] * (1 - top[3]);
      if (a === 0) return [0, 0, 0, 0];
      return [0, 1, 2].map((i) => (top[i] * top[3] + under[i] * under[3] * (1 - top[3])) / a).concat(a) as RGBA;
    };
    const lum = ([r, g, b]: RGBA) => {
      const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const bgOf = (el: Element): RGBA | null => {
      const layers: RGBA[] = [];
      for (let n: Element | null = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.backgroundImage !== "none") return null;
        if (n !== el && n.querySelector(":scope > img, :scope > picture") && s.position !== "static") return null;
        const c = parse(s.backgroundColor);
        if (c[3] > 0) layers.push(c);
        if (c[3] >= 1) break;
      }
      let out: RGBA = [255, 255, 255, 1];
      for (const layer of layers.reverse()) out = over(layer, out);
      return out;
    };
    const bad: string[] = [];
    const seen = new Set<Element>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const el = t.parentElement;
      if (!el || seen.has(el) || !t.textContent?.trim()) continue;
      seen.add(el);
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || s.visibility === "hidden" || Number(s.opacity) === 0) continue;
      if (el.closest("[hidden], [aria-hidden='true'], script, style, noscript, dialog:not([open]), nextjs-portal")) continue;
      if (parseFloat(s.fontSize) >= 24) continue;
      const bg = bgOf(el);
      if (!bg) continue;
      const fg = over(parse(s.color), bg);
      const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
      const ratio = (l1 + 0.05) / (l2 + 0.05);
      if (ratio < 4.5) {
        bad.push(`${ratio.toFixed(2)} ${el.tagName.toLowerCase()}.${[...el.classList].join(".")} ${s.fontSize} ${s.color} "${t.textContent.trim().slice(0, 40)}"`);
      }
    }
    return bad;
  });
}

/** Both widths: the mobile contact bar and drawer only exist under 901px. */
export async function atBothWidths(page: Page, path: string) {
  const bad: string[] = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    bad.push(...(await lowContrast(page)).map((line) => `${width}px ${line}`));
  }
  return bad;
}
