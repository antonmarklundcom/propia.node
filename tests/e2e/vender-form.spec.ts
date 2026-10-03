/**
 * The /vender forms end to end, through the real page and the real
 * `/api/leads` endpoint (founder, 2026-10-03: every field required, and
 * "make sure it works to submit"):
 *
 *   - an empty submit sends nothing and names all six fields;
 *   - a too-short message and a bad phone are refused with their own message;
 *   - a complete seller form is accepted, stored as a `seller` lead marked
 *     `utm.source = "vender"` with the role the visitor chose, and the visitor
 *     sees the thank-you;
 *   - the independent-realtor form (Spanish door only) is stored as an
 *     `agent_signup` lead marked `vender:socio`;
 *   - the English door serves its own lighter page, in English, without the
 *     partner band, and its form submits too.
 *
 * Chromium's resolver maps each door's hostname to the local dev server (same
 * trick as contrast-doors.spec.ts), so the app sees the real Host header. The
 * leads it writes go to the LOCAL database and are removed afterwards; refuses
 * any DATABASE_URL that is not localhost.
 *
 *   E2E_PORT=3100 npx playwright test tests/e2e/vender-form.spec.ts
 */
import { expect, test, type Page } from "@playwright/test";
import mysql from "mysql2/promise";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const ES = "http://inmobiliaria.com.py";
const EN = "http://realestateinparaguay.com";

test.use({
  launchOptions: {
    args: [
      `--host-resolver-rules=MAP inmobiliaria.com.py 127.0.0.1:${PORT},MAP realestateinparaguay.com 127.0.0.1:${PORT}`,
    ],
  },
});

function localDbUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // refused below
  }
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error("vender-form.spec writes leads; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = String(Date.now()).slice(-7);
const PHONE = `+59599${stamp}`;
const MARK = `E2E vender ${stamp}`;

interface LeadRow {
  lead_type: string;
  name: string | null;
  whatsapp: string;
  message: string | null;
  utm: string | Record<string, string> | null;
  vertical: string;
}

async function leadsByPhone(phone: string): Promise<LeadRow[]> {
  const conn = await mysql.createConnection(localDbUrl());
  try {
    const [rows] = await conn.query(
      "select lead_type, name, whatsapp, message, utm, vertical from leads where whatsapp = ?",
      [phone],
    );
    return rows as LeadRow[];
  } finally {
    await conn.end();
  }
}

test.afterAll(async () => {
  const conn = await mysql.createConnection(localDbUrl());
  try {
    await conn.query("delete from leads where whatsapp like ?", [`+59599${stamp}%`]);
  } finally {
    await conn.end();
  }
});

const utmOf = (r: LeadRow): Record<string, string> =>
  typeof r.utm === "string" ? JSON.parse(r.utm) : (r.utm ?? {});

/** First option that is not the empty placeholder. */
async function pickFirst(page: Page, selector: string) {
  const value = await page
    .locator(`${selector} option`)
    .evaluateAll((os) => (os as HTMLOptionElement[]).map((o) => o.value).find((v) => v !== ""));
  expect(value, `${selector} has a real option`).toBeTruthy();
  await page.selectOption(selector, value!);
}

test("es: an empty submit sends nothing and names every field", async ({ page }) => {
  let posted = false;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/leads")) posted = true;
  });
  await page.goto(`${ES}/vender`);
  const form = page.locator("form.vd-form").first();
  await form.getByRole("button", { name: "Hablemos de mi propiedad" }).click();
  await expect(form.locator(".vd-form__field-error")).toHaveCount(6);
  expect(posted).toBe(false);
  // The ask is gone: no free valuation anywhere on the form.
  await expect(page.locator("body")).not.toContainText("Quiero una tasación");
  await expect(page.locator("body")).not.toContainText("Sin costo. Sin compromiso");
});

test("es: a short message and a bad phone are refused with their own message", async ({ page }) => {
  await page.goto(`${ES}/vender`);
  const form = page.locator("form.vd-form").first();
  await form.locator("#vd-hero-name").fill("Prueba");
  await form.locator("#vd-hero-phone").fill("123");
  await form.locator("#vd-hero-message").fill("corto");
  await form.getByRole("button", { name: "Hablemos de mi propiedad" }).click();
  await expect(form.locator("#vd-hero-phone-error")).toBeVisible();
  await expect(form.locator("#vd-hero-message-error")).toContainText("mínimo 10");
});

