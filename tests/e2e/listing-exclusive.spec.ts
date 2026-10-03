/**
 * Exclusive listings end to end (plan-admin-next O1), through the real admin
 * pages and server action:
 *
 *   staff/admin marks a listing exclusive with an end date and a note
 *   → /admin/propiedades badges it and the "Exclusivas" chip filters to it
 *   → the public listing page says nothing about it (founder: admin only)
 *   → past its end date the badge reads "Exclusiva vencida"
 *   → unmarking removes it; both changes are in /admin/historial's table.
 *
 * Fixtures go straight into the LOCAL database and are removed afterwards;
 * refuses any DATABASE_URL that is not localhost.
 *
 *   E2E_PORT=3100 npx playwright test tests/e2e/listing-exclusive.spec.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { expect, test, type BrowserContext } from "@playwright/test";
import mysql from "mysql2/promise";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE = `http://localhost:${PORT}`;
const COOKIE = "propia_session";
const SHOTS = process.env.E2E_SCREENSHOTS ?? "";

function localDbUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // refused below
  }
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error("listing-exclusive.spec writes users and exclusives; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();

interface Fixture {
  conn: mysql.Connection;
  adminId: number;
  listing: { id: number; publicId: string; slug: string; title: string };
}

let fx: Fixture;
let admin: BrowserContext;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  const conn = await mysql.createConnection(localDbUrl());
  const [u] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO users (email, name, role, locale) VALUES (?, ?, 'admin', 'es')",
    [`e2e-exclusive-${stamp}@example.test`, `E2E Admin ${stamp}`],
  );
  const [[l]] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT l.id, l.public_id, l.slug, l.title FROM listings l LEFT JOIN listing_exclusives e ON e.listing_id = l.id WHERE l.status = 'published' AND e.listing_id IS NULL ORDER BY l.id LIMIT 1",
  );
  const token = randomBytes(32).toString("hex");
  await conn.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    createHash("sha256").update(token).digest("hex"),
    u.insertId,
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  ]);
  fx = { conn, adminId: u.insertId, listing: { id: l.id, publicId: l.public_id, slug: l.slug, title: l.title } };
  admin = await browser.newContext({ baseURL: BASE });
  await admin.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
});

test.afterAll(async () => {
  await admin?.close();
  if (!fx) return;
  const { conn } = fx;
  await conn.query("DELETE FROM listing_exclusives WHERE listing_id = ?", [fx.listing.id]);
  await conn.query("DELETE FROM admin_events WHERE actor_user_id = ?", [fx.adminId]);
  await conn.query("DELETE FROM sessions WHERE user_id = ?", [fx.adminId]);
  await conn.query("DELETE FROM users WHERE id = ?", [fx.adminId]);
  await conn.end();
});

const future = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);

test("mark a listing exclusive with an end date and a note", async () => {
  const page = await admin.newPage();
  await page.goto(`/admin/propiedades/${fx.listing.id}#exclusiva`);
  const form = page.locator("form#exclusiva");
  await form.getByLabel("Este aviso es exclusivo nuestro").check();
  await form.locator("input[name=until]").fill(future);
  await form.locator("input[name=note]").fill("Firmado con el propietario (e2e)");
  await form.getByRole("button", { name: "Guardar exclusiva" }).click();
  await expect(page.getByText("Exclusiva guardada.")).toBeVisible();
  await expect(page.locator("form#exclusiva h3")).toContainText("Exclusiva");
  if (SHOTS) await page.locator("form#exclusiva").screenshot({ path: `${SHOTS}/exclusive-form.png` });

  const [[row]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT DATE_FORMAT(until, '%Y-%m-%d') AS until, note, set_by_user_id FROM listing_exclusives WHERE listing_id = ?",
    [fx.listing.id],
  );
  expect(row.until).toBe(future);
  expect(row.note).toBe("Firmado con el propietario (e2e)");
  expect(Number(row.set_by_user_id)).toBe(fx.adminId);
  await page.close();
});

test("the list badges it and the Exclusivas chip filters to it", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/propiedades");
  await page.locator('[data-filter="exclusiva"]').click();
  await expect(page).toHaveURL(/exclusiva=1/);
  const row = page.locator("tr").filter({ hasText: fx.listing.publicId });
  await expect(row.locator('[data-exclusive="active"]')).toContainText(`Exclusiva hasta ${future}`);
  // Only exclusive rows in the filtered view.
  const total = await page.locator("tbody tr").count();
  expect(await page.locator('tbody tr [data-exclusive]').count()).toBe(total);
  if (SHOTS) await page.locator(".panel-table__wrap").screenshot({ path: `${SHOTS}/exclusive-list.png` });
  await page.close();
});

test("the public listing page says nothing about it", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: BASE });
  const page = await ctx.newPage();
  const res = await page.goto(`/propiedad/${fx.listing.slug}-${fx.listing.publicId}`);
  expect(res?.status()).toBe(200);
  await expect(page.locator("main")).not.toContainText(/exclusiv/i);
  await ctx.close();
});

test("past its end date it reads as expired", async () => {
  await fx.conn.query("UPDATE listing_exclusives SET until = '2020-01-31' WHERE listing_id = ?", [fx.listing.id]);
  const page = await admin.newPage();
  await page.goto("/admin/propiedades?exclusiva=1");
  const row = page.locator("tr").filter({ hasText: fx.listing.publicId });
  await expect(row.locator('[data-exclusive="expired"]')).toHaveText("Exclusiva vencida");
  await page.close();
});

test("unmarking removes it, and both changes are logged", async () => {
  const page = await admin.newPage();
  await page.goto(`/admin/propiedades/${fx.listing.id}#exclusiva`);
  const form = page.locator("form#exclusiva");
  await form.getByLabel("Este aviso es exclusivo nuestro").uncheck();
  await form.getByRole("button", { name: "Guardar exclusiva" }).click();
  await expect(page.getByText("Exclusiva guardada.")).toBeVisible();
  const [[n]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS c FROM listing_exclusives WHERE listing_id = ?",
    [fx.listing.id],
  );
  expect(Number(n.c)).toBe(0);
  const [events] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT action, target_id FROM admin_events WHERE actor_user_id = ? ORDER BY id",
    [fx.adminId],
  );
  expect(events.map((e) => e.action)).toEqual(["listing.exclusive", "listing.exclusive"]);
  expect(events.every((e) => Number(e.target_id) === fx.listing.id)).toBe(true);
  await page.close();
});
