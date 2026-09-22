import { expect, test } from "@playwright/test";
import { atBothWidths } from "./contrast";

for (const path of ["/", "/venta", "/precios"]) {
  test(`small text contrast >= 4.5:1 on ${path}`, async ({ page }) => {
    expect(await atBothWidths(page, path)).toEqual([]);
  });
}

test("small text contrast >= 4.5:1 on a listing page", async ({ page }) => {
  await page.goto("/venta");
  const href = await page.locator("a.listing-card").first().getAttribute("href");
  expect(await atBothWidths(page, href!)).toEqual([]);
});