test("es: a complete seller form is stored as a vender lead", async ({ page }) => {
  await page.goto(`${ES}/vender`);
  const form = page.locator("form.vd-form").first();
  await form.locator("#vd-hero-name").fill(MARK);
  await form.locator("#vd-hero-phone").fill(PHONE);
  await form.locator("#vd-hero-role").selectOption("owner");
  await pickFirst(page, "#vd-hero-city");
  await pickFirst(page, "#vd-hero-type");
  await form.locator("#vd-hero-message").fill("Casa de tres dormitorios, quiero vender este año.");
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/leads") && r.request().method() === "POST"),
    form.getByRole("button", { name: "Hablemos de mi propiedad" }).click(),
  ]);
  expect(res.status()).toBe(200);
  await expect(page.locator(".vd-form--done").first()).toContainText("Recibimos los datos de tu propiedad");

  const rows = await leadsByPhone(PHONE);
  expect(rows).toHaveLength(1);
  expect(rows[0].lead_type).toBe("seller");
  expect(rows[0].name).toBe(MARK);
  expect(rows[0].vertical).toBe("inmobiliaria");
  expect(rows[0].message).toContain("Ciudad / barrio:");
  expect(rows[0].message).toContain("Tipo de propiedad:");
  expect(utmOf(rows[0]).source).toBe("vender");
  expect(utmOf(rows[0]).contact_role).toBe("owner");
});

test("es: the independent-realtor form is stored as an agent sign-up", async ({ page }) => {
  await page.goto(`${ES}/vender`);
  const form = page.locator("#vd-partners form.vd-form");
  await expect(form).toHaveCount(1);
  await form.getByRole("button", { name: "Quiero ser socio" }).click();
  // name, phone, city, message — the partner form has no role and no type.
  await expect(form.locator(".vd-form__field-error")).toHaveCount(4);

  const phone = `${PHONE}1`;
  await form.locator("#vd-partner-name").fill(MARK);
  await form.locator("#vd-partner-phone").fill(phone);
  await pickFirst(page, "#vd-partner-city");
  await form.locator("#vd-partner-message").fill("Corredor independiente en la zona, diez años de experiencia.");
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/leads") && r.request().method() === "POST"),
    form.getByRole("button", { name: "Quiero ser socio" }).click(),
  ]);
  expect(res.status()).toBe(200);
  await expect(page.locator("#vd-partners .vd-form--done")).toContainText("Recibimos tu solicitud");

  const rows = await leadsByPhone(phone);
  expect(rows).toHaveLength(1);
  expect(rows[0].lead_type).toBe("agent_signup");
  expect(utmOf(rows[0]).source).toBe("vender:socio");
  expect(utmOf(rows[0]).contact_role).toBe("agent");
});

test("en: the English door has its own lighter page and its form submits", async ({ page }) => {
  await page.goto(`${EN}/vender`);
  await expect(page).toHaveURL(/\/vender$/);
  await expect(page.locator("h1")).toContainText("sales plan");
  await expect(page.locator("#vd-partners")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /realestateinparaguay\.com\/vender$/);
  await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute("href", /inmobiliaria\.com\.py\/vender$/);

  const form = page.locator("form.vd-form").first();
  await form.getByRole("button", { name: "Talk about my property" }).click();
  await expect(form.locator(".vd-form__field-error")).toHaveCount(6);

  const phone = `${PHONE}2`;
  await form.locator("#vd-hero-name").fill(MARK);
  await form.locator("#vd-hero-phone").fill(phone);
  await form.locator("#vd-hero-role").selectOption("owner");
  await pickFirst(page, "#vd-hero-city");
  await pickFirst(page, "#vd-hero-type");
  await form.locator("#vd-hero-message").fill("Apartment in Asuncion, owner living abroad.");
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/leads") && r.request().method() === "POST"),
    form.getByRole("button", { name: "Talk about my property" }).click(),
  ]);
  expect(res.status()).toBe(200);
  await expect(page.locator(".vd-form--done").first()).toContainText("received your property details");
  const rows = await leadsByPhone(phone);
  expect(rows[0].vertical).toBe("en");
  expect(utmOf(rows[0]).source).toBe("vender");
});
