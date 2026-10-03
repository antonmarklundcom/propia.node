/**
 * /agencia/leads "Mis consultas / Todo el equipo" end to end
 * (src/lib/panel-lead-access.ts), through the real page and its CSV:
 *
 *   an agent sees the leads of their own listings and the shares made to
 *   them — not a teammate's lead, not the agency's own share — with no toggle
 *   → the agency admin sees everything in "Todo el equipo" (the default)
 *   → "Mis consultas" narrows to their own listing; the choice is remembered
 *   → each view's CSV holds exactly what the page shows.
 *
 * Fixtures go straight into the LOCAL database (refuses any other) and are
 * removed afterwards. Uses the listings `global-setup.ts` imports.
 *
 *   E2E_PORT=3100 npx playwright test tests/e2e/agency-lead-views.spec.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
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
    throw new Error("agency-lead-views.spec writes fixtures; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();
const N = {
  adminLead: `E2E Lead del responsable ${stamp}`,
  agentLead: `E2E Lead del agente ${stamp}`,
  teammateLead: `E2E Lead de otro agente ${stamp}`,
  agencyShare: `E2E Compartida con la inmobiliaria ${stamp}`,
  agentShare: `E2E Compartida con el agente ${stamp}`,
};

interface Fx {
  conn: mysql.Connection;
  agencyId: number;
  userIds: number[];
  listingIds: number[];
  leadIds: number[];
  tokens: { admin: string; agent: string };
}
let fx: Fx;
let admin: BrowserContext;
let agent: BrowserContext;

async function ctxFor(browser: Browser, token: string) {
  const c = await browser.newContext({ baseURL: BASE });
  await c.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  return c;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  const conn = await mysql.createConnection(localDbUrl());
  const [ag] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO agencies (name, slug, is_verified) VALUES (?, ?, 1)",
    [`E2E Equipo ${stamp}`, `e2e-equipo-${stamp}`],
  );
  const agencyId = ag.insertId;
  const member = async (role: string, label: string) => {
    const [u] = await conn.query<mysql.ResultSetHeader>(
      "INSERT INTO users (email, name, role, locale) VALUES (?, ?, ?, 'es')",
      [`e2e-team-${label}-${stamp}@example.test`, `E2E ${label}`, role],
    );
    const [a] = await conn.query<mysql.ResultSetHeader>(
      "INSERT INTO agents (user_id, agency_id, name, slug, is_verified) VALUES (?, ?, ?, ?, 1)",
      [u.insertId, agencyId, `E2E ${label} ${stamp}`, `e2e-team-${label}-${stamp}`],
    );
    const token = randomBytes(32).toString("hex");
    await conn.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
      createHash("sha256").update(token).digest("hex"),
      u.insertId,
      new Date(Date.now() + 86_400_000),
    ]);
    return { userId: u.insertId, agentId: a.insertId, token };
  };
  const adminM = await member("agency_admin", "admin");
  const agentM = await member("agent", "agente");
  const mateM = await member("agent", "otro");

  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM listings WHERE status = 'published' AND agency_id IS NULL AND owner_user_id IS NULL ORDER BY id LIMIT 3 OFFSET 20",
  );
  const [lAdmin, lAgent, lMate] = rows.map((r) => r.id as number);
  for (const [id, agentId] of [[lAdmin, adminM.agentId], [lAgent, agentM.agentId], [lMate, mateM.agentId]] as const) {
    await conn.query("UPDATE listings SET agency_id = ?, agent_id = ? WHERE id = ?", [agencyId, agentId, id]);
  }
  const lead = async (name: string, listingId: number | null, routedTo: string) => {
    const [r] = await conn.query<mysql.ResultSetHeader>(
      "INSERT INTO leads (lead_type, vertical, listing_id, name, whatsapp, routed_to) VALUES ('buyer', 'inmobiliaria', ?, ?, '+595981000555', ?)",
      [listingId, name, routedTo],
    );
    return r.insertId;
  };
  const leadIds = [
    await lead(N.adminLead, lAdmin, "agent"),
    await lead(N.agentLead, lAgent, "agent"),
    await lead(N.teammateLead, lMate, "agent"),
  ];
  const agencyShare = await lead(N.agencyShare, null, "internal");
  const agentShare = await lead(N.agentShare, null, "internal");
  leadIds.push(agencyShare, agentShare);
  await conn.query(
    "INSERT INTO lead_assignments (lead_id, agency_id, agent_id, assigned_by_user_id) VALUES (?, ?, 0, ?), (?, 0, ?, ?)",
    [agencyShare, agencyId, adminM.userId, agentShare, agentM.agentId, adminM.userId],
  );
  fx = {
    conn,
    agencyId,
    userIds: [adminM.userId, agentM.userId, mateM.userId],
    listingIds: [lAdmin, lAgent, lMate],
    leadIds,
    tokens: { admin: adminM.token, agent: agentM.token },
  };
  admin = await ctxFor(browser, adminM.token);
  agent = await ctxFor(browser, agentM.token);
});

test.afterAll(async () => {
  await Promise.all([admin?.close(), agent?.close()]);
  if (!fx) return;
  const { conn } = fx;
  await conn.query("DELETE FROM lead_assignments WHERE lead_id IN (?)", [fx.leadIds]);
  await conn.query("DELETE FROM leads WHERE id IN (?)", [fx.leadIds]);
  await conn.query("UPDATE listings SET agency_id = NULL, agent_id = NULL WHERE id IN (?)", [fx.listingIds]);
  await conn.query("DELETE FROM agents WHERE agency_id = ?", [fx.agencyId]);
  await conn.query("DELETE FROM sessions WHERE user_id IN (?)", [fx.userIds]);
  await conn.query("DELETE FROM users WHERE id IN (?)", [fx.userIds]);
  await conn.query("DELETE FROM agencies WHERE id = ?", [fx.agencyId]);
  await conn.end();
});

test("an agent sees only their own, with no toggle", async () => {
  const page = await agent.newPage();
  await page.goto("/agencia/leads?vista=equipo");
  const main = page.locator("main");
  await expect(main).toContainText(N.agentLead);
  await expect(main).toContainText(N.agentShare);
  await expect(main).not.toContainText(N.teammateLead);
  await expect(main).not.toContainText(N.adminLead);
  await expect(main).not.toContainText(N.agencyShare);
  await expect(page.locator("[data-lead-view]")).toHaveCount(0);
  await expect(main).toContainText("Ves las consultas de los avisos asignados a vos");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/agent-leads.png`, fullPage: true });

  const csv = await (await page.request.get(`${BASE}/agencia/leads/export?vista=equipo`)).text();
  expect(csv).toContain(N.agentLead);
  expect(csv).toContain(N.agentShare);
  expect(csv).not.toContain(N.teammateLead);
  expect(csv).not.toContain(N.agencyShare);
});

test("the agency admin sees the whole team by default, and their own on request", async () => {
  const page = await admin.newPage();
  await page.goto("/agencia/leads");
  const main = page.locator("main");
  await expect(page.locator('[data-lead-view="equipo"]')).toBeVisible();
  for (const name of Object.values(N)) await expect(main).toContainText(name);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/admin-team.png`, fullPage: true });

  await page.getByRole("link", { name: "Mis consultas" }).click();
  await expect(page.locator('[data-lead-view="mias"]')).toBeVisible();
  await expect(main).toContainText(N.adminLead);
  await expect(main).not.toContainText(N.agentLead);
  await expect(main).not.toContainText(N.teammateLead);
  await expect(main).not.toContainText(N.agencyShare);
  await expect(main).not.toContainText(N.agentShare);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/admin-mine.png`, fullPage: true });

  // Remembered: the bare URL opens on "Mis consultas" again.
  await page.goto("/agencia/leads");
  await expect(page.locator('[data-lead-view="mias"]')).toBeVisible();
  const csvMine = await (await page.request.get(`${BASE}/agencia/leads/export?vista=mias`)).text();
  expect(csvMine).toContain(N.adminLead);
  expect(csvMine).not.toContain(N.agentLead);

  await page.getByRole("link", { name: "Todo el equipo" }).click();
  await expect(page.locator('[data-lead-view="equipo"]')).toBeVisible();
  await expect(main).toContainText(N.teammateLead);
  const csvTeam = await (await page.request.get(`${BASE}/agencia/leads/export?vista=equipo`)).text();
  for (const name of Object.values(N)) expect(csvTeam).toContain(name);
});
