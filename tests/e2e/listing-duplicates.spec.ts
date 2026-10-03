/**
 * Duplicate listings end to end (plan-admin-next O5), through the real admin
 * pages, server actions, the category grid and the listing page — the SQL
 * twin of `primaryOf()` (`notHiddenDuplicate()`) checked against MariaDB:
 *
 *   three listers publish the same property (A first, then B, then C)
 *   → the operator joins B to A, then C to B's link (groups merge)
 *   → the grid shows A only; B and C stay online, canonical → A, and every
 *     page says "También publicado por" naming the others
 *   → A is paused: B (the next lister) takes the slot by itself
 *   → C is taken out of the group: it is back in the grid on its own.
 *
 * Fixtures (three copies of a published listing, two agencies, an admin) go
 * straight into the LOCAL database and are removed afterwards; refuses any
 * DATABASE_URL that is not localhost.
 *
 *   E2E_PORT=3100 npx playwright test tests/e2e/listing-duplicates.spec.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
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
    throw new Error("listing-duplicates.spec writes listings and agencies; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();
const pid = (k: string) => (k + randomBytes(8).toString("hex")).replace(/[^a-z0-9]/g, "").slice(0, 10);

interface Copy {
  key: "A" | "B" | "C";
  id: number;
  publicId: string;
  slug: string;
  title: string;
}

interface Fixture {
  conn: mysql.Connection;
  adminId: number;
  agencyIds: number[];
  copies: Record<"A" | "B" | "C", Copy>;
  categoryPath: string;
}

let fx: Fixture;
let admin: BrowserContext;

test.describe.configure({ mode: "serial" });

const url = (c: Copy) => `/propiedad/${c.slug}-${c.publicId}`;

test.beforeAll(async ({ browser }) => {
  const conn = await mysql.createConnection(localDbUrl());
  const [u] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO users (email, name, role, locale) VALUES (?, ?, 'admin', 'es')",
    [`e2e-dup-${stamp}@example.test`, `E2E Admin ${stamp}`],
  );
  const agencyIds: number[] = [];
  for (const k of ["A", "B"]) {
    const [g] = await conn.query<mysql.ResultSetHeader>(
      "INSERT INTO agencies (name, slug, is_verified) VALUES (?, ?, 1)",
      [`E2E Dup Inmo ${k} ${stamp}`, `e2e-dup-inmo-${k.toLowerCase()}-${stamp}`],
    );
    agencyIds.push(g.insertId);
  }
  const [[src]] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT l.id, l.operation, loc.full_slug FROM listings l JOIN locations loc ON loc.id = l.location_id WHERE l.status = 'published' AND l.agency_id IS NULL ORDER BY l.id LIMIT 1",
  );
  const [cols] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'listings' AND column_name NOT IN ('id', 'public_id', 'slug', 'title', 'agency_id', 'agent_id', 'owner_user_id', 'published_at', 'status') ORDER BY ordinal_position",
  );
  const names = cols.map((r) => `\`${r.c}\``).join(", ");
  const copies = {} as Fixture["copies"];
  const minutesAgo = { A: 3, B: 2, C: 1 } as const;
  for (const key of ["A", "B", "C"] as const) {
    const publicId = pid(key.toLowerCase());
    const slug = `e2e-dup-${key.toLowerCase()}-${stamp}`;
    const title = `E2E Dup ${stamp} ${key}`;
    const agencyId = key === "A" ? agencyIds[0] : key === "B" ? agencyIds[1] : null;
    const [r] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO listings (public_id, slug, title, agency_id, agent_id, owner_user_id, status, published_at, ${names})
       SELECT ?, ?, ?, ?, NULL, NULL, 'published', NOW() - INTERVAL ? MINUTE, ${names} FROM listings WHERE id = ?`,
      [publicId, slug, title, agencyId, minutesAgo[key], src.id],
    );
    copies[key] = { key, id: r.insertId, publicId, slug, title };
  }
  const token = randomBytes(32).toString("hex");
  await conn.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    createHash("sha256").update(token).digest("hex"),
    u.insertId,
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  ]);
  fx = {
    conn,
    adminId: u.insertId,
    agencyIds,
    copies,
    // The city page, newest first: the three copies are the newest rows.
    categoryPath: `/${src.operation}/${String(src.full_slug).split("/")[0]}?orden=recientes`,
  };
  admin = await browser.newContext({ baseURL: BASE });
  await admin.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
});

test.afterAll(async () => {
  await admin?.close();
  if (!fx) return;
  const { conn } = fx;
  const ids = Object.values(fx.copies).map((c) => c.id);
  await conn.query("DELETE FROM listing_duplicates WHERE listing_id IN (?)", [ids]);
  await conn.query("DELETE FROM listings WHERE id IN (?)", [ids]);
  await conn.query("DELETE FROM agencies WHERE id IN (?)", [fx.agencyIds]);
  await conn.query("DELETE FROM admin_events WHERE actor_user_id = ?", [fx.adminId]);
  await conn.query("DELETE FROM sessions WHERE user_id = ?", [fx.adminId]);
  await conn.query("DELETE FROM users WHERE id = ?", [fx.adminId]);
  await conn.end();
});

/** Which of the three copies the category grid shows. */
async function inGrid(page: Page): Promise<string[]> {
  await page.goto(fx.categoryPath);
  const text = await page.locator("main").innerText();
  return (["A", "B", "C"] as const).filter((k) => text.includes(fx.copies[k].title));
}

