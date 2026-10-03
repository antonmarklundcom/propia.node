/**
 * Pure checks for two /admin insight modules: the connection / process rules
 * behind "Salud del sitio" (src/lib/runtime-health-rules.ts) and the evergreen
 * promotion candidates on /admin/google (src/lib/gsc-candidates.ts). No DB, no
 * network, no fs. In verify:local and the pre-push hook.
 */
import {
  connectionVerdict,
  looksLikeNextServer,
  parseCmdline,
  parseProcStat,
  showValue,
  summarizeCopies,
  type ServerProcess,
} from "../src/lib/runtime-health-rules";
import {
  categoryPageFilterRegex,
  categoryPathOf,
  evergreenCandidates,
  type PageQueryRow,
  type PageRow,
} from "../src/lib/gsc-candidates";
import { formatUptime } from "../src/i18n/es-admin-insights";

let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    failed++;
    console.error(`FAIL ${name}:\n  got  ${g}\n  want ${w}`);
  }
}

/* ------------------------------------------------------------------ */
/* /proc parsing                                                       */
/* ------------------------------------------------------------------ */

// A real-shaped stat line: field 20 (num_threads) is 11.
const stat = "4242 (next-server (v1) S 1 4242 4242 0 -1 4194560 1 0 0 0 5 2 0 0 20 0 11 0 12345 0 0";
eq("stat: comm with spaces and parens", parseProcStat(stat), { pid: 4242, ppid: 1, threads: 11 });
eq(
  "stat: plain comm",
  parseProcStat("77 (node) R 70 77 70 0 -1 0 0 0 0 0 0 0 0 0 20 0 7 0 1 0 0"),
  { pid: 77, ppid: 70, threads: 7 },
);
eq("stat: garbage", parseProcStat("not a stat line"), null);
eq("stat: empty", parseProcStat(""), null);
eq("stat: short line keeps ppid, threads 0", parseProcStat("5 (x) S 2"), { pid: 5, ppid: 2, threads: 0 });

eq("cmdline: NUL split", parseCmdline("node\0/app/node_modules/.bin/next\0start\0"), [
  "node",
  "/app/node_modules/.bin/next",
  "start",
]);
eq("cmdline: empty", parseCmdline(""), []);

eq("next: process title", looksLikeNextServer(["next-server (v15.5.4)"]), true);
eq("next: bin next start", looksLikeNextServer(["node", "/app/node_modules/.bin/next", "start"]), true);
eq("next: dist bin", looksLikeNextServer(["node", "/app/node_modules/next/dist/bin/next", "start", "-p", "3000"]), true);
eq("next: npx next start", looksLikeNextServer(["npx", "next", "start"]), true);
eq("next: next dev is not a server copy", looksLikeNextServer(["node", "/app/node_modules/.bin/next", "dev"]), false);
eq("next: other node app", looksLikeNextServer(["node", "server.js"]), false);
eq("next: lsnode wrapper", looksLikeNextServer(["lsnode:/home/u/app/"]), false);
eq("next: substring is not a match", looksLikeNextServer(["node", "/home/u/my-next-servers/x.js"]), false);
eq("next: empty", looksLikeNextServer([]), false);

const own = "/home/u/domains/app/nodejs";
const proc = (pid: number, ppid: number, threads: number, cwd: string | null): ServerProcess => ({ pid, ppid, threads, cwd });
eq(
  "copies: own folder, orphans, others",
  summarizeCopies(
    [
      proc(10, 900, 9, own),
      proc(11, 1, 8, own),
      proc(12, 1, 7, own),
      proc(13, 1, 10, "/home/u/domains/other/nodejs"),
      proc(14, 1, 10, null),
      proc(10, 900, 9, own), // listed twice: counted once
    ],
    own,
  ),
  { copies: 3, orphaned: 2, threads: 24, otherServers: 2 },
);
eq("copies: none", summarizeCopies([], own), { copies: 0, orphaned: 0, threads: 0, otherServers: 0 });

/* ------------------------------------------------------------------ */
/* Connection verdict                                                  */
/* ------------------------------------------------------------------ */

