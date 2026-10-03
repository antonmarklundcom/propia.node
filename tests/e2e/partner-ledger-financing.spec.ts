/**
 * Partner ledger + commission suggestion (O2) and seller financing (O8),
 * end to end through the real pages and server actions:
 *
 *   super-admin opens /admin/negocios/socios: the partner agency shows one
 *   shared lead and one lead from its own listing
 *   → sets the usual split (5 % / 50 %); the lead's Negocio block prefills it,
 *     says it is a suggestion, and nothing is stored until Guardar
 *   → Guardar stores the deal; the ledger counts it
 *   → the agency switches on its own financing for its listing: empty is
 *     refused, typed terms show on /propiedad with "Datos provistos por …",
 *     the estimated cuota is gone (and cleared in the row)
 *   → switched off, the listing page shows no seller financing.
 *
 * Uses the listings `global-setup.ts` imports. Writes its fixtures straight
 * into the LOCAL database (refuses any other) and removes them afterwards.
 *
 *   E2E_PORT=3100 npx playwright test tests/e2e/partner-ledger-financing.spec.ts
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
    throw new Error("partner-ledger-financing.spec writes fixtures; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();
const digits = String(stamp).slice(-6);
const AGENCY = `E2E Socio Ledger ${stamp}`;

interface Fx {
  conn: mysql.Connection;
  adminId: number;
  agencyUserId: number;
  agencyId: number;
  ownListing: { id: number; publicId: string; slug: string };
  sharedLeadId: number;
  listingLeadId: number;
  tokens: { admin: string; agency: string };
}
let fx: Fx;
let admin: BrowserContext;
let agency: BrowserContext;

async function insertUser(conn: mysql.Connection, role: string, label: string): Promise<number> {
  const [r] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO users (email, name, role, locale) VALUES (?, ?, ?, 'es')",
    [`e2e-ledger-${label}-${stamp}@example.test`, `E2E ${label} ${stamp}`, role],
  );
  return r.insertId;
}
async function session(conn: mysql.Connection, userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await conn.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    createHash("sha256").update(token).digest("hex"),
    userId,
    new Date(Date.now() + 86_400_000),
  ]);
  return token;
}
async function ctxFor(browser: Browser, token: string) {
  const c = await browser.newContext({ baseURL: BASE });
  await c.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  return c;
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  const conn = await mysql.createConnection(localDbUrl());
  const adminId = await insertUser(conn, "admin", "admin");
  const agencyUserId = await insertUser(conn, "agency_admin", "agency");
  const [ag] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO agencies (name, slug, is_verified, plan) VALUES (?, ?, 1, 'partner')",
    [AGENCY, `e2e-socio-ledger-${stamp}`],
  );
  await conn.query("INSERT INTO agents (user_id, agency_id, name, slug, is_verified) VALUES (?, ?, ?, ?, 1)", [
    agencyUserId,
    ag.insertId,
    `E2E Agente Ledger ${stamp}`,
    `e2e-agente-ledger-${stamp}`,
  ]);
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id, public_id, slug FROM listings WHERE status = 'published' AND operation = 'venta' AND agency_id IS NULL AND owner_user_id IS NULL ORDER BY id DESC LIMIT 2",
  );
  const [own, other] = rows;
  // The agency's own listing, with a cached estimate the financing must replace.
  await conn.query("UPDATE listings SET agency_id = ?, cuota_gs = 2100000 WHERE id = ?", [ag.insertId, own.id]);
  const [listingLead] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO leads (lead_type, vertical, listing_id, name, whatsapp, routed_to) VALUES ('buyer', 'inmobiliaria', ?, ?, ?, 'agency')",
    [own.id, `E2E Directo ${stamp}`, `+595982${digits}`],
  );
  const [sharedLead] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO leads (lead_type, vertical, listing_id, name, whatsapp, routed_to) VALUES ('buyer', 'inmobiliaria', ?, ?, ?, 'internal')",
    [other.id, `E2E Compartida ${stamp}`, `+595981${digits}`],
  );
  await conn.query(
    "INSERT INTO lead_assignments (lead_id, agency_id, agent_id, assigned_by_user_id) VALUES (?, ?, 0, ?)",
    [sharedLead.insertId, ag.insertId, adminId],
  );
  fx = {
    conn,
    adminId,
    agencyUserId,
    agencyId: ag.insertId,
    ownListing: { id: own.id, publicId: own.public_id, slug: own.slug },
    sharedLeadId: sharedLead.insertId,
    listingLeadId: listingLead.insertId,
    tokens: { admin: await session(conn, adminId), agency: await session(conn, agencyUserId) },
  };
  admin = await ctxFor(browser, fx.tokens.admin);
  agency = await ctxFor(browser, fx.tokens.agency);
});

test.afterAll(async () => {
  await Promise.all([admin?.close(), agency?.close()]);
  if (!fx) return;
  const { conn } = fx;
  const leadIds = [fx.sharedLeadId, fx.listingLeadId];
  await conn.query("DELETE FROM deals WHERE lead_id IN (?)", [leadIds]);
  await conn.query("DELETE FROM lead_assignments WHERE lead_id IN (?)", [leadIds]);
  await conn.query("DELETE FROM leads WHERE id IN (?)", [leadIds]);
  await conn.query("DELETE FROM listing_financing WHERE listing_id = ?", [fx.ownListing.id]);
  await conn.query("UPDATE listings SET agency_id = NULL, cuota_gs = NULL WHERE id = ?", [fx.ownListing.id]);
  await conn.query("DELETE FROM partner_terms WHERE agency_id = ?", [fx.agencyId]);
  await conn.query("DELETE FROM admin_events WHERE actor_user_id IN (?)", [[fx.adminId, fx.agencyUserId]]);
  await conn.query("DELETE FROM agents WHERE agency_id = ?", [fx.agencyId]);
  await conn.query("DELETE FROM agencies WHERE id = ?", [fx.agencyId]);
  await conn.query("DELETE FROM sessions WHERE user_id IN (?)", [[fx.adminId, fx.agencyUserId]]);
  await conn.query("DELETE FROM users WHERE id IN (?)", [[fx.adminId, fx.agencyUserId]]);
  await conn.end();
});

const listingPath = () => `/propiedad/${fx.ownListing.slug}-${fx.ownListing.publicId}`;

test("the ledger shows what the Socio got; the usual split is saved", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/negocios");
  await page.getByRole("link", { name: /Consultas por socio/ }).click();
  const row = page.locator(`tr[data-partner="agency:${fx.agencyId}"]`);
  await expect(row).toContainText(AGENCY);
  // Socio | Compartidas | De sus avisos | Compradores | Vendedores | …
  const cells = row.locator("td");
  await expect(cells.nth(1)).toHaveText("1");
  await expect(cells.nth(2)).toHaveText("1");
  await expect(cells.nth(3)).toHaveText("2");

  const form = page.locator(`form#reparto-agency-${fx.agencyId}`);
  await form.locator('input[name="commissionPct"]').fill("5");
  await form.locator('input[name="mySharePct"]').fill("50");
  await form.locator('input[name="note"]').fill("Contrato e2e");
  await form.getByRole("button", { name: "Guardar reparto" }).click();
  await expect(page.getByText("Reparto guardado.")).toBeVisible();
  await expect(page.locator(`tr[data-partner="agency:${fx.agencyId}"]`)).toContainText("5 % · tu parte 50 %");
  if (SHOTS) await page.locator("main").screenshot({ path: `${SHOTS}/ledger.png` });

  await page.locator(`tr[data-partner="agency:${fx.agencyId}"] a`).first().click();
  const detail = page.locator("table[data-ledger-detail]");
  await expect(detail).toContainText(`E2E Compartida ${stamp}`);
  await expect(detail).toContainText(`E2E Directo ${stamp}`);
  await expect(detail).toContainText("Compartida");
  await expect(detail).toContainText("Su aviso");
  if (SHOTS) await page.locator("main").screenshot({ path: `${SHOTS}/ledger-detail.png` });

  const [[ev]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT count(*) AS n FROM admin_events WHERE actor_user_id = ? AND action = 'partner.terms'",
    [fx.adminId],
  );
  expect(Number(ev.n)).toBe(1);
});

test("the Negocio block suggests the split; only Guardar stores it", async () => {
  const page = await admin.newPage();
  await page.goto(`/admin/leads?vista=todas&tel=981${digits}&negocio=${fx.sharedLeadId}`);
  const card = page.locator(`#lead-${fx.sharedLeadId}`);
  await expect(card.locator('input[name="commissionPct"]')).toHaveValue("5.00");
  await expect(card.locator('input[name="mySharePct"]')).toHaveValue("50.00");
  await expect(card.locator("[data-split-suggested]")).toContainText(AGENCY);
  if (SHOTS) await card.screenshot({ path: `${SHOTS}/deal-suggestion.png` });

  // Shown, not stored.
  const [before] = await fx.conn.query<mysql.RowDataPacket[]>("SELECT id FROM deals WHERE lead_id = ?", [fx.sharedLeadId]);
  expect(before).toHaveLength(0);

  await card.locator('select[name="partner"]').selectOption(`agency:${fx.agencyId}`);
  await card.getByRole("button", { name: "Guardar negocio" }).click();
  await page.waitForLoadState("networkidle");
  const [[deal]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT commission_pct, my_share_pct, my_share_usd, agency_id FROM deals WHERE lead_id = ?",
    [fx.sharedLeadId],
  );
  expect([Number(deal.commission_pct), Number(deal.my_share_pct), deal.my_share_usd, Number(deal.agency_id)]).toEqual([
    5,
    50,
    null,
    fx.agencyId,
  ]);

  await page.goto("/admin/negocios/socios");
  const cells = page.locator(`tr[data-partner="agency:${fx.agencyId}"] td`);
  await expect(cells.nth(8)).toHaveText("1"); // Negocios
});

test("seller financing replaces the estimate on the listing page", async () => {
  const pub = await admin.newPage();
  await pub.goto(listingPath());
  await expect(pub.locator("[data-seller-financing]")).toHaveCount(0);

  const page = await agency.newPage();
  await page.goto(`/agencia/propiedad/${fx.ownListing.id}#financiacion`);
  const box = page.locator("#financiacion");
  await box.getByLabel("Mostrar financiación propia en el aviso").check();
  await box.getByRole("button", { name: "Guardar financiación" }).click();
  await expect(page.locator("#financiacion")).toContainText("escribí al menos");

  const box2 = page.locator("#financiacion");
  await box2.getByLabel("Mostrar financiación propia en el aviso").check();
  await box2.locator('input[name="financingEntity"]').fill("El propietario");
  await box2.locator('input[name="financingRate"]').fill("8 % anual");
  await box2.locator('input[name="financingTerm"]').fill("hasta 60 meses");
  await box2.locator('input[name="financingDownPayment"]').fill("30 %");
  await box2.getByRole("button", { name: "Guardar financiación" }).click();
  await expect(page.locator("#financiacion")).toContainText("Financiación guardada.");
  if (SHOTS) await page.locator("#financiacion").screenshot({ path: `${SHOTS}/financing-form.png` });

  const [[l]] = await fx.conn.query<mysql.RowDataPacket[]>("SELECT cuota_gs FROM listings WHERE id = ?", [fx.ownListing.id]);
  expect(l.cuota_gs).toBeNull();

  await pub.goto(listingPath());
  const seller = pub.locator("[data-seller-financing]");
  await expect(seller).toContainText("Financiación del vendedor");
  await expect(seller).toContainText("8 % anual");
  await expect(seller).toContainText("hasta 60 meses");
  await expect(seller).toContainText(`Datos provistos por ${AGENCY}, no por el portal.`);
  if (SHOTS) await seller.screenshot({ path: `${SHOTS}/financing-public.png` });
  await pub.setViewportSize({ width: 390, height: 844 });
  await pub.goto(listingPath());
  expect(await pub.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (SHOTS) await pub.locator("[data-seller-financing]").screenshot({ path: `${SHOTS}/financing-public-mobile.png` });

  // Another agency's listing id is not theirs: the action saves nothing.
  const [[otherId]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM listings WHERE (agency_id IS NULL OR agency_id <> ?) ORDER BY id LIMIT 1",
    [fx.agencyId],
  );
  await page.goto(`/agencia/propiedad/${fx.ownListing.id}`);
  await page.locator('#financiacion input[name="listingId"]').evaluate((el, v) => ((el as HTMLInputElement).value = String(v)), otherId.id);
  await page.locator("#financiacion").getByRole("button", { name: "Guardar financiación" }).click();
  await page.waitForURL(/msg=financing_not_found/);
  const [forged] = await fx.conn.query<mysql.RowDataPacket[]>("SELECT 1 FROM listing_financing WHERE listing_id = ?", [otherId.id]);
  expect(forged).toHaveLength(0);

  // Off: the box goes away.
  await page.goto(`/agencia/propiedad/${fx.ownListing.id}#financiacion`);
  await page.locator("#financiacion").getByLabel("Mostrar financiación propia en el aviso").uncheck();
  await page.locator("#financiacion").getByRole("button", { name: "Guardar financiación" }).click();
  await expect(page.locator("#financiacion")).toContainText("Financiación guardada.");
  await pub.goto(listingPath());
  await expect(pub.locator("[data-seller-financing]")).toHaveCount(0);
});