async function canonicalOf(page: Page, c: Copy): Promise<string> {
  const res = await page.goto(url(c));
  expect(res?.status()).toBe(200);
  return (await page.locator('link[rel="canonical"]').getAttribute("href")) ?? "";
}

async function markDuplicate(of: Copy, ref: string) {
  const page = await admin.newPage();
  await page.goto(`/admin/propiedades/${of.id}#duplicados`);
  const card = page.locator("#duplicados");
  await card.locator("input[name=ref]").fill(ref);
  await card.getByRole("button", { name: "Unir como duplicado" }).click();
  await expect(page.getByText("Duplicados actualizados.")).toBeVisible();
  await page.close();
}

test("before grouping, all three are in the grid", async ({ page }) => {
  expect(await inGrid(page)).toEqual(["A", "B", "C"]);
});

test("the operator joins B to A by code, then C to B by link", async () => {
  await markDuplicate(fx.copies.B, fx.copies.A.publicId.toUpperCase());
  await markDuplicate(fx.copies.C, `${BASE}${url(fx.copies.B)}`);
  const [rows] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(DISTINCT group_id) AS g, COUNT(*) AS n FROM listing_duplicates WHERE listing_id IN (?)",
    [Object.values(fx.copies).map((c) => c.id)],
  );
  expect(Number(rows[0].g)).toBe(1);
  expect(Number(rows[0].n)).toBe(3);

  const page = await admin.newPage();
  await page.goto(`/admin/propiedades/${fx.copies.B.id}#duplicados`);
  const state = (c: Copy) => page.locator(`tr[data-member="${c.publicId}"] [data-dup-state]`);
  await expect(state(fx.copies.A)).toHaveText("Ocupa el lugar");
  await expect(state(fx.copies.B)).toHaveText("Oculto en listados");
  await expect(state(fx.copies.C)).toHaveText("Oculto en listados");
  if (SHOTS) await page.locator("#duplicados").screenshot({ path: `${SHOTS}/duplicates-admin.png` });
  await page.close();
});

test("the grid keeps the first lister only; the others canonicalise to it", async ({ page }) => {
  expect(await inGrid(page)).toEqual(["A"]);
  expect(await canonicalOf(page, fx.copies.A)).toMatch(new RegExp(`${url(fx.copies.A)}$`));
  expect(await canonicalOf(page, fx.copies.B)).toMatch(new RegExp(`${url(fx.copies.A)}$`));
  const also = page.locator("[data-also-listed]");
  await expect(also).toContainText("También publicado por");
  await expect(also).toContainText(`E2E Dup Inmo A ${stamp}`);
  await expect(also.locator(`a[href="${url(fx.copies.A)}"]`)).toHaveCount(1);
  await expect(also.locator(`a[href="${url(fx.copies.C)}"]`)).toHaveCount(1);
  if (SHOTS) await also.screenshot({ path: `${SHOTS}/duplicates-also-listed.png` });

  expect(await canonicalOf(page, fx.copies.C)).toMatch(new RegExp(`${url(fx.copies.A)}$`));
  await page.goto(url(fx.copies.A));
  await expect(page.locator("[data-also-listed]")).toContainText(`E2E Dup Inmo B ${stamp}`);
});

test("when the first lister goes, the next takes the slot by itself", async ({ page }) => {
  const adminPage = await admin.newPage();
  await adminPage.goto(`/admin/propiedades?q=${fx.copies.A.publicId}`);
  await adminPage.locator(`input[name=ids][value="${fx.copies.A.id}"]`).check();
  await adminPage.locator("select[name=op]").selectOption("paused");
  await adminPage.getByRole("button", { name: "Aplicar" }).click();
  await adminPage.waitForLoadState("networkidle");
  await adminPage.close();
  const [[a]] = await fx.conn.query<mysql.RowDataPacket[]>("SELECT status FROM listings WHERE id = ?", [fx.copies.A.id]);
  expect(a.status).toBe("paused");

  expect(await inGrid(page)).toEqual(["B"]);
  expect(await canonicalOf(page, fx.copies.B)).toMatch(new RegExp(`${url(fx.copies.B)}$`));
  expect(await canonicalOf(page, fx.copies.C)).toMatch(new RegExp(`${url(fx.copies.B)}$`));
  // A paused listing is not offered as "also listed".
  await expect(page.locator(`[data-also-listed] a[href="${url(fx.copies.A)}"]`)).toHaveCount(0);
});

test("taking C out of the group puts it back in the grid", async ({ page }) => {
  const adminPage = await admin.newPage();
  await adminPage.goto(`/admin/propiedades/${fx.copies.B.id}#duplicados`);
  await adminPage
    .locator(`tr[data-member="${fx.copies.C.publicId}"]`)
    .getByRole("button", { name: "Quitar del grupo" })
    .click();
  await expect(adminPage.getByText("Aviso quitado del grupo.")).toBeVisible();
  await adminPage.close();

  expect(await inGrid(page)).toEqual(["B", "C"]);
  expect(await canonicalOf(page, fx.copies.C)).toMatch(new RegExp(`${url(fx.copies.C)}$`));
  await expect(page.locator("[data-also-listed]")).toHaveCount(0);

  const [events] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM admin_events WHERE actor_user_id = ? AND action = 'listing.duplicate'",
    [fx.adminId],
  );
  expect(Number(events[0].n)).toBe(3);
});
