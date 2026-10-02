/**
 * Lead routing rules end to end (plan-admin-next O3), through the real pages,
 * server actions and the public lead endpoint:
 *
 *   super-admin marks an independent agent "Socio" in /admin/agentes
 *   → sets coverage in /admin/ajustes (agent: the barrio; partner agency: the
 *     city) and switches routing on; the preview names the agent
 *   → a lead on a listing in that barrio is shared with the agent (barrio
 *     beats city), with the automatic note and a `lead.auto_share` history line
 *   → with the agent "busy" (a share pending > 24 h) the next lead goes to the
 *     agency (city tier)
 *   → with routing off, a new lead is not shared at all.
 *
 * Uses the listings `global-setup.ts` imports into asuncion/villa-morra (no
 * agency, no owner: their leads land in the operator's lane). Fixtures go
 * straight into the LOCAL database and are removed afterwards; refuses any
 * DATABASE_URL that is not localhost.
 *
 *   E2E_PORT=3100 npx playwright test tests/e2e/lead-routing.spec.ts
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
    throw new Error("lead-routing.spec writes users, agencies and leads; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();
const digits = String(stamp).slice(-6);
const AGENT_NAME = `E2E Socio Agente ${stamp}`;
const AGENCY_NAME = `E2E Socio Inmo ${stamp}`;

interface Fixture {
  conn: mysql.Connection;
  adminId: number;
  agentId: number;
  agencyId: number;
  barrioId: number;
  cityId: number;
  listingPublicId: string;
  token: string;
  settingsBefore: Array<{ key: string; value: string | null }>;
  leadIds: number[];
}

let fx: Fixture;
let admin: BrowserContext;

const ROUTING_KEYS = ["lead_routing_enabled", "lead_routing_rules", "partner_agent_ids"];

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  const conn = await mysql.createConnection(localDbUrl());
  const [u] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO users (email, name, role, locale) VALUES (?, ?, 'admin', 'es')",
    [`e2e-routing-${stamp}@example.test`, `E2E Admin ${stamp}`],
  );
  const [a] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO agents (name, slug, is_verified) VALUES (?, ?, 1)",
    [AGENT_NAME, `e2e-socio-agente-${stamp}`],
  );
  const [g] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO agencies (name, slug, is_verified, plan) VALUES (?, ?, 1, 'partner')",
    [AGENCY_NAME, `e2e-socio-inmo-${stamp}`],
  );
  const [[barrio]] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id, parent_id FROM locations WHERE full_slug = 'asuncion/villa-morra'",
  );
  const [[listing]] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT public_id FROM listings WHERE location_id = ? AND status = 'published' AND agency_id IS NULL AND agent_id IS NULL AND owner_user_id IS NULL ORDER BY id LIMIT 1",
    [barrio.id],
  );
  const [settingsBefore] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT `key`, value FROM site_settings WHERE `key` IN (?)",
    [ROUTING_KEYS],
  );
  const token = randomBytes(32).toString("hex");
  await conn.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    createHash("sha256").update(token).digest("hex"),
    u.insertId,
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  ]);
  fx = {
    conn,
    adminId: u.insertId,
    agentId: a.insertId,
    agencyId: g.insertId,
    barrioId: barrio.id,
    cityId: barrio.parent_id,
    listingPublicId: listing.public_id,
    token,
    settingsBefore: settingsBefore as Fixture["settingsBefore"],
    leadIds: [],
  };
  admin = await browser.newContext({ baseURL: BASE });
  await admin.addCookies([
    { name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
});

test.afterAll(async () => {
  await admin?.close();
  if (!fx) return;
  const { conn } = fx;
  if (fx.leadIds.length) {
    await conn.query("DELETE FROM lead_assignments WHERE lead_id IN (?)", [fx.leadIds]);
    await conn.query("DELETE FROM admin_events WHERE target_type = 'lead' AND target_id IN (?)", [fx.leadIds]);
    await conn.query("DELETE FROM leads WHERE id IN (?)", [fx.leadIds]);
  }
  await conn.query("DELETE FROM lead_assignments WHERE agent_id = ? OR agency_id = ?", [fx.agentId, fx.agencyId]);
  await conn.query("DELETE FROM admin_events WHERE actor_user_id = ?", [fx.adminId]);
  await conn.query("DELETE FROM site_settings WHERE `key` IN (?)", [ROUTING_KEYS]);
  for (const s of fx.settingsBefore) {
    await conn.query("INSERT INTO site_settings (`key`, value) VALUES (?, ?)", [s.key, s.value]);
  }
  await conn.query("DELETE FROM agents WHERE id = ?", [fx.agentId]);
  await conn.query("DELETE FROM agencies WHERE id = ?", [fx.agencyId]);
  await conn.query("DELETE FROM sessions WHERE user_id = ?", [fx.adminId]);
  await conn.query("DELETE FROM users WHERE id = ?", [fx.adminId]);
  await conn.end();
});

async function submitLead(page: Page, n: number): Promise<number> {
  const res = await page.request.post(`${BASE}/api/leads`, {
    headers: { "content-type": "application/json" },
    data: {
      leadType: "buyer",
      listingPublicId: fx.listingPublicId,
      name: `E2E Ruteo ${n} ${stamp}`,
      whatsapp: `+595981${digits}`,
      message: "Consulta de prueba del reparto automático (e2e).",
    },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.routedTo).toBe("internal");
  fx.leadIds.push(body.leadId);
  return body.leadId as number;
}

/** The lead's shares, once `after()` has had time to write them. */
async function sharesOf(leadId: number, expectAny: boolean) {
  let rows: mysql.RowDataPacket[] = [];
  for (let i = 0; i < 40; i++) {
    [rows] = await fx.conn.query<mysql.RowDataPacket[]>(
      "SELECT agency_id, agent_id, note, assigned_by_user_id FROM lead_assignments WHERE lead_id = ?",
      [leadId],
    );
    if (rows.length > 0 || !expectAny) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  return rows;
}

test("mark the agent Socio and save coverage rules", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/agentes");
  const row = page.locator("tr, li, article").filter({ hasText: AGENT_NAME }).first();
  await row.getByRole("button", { name: "Marcar como socio" }).click();
  await page.waitForLoadState("networkidle");

  await page.goto("/admin/ajustes#reparto");
  const form = page.locator("form#reparto");
  await expect(form).toContainText(AGENT_NAME);
  await expect(form).toContainText(AGENCY_NAME);

  const agent = form.locator(`[data-socio="agent:${fx.agentId}"]`);
  await agent.getByLabel("Recibe consultas automáticas").check();
  await agent.locator("select").selectOption([String(fx.barrioId)]);
  await agent.getByLabel("Venta", { exact: true }).check();

  const agency = form.locator(`[data-socio="agency:${fx.agencyId}"]`);
  await agency.getByLabel("Recibe consultas automáticas").check();
  await agency.locator("select").selectOption([String(fx.cityId)]);

  await form.getByLabel("Reparto automático").check();
  await form.getByRole("button", { name: "Guardar reglas de reparto" }).click();
  await expect(page.getByText("Reglas de reparto guardadas.")).toBeVisible();
  await expect(page.locator("form#reparto")).toContainText("Ahora: encendido.");
  if (SHOTS) {
    await page.locator("form#reparto").screenshot({ path: `${SHOTS}/routing-settings.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("form#reparto").screenshot({ path: `${SHOTS}/routing-settings-mobile.png` });
  }
  // The coverage cards must not push the panel wider than a phone.
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const [[ev]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT count(*) AS n FROM admin_events WHERE actor_user_id = ? AND action = 'setting.change'",
    [fx.adminId],
  );
  expect(Number(ev.n)).toBeGreaterThanOrEqual(2);
});

test("a new lead in the barrio goes to the barrio Socio", async () => {
  const page = await admin.newPage();
  const leadId = await submitLead(page, 1);
  const rows = await sharesOf(leadId, true);
  expect(rows).toHaveLength(1);
  expect(Number(rows[0].agent_id)).toBe(fx.agentId);
  expect(rows[0].note).toBe("Asignada automáticamente por las reglas de reparto.");
  expect(Number(rows[0].assigned_by_user_id)).toBe(fx.adminId);
  const [[ev]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT detail_json FROM admin_events WHERE action = 'lead.auto_share' AND target_id = ?",
    [leadId],
  );
  const detail = typeof ev.detail_json === "string" ? JSON.parse(ev.detail_json) : ev.detail_json;
  expect(detail).toMatchObject({ target: `agent:${fx.agentId}`, via: "barrio" });

  await page.goto(`/admin/leads?vista=todas&tel=981${digits}`);
  await expect(page.locator(`#lead-${leadId}`)).toContainText(AGENT_NAME);
  if (SHOTS) await page.locator(`#lead-${leadId}`).screenshot({ path: `${SHOTS}/routing-lead-card.png` });

  await page.goto("/admin/historial");
  await expect(page.getByText("Compartió una consulta (regla automática)").first()).toBeVisible();
});

test("a busy Socio is skipped: the city Socio gets the next lead", async () => {
  // The agent's share is now "unanswered for two days".
  await fx.conn.query(
    "UPDATE lead_assignments SET created_at = now() - interval 2 day WHERE agent_id = ?",
    [fx.agentId],
  );
  // An unshared lead typed straight into the operator's lane, for the preview.
  const [pre] = await fx.conn.query<mysql.ResultSetHeader>(
    "INSERT INTO leads (lead_type, vertical, listing_id, name, whatsapp, routed_to) SELECT 'buyer', 'inmobiliaria', id, ?, ?, 'internal' FROM listings WHERE public_id = ?",
    [`E2E Vista previa ${stamp}`, `+595981${digits}`, fx.listingPublicId],
  );
  fx.leadIds.push(pre.insertId);
  const page = await admin.newPage();
  await page.goto("/admin/ajustes#reparto-prueba");
  await expect(page.locator("#reparto-prueba")).toContainText(`Se compartiría con ${AGENCY_NAME} (cubre la ciudad)`);
  if (SHOTS) await page.locator("#reparto-prueba").screenshot({ path: `${SHOTS}/routing-preview.png` });

  const leadId = await submitLead(page, 2);
  const rows = await sharesOf(leadId, true);
  expect(rows).toHaveLength(1);
  expect(Number(rows[0].agency_id)).toBe(fx.agencyId);
});

test("routing off: a new lead stays with the operator", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/ajustes#reparto");
  const form = page.locator("form#reparto");
  await form.getByLabel("Reparto automático").uncheck();
  await form.getByRole("button", { name: "Guardar reglas de reparto" }).click();
  await expect(page.locator("form#reparto")).toContainText("Ahora: apagado");

  const leadId = await submitLead(page, 3);
  await new Promise((r) => setTimeout(r, 2500));
  expect(await sharesOf(leadId, false)).toHaveLength(0);
});
