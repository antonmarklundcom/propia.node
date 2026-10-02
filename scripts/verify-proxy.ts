/**
 * Verify the trusted-proxy path (docs/hosting-process-cap.md) — pure, no
 * database, no network:
 *
 *   1. Without ORIGIN_PROXY_SECRET nothing changes: x-forwarded-host wins as
 *      it always did, x-client-ip is ignored.
 *   2. With it, x-forwarded-host and x-client-ip count only alongside the
 *      matching x-origin-auth; a forged header falls back to Host / the last
 *      x-forwarded-for hop.
 *   3. The Worker's plan (`workers/host-router/src/route.ts`) forwards to the
 *      one origin with the door in x-forwarded-host, strips client-sent proxy
 *      headers, caches only /_next/static, answers the whole-host redirect
 *      itself, and refuses a loop or a missing secret.
 *   4. A request shaped exactly like the Worker's output is read by the app as
 *      the door the visitor typed — the two halves agree.
 *
 * Run: npm run verify:proxy   (also part of npm run verify:local)
 */
import { bareHostFrom, visitorHostFrom } from "../src/lib/host";
import { clientIpFrom } from "../src/lib/client-ip";
import { planRoute } from "../workers/host-router/src/route";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${!ok && detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

const SECRET = "s3cret-s3cret-s3cret-0123456789";
const h = (o: Record<string, string>) => new Headers(o);

// 1. No secret: today's behaviour.
delete process.env.ORIGIN_PROXY_SECRET;
check("no secret: x-forwarded-host wins", bareHostFrom(h({ host: "realestateinparaguay.com", "x-forwarded-host": "terreno.com.py" })) === "terreno.com.py");
check("no secret: Host alone", bareHostFrom(h({ host: "www.Inmobiliaria.com.py:443" })) === "inmobiliaria.com.py");
check("no secret: x-client-ip ignored", clientIpFrom(h({ "x-forwarded-for": "1.1.1.1, 9.9.9.9", "x-client-ip": "6.6.6.6", "x-origin-auth": "x" })) === "9.9.9.9");

// 2. Secret set.
process.env.ORIGIN_PROXY_SECRET = SECRET;
check("secret: forged x-forwarded-host ignored", bareHostFrom(h({ host: "realestateinparaguay.com", "x-forwarded-host": "terreno.com.py" })) === "realestateinparaguay.com");
check("secret: wrong x-origin-auth ignored", bareHostFrom(h({ host: "realestateinparaguay.com", "x-forwarded-host": "terreno.com.py", "x-origin-auth": SECRET + "x" })) === "realestateinparaguay.com");
check("secret: matching x-origin-auth → door", bareHostFrom(h({ host: "realestateinparaguay.com", "x-forwarded-host": "www.terreno.com.py", "x-origin-auth": SECRET })) === "terreno.com.py");
check("secret: visitorHostFrom keeps www for links", visitorHostFrom(h({ host: "realestateinparaguay.com", "x-forwarded-host": "www.terreno.com.py", "x-origin-auth": SECRET })) === "www.terreno.com.py");
check("secret: forged x-client-ip ignored", clientIpFrom(h({ "x-forwarded-for": "9.9.9.9", "x-client-ip": "6.6.6.6" })) === "9.9.9.9");
check("secret: Worker's x-client-ip used", clientIpFrom(h({ "x-forwarded-for": "172.70.1.1", "x-client-ip": "200.1.2.3", "x-origin-auth": SECRET })) === "200.1.2.3");
process.env.ORIGIN_PROXY_SECRET = "short";
check("a secret under 16 chars counts as unset", bareHostFrom(h({ host: "a.com", "x-forwarded-host": "terreno.com.py" })) === "terreno.com.py");
process.env.ORIGIN_PROXY_SECRET = SECRET;

// 3. The Worker's plan.
const cfg = { originHost: "realestateinparaguay.com", secret: SECRET };
const p = planRoute(
  "https://www.terreno.com.py/venta/luque?x=1",
  h({ host: "www.terreno.com.py", "x-forwarded-host": "evil.com", "x-client-ip": "6.6.6.6", "x-origin-auth": "guess", cookie: "a=b" }),
  "200.1.2.3",
  cfg,
);
check("forward to the origin, path and query kept", p.kind === "forward" && p.url === "https://realestateinparaguay.com/venta/luque?x=1");
if (p.kind === "forward") {
  check("door in x-forwarded-host (client value replaced)", p.headers.get("x-forwarded-host") === "www.terreno.com.py");
  check("client IP from cf-connecting-ip", p.headers.get("x-client-ip") === "200.1.2.3");
  check("secret attached", p.headers.get("x-origin-auth") === SECRET);
  check("other headers kept (cookie)", p.headers.get("cookie") === "a=b");
  check("pages not cacheable", p.cacheable === false);

  // 4. The app reads the Worker's request as the door.
  const atOrigin = new Headers(p.headers);
  atOrigin.set("host", "realestateinparaguay.com");
  atOrigin.set("x-forwarded-for", "172.70.1.1");
  check("app sees the door", bareHostFrom(atOrigin) === "terreno.com.py");
  check("app sees the visitor's IP", clientIpFrom(atOrigin) === "200.1.2.3");
}
const s = planRoute("https://terreno.com.py/_next/static/chunks/a.js", h({}), null, cfg);
check("/_next/static cacheable", s.kind === "forward" && s.cacheable);
const r = planRoute("https://www.landforsaleinparaguay.com/venta?a=1", h({}), null, cfg);
check("whole-host redirect at the edge", r.kind === "redirect" && r.location === "https://landforsaleparaguay.com/venta?a=1");
check("no secret → 503", planRoute("https://terreno.com.py/", h({}), null, { ...cfg, secret: "" }).kind === "refuse");
const loop = planRoute("https://terreno.com.py/", h({ "x-origin-auth": SECRET }), null, cfg);
check("re-entry → 508", loop.kind === "refuse" && loop.status === 508);
const self = planRoute("https://www.realestateinparaguay.com/", h({}), null, cfg);
check("origin host routed to the Worker → 508", self.kind === "refuse" && self.status === 508);

delete process.env.ORIGIN_PROXY_SECRET;
if (failures > 0) {
  console.log(`\nverify:proxy — ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nverify:proxy — OK");
