/**
 * The WhatsApp inbox end to end, with no Meta account: signed webhooks are
 * POSTed to `/api/whatsapp` exactly as `npm run whatsapp:replay` does (same
 * `signWebhook()`, same fixture, `scripts/fixtures/whatsapp-webhook-sample.json`),
 * then the rows and the pages are checked.
 *
 *   a bad signature is refused and stores nothing
 *   → a signed message from a number with a lead is stored and attached to it
 *   → the same webhook again (Meta retries) stores nothing twice
 *   → a message from a stranger is stored with no lead
 *   → the super-admin sees the stranger's chat in /admin/inbox?vista=whatsapp
 *   → and the lead's message under its card in /admin/leads.
 *
 * Needs the app to run WITH the four WhatsApp variables, and this process with
 * the same secret and phone-number id (otherwise the specs skip, loudly):
 *
 *   WHATSAPP_ACCESS_TOKEN=x WHATSAPP_PHONE_NUMBER_ID=123456 \
 *   WHATSAPP_APP_SECRET=secret WHATSAPP_VERIFY_TOKEN=verify \
 *   DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia" \
 *   E2E_PORT=3100 npx playwright test tests/e2e/whatsapp-inbox.spec.ts
 *
 * Fixtures (a super-admin with a session, one lead) go into the LOCAL database
 * and are removed afterwards with every message the run stored. Refuses any
 * DATABASE_URL that is not localhost. Media download and the auto-responder are
 * off/unconfigured by default, so nothing leaves the machine.
 */
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type BrowserContext } from "@playwright/test";
import mysql from "mysql2/promise";
import { signWebhook } from "../../src/lib/whatsapp-webhook";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE = `http://localhost:${PORT}`;
const COOKIE = "propia_session";
const SECRET = process.env.WHATSAPP_APP_SECRET;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

function localDbUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // refused below
  }
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error("whatsapp-inbox.spec writes users, leads and messages; it only runs against a local DATABASE_URL.");
  }
  return url;
}

const stamp = Date.now();
// Distinct last-nine-digits per run, so an old lead cannot capture the message.
const tail = String(stamp).slice(-8);
const LEAD_PHONE = `59598${tail}`.slice(0, 12);
const STRANGER_PHONE = `59597${tail}`.slice(0, 12);
const LEAD_TEXT = `Hola, consulta e2e ${stamp} sobre la casa`;
const STRANGER_TEXT = `Mensaje de un desconocido ${stamp}`;
const LEAD_MSG_ID = `wamid.E2E_LEAD_${stamp}`;
const STRANGER_MSG_ID = `wamid.E2E_STRANGER_${stamp}`;

/** The sample payload with this run's phone, id and text — what whatsapp-replay.ts builds. */
function payload(from: string, id: string, text: string): string {
  const template = readFileSync(join(process.cwd(), "scripts", "fixtures", "whatsapp-webhook-sample.json"), "utf8");
  const json = JSON.parse(
    template.replace("PHONE_NUMBER_ID", PHONE_NUMBER_ID!).replace("TIMESTAMP", String(Math.floor(Date.now() / 1000))),
  );
  const value = json.entry[0].changes[0].value;
  value.contacts[0].wa_id = from;
  value.messages[0].from = from;
  value.messages[0].id = id;
  value.messages[0].text.body = text;
  return JSON.stringify(json);
}

let conn: mysql.Connection;
let adminId = 0;
let leadId = 0;
let admin: BrowserContext;

async function post(body: string, signature: string) {
  return fetch(`${BASE}/api/whatsapp`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hub-signature-256": signature },
    body,
  });
}

