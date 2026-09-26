/**
 * Send ONE test email through Cloudflare Email Sending, so the founder can
 * check the setup after putting the env vars in hPanel (or exporting them in a
 * shell — tsx does not read .env):
 *
 *   npm run email:test -- --to you@example.com --dry   # print the request, send nothing
 *   npm run email:test -- --to you@example.com         # send it
 *
 * Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_EMAIL_TOKEN; EMAIL_FROM is
 * optional. Not an ops job (it touches no database and is not routine), so it
 * calls `sendEmail()` directly — the same function the app sends through.
 * Exits 1 unless Cloudflare accepted the message: a "sent" line here is only
 * ever printed for a real acceptance.
 */
import { emailRequestBody, isEmailConfigured, renderEmail, sendEmail } from "../src/lib/email";
import { BRAND_NAME } from "../src/lib/brand";
import { DRY, flagString } from "./ops-cli";

async function main(): Promise<number> {
  const to = flagString("--to");
  if (!to) {
    console.error("Usage: npm run email:test -- --to <address> [--dry]");
    return 1;
  }

  const { html, text } = renderEmail({
    heading: `Prueba de correo — ${BRAND_NAME}`,
    paragraphs: [
      "Si estás leyendo esto, Cloudflare Email Sending está configurado y este servidor puede enviar correo.",
      `Enviado: ${new Date().toISOString()}`,
    ],
    footer: "Correo de prueba enviado con npm run email:test.",
  });
  const message = { to, subject: `Prueba de correo — ${BRAND_NAME}`, html, text };

  const body = emailRequestBody(message);
  if (!body) {
    console.error("Refused: the --to address or EMAIL_FROM is not a valid address.");
    return 1;
  }

  console.log(`configured: ${isEmailConfigured() ? "yes" : "NO (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_EMAIL_TOKEN unset)"}`);
  console.log(`from:       ${JSON.stringify(body.from)}`);
  console.log(`to:         ${to}`);
  console.log(`subject:    ${String(body.subject)}`);

  if (DRY) {
    console.log("\n[DRY RUN — nothing sent]");
    return 0;
  }
  if (!isEmailConfigured()) {
    console.error("\nNot sent: email is not configured.");
    return 1;
  }

  const result = await sendEmail(message);
  if (result.sent) {
    console.log(`\nAccepted by Cloudflare${result.messageId ? ` (message id ${result.messageId})` : ""}. Check the inbox (and spam).`);
    return 0;
  }
  console.error(`\nNot sent: ${result.error ?? "unknown error"}`);
  return 1;
}

void main().then((code) => process.exit(code));
