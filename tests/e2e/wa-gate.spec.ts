/**
 * WhatsApp taps and "Pedir datos antes de WhatsApp" end to end
 * (plan-admin-next O9), through the real pages, server actions, the beacon
 * and the public lead endpoint:
 *
 *   gate off: the listing's WhatsApp buttons are wa.me links, the form is the
 *     usual "Enviar Mensaje"
 *   → super-admin switches the gate on in /admin/ajustes (logged in history)
 *   → gate on: the buttons scroll to the form and still send a `wa` tap to the
 *     beacon; the form's "Enviar y abrir WhatsApp" saves a lead stamped
 *     `utm.channel = "whatsapp"`, then opens wa.me; a client-sent
 *     `utm.channel` is dropped
 *   → /admin/analitica "WhatsApp por anunciante" groups listing taps, profile
 *     taps (the agent's under their agency) and gate leads by publisher;
 *     /admin/leads marks the lead
 *   → /agencia shows the responsable their agency's and their own profile taps
 *   → the gate is switched off again through the same form.
 *
 * Fixtures go straight into the LOCAL database (a copy of a published listing
 * owned by a new agency, so no cached detail page is involved) and are
 * removed afterwards; refuses any DATABASE_URL that is not localhost.
 *
 *   E2E_PORT=3100 npx playwright test tests/e2e/wa-gate.spec.ts
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
    throw new Error("wa-gate.spec writes users, agencies, listings and leads; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();
const digits = String(stamp).slice(-6);
const AGENCY_NAME = `E2E WA Inmo ${stamp}`;
const AGENCY_SLUG = `e2e-wa-inmo-${stamp}`;
const AGENT_SLUG = `e2e-wa-agente-${stamp}`;
const PUBLIC_ID = randomBytes(8).toString("hex").replace(/[^a-z0-9]/g, "").slice(0, 10).padEnd(10, "x");
const SLUG = `e2e-wa-gate-${stamp}`;
const LISTING_PATH = `/propiedad/${SLUG}-${PUBLIC_ID}`;

interface Fixture {
  conn: mysql.Connection;
  adminId: number;
  memberId: number;
  agencyId: number;
  agentId: number;
  listingId: number;
  leadIds: number[];
  gateBefore: string | null;
}

let fx: Fixture;
let admin: BrowserContext;
let member: BrowserContext;

test.describe.configure({ mode: "serial" });

async function session(conn: mysql.Connection, userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await conn.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    createHash("sha256").update(token).digest("hex"),
    userId,
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  ]);
  return token;
}

async function contextWith(browser: import("@playwright/test").Browser, token: string) {
  const ctx = await browser.newContext({ baseURL: BASE });
  await ctx.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  return ctx;
}

test.beforeAll(async ({ browser }) => {
  const conn = await mysql.createConnection(localDbUrl());
  const [u] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO users (email, name, role, locale) VALUES (?, ?, 'admin', 'es')",
    [`e2e-wagate-admin-${stamp}@example.test`, `E2E Admin ${stamp}`],
  );
  const [m] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO users (email, name, role, locale) VALUES (?, ?, 'agency_admin', 'es')",
    [`e2e-wagate-member-${stamp}@example.test`, `E2E Responsable ${stamp}`],
  );
  const [g] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO agencies (name, slug, is_verified, whatsapp) VALUES (?, ?, 1, ?)",
    [AGENCY_NAME, AGENCY_SLUG, `595981${digits}`],
  );
  const [a] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO agents (name, slug, agency_id, user_id, is_verified) VALUES (?, ?, ?, ?, 1)",
    [`E2E WA Agente ${stamp}`, AGENT_SLUG, g.insertId, m.insertId],
  );

  // A copy of a published listing, owned by the new agency.
  const [cols] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'listings' AND column_name NOT IN ('id', 'public_id', 'slug', 'agency_id', 'agent_id', 'owner_user_id') ORDER BY ordinal_position",
  );
  const names = cols.map((r) => `\`${r.c}\``).join(", ");
  const [[src]] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM listings WHERE status = 'published' AND agency_id IS NULL AND agent_id IS NULL AND owner_user_id IS NULL ORDER BY id LIMIT 1",
  );
  const [l] = await conn.query<mysql.ResultSetHeader>(
    `INSERT INTO listings (public_id, slug, agency_id, agent_id, owner_user_id, ${names}) SELECT ?, ?, ?, NULL, NULL, ${names} FROM listings WHERE id = ?`,
    [PUBLIC_ID, SLUG, g.insertId, src.id],
  );

  // Taps already recorded: three on the listing, two on the agency's profile,
  // one on the member's own agent profile (grouped under the agency).
  const day = new Date().toISOString().slice(0, 10);
  const tap = (path: string, listingId: number | null) =>
    conn.query(
      "INSERT INTO analytics_events (ts, day, vertical, event, path, listing_id, device, visitor_hash) VALUES (NOW(), ?, 'inmobiliaria', 'wa_click', ?, ?, 'mobile', ?)",
      [day, path, listingId, randomBytes(8).toString("hex")],
    );
  for (let i = 0; i < 3; i++) await tap(LISTING_PATH, l.insertId);
  for (let i = 0; i < 2; i++) await tap(`/inmobiliaria/${AGENCY_SLUG}`, null);
  await tap(`/agente/${AGENT_SLUG}`, null);

  const [[gate]] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT value FROM site_settings WHERE `key` = 'wa_gate_enabled'",
  );
  fx = {
    conn,
    adminId: u.insertId,
    memberId: m.insertId,
    agencyId: g.insertId,
    agentId: a.insertId,
    listingId: l.insertId,
    leadIds: [],
    gateBefore: gate?.value ?? null,
  };
  admin = await contextWith(browser, await session(conn, u.insertId));
  member = await contextWith(browser, await session(conn, m.insertId));
});

test.afterAll(async () => {
  await admin?.close();
  await member?.close();
  if (!fx) return;
  const { conn } = fx;
  const [rows] = await conn.query<mysql.RowDataPacket[]>("SELECT id FROM leads WHERE listing_id = ?", [fx.listingId]);
  const leadIds = [...new Set([...fx.leadIds, ...rows.map((r) => Number(r.id))])];
  if (leadIds.length) {
    await conn.query("DELETE FROM lead_assignments WHERE lead_id IN (?)", [leadIds]);
    await conn.query("DELETE FROM leads WHERE id IN (?)", [leadIds]);
  }
  await conn.query("DELETE FROM analytics_events WHERE listing_id = ? OR path IN (?)", [
    fx.listingId,
    [LISTING_PATH, `/inmobiliaria/${AGENCY_SLUG}`, `/agente/${AGENT_SLUG}`],
  ]);
  await conn.query("DELETE FROM admin_events WHERE actor_user_id = ?", [fx.adminId]);
  if (fx.gateBefore == null) await conn.query("DELETE FROM site_settings WHERE `key` = 'wa_gate_enabled'");
  else await conn.query("UPDATE site_settings SET value = ? WHERE `key` = 'wa_gate_enabled'", [fx.gateBefore]);
  await conn.query("DELETE FROM listings WHERE id = ?", [fx.listingId]);
  await conn.query("DELETE FROM agents WHERE id = ?", [fx.agentId]);
  await conn.query("DELETE FROM agencies WHERE id = ?", [fx.agencyId]);
  await conn.query("DELETE FROM sessions WHERE user_id IN (?)", [[fx.adminId, fx.memberId]]);
  await conn.query("DELETE FROM users WHERE id IN (?)", [[fx.adminId, fx.memberId]]);
  await conn.end();
});

async function setGate(on: boolean) {
  const page = await admin.newPage();
  await page.goto("/admin/ajustes#whatsapp-avisos");
  const form = page.locator("form#whatsapp-avisos");
  const box = form.getByLabel("Pedir datos antes de abrir WhatsApp");
  if (on) await box.check();
  else await box.uncheck();
  await form.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible();
  await expect(page.locator("form#whatsapp-avisos")).toContainText(on ? "Ahora: encendido." : "Ahora: apagado");
  if (SHOTS && on) await page.locator("form#whatsapp-avisos").screenshot({ path: `${SHOTS}/wa-gate-settings.png` });
  await page.close();
}

test("gate off: WhatsApp buttons are wa.me links", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: BASE });
  const page = await ctx.newPage();
  await page.goto(LISTING_PATH);
  await expect(page.locator("a.seller-card__whatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  await expect(page.locator("form#contacto button[type=submit]")).toHaveText("Enviar Mensaje");
  await ctx.close();
});

test("super-admin switches the gate on", async () => {
  await setGate(true);
  const [[ev]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM admin_events WHERE actor_user_id = ? AND action = 'setting.change'",
    [fx.adminId],
  );
  expect(Number(ev.n)).toBe(1);
});

test("gate on: the tap is counted, the form saves a WhatsApp lead, then opens wa.me", async ({ browser }) => {
  const ctx = await browser.newContext({ baseURL: BASE });
  await ctx.route("https://wa.me/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<p>wa</p>" }));
  const page = await ctx.newPage();
  await page.goto(LISTING_PATH);
  const button = page.locator("a.seller-card__whatsapp");
  await expect(button).toHaveAttribute("href", "#contacto");
  await expect(page.locator("a.listing-cta-bar__btn--whatsapp")).toHaveAttribute("href", "#contacto");

  const beacon = page.waitForRequest((r) => r.url().endsWith("/api/a") && (r.postData() ?? "").includes('"e":"wa"'));
  await button.click();
  const body = JSON.parse((await beacon).postData() ?? "{}") as { events: Array<{ e: string; p: string }> };
  expect(body.events.some((e) => e.e === "wa" && e.p === LISTING_PATH)).toBe(true);

  const form = page.locator("form#contacto");
  await expect(form.locator("button[type=submit]")).toHaveText("Enviar y abrir WhatsApp");
  await expect(form.locator("a.contact-form__altlink[href^='https://wa.me']")).toHaveCount(0);
  if (SHOTS) await page.locator("aside").first().screenshot({ path: `${SHOTS}/wa-gate-form.png` });
  await form.getByLabel("Nombre").fill(`E2E Gate ${stamp}`);
  await form.locator("input[type=tel]").fill(`981${digits}`);
  await Promise.all([page.waitForURL(/^https:\/\/wa\.me\//), form.locator("button[type=submit]").click()]);

  const [rows] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT id, JSON_VALUE(utm, '$.channel') AS channel, routed_to FROM leads WHERE listing_id = ? ORDER BY id",
    [fx.listingId],
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].channel).toBe("whatsapp");
  expect(rows[0].routed_to).toBe("agency");
  fx.leadIds.push(Number(rows[0].id));
  await ctx.close();
});

test("a client-sent utm.channel is dropped", async ({ request }) => {
  const res = await request.post(`${BASE}/api/leads`, {
    headers: { "content-type": "application/json" },
    data: {
      leadType: "buyer",
      listingPublicId: PUBLIC_ID,
      name: `E2E Spoof ${stamp}`,
      whatsapp: `+595981${digits}`,
      message: "Consulta de prueba (e2e).",
      utm: { channel: "whatsapp", utm_source: "e2e" },
    },
  });
  expect(res.status()).toBe(200);
  const { leadId } = await res.json();
  fx.leadIds.push(leadId);
  const [[row]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT JSON_VALUE(utm, '$.channel') AS channel, JSON_VALUE(utm, '$.utm_source') AS src FROM leads WHERE id = ?",
    [leadId],
  );
  expect(row.channel).toBeNull();
  expect(row.src).toBe("e2e");
});

test("/admin/analitica groups taps and WhatsApp leads by publisher; the lead card is marked", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/analitica");
  const table = page.locator("#whatsapp-anunciantes");
  const row = table.locator("tr").filter({ hasText: AGENCY_NAME });
  await expect(row).toHaveCount(1);
  const cells = row.locator("td");
  await expect(cells.nth(1)).toHaveText("Inmobiliaria");
  // Three seeded listing taps (the gated tap is still in the server's buffer).
  await expect(cells.nth(2)).toHaveText("3");
  await expect(cells.nth(3)).toHaveText("3");
  await expect(cells.nth(4)).toHaveText("1");
  if (SHOTS) await table.screenshot({ path: `${SHOTS}/wa-publisher-table.png` });

  await page.goto("/admin/leads?vista=todas");
  const card = page.locator("article").filter({ hasText: `E2E Gate ${stamp}` }).first();
  await expect(card.locator("[data-lead-channel=whatsapp]")).toHaveText("Llegó por el botón de WhatsApp");
  await expect(
    page.locator("article").filter({ hasText: `E2E Spoof ${stamp}` }).first().locator("[data-lead-channel]"),
  ).toHaveCount(0);
  await page.close();
});

test("/agencia shows the responsable their profile taps", async () => {
  const page = await member.newPage();
  await page.goto("/agencia");
  await expect(page.locator("[data-profile-taps]")).toContainText(
    "2 en el perfil de la inmobiliaria · 1 en tu perfil de agente",
  );
  if (SHOTS) await page.locator("[data-profile-taps]").screenshot({ path: `${SHOTS}/wa-profile-taps.png` });
  await page.close();
});

test("switching the gate off restores wa.me links", async ({ browser }) => {
  await setGate(false);
  const ctx = await browser.newContext({ baseURL: BASE });
  const page = await ctx.newPage();
  await page.goto(LISTING_PATH);
  await expect(page.locator("a.seller-card__whatsapp")).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  await ctx.close();
});