async function countMessages(waId: string): Promise<number> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM whatsapp_messages WHERE wa_message_id = ?",
    [waId],
  );
  return Number(rows[0].n);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  test.skip(!SECRET || !PHONE_NUMBER_ID, "set WHATSAPP_APP_SECRET and WHATSAPP_PHONE_NUMBER_ID (the values the app runs with)");
  conn = await mysql.createConnection(localDbUrl());
  const [u] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO users (email, name, role, locale) VALUES (?, ?, 'admin', 'es')",
    [`e2e-wa-admin-${stamp}@example.test`, `E2E WA ${stamp}`],
  );
  adminId = u.insertId;
  const token = randomBytes(32).toString("hex");
  await conn.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    createHash("sha256").update(token).digest("hex"),
    adminId,
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  ]);
  const [l] = await conn.query<mysql.ResultSetHeader>(
    "INSERT INTO leads (lead_type, vertical, name, whatsapp, message, routed_to) VALUES ('question', 'inmobiliaria', ?, ?, 'e2e', 'internal')",
    [`E2E Lead ${stamp}`, `+${LEAD_PHONE}`],
  );
  leadId = l.insertId;
  admin = await browser.newContext({ baseURL: BASE });
  await admin.addCookies([
    { name: COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
});

test.afterAll(async () => {
  await admin?.close();
  if (!conn) return;
  await conn.query("DELETE FROM whatsapp_messages WHERE wa_message_id IN (?, ?)", [LEAD_MSG_ID, STRANGER_MSG_ID]);
  await conn.query("DELETE FROM whatsapp_contacts WHERE phone IN (?, ?)", [LEAD_PHONE, STRANGER_PHONE]).catch(() => {});
  await conn.query("DELETE FROM leads WHERE id = ?", [leadId]);
  await conn.query("DELETE FROM admin_events WHERE actor_user_id = ?", [adminId]);
  await conn.query("DELETE FROM sessions WHERE user_id = ?", [adminId]);
  await conn.query("DELETE FROM users WHERE id = ?", [adminId]);
  await conn.end();
});

test("a bad signature is refused and stores nothing", async () => {
  const body = payload(LEAD_PHONE, LEAD_MSG_ID, LEAD_TEXT);
  const res = await post(body, signWebhook("wrong-secret", body));
  expect(res.status).toBe(401);
  expect(await countMessages(LEAD_MSG_ID)).toBe(0);
});

test("a signed message from a lead's number is stored and attached to the lead", async () => {
  const body = payload(LEAD_PHONE, LEAD_MSG_ID, LEAD_TEXT);
  const res = await post(body, signWebhook(SECRET!, body));
  expect(res.status).toBe(200);
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT lead_id, direction, body FROM whatsapp_messages WHERE wa_message_id = ?",
    [LEAD_MSG_ID],
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].direction).toBe("in");
  expect(rows[0].body).toBe(LEAD_TEXT);
  expect(Number(rows[0].lead_id)).toBe(leadId);
});

test("Meta retrying the same webhook stores nothing twice", async () => {
  const body = payload(LEAD_PHONE, LEAD_MSG_ID, LEAD_TEXT);
  const res = await post(body, signWebhook(SECRET!, body));
  expect(res.status).toBe(200);
  expect(await countMessages(LEAD_MSG_ID)).toBe(1);
});

test("a stranger's message is stored with no lead", async () => {
  const body = payload(STRANGER_PHONE, STRANGER_MSG_ID, STRANGER_TEXT);
  const res = await post(body, signWebhook(SECRET!, body));
  expect(res.status).toBe(200);
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT lead_id FROM whatsapp_messages WHERE wa_message_id = ?",
    [STRANGER_MSG_ID],
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].lead_id).toBeNull();
});

test("the operator sees the stranger's chat in the WhatsApp inbox", async () => {
  const page = await admin.newPage();
  await page.goto("/admin/inbox?vista=whatsapp");
  await expect(page.getByText(STRANGER_TEXT)).toBeVisible();
  await page.close();
});

test("the lead's message shows under its card in /admin/leads", async () => {
  const page = await admin.newPage();
  await page.goto(`/admin/leads?q=${encodeURIComponent(`E2E Lead ${stamp}`)}`);
  await expect(page.getByText(LEAD_TEXT)).toBeVisible();
  await page.close();
});
