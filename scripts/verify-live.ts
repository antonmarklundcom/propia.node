/**
 * verify:live — a post-deploy smoke check of every domain this app answers for.
 *
 * `verify:seo` proves the vertical table is *consistent*; it cannot prove the
 * deployed site *agrees with it*. A merge deploys, and the hPanel env vars
 * (`NEXT_PUBLIC_CANONICAL_HOST` above all — inlined at build time) change what
 * the live pages say without any commit. This script fetches the live doors
 * and checks what they actually emit against what `verticals.ts` and
 * `alternates.ts` say they should, using the same functions the pages call.
 *
 * Read-only: only GET requests, no database, no credentials. It needs the
 * network, so it is deliberately NOT part of `verify:local` / the pre-push hook.
 *
 *   npm run verify:live                                  # the live sites, https://<host>
 *   npm run verify:live -- --only rentparaguay.com       # one door (or redirect host)
 *   npm run verify:live -- --raw-host <name>.hostingersite.com
 *   npm run verify:live -- --base http://localhost:3000  # one local server, Host header per door
 *   npm run verify:live -- --json                        # machine-readable
 *   npm run verify:live -- --ascii                       # OK/FAIL instead of ✓/✗ (old consoles)
 *   npm run verify:live -- --all                         # also check doors in NOT_LIVE
 *
 * Exit code 1 when any check fails, 2 on a usage error.
 * What each failure usually means: docs/log/verify-live.md.
 */
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import {
  CANONICAL_HOST,
  MARKETPLACE_PRIMARY_HOST,
  type VerticalConfig,
} from "../src/config/verticals";
import { languageAlternates, servedDoors } from "../src/lib/alternates";
import { detailOwnerForLocale } from "../src/lib/origin";
import { MARKETPLACE_PATH_ROOTS } from "../src/config/site-nav";
import { marketplacePagesEnabled } from "../src/design/sections";
import nextConfig from "../next.config";

/**
 * Doors that are `enabled: true` in verticals.ts but cannot answer on the
 * internet yet, with the reason. Skipped unless `--all` is passed — enabled in
 * code so they can be previewed with a Host header (see the alquiler.com.py
 * comment in verticals.ts), but checking them live is a guaranteed DNS failure
 * that would hide real ones. Remove an entry the day its domain goes live.
 */
const NOT_LIVE: Record<string, string> = {
  "alquiler.com.py": "not purchased (CLAUDE.md domain table)",
};

const TIMEOUT_MS = 10_000;
/**
 * Two, not more: a cold home render fires several queries at once, and the
 * app's pool is deliberately small (6 connections, queue of 24 — src/db).
 * Measured locally right after a restart, four cold homes in parallel overflow
 * that queue and 500; two never did. A post-deploy check must not be the
 * thing that breaks a freshly deployed site.
 */
const CONCURRENCY = 2;
const USER_AGENT =
  "verify-live/1.0 (read-only post-deploy check; npm run verify:live)";

/* ----------------------------------------------------------------------- *
 * Arguments
 * ----------------------------------------------------------------------- */

function usage(message?: string): never {
  if (message) console.error(`verify:live: ${message}\n`);
  console.error(
    [
      "usage: npm run verify:live -- [--base <url>] [--only <host>[,<host>]] [--raw-host <host>]",
      "                             [--json] [--ascii] [--all]",
    ].join("\n"),
  );
  process.exit(2);
}

function parseArgs(argv: string[]) {
  const opts = {
    base: null as string | null,
    only: [] as string[],
    rawHost: null as string | null,
    json: false,
    ascii: false,
    all: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inline] = arg.split(/=(.*)/s, 2);
    const value = () => {
      const v = inline ?? argv[++i];
      if (!v || v.startsWith("--")) usage(`${flag} needs a value`);
      return v;
    };
    switch (flag) {
      case "--base":
        opts.base = value().replace(/\/+$/, "");
        break;
      case "--only":
        opts.only.push(
          ...value()
            .split(",")
            .map((h) => h.trim().toLowerCase().replace(/^www\./, ""))
            .filter(Boolean),
        );
        break;
      case "--raw-host":
        opts.rawHost = value().toLowerCase();
        break;
      case "--json":
        opts.json = true;
        break;
      case "--ascii":
        opts.ascii = true;
        break;
      case "--all":
        opts.all = true;
        break;
      case "--help":
      case "-h":
        usage();
      default:
        usage(`unknown option ${arg}`);
    }
  }
  if (opts.base) {
    try {
      const u = new URL(opts.base);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
    } catch {
      usage(`--base must be an http(s) URL, got ${opts.base}`);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));