const conn = (
  threadsConnected: number | null,
  maxConnections: number | null,
  userConnections: number | null,
  maxUserConnections: number | null,
) => ({ threadsConnected, maxConnections, userConnections, maxUserConnections });

eq("verdict: user at 80 %", connectionVerdict(conn(20, 500, 40, 50)), { kind: "user-near-limit", used: 40, max: 50 });
eq("verdict: user below 80 %", connectionVerdict(conn(20, 500, 39, 50)), { kind: "ok" });
eq("verdict: user over limit", connectionVerdict(conn(20, 500, 60, 50)), { kind: "user-near-limit", used: 60, max: 50 });
eq("verdict: no per-user limit (0) → server rule", connectionVerdict(conn(410, 500, 400, 0)), {
  kind: "server-near-limit",
  used: 410,
  max: 500,
});
eq("verdict: no per-user limit, server fine", connectionVerdict(conn(100, 500, 400, 0)), { kind: "ok" });
eq("verdict: user rule wins over server", connectionVerdict(conn(450, 500, 45, 50)), {
  kind: "user-near-limit",
  used: 45,
  max: 50,
});
eq("verdict: only server known", connectionVerdict(conn(10, 100, null, null)), { kind: "ok" });
eq("verdict: nothing known", connectionVerdict(conn(null, null, null, null)), { kind: "unknown" });
eq("verdict: limit unknown, count known", connectionVerdict(conn(null, null, 5, null)), { kind: "unknown" });

eq("show: value", showValue([{ Variable_name: "max_connections", Value: "151" }], "max_connections"), 151);
eq("show: case-insensitive name", showValue([{ Variable_name: "Threads_connected", Value: "7" }], "threads_connected"), 7);
eq("show: missing", showValue([], "max_connections"), null);
eq("show: not rows", showValue(null, "max_connections"), null);
eq("show: non-number", showValue([{ Variable_name: "x", Value: "abc" }], "x"), null);

eq("uptime: minutes", formatUptime(125), "2 min");
eq("uptime: hours", formatUptime(3 * 3600 + 12 * 60), "3 h 12 min");
eq("uptime: days", formatUptime(2 * 86_400 + 5 * 3600 + 59), "2 d 5 h");

/* ------------------------------------------------------------------ */
/* Evergreen candidates                                                */
/* ------------------------------------------------------------------ */

const H = "inmobiliaria.com.py";
const u = (path: string, host = H) => `https://${host}${path}`;
eq("path: city", categoryPathOf(u("/venta/luque"), H), "/venta/luque");
eq("path: city + type", categoryPathOf(u("/venta/luque/casas"), H), "/venta/luque/casas");
eq("path: barrio + type", categoryPathOf(u("/alquiler/asuncion/recoleta/departamentos"), H), "/alquiler/asuncion/recoleta/departamentos");
eq("path: hyphenated operation", categoryPathOf(u("/alquiler-temporal/san-bernardino"), H), "/alquiler-temporal/san-bernardino");
eq("path: trailing slash and query dropped", categoryPathOf(u("/venta/luque/casas/?orden=precio"), H), "/venta/luque/casas");
eq("path: national hub is not a category", categoryPathOf(u("/venta"), H), null);
eq("path: barrio without type", categoryPathOf(u("/venta/asuncion/recoleta"), H), null);
eq("path: unknown type", categoryPathOf(u("/venta/luque/castillos"), H), null);
eq("path: listing detail", categoryPathOf(u("/propiedad/casa-x-AB12CD"), H), null);
eq("path: enum spelling of operation", categoryPathOf(u("/alquiler_temporal/luque"), H), null);
eq("path: other host", categoryPathOf(u("/venta/luque", "www.inmobiliaria.com.py"), H), null);
eq("path: any host when null", categoryPathOf(u("/venta/luque", "www.inmobiliaria.com.py"), null), "/venta/luque");
eq("path: empty segment", categoryPathOf(u("/venta//casas"), H), null);
eq("path: not a URL", categoryPathOf("/venta/luque", H), null);
eq("path: too deep", categoryPathOf(u("/venta/a/b/casas/x"), H), null);

