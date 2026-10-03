/**
 * Partner reviews end to end (plan-admin-next O7), through the real admin
 * pages, the buyer's /resena form and both profile renderings:
 *
 *   a lead the agency worked (routed to it, marked contacted) gets a
 *   "Pedir reseña" link on /admin/leads; one it did not work (still new) does not
 *   → the buyer opens the link, gives 4 stars and a text → stored pending
 *   → the link cannot be used twice; a tampered link is refused
 *   → nothing shows on the profile until the operator approves on /admin/resenas
 *   → approved: stars only on inmobiliaria.com.py, the full review on
 *     inmobiliarios.com.py
 *   → "Despublicar" takes it down again.
 *
 * The server must run with AUTH_TOKEN_SECRET set (≥ 32 chars). Fixtures go
 * straight into the LOCAL database and are removed afterwards; refuses any
 * DATABASE_URL that is not localhost.
 *
 *   AUTH_TOKEN_SECRET=… (server) E2E_PORT=3100 npx playwright test tests/e2e/reviews.spec.ts
 */
import { createHash, randomBytes } from "node:crypto";
import { expect, test, type BrowserContext } from "@playwright/test";
import mysql from "mysql2/promise";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE = `http://localhost:${PORT}`;
const DIRECTORY = "inmobiliarios.com.py";
const COOKIE = "propia_session";
const SHOTS = process.env.E2E_SCREENSHOTS ?? "";

// The directory door is reached through Chromium's resolver (same trick as
// contrast-doors.spec.ts). This replaces launchOptions wholesale, so a local
// Chromium path from the environment is passed on too.
test.use({
  launchOptions: {
    args: [`--host-resolver-rules=MAP ${DIRECTORY} 127.0.0.1:${PORT}`],
    ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
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
    throw new Error("reviews.spec writes users, agencies, leads and reviews; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();
const AGENCY = `E2E Reseña Inmo ${stamp}`;
const SLUG = `e2e-resena-inmo-${stamp}`;

interface Fixture {
  conn: mysql.Connection;
  adminId: number;
  agencyId: number;
  listingId: number;
  workedLead: number;
  newLead: number;
  link: string;
}

let fx: Fixture;
let admin: BrowserContext;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  const conn = await mysql.createConnection(localDbUrl());
  const [u] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO users (email, name, role, locale) VALUES (?, ?, 'admin', 'es')",
    [`e2e-reviews-${stamp}@example.test`, `E2E Admin ${stamp}`],
  );
  const [g] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO agencies (name, slug, is_verified) VALUES (?, ?, 1)",
    [AGENCY, SLUG],
  );
  // A published listing of the agency, so its profile renders (0 listings is a 404).
  const [cols] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'listings' AND column_name NOT IN ('id', 'public_id', 'slug', 'agency_id', 'agent_id', 'owner_user_id') ORDER BY ordinal_position",
  );
  const names = cols.map((r) => `\`${r.c}\``).join(", ");
  const [[src]] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM listings WHERE status = 'published' ORDER BY id LIMIT 1",
  );
  const publicId = randomBytes(8).toString("hex").slice(0, 10);
  const [l] = await conn.query<mysql.ResultSetHeader>(
    `INSERT INTO listings (public_id, slug, agency_id, agent_id, owner_user_id, ${names}) SELECT ?, ?, ?, NULL, NULL, ${names} FROM listings WHERE id = ?`,
    [publicId, `e2e-resena-${stamp}`, g.insertId, src.id],
  );
  const lead = async (status: string, name: string) => {
    const [r] = await conn.query<mysql.ResultSetHeader>(
      "INSERT INTO leads (lead_type, vertical, listing_id, name, whatsapp, routed_to, status) VALUES ('buyer', 'inmobiliaria', ?, ?, '+595981000000', 'agency', ?)",
      [l.insertId, name, status],
    );
    return r.insertId;
  };
  const workedLead = await lead("contacted", `Lucía Benítez ${stamp}`);
  const newLead = await lead("new", `Sin Trabajar ${stamp}`);
  const token = randomBytes(32).toString("hex");
  await conn.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    createHash("sha256").update(token).digest("hex"),
    u.insertId,
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  ]);
  fx = { conn, adminId: u.insertId, agencyId: g.insertId, listingId: l.insertId, workedLead, newLead, link: "" };
  admin = await browser.newContext({ baseURL: BASE });
  await admin.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
});

test.afterAll(async () => {
  await admin?.close();
  if (!fx) return;
  const { conn } = fx;
  await conn.query("DELETE FROM reviews WHERE lead_id IN (?)", [[fx.workedLead, fx.newLead]]);
  await conn.query("DELETE FROM leads WHERE id IN (?)", [[fx.workedLead, fx.newLead]]);
  await conn.query("DELETE FROM listings WHERE id = ?", [fx.listingId]);
  await conn.query("DELETE FROM agencies WHERE id = ?", [fx.agencyId]);
  await conn.query("DELETE FROM admin_events WHERE actor_user_id = ?", [fx.adminId]);
  await conn.query("DELETE FROM sessions WHERE user_id = ?", [fx.adminId]);
  await conn.query("DELETE FROM users WHERE id = ?", [fx.adminId]);
  await conn.end();
});