/* ----------------------------------------------------------------------- *
 * HTTP — GET only, never follows redirects, 10 s timeout, CONCURRENCY at a time.
 * ----------------------------------------------------------------------- */

interface Resp {
  ok: boolean; // a response arrived at all
  status: number;
  location: string | null;
  body: string;
  ms: number;
  /** Why no response arrived, in words (DNS, TLS, timeout, …). */
  error?: string;
}

let active = 0;
const waiting: Array<() => void> = [];
async function limited<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= CONCURRENCY) await new Promise<void>((r) => waiting.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

function describeError(err: unknown): string {
  const e = err as { name?: string; code?: string; cause?: { code?: string; message?: string } };
  const code = e?.cause?.code ?? e?.code ?? "";
  if (e?.name === "TimeoutError" || e?.name === "AbortError" || code === "ETIMEDOUT")
    return `no answer within ${TIMEOUT_MS / 1000} s`;
  if (code === "ENOTFOUND" || code === "EAI_AGAIN")
    return "DNS does not resolve (domain not pointed at the server?)";
  if (code === "ECONNREFUSED") return "connection refused (server down?)";
  if (code === "ECONNRESET") return "connection reset";
  if (/CERT|SSL|TLS/i.test(code) || /certificate/i.test(e?.cause?.message ?? ""))
    return `TLS certificate problem (${code || "unknown"})`;
  return (e?.cause?.message ?? (err as Error)?.message ?? String(err)) + (code ? ` (${code})` : "");
}

/**
 * Live mode: Node's fetch against https://<host>. `--base` mode: node:http
 * against the one local server with an explicit `Host` header — fetch treats
 * `Host` as a forbidden header and silently replaces it with the URL's host,
 * and next.config.ts's `has: host` redirects match on `Host`, not on
 * `x-forwarded-host`. `--base` mode also sends `x-forwarded-host`, which the
 * app reads first (`src/lib/host.ts`) — what Hostinger's proxy does live.
 */
function rawGet(host: string, path: string): Promise<Resp> {
  const started = Date.now();
  if (!opts.base) {
    return fetch(`https://${host}${path}`, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xml,text/plain,*/*" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
      .then(async (res): Promise<Resp> => ({
        ok: true,
        status: res.status,
        location: res.headers.get("location"),
        // Inside the same chain as the request, so a timeout while the body
        // is still arriving lands in the catch below rather than escaping.
        body: await res.text(),
        ms: Date.now() - started,
      }))
      .catch((err): Resp => ({ ok: false, status: 0, location: null, body: "", ms: Date.now() - started, error: describeError(err) }));
  }
  const url = new URL(`${opts.base}${path}`);
  const request = url.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise<Resp>((resolve) => {
    const req = request(
      url,
      {
        method: "GET",
        headers: {
          host,
          "x-forwarded-host": host,
          "x-forwarded-proto": "https",
          "user-agent": USER_AGENT,
          accept: "text/html,application/xml,text/plain,*/*",
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({
            ok: true,
            status: res.statusCode ?? 0,
            location: (res.headers.location as string | undefined) ?? null,
            body: Buffer.concat(chunks).toString("utf8"),
            ms: Date.now() - started,
          }),
        );
        res.on("error", (err) =>
          resolve({ ok: false, status: 0, location: null, body: "", ms: Date.now() - started, error: describeError(err) }),
        );
      },
    );
    req.on("timeout", () => req.destroy(Object.assign(new Error("timeout"), { name: "TimeoutError" })));
    req.on("error", (err) =>
      resolve({ ok: false, status: 0, location: null, body: "", ms: Date.now() - started, error: describeError(err) }),
    );
    req.end();
  });
}

const memo = new Map<string, Promise<Resp>>();
function get(host: string, path: string): Promise<Resp> {
  const key = `${host}${path}`;
  let p = memo.get(key);
  if (!p) {
    p = limited(() => rawGet(host, path));
    memo.set(key, p);
  }
  return p;
}