const re = new RegExp(categoryPageFilterRegex());
eq("filter: venta", re.test(u("/venta/luque")), true);
eq("filter: alquiler-temporal", re.test(u("/alquiler-temporal/luque")), true);
eq("filter: hub", re.test(u("/venta")), false);
eq("filter: propiedad", re.test(u("/propiedad/x")), false);

const row = (path: string, clicks: number, impressions: number, position: number, host = H): PageRow => ({
  page: u(path, host),
  clicks,
  impressions,
  position,
});
const evergreen = new Set(["/venta/luque/casas"]);
const pages: PageRow[] = [
  row("/venta/luque/casas", 50, 900, 4), // evergreen: excluded
  row("/venta/asuncion/casas", 3, 300, 12),
  row("/venta/asuncion/casas?orden=precio", 1, 100, 20), // same path: summed
  row("/alquiler/luque", 2, 250, 8),
  row("/venta/luque/terrenos", 0, 250, 15), // ties with /alquiler/luque on impressions, fewer clicks
  row("/venta/encarnacion", 0, 0, 0), // no impressions
  row("/propiedad/casa-x-AB12CD", 30, 5000, 2), // not a category
  row("/venta", 9, 4000, 6), // hub
  row("/venta/ciudad-del-este", 1, 40, 30, "www.inmobiliaria.com.py"), // other host
];
const pq = (path: string, query: string, clicks: number, impressions: number): PageQueryRow => ({
  page: u(path),
  query,
  clicks,
  impressions,
  position: 10,
});
const pageQueries: PageQueryRow[] = [
  pq("/venta/asuncion/casas", "casas en venta asuncion", 2, 150),
  pq("/venta/asuncion/casas?orden=precio", "casas en venta asuncion", 0, 50),
  pq("/venta/asuncion/casas", "casas asuncion", 1, 120),
  pq("/venta/asuncion/casas", "casa barata asuncion", 0, 20),
  pq("/venta/asuncion/casas", "venta casa asuncion centro", 0, 5),
  pq("/venta/luque/casas", "casas luque", 40, 700), // evergreen page: ignored
  pq("/alquiler/luque", "", 0, 10), // anonymised query: ignored
];
const opts = { host: H, isEvergreen: (p: string) => evergreen.has(p) };
const got = evergreenCandidates(pages, pageQueries, opts);
eq(
  "candidates: order, sums, exclusions",
  got.map((c) => [c.path, c.clicks, c.impressions]),
  [
    ["/venta/asuncion/casas", 4, 400],
    ["/alquiler/luque", 2, 250],
    ["/venta/luque/terrenos", 0, 250],
  ],
);
eq("candidates: weighted position", got[0]?.position, (12 * 300 + 20 * 100) / 400);
eq(
  "candidates: top queries summed, capped at 3",
  got[0]?.topQueries,
  [
    { query: "casas en venta asuncion", clicks: 2, impressions: 200 },
    { query: "casas asuncion", clicks: 1, impressions: 120 },
    { query: "casa barata asuncion", clicks: 0, impressions: 20 },
  ],
);
eq("candidates: anonymised query dropped", got[1]?.topQueries, []);
eq(
  "candidates: no query data still lists pages",
  evergreenCandidates(pages, null, opts).map((c) => [c.path, c.topQueries.length]),
  [
    ["/venta/asuncion/casas", 0],
    ["/alquiler/luque", 0],
    ["/venta/luque/terrenos", 0],
  ],
);
eq(
  "candidates: limit",
  evergreenCandidates(pages, null, { ...opts, limit: 1 }).map((c) => c.path),
  ["/venta/asuncion/casas"],
);
const many: PageRow[] = Array.from({ length: 30 }, (_, i) => row(`/venta/ciudad-${i}`, 0, 100 + i, 10));
eq("candidates: default cap is 20", evergreenCandidates(many, null, opts).length, 20);
eq("candidates: biggest first", evergreenCandidates(many, null, opts)[0]?.path, "/venta/ciudad-29");
eq("candidates: nothing", evergreenCandidates([], [], opts), []);

if (failed) {
  console.error(`verify:admin-insights — ${failed} failure(s)`);
  process.exit(1);
}
console.log("verify:admin-insights — OK");
