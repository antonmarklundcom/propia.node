/**
 * Verify the featured-placement reminders' pure half — no database, no network,
 * no Cloudflare. The runner (`src/lib/ops/featured-reminders.ts`) is the same
 * two rules over real rows: which placements are due, and who is told.
 *
 * Run: npm run verify:listing-reminders   (also part of npm run verify:local)
 */
import {
  FEATURED_REMIND_DAYS,
  featuredDaysLeft,
  featuredRecipient,
  featuredReminderDue,
  featuredReminderKey,
} from "../src/lib/featured-reminders";
import { getDictionary } from "../src/i18n";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`  ok    ${name}`);
  }
}

const H = 60 * 60 * 1000;
const now = new Date("2026-09-30T12:00:00Z");
const at = (hours: number) => new Date(now.getTime() + hours * H);

console.log("Window");
check("the window is three days", FEATURED_REMIND_DAYS === 3);
check("ending in 71 h is due", featuredReminderDue(at(71), now));
check("ending in exactly 72 h is due", featuredReminderDue(at(72), now));
check("ending in 73 h is not yet", !featuredReminderDue(at(73), now));
check("ending in a minute is due", featuredReminderDue(at(1 / 60), now));
check("already ended is never due", !featuredReminderDue(at(-1), now) && !featuredReminderDue(now, now));
check("no end date is never due", !featuredReminderDue(null, now) && !featuredReminderDue(undefined, now));
check("a garbage date is never due", !featuredReminderDue("not a date", now));
check("an ISO string works like a Date", featuredReminderDue(at(10).toISOString(), now));

console.log("\nDays left");
check("under a day left says 1", featuredDaysLeft(at(3), now) === 1);
check("exactly 24 h left says 1", featuredDaysLeft(at(24), now) === 1);
check("25 h left says 2", featuredDaysLeft(at(25), now) === 2);
check("72 h left says 3", featuredDaysLeft(at(72), now) === 3);

console.log("\nOnce per end date");
check("the same placement gives the same key", featuredReminderKey(at(50)) === featuredReminderKey(at(50).toISOString()));
check("seconds do not change the key", featuredReminderKey(new Date("2026-10-02T14:00:05Z")) === featuredReminderKey(new Date("2026-10-02T14:00:55Z")));
check("a renewed placement gets a new key", featuredReminderKey(at(50)) !== featuredReminderKey(at(50 + 24 * 30)));

console.log("\nRecipient");
check("the private owner comes first", featuredRecipient({ ownerEmail: "o@x.com", agentEmail: "a@x.com", agencyEmail: "g@x.com" })?.kind === "owner");
check("then the agent", featuredRecipient({ agentEmail: "a@x.com", agencyEmail: "g@x.com" })?.kind === "agent");
check("then the agency address", featuredRecipient({ agencyEmail: "g@x.com" })?.email === "g@x.com");
check("nothing to send to is null, not a guess", featuredRecipient({}) === null && featuredRecipient({ ownerEmail: "  " }) === null);
check("an implausible address is skipped for the next one", featuredRecipient({ ownerEmail: "not an email", agentEmail: "a@x.com" })?.kind === "agent");
check("a header-injection address is refused", featuredRecipient({ ownerEmail: "a@x.com\r\nBcc: z@y.com" }) === null);

console.log("\nCopy (both languages, singular and plural)");
for (const locale of ["es", "en"] as const) {
  const t = getDictionary(locale).email;
  check(`${locale}: 1 day and 3 days read differently`, t.featuredBody("Casa", 1) !== t.featuredBody("Casa", 3));
  check(`${locale}: the body names the listing and the days`, t.featuredBody("Casa Luque", 3).includes("Casa Luque") && /3/.test(t.featuredBody("Casa Luque", 3)));
  check(`${locale}: subject carries the brand`, t.featuredSubject("Marca", "Casa").includes("Marca"));
  check(`${locale}: no leftover placeholder or undefined`, !/undefined|\$\{/.test(t.featuredBody("Casa", 2) + t.featuredSubject("M", "C") + t.featuredHeading));
}

console.log(failures === 0 ? "\nAll listing-reminder checks passed.\n" : `\n${failures} listing-reminder check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