/** "200 in 312 ms", "308 → https://…", or the transport error. */
function said(r: Resp): string {
  if (!r.ok) return r.error ?? "no response";
  if (r.status >= 300 && r.status < 400) return `${r.status} → ${r.location ?? "(no Location)"}`;
  return `${r.status} in ${r.ms} ms`;
}

/* ----------------------------------------------------------------------- *
 * Parsing — regexes are enough: the markup is Next's own, not arbitrary HTML.
 * ----------------------------------------------------------------------- */

function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function linkTags(html: string): Array<Record<string, string>> {
  const tags: Array<Record<string, string>> = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const a of m[0].matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? "");
    }
    tags.push(attrs);
  }
  return tags;
}

const relHas = (t: Record<string, string>, rel: string) =>
  (t.rel ?? "").toLowerCase().split(/\s+/).includes(rel);

function canonicalsOf(html: string): string[] {
  return [...new Set(linkTags(html).filter((t) => relHas(t, "canonical")).map((t) => t.href ?? ""))];
}

function hreflangsOf(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of linkTags(html)) {
    if (relHas(t, "alternate") && t.hreflang) out[t.hreflang.toLowerCase()] = t.href ?? "";
  }
  return out;
}

function norm(url: string): string {
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}

function locsOf(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => decode(m[1]));
}

function formatMap(map: Record<string, string>): string {
  const keys = Object.keys(map).sort();
  return keys.length ? keys.map((k) => `${k}=${map[k]}`).join("  ") : "(none)";
}

function normMap(map: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map ?? {})) out[k.toLowerCase()] = norm(v);
  return out;
}

/* ----------------------------------------------------------------------- *
 * Results
 * ----------------------------------------------------------------------- */

type Status = "pass" | "fail" | "skip";
interface Result {
  group: string;
  check: string;
  status: Status;
  detail?: string;
  expected?: string;
  actual?: string;
}

const results: Result[] = [];
function record(r: Result) {
  results.push(r);
}

/** Every canonical any page emitted, for the *.hostingersite.com sweep. */
const seenCanonicals: Array<{ where: string; href: string }> = [];

/* ----------------------------------------------------------------------- *
 * Which doors
 * ----------------------------------------------------------------------- */

interface DoorPlan {
  host: string;
  config: VerticalConfig;
  /** Is /propiedad canonical here? Same predicate as origin.ts's ownsListingDetail(). */
  ownsDetail: boolean;
}

const allDoors: DoorPlan[] = servedDoors(CANONICAL_HOST).map(({ host, config }) => ({
  host,
  config,
  ownsDetail: host === CANONICAL_HOST || config.ownsListingDetail,
}));

const selected = (host: string) =>
  opts.only.length === 0 || opts.only.includes(host.replace(/^www\./, ""));

const notLiveSkipped = allDoors.filter((d) => NOT_LIVE[d.host] && !opts.all && selected(d.host));
const doors = allDoors.filter((d) => selected(d.host) && (opts.all || !NOT_LIVE[d.host]));

/** Host-scoped redirects declared in next.config.ts. */
interface ConfiguredRedirect {
  host: string;
  source: string;
  destination: string;
  wholeHost: boolean;
}
async function configuredRedirects(): Promise<ConfiguredRedirect[]> {
  const list = (await nextConfig.redirects?.()) ?? [];
  const out: ConfiguredRedirect[] = [];
  for (const r of list) {
    const host = r.has?.find((h) => h.type === "host")?.value;
    if (!host) continue;
    out.push({
      host,
      source: r.source,
      destination: r.destination,
      wholeHost: r.source === "/:path*",
    });
  }
  return out;
}

/* ----------------------------------------------------------------------- *
 * Checks
 * ----------------------------------------------------------------------- */

/** One /propiedad path taken from an owner's sitemap, filled in by the sitemap checks. */
const listingSamples = new Map<string, string>(); // owner host → path

