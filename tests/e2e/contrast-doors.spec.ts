import { expect, test } from "@playwright/test";
import { atBothWidths } from "./contrast";

/**
 * Small-text contrast (see ./contrast.ts) on the other enabled doors, which
 * carry their own theme overrides (src/design/themes.ts). Chromium's resolver
 * sends each door's hostname to the local dev server, so every request has
 * its real Host header and the app picks that door's theme and routes.
 *
 * Only paths a door serves itself: inmobiliarios.com.py 308s the marketplace
 * paths to the https primary, which a local run cannot follow.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const DOORS: Record<string, string[]> = {
  "realestateinparaguay.com": ["/", "/venta", "/precios"],
  "terreno.com.py": ["/", "/venta"],
  "landforsaleparaguay.com": ["/"],
  "inmobiliarios.com.py": ["/", "/agentes", "/inmobiliarias"],
  "rentparaguay.com": ["/"],
  "alquiler.com.py": ["/"],
};

test.use({
  launchOptions: {
    args: [`--host-resolver-rules=${Object.keys(DOORS).map((h) => `MAP ${h} 127.0.0.1:${PORT}`).join(",")}`],
  },
});

for (const [host, paths] of Object.entries(DOORS)) {
  for (const path of paths) {
    test(`small text contrast >= 4.5:1 on ${host}${path}`, async ({ page }) => {
      expect(await atBothWidths(page, `http://${host}${path}`)).toEqual([]);
    });
  }
}

test("small text contrast >= 4.5:1 on a realestateinparaguay.com listing page", async ({ page }) => {
  await page.goto("http://realestateinparaguay.com/venta");
  const href = await page.locator("a.listing-card").first().getAttribute("href");
  expect(await atBothWidths(page, new URL(href!, "http://realestateinparaguay.com").href)).toEqual([]);
});
