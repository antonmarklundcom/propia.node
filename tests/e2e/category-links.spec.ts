import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * No internal link into an empty category page. A city with no stock on a
 * door 404s, and an empty city/type page redirects to the nearest level up
 * with stock; the header, footer, sidebar and default home skip those links
 * (withoutEmptyCategoryLinks in src/lib/queries.ts). This collects every
 * category-shaped link on a door's main pages and follows it to its final
 * response, which must not be a 4xx.
 *
 * Requests go to the dev server with the door's Host header and redirects are
 * followed by hand, so the Host survives every hop.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const DOORS: Record<string, string[]> = {
  "inmobiliaria.com.py": ["/", "/venta", "/alquiler"],
  "realestateinparaguay.com": ["/", "/venta", "/alquiler"],
  "terreno.com.py": ["/", "/venta"],
  "landforsaleparaguay.com": ["/", "/venta"],
};
const CATEGORY = /^\/(venta|alquiler|alquiler-temporal)\/[^?#]+/;

async function finalStatus(request: APIRequestContext, host: string, path: string) {
  let current = path;
  for (let hop = 0; hop < 5; hop++) {
    const res = await request.get(ORIGIN + current, {
      headers: { host },
      maxRedirects: 0,
      timeout: 120_000,
    });
    const location = res.headers()["location"];
    if (res.status() < 300 || res.status() >= 400 || !location) {
      return { status: res.status(), path: current };
    }
    const next = new URL(location, ORIGIN);
    current = next.pathname + next.search;
  }
  return { status: 0, path: current };
}

for (const [host, pages] of Object.entries(DOORS)) {
  test(`category links on ${host} never end in a 4xx`, async ({ request }) => {
    test.setTimeout(600_000);
    const links = new Set<string>();
    for (const page of pages) {
      const res = await request.get(ORIGIN + page, { headers: { host }, timeout: 120_000 });
      expect(res.status(), `${host}${page}`).toBe(200);
      for (const [, href] of (await res.text()).matchAll(/href="([^"]+)"/g)) {
        const path = href.replace(/&amp;/g, "&");
        if (CATEGORY.test(path)) links.add(path);
      }
    }
    expect(links.size).toBeGreaterThan(0);
    const broken: string[] = [];
    for (const link of links) {
      const end = await finalStatus(request, host, link);
      if (end.status === 0 || end.status >= 400) broken.push(`${link} -> ${end.status} ${end.path}`);
    }
    expect(broken).toEqual([]);
  });
}