async function checkSitemap(door: DoorPlan): Promise<void> {
  const g = door.host;
  const r = await get(g, "/sitemap.xml");
  if (!r.ok || r.status !== 200) {
    record({ group: g, check: "sitemap.xml", status: "fail", detail: said(r), expected: "200" });
    return;
  }
  const isIndex = /<sitemapindex\b/.test(r.body);
  if (!isIndex && !/<urlset\b/.test(r.body)) {
    record({
      group: g,
      check: "sitemap.xml",
      status: "fail",
      detail: "200 but neither a <urlset> nor a <sitemapindex>",
      actual: r.body.slice(0, 120).replace(/\s+/g, " "),
    });
    return;
  }
  let locs = locsOf(r.body);
  const offHost = (urls: string[]) =>
    urls.filter((u) => {
      try {
        const url = new URL(u);
        return url.protocol !== "https:" || url.host !== g;
      } catch {
        return true;
      }
    });

  let note = "";
  if (isIndex) {
    const bad = offHost(locs);
    if (bad.length) {
      record({ group: g, check: "sitemap index <loc>s on this host", status: "fail", expected: `https://${g}/…`, actual: bad.slice(0, 3).join(", ") });
      return;
    }
    // Sample: the first chunk. Every chunk is built by the same code.
    const first = locs[0] ? new URL(locs[0]).pathname : null;
    if (!first) {
      record({ group: g, check: "sitemap.xml", status: "fail", detail: "empty <sitemapindex>" });
      return;
    }
    const chunk = await get(g, first);
    if (!chunk.ok || chunk.status !== 200) {
      record({ group: g, check: `sitemap chunk ${first}`, status: "fail", detail: said(chunk), expected: "200" });
      return;
    }
    note = ` (index of ${locs.length} chunks; checked ${first})`;
    locs = locsOf(chunk.body);
  }

  if (locs.length === 0) {
    record({ group: g, check: "sitemap.xml", status: "fail", detail: `empty sitemap${note}`, expected: "at least the home page" });
    return;
  }
  const bad = offHost(locs);
  record(
    bad.length
      ? {
          group: g,
          check: "sitemap <loc>s on this host",
          status: "fail",
          detail: `${bad.length} of ${locs.length} URLs point elsewhere`,
          expected: `https://${g}/…`,
          actual: bad.slice(0, 3).join(", "),
        }
      : { group: g, check: "sitemap.xml", status: "pass", detail: `${locs.length} URLs, all on https://${g}${note}` },
  );

  const detail = locs.filter((u) => {
    try {
      return new URL(u).pathname.startsWith("/propiedad/");
    } catch {
      return false;
    }
  });
  if (door.ownsDetail) {
    if (detail.length) listingSamples.set(g, new URL(detail[0]).pathname);
    record({
      group: g,
      check: "sitemap lists /propiedad",
      status: "pass",
      detail: detail.length
        ? `${detail.length} listing URLs (this door owns them)`
        : "none listed — no published listings on this door?",
    });
  } else {
    record(
      detail.length
        ? {
            group: g,
            check: "sitemap omits /propiedad",
            status: "fail",
            detail: `${detail.length} listing URLs this door canonicalises to ${detailOwnerForLocale(door.config.locale)}`,
            actual: detail.slice(0, 2).join(", "),
          }
        : { group: g, check: "sitemap omits /propiedad", status: "pass", detail: "ownsListingDetail: false" },
    );
  }

  if (!marketplacePagesEnabled(door.config.key)) {
    const redirected = locs.filter((u) => {
      try {
        return MARKETPLACE_PATH_ROOTS.includes(new URL(u).pathname.split("/")[1] ?? "");
      } catch {
        return false;
      }
    });
    record(
      redirected.length
        ? {
            group: g,
            check: "sitemap omits redirected paths",
            status: "fail",
            detail: `${redirected.length} URLs this door 308s to ${MARKETPLACE_PRIMARY_HOST}`,
            actual: redirected.slice(0, 3).join(", "),
          }
        : { group: g, check: "sitemap omits redirected paths", status: "pass", detail: "no marketplace paths" },
    );
  }
}

