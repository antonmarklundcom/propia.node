/**
 * Verify the public-endpoint rate limiter (`src/lib/rate-limit.ts`) — pure, no
 * database, no network, no real time.
 *
 * The limiter reads `Date.now()` and nothing else, so this script replaces
 * `Date.now` with a clock it moves by hand and imports the module only after
 * that (its sweep timer is initialised at load). `server-only` resolves to the
 * no-op shim through `scripts/tsconfig.json`, the same way every other script
 * reaches into `src/lib`.
 *
 * What it pins down, each with the real windows of the callers where it matters:
 *
 *   1. **An exhausted allowance stays exhausted** for the rest of its window,
 *      and further blocked hits do not reset it.
 *   2. **The expiry boundary.** A window is `start … start + windowMs`
 *      inclusive; the first request strictly after it opens a fresh window.
 *   3. **Mixed windows (the O2 regression, fable/KNOWN-ISSUES.md).** The sweep
 *      runs on whichever caller triggers it. A 5-minute `import-url` request
 *      six minutes after an OTP user was blocked must not expire that
 *      hour-long `otp` bucket and hand the user a fresh allowance.
 *   4. **Keys are independent.** One exhausted key never blocks another.
 *
 * Test only: the limiter itself is not changed by this script.
 *
 * Run: npm run verify:rate-limit   (also part of npm run verify:local)
 */

let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const MIN = 60_000;
// Any fixed epoch; the limiter only ever subtracts two readings.
let clock = Date.UTC(2026, 8, 22, 12, 0, 0);
const realNow = Date.now;
Date.now = () => clock;
const advance = (ms: number) => {
  clock += ms;
};

/** Hit `key` n times, return how many were allowed. */
function hits(allow: (k: string, m: number, w: number) => boolean, key: string, n: number, max: number, windowMs: number) {
  let allowed = 0;
  for (let i = 0; i < n; i++) if (allow(key, max, windowMs)) allowed += 1;
  return allowed;
}

async function main() {
  const { allowRequest } = await import("../src/lib/rate-limit");

  // The callers' real numbers (app/…/actions.ts, app/api/leads/route.ts).
  const OTP = { max: 5, windowMs: 60 * MIN };
  const IMPORT_URL = { max: 12, windowMs: 5 * MIN };
  const LEADS = { max: 10, windowMs: 10 * MIN };

  console.log("\nrate-limit: exhausted allowance");
  {
    const key = "leads|203.0.113.1";
    check("the first `max` requests are allowed", hits(allowRequest, key, LEADS.max, LEADS.max, LEADS.windowMs) === LEADS.max);
    check("request max+1 is refused", !allowRequest(key, LEADS.max, LEADS.windowMs));
    advance(LEADS.windowMs / 2);
    check("still refused halfway through the window", !allowRequest(key, LEADS.max, LEADS.windowMs));
    check("refused hits do not reset the window", hits(allowRequest, key, 20, LEADS.max, LEADS.windowMs) === 0);
  }

  console.log("\nrate-limit: expiry boundary");
  {
    const key = "register|198.51.100.7";
    const windowMs = 10 * MIN;
    check("fills the window", hits(allowRequest, key, 5, 5, windowMs) === 5);
    advance(windowMs);
    check("exactly start + windowMs is still the same window (refused)", !allowRequest(key, 5, windowMs));
    advance(1);
    check("1 ms after the window, a fresh window opens (allowed)", allowRequest(key, 5, windowMs));
    check("…and the fresh window counts from 1 (4 more allowed, then refused)",
      hits(allowRequest, key, 4, 5, windowMs) === 4 && !allowRequest(key, 5, windowMs));
  }

  console.log("\nrate-limit: mixed windows (O2 regression)");
  {
    const otpKey = "otp|42";
    check("OTP user uses the whole hourly allowance", hits(allowRequest, otpKey, OTP.max, OTP.max, OTP.windowMs) === OTP.max);
    check("the next OTP request is refused", !allowRequest(otpKey, OTP.max, OTP.windowMs));
    // Six minutes on, a different caller with a 5-minute window triggers the sweep.
    advance(6 * MIN);
    check("an import-url request six minutes later is allowed", allowRequest("import-url:7", IMPORT_URL.max, IMPORT_URL.windowMs));
    check("the OTP bucket survived that 5-minute sweep (still refused)", !allowRequest(otpKey, OTP.max, OTP.windowMs));
    // Another short-window sweep much later, still inside the hour.
    advance(40 * MIN);
    allowRequest("import-url:8", IMPORT_URL.max, IMPORT_URL.windowMs);
    check("still refused 46 minutes in, after a second short sweep", !allowRequest(otpKey, OTP.max, OTP.windowMs));
    // Past the hour (the window started at the first OTP hit, 46 minutes ago).
    advance(15 * MIN);
    check("allowed again once the hour has passed", allowRequest(otpKey, OTP.max, OTP.windowMs));
  }

  console.log("\nrate-limit: keys are independent");
  {
    const windowMs = 10 * MIN;
    hits(allowRequest, "leads|a", 11, 10, windowMs);
    check("one exhausted key does not block another", allowRequest("leads|b", 10, windowMs));
    check("the exhausted key is still refused", !allowRequest("leads|a", 10, windowMs));
  }

  Date.now = realNow;
  console.log(failures === 0 ? "\nrate-limit: all checks passed\n" : `\nrate-limit: ${failures} check(s) FAILED\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