test("only a lead the agency worked gets a review link", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/leads?vista=todas");
  const worked = page.locator(`#lead-${fx.workedLead}`);
  await worked.locator("[data-review-ask] summary").click();
  const input = worked.locator(`[data-review-link="agency:${fx.agencyId}"] input`);
  fx.link = await input.inputValue();
  expect(fx.link).toMatch(/\/resena\?t=[A-Za-z0-9_-]+$/);
  await expect(worked.locator("[data-review-ask] a[href^='https://wa.me/']")).toHaveCount(1);
  await expect(page.locator(`#lead-${fx.newLead} [data-review-ask]`)).toHaveCount(0);
  if (SHOTS) await worked.locator("[data-review-ask]").screenshot({ path: `${SHOTS}/reviews-ask.png` });
  await page.close();
});

test("the buyer leaves 4 stars and a text; it is stored pending", async ({ page }) => {
  await page.goto(fx.link);
  await expect(page.locator("h1")).toHaveText(`¿Cómo fue tu experiencia con ${AGENCY}?`);
  await expect(page.locator("#authorName")).toHaveValue("Lucía");
  await page.locator("label.review-stars__star[title='4 estrellas']").click();
  await page.locator("#authorName").fill("Lucía B.");
  await page.locator("#body").fill("Muy buena atención, respondieron rápido y la visita fue puntual.");
  if (SHOTS) await page.locator(".review-card").screenshot({ path: `${SHOTS}/reviews-form.png` });
  await page.getByRole("button", { name: "Enviar reseña" }).click();
  await expect(page.locator("[data-review-state=thanks]")).toBeVisible();

  const [[r]] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT rating, author_name, status, agency_id, agent_id FROM reviews WHERE lead_id = ?",
    [fx.workedLead],
  );
  expect(r).toMatchObject({ rating: 4, author_name: "Lucía B.", status: "pending" });
  expect(Number(r.agency_id)).toBe(fx.agencyId);
  expect(Number(r.agent_id)).toBe(0);
});

test("the link works once; a tampered link is refused", async ({ page }) => {
  await page.goto(fx.link);
  await expect(page.locator("[data-review-state=used]")).toContainText(AGENCY);
  await expect(page.locator("[data-review-form]")).toHaveCount(0);
  const token = new URL(fx.link).searchParams.get("t")!;
  const raw = Buffer.from(token, "base64url").toString("utf8").replace(`${fx.workedLead}.`, `${fx.newLead}.`);
  await page.goto(`/resena?t=${Buffer.from(raw).toString("base64url")}`);
  await expect(page.locator("[data-review-state=invalid]")).toBeVisible();
});

test("nothing shows before approval", async ({ page }) => {
  await page.goto(`/inmobiliaria/${SLUG}`);
  await expect(page.locator("[data-reviews-summary]")).toHaveCount(0);
});

test("the operator approves it on /admin/resenas", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/resenas");
  await expect(page.locator('a[href="/admin/resenas"] .panel-tab__count, a[href="/admin/resenas"]').first()).toBeVisible();
  const [[rv]] = await fx.conn.query<mysql.RowDataPacket[]>("SELECT id FROM reviews WHERE lead_id = ?", [fx.workedLead]);
  const card = page.locator(`[data-review-id="${rv.id}"]`);
  await expect(card.locator("[data-review-status]")).toHaveText("Por aprobar");
  if (SHOTS) await card.screenshot({ path: `${SHOTS}/reviews-moderation.png` });
  await card.getByRole("button", { name: "Aprobar" }).click();
  await expect(page.getByText("Reseña publicada.")).toBeVisible();
  await expect(page.locator(`[data-review-id="${rv.id}"] [data-review-status]`)).toHaveText("Publicada");
  await page.close();
});

test("approved: stars only on the marketplace, the full review on the directory door", async ({ page }) => {
  await page.goto(`/inmobiliaria/${SLUG}`);
  await expect(page.locator("[data-reviews-summary]")).toContainText("4,0 de 5 · 1 reseña");
  await expect(page.locator("[data-reviews-full]")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("Muy buena atención");

  await page.goto(`http://${DIRECTORY}/inmobiliaria/${SLUG}`);
  const full = page.locator("[data-reviews-full]");
  await expect(full).toContainText("4,0 de 5 · 1 reseña");
  await expect(full).toContainText("Lucía B.");
  await expect(full).toContainText("Muy buena atención, respondieron rápido y la visita fue puntual.");
  if (SHOTS) await full.screenshot({ path: `${SHOTS}/reviews-directory.png` });
});

test("Despublicar takes it down; both decisions are logged", async ({ page }) => {
  const adminPage = await admin.newPage();
  await adminPage.goto("/admin/resenas");
  const [[rv]] = await fx.conn.query<mysql.RowDataPacket[]>("SELECT id FROM reviews WHERE lead_id = ?", [fx.workedLead]);
  await adminPage.locator(`[data-review-id="${rv.id}"]`).getByRole("button", { name: "Despublicar" }).click();
  await expect(adminPage.getByText("Reseña rechazada.")).toBeVisible();
  await adminPage.close();

  await page.goto(`/inmobiliaria/${SLUG}`);
  await expect(page.locator("[data-reviews-summary]")).toHaveCount(0);
  const [events] = await fx.conn.query<mysql.RowDataPacket[]>(
    "SELECT action FROM admin_events WHERE actor_user_id = ? ORDER BY id",
    [fx.adminId],
  );
  expect(events.map((e) => e.action)).toEqual(["review.moderate", "review.moderate"]);
});