async function checkDoor(door: DoorPlan): Promise<void> {
  const g = door.host;

  // Home, canonical, hreflang.
  const home = await get(g, "/");
  const homeOk = home.ok && home.status === 200;
  record({
    group: g,
    check: "home",
    status: homeOk ? "pass" : "fail",
    detail: said(home),
    expected: homeOk ? undefined : "200",
  });
  if (homeOk) {
    const canon = canonicalsOf(home.body);
    canon.forEach((href) => seenCanonicals.push({ where: `${g}/`, href }));
    const expected = norm(`https://${g}/`);
    record(
      canon.length === 1 && norm(canon[0]) === expected
        ? { group: g, check: "home canonical", status: "pass", detail: canon[0] }
        : {
            group: g,
            check: "home canonical",
            status: "fail",
            detail: canon.length > 1 ? `${canon.length} different canonical tags` : undefined,
            expected,
            actual: canon.length ? canon.join(" | ") : "(no canonical tag)",
          },
    );

    const want = normMap(
      languageAlternates({ path: "/", scope: "site", family: door.config.family, servingHost: g }),
    );
    const got = normMap(hreflangsOf(home.body));
    const same = formatMap(want) === formatMap(got);
    record(
      same
        ? {
            group: g,
            check: "home hreflang",
            status: "pass",
            detail: Object.keys(want).length ? Object.keys(want).sort().join(", ") : "none expected, none emitted",
          }
        : { group: g, check: "home hreflang", status: "fail", expected: formatMap(want), actual: formatMap(got) },
    );
  } else {
    for (const check of ["home canonical", "home hreflang"])
      record({ group: g, check, status: "skip", detail: "home did not load" });
  }

  // robots.txt → this host's sitemap.
  const robots = await get(g, "/robots.txt");
  if (!robots.ok || robots.status !== 200) {
    record({ group: g, check: "robots.txt", status: "fail", detail: said(robots), expected: "200" });
  } else {
    const lines = [...robots.body.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
    const expected = `https://${g}/sitemap.xml`;
    record(
      lines.length === 1 && norm(lines[0]) === norm(expected)
        ? { group: g, check: "robots.txt", status: "pass", detail: `Sitemap: ${lines[0]}` }
        : {
            group: g,
            check: "robots.txt sitemap line",
            status: "fail",
            expected,
            actual: lines.length ? lines.join(" | ") : "(no Sitemap: line)",
          },
    );
  }

  await checkSitemap(door);

  // Liveness of the process behind this door.
  const health = await get(g, "/api/health");
  let healthy = health.ok && health.status === 200;
  if (healthy) {
    try {
      healthy = JSON.parse(health.body)?.ok === true;
    } catch {
      healthy = false;
    }
  }
  record({
    group: g,
    check: "/api/health",
    status: healthy ? "pass" : "fail",
    detail: health.ok && health.status === 200 && !healthy ? "200 but not {\"ok\":true}" : said(health),
    expected: healthy ? undefined : '200 {"ok":true}',
  });
}

/** A /propiedad page fetched on each door: owners self-canonicalise, the rest point at the owner. */
async function checkListingCanonical(door: DoorPlan, samplePath: string | null): Promise<void> {
  const g = door.host;
  if (!marketplacePagesEnabled(door.config.key)) return; // covered by the directory redirect check
  if (!samplePath) {
    record({
      group: g,
      check: "/propiedad canonical",
      status: "skip",
      detail: "no /propiedad URL found in any owner's sitemap to sample",
    });
    return;
  }
  const r = await get(g, samplePath);
  if (!r.ok || r.status !== 200) {
    record({ group: g, check: "/propiedad page", status: "fail", detail: `${samplePath}: ${said(r)}`, expected: "200" });
    return;
  }
  const owner = door.ownsDetail ? g : detailOwnerForLocale(door.config.locale);
  const expected = norm(`https://${owner}${samplePath}`);
  const canon = canonicalsOf(r.body);
  canon.forEach((href) => seenCanonicals.push({ where: `${g}${samplePath}`, href }));
  record(
    canon.length === 1 && norm(canon[0]) === expected
      ? {
          group: g,
          check: "/propiedad canonical",
          status: "pass",
          detail: door.ownsDetail ? `self (${samplePath})` : `→ ${owner}`,
        }
      : {
          group: g,
          check: "/propiedad canonical",
          status: "fail",
          detail: samplePath,
          expected,
          actual: canon.length ? canon.join(" | ") : "(no canonical tag)",
        },
  );
  if (!door.ownsDetail) {
    const langs = hreflangsOf(r.body);
    record(
      Object.keys(langs).length === 0
        ? { group: g, check: "/propiedad no hreflang", status: "pass", detail: "canonicalised away, so no language set" }
        : {
            group: g,
            check: "/propiedad no hreflang",
            status: "fail",
            detail: "a page that canonicalises away must not claim language versions",
            expected: "(none)",
            actual: formatMap(langs),
          },
    );
  }
}

/** The directory door 308s the marketplace's page types to the Spanish primary (middleware.ts). */
async function checkDirectoryRedirects(door: DoorPlan, samplePath: string | null): Promise<void> {
  if (marketplacePagesEnabled(door.config.key)) return;
  const g = door.host;
  const paths = ["/venta", "/publicar", "/precios", ...(samplePath ? [samplePath] : [])];
  for (const path of paths) {
    const r = await get(g, path);
    const expected = `https://${MARKETPLACE_PRIMARY_HOST}${path}`;
    const label = path === samplePath ? "/propiedad/…" : path;
    const actual = r.location ? new URL(r.location, `https://${g}`).href : null;
    record(
      r.ok && r.status === 308 && actual === norm(expected)
        ? { group: g, check: `${label} → marketplace`, status: "pass", detail: `308 → ${actual}` }
        : {
            group: g,
            check: `${label} → marketplace`,
            status: "fail",
            expected: `308 → ${expected}`,
            actual: said(r),
          },
    );
  }
}

/** next.config.ts's host-scoped redirects: every whole-host one, and a sample of the path maps. */
async function checkConfiguredRedirects(): Promise<void> {
  const all = await configuredRedirects();
  // www.* forms are declared too, but their DNS is not guaranteed to exist;
  // the bare host exercises the same rule.
  const bare = all.filter((r) => !r.host.startsWith("www."));
  const byHost = new Map<string, ConfiguredRedirect[]>();
  for (const r of bare) byHost.set(r.host, [...(byHost.get(r.host) ?? []), r]);

  const tasks: Array<Promise<void>> = [];
  for (const [host, list] of byHost) {
    if (!selected(host)) continue;
    const g = `${host} (redirects)`;
    if (NOT_LIVE[host] && !opts.all) {
      record({ group: g, check: "redirects", status: "skip", detail: NOT_LIVE[host] });
      continue;
    }
    const cases: Array<{ path: string; expected: string }> = [];
    for (const r of list.filter((r) => r.wholeHost)) {
      for (const path of ["/", "/venta"]) {
        cases.push({ path, expected: r.destination.replace("/:path*", path === "/" ? "/" : path) });
      }
    }
    // Path maps: two samples, bare form (the trailing-slash twin is the same rule).
    for (const r of list.filter((r) => !r.wholeHost && !r.source.endsWith("/") && !r.source.includes(":")).slice(0, 2)) {
      cases.push({ path: r.source, expected: new URL(r.destination, `https://${host}`).href });
    }
    for (const c of cases) {
      tasks.push(
        get(host, c.path).then((r) => {
          const actual = r.location ? new URL(r.location, `https://${host}`).href : null;
          record(
            r.ok && r.status === 308 && actual === norm(c.expected)
              ? { group: g, check: `${c.path} 308`, status: "pass", detail: `→ ${actual}` }
              : { group: g, check: `${c.path} 308`, status: "fail", expected: `308 → ${norm(c.expected)}`, actual: said(r) },
          );
        }),
      );
    }
  }
  await Promise.all(tasks);
}

/**
 * The raw deploy host (or any host that is not a door) must canonicalise to
 * CANONICAL_HOST — `siteOrigin()`'s fallback. This is the check that sees a
 * wrong `NEXT_PUBLIC_CANONICAL_HOST` most directly.
 */
async function checkRawHost(): Promise<void> {
  const raw = opts.rawHost ?? (opts.base ? "verify-live-probe.hostingersite.com" : null);
  const g = "unknown host";
  if (!raw) {
    record({
      group: g,
      check: "raw host canonical",
      status: "skip",
      detail: "pass --raw-host <name>.hostingersite.com to check the raw deploy host",
    });
    return;
  }
  if (opts.only.length && !selected(raw)) return;
  const r = await get(raw, "/");
  if (!r.ok || r.status !== 200) {
    record({ group: g, check: `${raw} home`, status: "fail", detail: said(r), expected: "200" });
    return;
  }
  const canon = canonicalsOf(r.body);
  canon.forEach((href) => seenCanonicals.push({ where: `${raw}/`, href }));
  const expected = norm(`https://${CANONICAL_HOST}/`);
  record(
    canon.length === 1 && norm(canon[0]) === expected
      ? { group: g, check: `${raw} canonical`, status: "pass", detail: `→ ${canon[0]}` }
      : {
          group: g,
          check: `${raw} canonical`,
          status: "fail",
          detail: "a host that is not a door canonicalises to NEXT_PUBLIC_CANONICAL_HOST — check its value in hPanel",
          expected,
          actual: canon.length ? canon.join(" | ") : "(no canonical tag)",
        },
  );
}

async function checkDbHealth(): Promise<void> {
  const host = doors.find((d) => d.host === MARKETPLACE_PRIMARY_HOST)?.host ?? doors[0]?.host;
  if (!host) return;
  const g = "database";
  const r = await get(host, "/api/health/db");
  if (r.ok && r.status === 404) {
    record({ group: g, check: "/api/health/db", status: "skip", detail: "route does not exist on this deploy" });
    return;
  }
  let body: { ok?: boolean; dbMs?: number; error?: string } = {};
  try {
    body = JSON.parse(r.body);
  } catch {
    /* reported below */
  }
  record(
    r.ok && r.status === 200 && body.ok === true
      ? {
          group: g,
          check: "/api/health/db",
          status: "pass",
          detail: `database answered in ${body.dbMs ?? "?"} ms (round trip ${r.ms} ms, via ${host})`,
        }
      : {
          group: g,
          check: "/api/health/db",
          status: "fail",
          detail: body.error ? `database ${body.error} after ${body.dbMs ?? "?"} ms` : undefined,
          expected: '200 {"ok":true}',
          actual: said(r),
        },
  );
}

function checkNoRawCanonicals(): void {
  const bad = seenCanonicals.filter(({ href }) => {
    try {
      return new URL(href).hostname.endsWith(".hostingersite.com");
    } catch {
      return false;
    }
  });
  if (seenCanonicals.length === 0) {
    record({
      group: "all pages",
      check: "no *.hostingersite.com canonical",
      status: "skip",
      detail: "no page loaded, so no canonical to check",
    });
    return;
  }
  record(
    bad.length
      ? {
          group: "all pages",
          check: "no *.hostingersite.com canonical",
          status: "fail",
          actual: bad.slice(0, 3).map((b) => `${b.where} → ${b.href}`).join(", "),
        }
      : {
          group: "all pages",
          check: "no *.hostingersite.com canonical",
          status: "pass",
          detail: `${seenCanonicals.length} canonical tags checked`,
        },
  );
}

/* ----------------------------------------------------------------------- *
 * Run
 * ----------------------------------------------------------------------- */

async function main() {
  const known = [
    ...allDoors.map((d) => d.host),
    ...(await configuredRedirects()).map((r) => r.host.replace(/^www\./, "")),
    ...(opts.rawHost ? [opts.rawHost] : []),
  ];
  const unknown = opts.only.filter((h) => !known.includes(h));
  if (unknown.length) usage(`--only: unknown host ${unknown.join(", ")}; known: ${[...new Set(known)].join(", ")}`);

  for (const d of notLiveSkipped)
    record({ group: d.host, check: "door", status: "skip", detail: `${NOT_LIVE[d.host]} — pass --all to check it anyway` });

  await Promise.all(doors.map(checkDoor));

  // A listing URL to sample: from the Spanish detail owner's sitemap, else any
  // owner's. With --only on a door that does not own detail, the owner's
  // sitemap is fetched just for this, without reporting on it.
  const ownerHosts = [detailOwnerForLocale("es"), ...allDoors.filter((d) => d.ownsDetail).map((d) => d.host)];
  let samplePath: string | null = null;
  for (const host of ownerHosts) {
    samplePath = listingSamples.get(host) ?? null;
    if (samplePath) break;
    if (NOT_LIVE[host] && !opts.all) continue;
    const r = await get(host, "/sitemap.xml");
    let locs = r.ok && r.status === 200 ? locsOf(r.body) : [];
    if (/<sitemapindex\b/.test(r.body) && locs[0]) {
      const chunk = await get(host, new URL(locs[0]).pathname);
      locs = chunk.ok && chunk.status === 200 ? locsOf(chunk.body) : [];
    }
    const hit = locs.find((u) => u.includes("/propiedad/"));
    if (hit) {
      samplePath = new URL(hit).pathname;
      break;
    }
  }

  await Promise.all([
    ...doors.map((d) => checkListingCanonical(d, samplePath)),
    ...doors.map((d) => checkDirectoryRedirects(d, samplePath)),
    checkConfiguredRedirects(),
    checkRawHost(),
    checkDbHealth(),
  ]);
  checkNoRawCanonicals();

  report(samplePath);
}

function report(samplePath: string | null) {
  const counts = { pass: 0, fail: 0, skip: 0 };
  for (const r of results) counts[r.status]++;

  const code = counts.fail ? 1 : 0;
  if (opts.json) {
    finish(
      code,
      JSON.stringify(
        {
          target: opts.base ? `${opts.base} (Host header per door)` : "https://<host>",
          canonicalHost: CANONICAL_HOST,
          sampleListingPath: samplePath,
          summary: counts,
          results,
        },
        null,
        2,
      ),
    );
    return;
  }
  const out: string[] = [];
  const say = (line: string) => out.push(line);

  const mark: Record<Status, string> = opts.ascii
    ? { pass: "OK  ", fail: "FAIL", skip: "skip" }
    : { pass: "✓", fail: "✗", skip: "–" };
  const width = Math.max(28, ...results.map((r) => r.check.length + 2));
  // Continuation lines start under the detail column: "  " + mark + "  " + check.
  const pad = " ".repeat(2 + mark.pass.length + 2 + width);

  say(
    `\nverify:live — ${opts.base ? `${opts.base} with a Host header per door` : "the live sites (https://<host>)"}`,
  );
  say(
    `expectations from verticals.ts with CANONICAL_HOST=${CANONICAL_HOST}` +
      (process.env.NEXT_PUBLIC_CANONICAL_HOST ? " (set in THIS shell's NEXT_PUBLIC_CANONICAL_HOST)" : ""),
  );
  if (CANONICAL_HOST !== MARKETPLACE_PRIMARY_HOST)
    say(`  note: that differs from the intended primary ${MARKETPLACE_PRIMARY_HOST} — unset it in this shell`);
  if (samplePath) say(`sample listing: ${samplePath}`);

  const groups = [...new Set(results.map((r) => r.group))];
  const doorOrder = allDoors.map((d) => d.host);
  groups.sort((a, b) => {
    const ia = doorOrder.indexOf(a);
    const ib = doorOrder.indexOf(b);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
  for (const group of groups) {
    const door = allDoors.find((d) => d.host === group);
    const about = door
      ? `  ${door.config.locale} · ${door.config.family}${door.ownsDetail ? " · owns /propiedad" : ""}`
      : "";
    say(`\n${group}${about}`);
    // Keep the order the checks were declared in, per group.
    for (const r of results.filter((x) => x.group === group)) {
      const line = `  ${mark[r.status]}  ${r.check.padEnd(width)}`;
      say(`${line}${r.detail ?? ""}`.trimEnd());
      if (r.status === "fail") {
        if (r.expected !== undefined) say(`${pad}expected ${r.expected}`);
        if (r.actual !== undefined) say(`${pad}actual   ${r.actual}`);
      }
    }
  }
  say(
    `\n${counts.pass} passed, ${counts.fail} failed, ${counts.skip} skipped` +
      (counts.fail ? " — see docs/log/verify-live.md for what each failure usually means" : ""),
  );
  finish(code, out.join("\n"));
}

/**
 * Exit only once stdout has taken the whole report: `process.exit()` straight
 * after a large `console.log` can truncate it when stdout is a pipe (always
 * asynchronous on Windows), and an open keep-alive socket must not hold the
 * process open either.
 */
function finish(code: number, text: string): void {
  process.stdout.write(`${text}\n`, () => process.exit(code));
}

main().catch((err) => {
  console.error("verify:live crashed:", err);
  process.exit(2);
});
