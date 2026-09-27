/**
 * "Invitar socio" end to end (/admin/inmobiliarias), through the real pages
 * and server actions:
 *
 *   a staff user sees neither the button nor the invite list
 *   → the super-admin presses "Invitar socio" on an agency row
 *   → the link appears under "Invitaciones de socios"
 *   → a visitor with no session opens it, sees the agency, creates an account
 *   → that account is the agency's `agency_admin` and lands in /agencia
 *   → a second invite is revoked and disappears from the list
 *   → /admin/historial names both actions.
 *
 * Fixtures (a super-admin and a staff user with sessions, one agency) are
 * written straight into the LOCAL database and removed afterwards, with the
 * account the invite creates. Refuses any DATABASE_URL that is not localhost.
 *
 * Run (local DB, app built and started on E2E_PORT):
 *   E2E_PORT=3100 npx playwright test tests/e2e/partner-invite.spec.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import mysql from "mysql2/promise";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE = `http://localhost:${PORT}`;
const COOKIE = "propia_session";

function localDbUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // refused below
  }
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error("partner-invite.spec writes users and agencies; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();
const AGENCY_NAME = `E2E Inmobiliaria ${stamp}`;
const INVITEE_EMAIL = `e2e-socio-${stamp}@example.test`;

interface Fixture {
  conn: mysql.Connection;
  adminId: number;
  staffId: number;
  agencyId: number;
  tokens: { admin: string; staff: string };
}

let fx: Fixture;
let admin: BrowserContext;
let staff: BrowserContext;

async function insertUser(conn: mysql.Connection, role: string, label: string): Promise<number> {
  const [res] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO users (email, name, role, locale) VALUES (?, ?, ?, 'es')",
    [`e2e-${label}-${stamp}@example.test`, `E2E ${label} ${stamp}`, role],
  );
  return res.insertId;
}

async function insertSession(conn: mysql.Connection, userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await conn.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    createHash("sha256").update(token).digest("hex"),
    userId,
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  ]);
  return token;
}

async function contextFor(browser: Browser, token: string): Promise<BrowserContext> {
  const ctx = await browser.newContext({ baseURL: BASE });
  await ctx.addCookies([
    { name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
  return ctx;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  const conn = await mysql.createConnection(localDbUrl());
  const adminId = await insertUser(conn, "admin", "admin");
  const staffId = await insertUser(conn, "staff", "staff");
  const [agencyRes] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO agencies (name, slug) VALUES (?, ?)",
    [AGENCY_NAME, `e2e-inmobiliaria-${stamp}`],
  );
  fx = {
    conn,
    adminId,
    staffId,
    agencyId: agencyRes.insertId,
    tokens: {
      admin: await insertSession(conn, adminId),
      staff: await insertSession(conn, staffId),
    },
  };
  admin = await contextFor(browser, fx.tokens.admin);
  staff = await contextFor(browser, fx.tokens.staff);
});

test.afterAll(async () => {
  await Promise.all([admin?.close(), staff?.close()]);
  if (!fx) return;
  const { conn, agencyId } = fx;
  const [invitees] = await conn.query<mysql.RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [
    INVITEE_EMAIL,
  ]);
  const userIds = [fx.adminId, fx.staffId, ...invitees.map((r) => Number(r.id))];
  await conn.query("DELETE FROM agency_invites WHERE agency_id = ?", [agencyId]);
  await conn.query("DELETE FROM admin_events WHERE actor_user_id IN (?)", [userIds]);
  await conn.query("DELETE FROM agents WHERE agency_id = ? OR user_id IN (?)", [agencyId, userIds]);
  await conn.query("DELETE FROM sessions WHERE user_id IN (?)", [userIds]);
  await conn.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  await conn.query("DELETE FROM agencies WHERE id = ?", [agencyId]);
  await conn.end();
});

const agencyRow = (page: import("@playwright/test").Page) =>
  page.locator("tr", { has: page.locator("td.panel-table__name", { hasText: AGENCY_NAME }) });

test("staff sees no invite button and no invite list", async () => {
  const page = await staff.newPage();
  await page.goto("/admin/inmobiliarias");
  await expect(agencyRow(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Invitar socio" })).toHaveCount(0);
  await expect(page.getByText("Invitaciones de socios")).toHaveCount(0);
  await page.close();
});

let inviteUrl = "";

test("the super-admin invites a partner and gets a link", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/inmobiliarias");
  await agencyRow(page).getByRole("button", { name: "Invitar socio" }).click();
  await expect(page).toHaveURL(/msg=invite_created/);
  const field = page.getByLabel(new RegExp(`${AGENCY_NAME} — responsable`));
  await expect(field).toBeVisible();
  inviteUrl = await field.inputValue();
  expect(inviteUrl).toMatch(/\/registro\?invite=[0-9a-f]{64}$/);
  await page.close();
});

test("the link creates the agency's administrator", async ({ browser }) => {
  const visitor = await browser.newContext({ baseURL: BASE });
  const page = await visitor.newPage();
  await page.goto(inviteUrl);
  await expect(page.getByText(AGENCY_NAME).first()).toBeVisible();
  await page.locator('input[name="name"]').fill(`E2E Socio ${stamp}`);
  await page.locator('input[name="email"]').fill(INVITEE_EMAIL);
  await page.locator('input[name="password"]').fill(`e2e-${randomBytes(8).toString("hex")}`);
  await page.locator('form button[type="submit"]').last().click();
  await expect(page).toHaveURL(/\/agencia/);
  await visitor.close();

  const [rows] = await fx.conn.query<mysql.RowDataPacket[]>(
    `SELECT u.role, a.agency_id FROM users u LEFT JOIN agents a ON a.user_id = u.id WHERE u.email = ?`,
    [INVITEE_EMAIL],
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].role).toBe("agency_admin");
  expect(Number(rows[0].agency_id)).toBe(fx.agencyId);

  const [inv] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT used_at, used_by_user_id FROM agency_invites WHERE agency_id = ?",
    [fx.agencyId],
  );
  expect(inv).toHaveLength(1);
  expect(inv[0].used_at).not.toBeNull();
});

test("a revoked invite leaves the list, and both actions are in the history", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/inmobiliarias");
  await expect(page.getByLabel(new RegExp(`${AGENCY_NAME} — responsable`))).toHaveCount(0);
  await agencyRow(page).getByRole("button", { name: "Invitar socio" }).click();
  const field = page.getByLabel(new RegExp(`${AGENCY_NAME} — responsable`));
  await expect(field).toBeVisible();
  const row = page.locator(".panel-form", { has: field });
  await row.getByRole("button", { name: "Anular" }).click();
  await expect(page).toHaveURL(/msg=invite_revoked/);
  await expect(page.getByLabel(new RegExp(`${AGENCY_NAME} — responsable`))).toHaveCount(0);

  await page.goto("/admin/historial");
  await expect(page.getByText("Invitó a un socio").first()).toBeVisible();
  await expect(page.getByText("Anuló una invitación de socio").first()).toBeVisible();
  await page.close();
});
