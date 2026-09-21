/**
 * The category page's "Ordenar" control: submit the filter form, and the grid
 * must come back in price order, on page 1 and across pagination.
 */
import { expect, test, type Page } from "@playwright/test";
import { FIXTURE_COUNT, FIXTURE_PATH } from "./global-setup";

type Card = { href: string; price: number };

/** Cards of the current page in DOM order; price is the digits of the printed price. */
async function cards(page: Page): Promise<Card[]> {
  return page.locator("a.listing-card").evaluateAll((els) =>
    els.map((el) => ({
      href: (el as HTMLAnchorElement).getAttribute("href") ?? "",
      price: Number(
        (el.querySelector(".ds-photo-card__price")?.textContent ?? "").replace(/\D/g, ""),
      ),
    })),
  );
}

function isSorted(prices: number[], dir: "asc" | "desc"): boolean {
  return prices.every(
    (p, i) => i === 0 || (dir === "asc" ? prices[i - 1] <= p : prices[i - 1] >= p),
  );
}

async function submitSort(page: Page, orden: "precio_asc" | "precio_desc") {
  await page.locator("select#orden").selectOption(orden);
  await Promise.all([
    page.waitForURL((u) => u.searchParams.get("orden") === orden),
    page.locator("button.filter-bar__submit").click(),
  ]);
}

for (const dir of ["asc", "desc"] as const) {
  const orden = `precio_${dir}` as const;

  test(`${orden}: page 1 comes back in price order after submitting the form`, async ({
    page,
  }) => {
    await page.goto(FIXTURE_PATH);
    await submitSort(page, orden);

    const list = await cards(page);
    expect(list.length).toBe(48);
    expect(isSorted(list.map((c) => c.price), dir)).toBe(true);
  });

  test(`${orden}: survives pagination, and pages 1 and 2 together are one ordered list`, async ({
    page,
  }) => {
    await page.goto(FIXTURE_PATH);
    await submitSort(page, orden);
    const first = await cards(page);

    const next = page.locator("a.pagination__link").last();
    expect(await next.getAttribute("href")).toContain(`orden=${orden}`);
    await next.click();
    await page.waitForURL((u) => u.searchParams.get("page") === "2");
    expect(new URL(page.url()).searchParams.get("orden")).toBe(orden);

    const second = await cards(page);
    const all = [...first, ...second];
    expect(isSorted(all.map((c) => c.price), dir)).toBe(true);

    // Every fixture listing appears exactly once across the two pages.
    const hrefs = all.map((c) => c.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.filter((h) => h.includes("sort-fixture")).length).toBe(FIXTURE_COUNT);
  });

  test(`${orden}: the list/map view switch keeps the sort`, async ({ page }) => {
    await page.goto(`${FIXTURE_PATH}?orden=${orden}`);
    const mapLink = page.locator("a.view-switch__option").last();
    expect(await mapLink.getAttribute("href")).toContain(`orden=${orden}`);
  });
}
