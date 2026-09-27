import { expect, test } from "@playwright/test";
import mysql from "mysql2/promise";

/**
 * Evergreen category pages (src/content/evergreen/, ARCHITECTURE.md §4.3).
 *
 * The pilot, /venta/luque/casas, must render at 0 stock on its owner door:
 * 200, indexable, the chips and the brief inside the first screen of a
 * 390px phone. A category that is NOT on the registry keeps the old rule —
 * an empty city page still 404s, an empty typed page still redirects.
 *
 * To get a real 0 the spec pauses every published casa en venta in Luque
 * for the duration of the test and publishes the same rows again after, so
 * it WRITES — it refuses any database that is not localhost. The request
 * goes to the dev server as `localhost`, an unknown host, which resolves to
 * the canonical door (inmobiliaria.com.py, the pilot's owner).
 */
const EVERGREEN = "/venta/luque/casas";
// Seeded (seed-locations.ts), and no fixture writes a listing there.
const EMPTY_CITY = "/venta/yaguaron";
const EMPTY_TYPED = "/venta/yaguaron/casas";

function localDbUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // refused below
  }
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error("evergreen.spec pauses listings; it only runs against a local DATABASE_URL.");
  }
  return url;
}

let conn: mysql.Connection;
let paused: number[] = [];

test.beforeAll(async () => {
  conn = await mysql.createConnection(localDbUrl());
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT l.id FROM listings l
       JOIN locations loc ON loc.id = l.location_id
       JOIN locations city ON city.slug = 'luque' AND city.level = 'ciudad'
      WHERE l.status = 'published' AND l.operation = 'venta' AND l.property_type = 'casa'
        AND (loc.id = city.id OR loc.parent_id = city.id)`,
  );
  paused = rows.map((r) => Number(r.id));
  if (paused.length) {
    await conn.query(`UPDATE listings SET status = 'paused' WHERE id IN (?)`, [paused]);
  }
});

test.afterAll(async () => {
  if (paused.length) {
    await conn.query(`UPDATE listings SET status = 'published' WHERE id IN (?)`, [paused]);
  }
  await conn?.end();
});

test("an evergreen URL with 0 listings is a 200, indexable page with chips and the brief above the fold", async ({ page, request }) => {
  test.setTimeout(240_000);
  const res = await request.get(EVERGREEN, { maxRedirects: 0, timeout: 180_000 });
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).not.toMatch(/<meta name="robots" content="[^"]*noindex/);
  expect(html).toContain('"@type":"FAQPage"');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(EVERGREEN, { timeout: 180_000 });
  await expect(page.locator("h1")).toHaveText("Casas en venta en Luque");
  // The primary button reads "Avisame cuando haya" at 0 stock and opens the brief.
  const primary = page.locator(".evg-primary");
  await expect(primary).toHaveAttribute("href", "#brief");
  await expect(primary).toBeInViewport();
  // The page's own type chip still shows at 0, greyed.
  await expect(page.locator(".evg-chip--current.evg-chip--zero")).toBeVisible();
  await expect(page.locator(".evg-chip").first()).toBeInViewport();
  const brief = page.locator("#brief .buyer-brief__title");
  await expect(brief).toBeVisible();
  await expect(brief).toBeInViewport();
  // No horizontal page scroll at phone width.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("a non-evergreen empty category keeps the old rule", async ({ request }) => {
  test.setTimeout(240_000);
  const city = await request.get(EMPTY_CITY, { maxRedirects: 0, timeout: 180_000 });
  expect(city.status()).toBe(404);
  const typed = await request.get(EMPTY_TYPED, { maxRedirects: 0, timeout: 180_000 });
  expect([301, 302, 307, 308]).toContain(typed.status());
});
