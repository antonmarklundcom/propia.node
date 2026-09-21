import { expect, test } from "@playwright/test";
import { FIXTURE_PATH } from "./global-setup";

for (const path of ["/venta", FIXTURE_PATH]) {
  test(`${path}: price, bedrooms, removal and SEO`, async ({ page }) => {
    await page.goto(path);
    const count = page.locator(".listing-result-count");
    const before = Number(await count.getAttribute("data-count"));
    await page.locator("#precio_max").fill("50000");
    await page.locator(".listing-sidebar .filter-bar__submit").click();
    await expect(page).toHaveURL(/precio_max=50000/);
    await expect.poll(async () => Number(await count.getAttribute("data-count"))).toBeLessThan(before);
    await expect(page.locator('a.listing-card[href*="sort-fixture"]')).toHaveCount(3);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
    await page.locator('.listing-sidebar input[name="dormitorios"][value="4"]').check();
    await expect(page).toHaveURL(/dormitorios=4/);
    await expect(page.locator('a.listing-card[href*="sort-fixture"]')).toHaveCount(0);
    await page.locator('[data-filter="dormitorios"]').click();
    await expect(page).not.toHaveURL(/dormitorios=/);
    await expect(page.locator('a.listing-card[href*="sort-fixture"]')).toHaveCount(3);
  });
  test(`${path}: all facets survive pagination and map`, async ({ page }) => {
    await page.goto(`${path}?precio_max=100000&dormitorios=3&orden=precio_asc&tipo=casas`);
    for (const link of [page.locator(".pagination__link").last(), page.locator(".view-switch__option").last()]) {
      const href = await link.getAttribute("href");
      for (const param of ["precio_max=100000", "dormitorios=3", "orden=precio_asc", "tipo=casas"]) expect(href).toContain(param);
    }
    await page.locator(".pagination__link").last().click();
    await expect(page).toHaveURL(/page=2/);
  });
  test(`${path}: mobile applies only on Apply and restores focus`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(path);
    await page.locator(".listing-filter-open").click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await drawer.locator('[name="precio_max"]').fill("50000");
    await drawer.locator('[name="dormitorios"][value="3"]').check();
    await expect(page).not.toHaveURL(/precio_max/);
    await drawer.locator(".filter-bar__submit").click();
    await expect(drawer).toHaveCount(0);
    await expect(page).toHaveURL(/precio_max=50000/);
    await expect(page.locator(".listing-filter-open")).toBeFocused();
    await page.locator(".listing-filter-open").click();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
  });
}
for (const path of ["/alquiler", "/alquiler-temporal"]) {
  test(`${path}: hub exposes filtered results`, async ({ page }) => {
    await page.goto(`${path}?precio_max=500&orden=precio_asc`);
    await expect(page.locator("#precio_max")).toHaveValue("500");
    await expect(page.locator("#orden")).toHaveValue("precio_asc");
    await expect(page.locator(".listing-result-count")).toBeVisible();
  });
}
test("GET filters work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://localhost:" + (process.env.E2E_PORT ?? "3000") + "/venta");
  await page.locator("#precio_max").fill("50000");
  // The site uses smooth scrolling, so Playwright's scroll-into-view keeps restarting and the far-below-the-fold button never looks stable. Jump there instantly first.
  await page.locator(".filter-bar__submit").evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
  await page.locator(".filter-bar__submit").click();
  await expect(page).toHaveURL(/precio_max=50000/);
  await expect(page.locator('a.listing-card[href*="sort-fixture"]')).toHaveCount(3);
  await context.close();
});

test("hub sort changes the displayed order", async ({ page }) => {
  await page.goto("/venta?precio_min=50000&precio_max=78500&tipo=casas");
  for (const sort of ["precio_asc", "precio_desc"]) {
    await page.locator("#orden").selectOption(sort);
    await expect(page).toHaveURL(new RegExp(`orden=${sort}`));
    await expect(page.locator(".listing-browser__results")).toHaveAttribute("aria-busy", "false");
    const prices = await page.locator('a.listing-card[href*="sort-fixture"] .ds-photo-card__price').allTextContents();
    const values = prices.map(p => Number(p.replace(/\D/g, "")));
    expect(values.length).toBeGreaterThan(1);
    expect(values).toEqual([...values].sort((a,b) => sort === "precio_asc" ? a-b : b-a));
  }
});
