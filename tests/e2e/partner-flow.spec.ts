/**
 * The partner loop end to end (plan-agency batches 4 and 6), through the real
 * pages and server actions:
 *
 *   super-admin shares a lead with a verified agent
 *   → the agent sees it in /agencia/leads and presses "La tomo"
 *   → the agent sets the deal stage
 *   → the super-admin sees the stage in /admin/negocios and types the money
 *   → a staff user sees the stage but no money field, and no ledger
 *   → the ledger CSV carries the money (super-admin only)
 *   → a revoked share disappears for the agent
 *   → the super-admin deletes the deal (after the confirm word).
 *
 * Fixtures (three users with sessions, one verified independent agent, one
 * internal-lane lead) are written straight into the LOCAL database and
 * removed afterwards; a session is a row + the cookie, exactly what
 * `createSession()` writes, so no login form or rate limit is involved.
 * Refuses any DATABASE_URL that is not localhost.
 *
 * Run (local DB, app built and started on E2E_PORT):
 *   E2E_PORT=3100 npx playwright test tests/e2e/partner-flow.spec.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
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
    throw new Error("partner-flow.spec writes users and leads; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();
const digits = String(stamp).slice(-6);
/** The lead's phone; its last 9 digits are the /admin/leads `tel=` filter. */
const WHATSAPP = `+595 981 ${digits}`;
const TEL_KEY = `981${digits}`;
const LEAD_NAME = `E2E Comprador ${stamp}`;
const AGENT_NAME = `E2E Socio ${stamp}`;

/** es-PY money, the way `formatUsd()` prints a value with cents. */
const money = (n: number) =>
  n.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Fixture {
  conn: mysql.Connection;
  adminId: number;
  staffId: number;
  agentUserId: number;
  agentId: number;
  leadId: number;
  tokens: { admin: string; staff: string; agent: string };
}

let fx: Fixture;
let admin: BrowserContext;
let staff: BrowserContext;
let agent: BrowserContext;

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
  const agentUserId = await insertUser(conn, "agent", "agent");
  const [agentRes] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO agents (user_id, name, slug, is_verified) VALUES (?, ?, ?, 1)",
    [agentUserId, AGENT_NAME, `e2e-socio-${stamp}`],
  );
  const [leadRes] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO leads (lead_type, vertical, name, whatsapp, message, routed_to) VALUES ('buyer', 'inmobiliaria', ?, ?, ?, 'internal')",
    [LEAD_NAME, WHATSAPP, "Busco casa en Asunción (e2e)."],
  );
  fx = {
    conn,
    adminId,
    staffId,
    agentUserId,
    agentId: agentRes.insertId,
    leadId: leadRes.insertId,
    tokens: {
      admin: await insertSession(conn, adminId),
      staff: await insertSession(conn, staffId),
      agent: await insertSession(conn, agentUserId),
    },
  };
  admin = await contextFor(browser, fx.tokens.admin);
  staff = await contextFor(browser, fx.tokens.staff);
  agent = await contextFor(browser, fx.tokens.agent);
});

test.afterAll(async () => {
  await Promise.all([admin?.close(), staff?.close(), agent?.close()]);
  if (!fx) return;
  const { conn, leadId, agentId } = fx;
  const userIds = [fx.adminId, fx.staffId, fx.agentUserId];
  await conn.query("DELETE FROM deals WHERE lead_id = ?", [leadId]);
  await conn.query("DELETE FROM lead_assignments WHERE lead_id = ?", [leadId]);
  await conn.query("DELETE FROM admin_events WHERE target_type = 'lead' AND target_id = ?", [leadId]);
  await conn.query("DELETE FROM admin_events WHERE actor_user_id IN (?)", [userIds]);
  await conn.query("DELETE FROM leads WHERE id = ?", [leadId]);
  await conn.query("DELETE FROM agents WHERE id = ?", [agentId]);
  await conn.query("DELETE FROM sessions WHERE user_id IN (?)", [userIds]);
  await conn.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  await conn.end();
});

/** The lead's card on /admin/leads, filtered to its phone. */
async function adminCard(page: Page, extra = "") {
  await page.goto(`/admin/leads?tel=${TEL_KEY}${extra}`);
  const card = page.locator(`#lead-${fx.leadId}`);
  await expect(card).toBeVisible();
  return card;
}

async function sharedCard(page: Page) {
  await page.goto("/agencia/leads");
  return page.locator(`#shared-${fx.leadId}`);
}

test("super-admin shares the lead with a verified agent", async () => {
  const page = await admin.newPage();
  const card = await adminCard(page);
  await card.locator('select[name="target"]').selectOption(`agent:${fx.agentId}`);
  await card.getByRole("button", { name: "Compartir", exact: true }).click();
  await page.waitForURL(/msg=/);
  const after = page.locator(`#lead-${fx.leadId}`);
  await expect(after).toContainText(AGENT_NAME);
  await expect(after.getByRole("button", { name: "Quitar acceso" })).toBeVisible();
  await page.close();
});

