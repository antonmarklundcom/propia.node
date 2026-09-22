import { expect, test } from "@playwright/test";

// Plan 2026-09-22 A7: the national hub's type chips count the whole country,
// so they must open the national set filtered by type, not the biggest city.
test("/venta type chips stay national and their count matches the result", async ({ page }) => {
  await page.goto("/venta");
  const chips = page.locator("a.hub-chip");
  const n = await chips.count();
  expect(n).toBeGreaterThan(1);
  for (let i = 0; i < n; i++) {
    expect(await chips.nth(i).getAttribute("href")).toMatch(/^\/venta\?tipo=[a-z-]+$/);
  }
  const first = chips.first();
  const count = (await first.locator(".hub-chip__count").innerText()).replace(/\D/g, "");
  await first.click();
  await expect(page).toHaveURL(/\/venta\?tipo=/);
  await expect(page.locator("body")).toContainText(`Ver ${count} propiedad`);
});