test("the agent sees it in /agencia/leads, takes it and sets the deal stage", async () => {
  const page = await agent.newPage();
  const card = await sharedCard(page);
  await expect(card).toBeVisible();
  await expect(card).toContainText(LEAD_NAME);

  await card.getByRole("button", { name: "La tomo" }).click();
  await page.waitForURL(/msg=/);
  const taken = page.locator(`#shared-${fx.leadId}`);
  await expect(taken.getByRole("button", { name: "La tomo" })).toHaveClass(/panel-btn--primary/);

  await taken.locator('select[name="stage"]').selectOption("viewing");
  await taken.getByRole("button", { name: "Actualizar etapa" }).click();
  await page.waitForURL(/msg=deal_saved/);
  await expect(page.locator(".panel-flash")).toContainText("Etapa actualizada");
  await expect(page.locator(`#shared-${fx.leadId} select[name="stage"]`)).toHaveValue("viewing");
  // The partner's card has no money field at all.
  await expect(page.locator(`#shared-${fx.leadId} input[name="myShareUsd"]`)).toHaveCount(0);
  await page.close();
});

test("the super-admin sees the stage in /admin/negocios and types the money", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/negocios");
  const row = page.locator("tr", { has: page.getByRole("link", { name: LEAD_NAME }) });
  await expect(row).toContainText("Visita");
  await expect(row).toContainText(AGENT_NAME);

  const card = await adminCard(page, `&negocio=${fx.leadId}`);
  const deal = card.locator("details", { has: page.locator('input[name="myShareUsd"]') });
  await deal.locator('input[name="salePriceUsd"]').fill("250000");
  await deal.locator('input[name="commissionPct"]').fill("5");
  await deal.locator('input[name="mySharePct"]').fill("50");
  await deal.locator('input[name="myShareUsd"]').fill("12500.50");
  await deal.locator('input[name="paidAt"]').fill("2026-09-15");
  await deal.getByRole("button", { name: "Guardar negocio" }).click();
  await page.waitForURL(/msg=deal_saved/);
  await expect(page.locator(".panel-flash")).toContainText("Negocio guardado");

  await page.goto("/admin/negocios");
  const saved = page.locator("tr", { has: page.getByRole("link", { name: LEAD_NAME }) });
  await expect(saved).toContainText(money(12500.5));
  await expect(saved).toContainText("Visita");
  await page.close();
});

test("the ledger CSV carries the money, for the super-admin only", async () => {
  const res = await admin.request.get("/admin/negocios/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const csv = await res.text();
  const line = csv.split("\r\n").find((l) => l.includes(LEAD_NAME)) ?? "";
  expect(line).toContain(",250000.00,5.00,50.00,12500.50,2026-09-15,");
  expect(line).toContain(AGENT_NAME);

  const denied = await staff.request.get("/admin/negocios/export");
  expect(denied.headers()["content-type"] ?? "").not.toContain("text/csv");
  expect(await denied.text()).not.toContain("12500.50");
});

test("a staff user sees the stage but no money field and no ledger", async () => {
  const page = await staff.newPage();
  const card = await adminCard(page, `&negocio=${fx.leadId}`);
  await expect(card).toContainText("Etapa del negocio");
  await expect(card).toContainText("Visita");
  for (const name of ["salePriceUsd", "commissionPct", "mySharePct", "myShareUsd", "paidAt"]) {
    await expect(card.locator(`input[name="${name}"]`)).toHaveCount(0);
  }
  await expect(page.locator("body")).not.toContainText(money(12500.5));
  await expect(page.locator("body")).not.toContainText("Borrar negocio");

  await page.goto("/admin/negocios");
  expect(new URL(page.url()).pathname).not.toBe("/admin/negocios");
  await expect(page.locator("body")).not.toContainText(money(12500.5));
  await page.close();
});

test("a revoked share disappears for the agent", async () => {
  const page = await admin.newPage();
  const card = await adminCard(page);
  await card.getByRole("button", { name: "Quitar acceso" }).click();
  await page.waitForURL(/msg=/);
  await expect(page.locator(`#lead-${fx.leadId}`).getByRole("button", { name: "Quitar acceso" })).toHaveCount(0);
  await page.close();

  const agentPage = await agent.newPage();
  const gone = await sharedCard(agentPage);
  await expect(gone).toHaveCount(0);
  await expect(agentPage.locator("body")).not.toContainText(LEAD_NAME);
  await agentPage.close();
});

test("the super-admin deletes the deal only after the confirm word", async () => {
  const page = await admin.newPage();
  const card = await adminCard(page, `&negocio=${fx.leadId}`);
  const del = card.locator('form[aria-label="Borrar este negocio"]');
  await del.locator('input[name="confirm"]').fill("borra");
  await del.getByRole("button", { name: "Borrar negocio" }).click();
  await page.waitForURL(/msg=deal_delete_confirm/);
  await expect(page.locator(".auth-error")).toContainText("escribí BORRAR");

  const again = page.locator(`#lead-${fx.leadId} form[aria-label="Borrar este negocio"]`);
  await again.locator('input[name="confirm"]').fill("BORRAR");
  await again.getByRole("button", { name: "Borrar negocio" }).click();
  await page.waitForURL(/msg=deal_deleted/);
  await expect(page.locator(".panel-flash")).toContainText("Negocio borrado");

  await page.goto("/admin/negocios");
  await expect(page.getByRole("link", { name: LEAD_NAME })).toHaveCount(0);

  const [events] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT action FROM admin_events WHERE target_type = 'lead' AND target_id = ? AND action = 'deal.delete'",
    [fx.leadId],
  );
  expect(events.length).toBe(1);
  await page.close();
});
