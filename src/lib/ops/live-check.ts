/**
 * `check:live` — load the public site the way Google does and say so when a
 * page that should work does not.
 *
 * For every door that is live (enabled in `verticals.ts` and actually
 * reachable — see `NOT_LIVE_YET`), it fetches the home page, every evergreen
 * path the door owns, and a sample of the door's own `/sitemap.xml`. Anything
 * that is not a 200 is a failure: a 404 or 5xx, a timeout, or a redirect (a
 * URL we submit to Google must not bounce). With failures, the operator gets
 * one Telegram message (and one email when email sending is configured) with
 * the first few URLs — once per failure set, then a reminder a day while it
 * lasts and one line when it clears (`src/lib/live-check-alerts.ts`; the
 * memory is the `live_check_alert_state` site setting).
 *
 * It runs on its own after every deploy (`instrumentation.ts`, a minute after
 * the server starts) and once a day from the hourly tick. It would have caught
 * the evergreen pages that were in the sitemap before `seed:locations` ran.
 *
 * `dry` fetches the same URLs and reports the same counts, but sends no alert.
 * It writes nothing either way (the `ops_runs` row is the caller's).
 */
import "server-only";
import { VERTICALS } from "@/config/verticals";
import { evergreenPathsFor } from "@/content/evergreen";
import { alertOperatorSystem } from "@/lib/crm";
import { planLiveCheckAlert, parseLiveCheckState } from "@/lib/live-check-alerts";
import { readSiteSettingsRaw, setSystemSetting, SETTING_KEYS } from "@/lib/site-settings";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

/**
 * Enabled doors that no visitor can reach yet: `landforsaleparaguay.com`'s
 * DNS is unconfirmed (CLAUDE.md, "Domains"). `alquiler.com.py` is disabled
 * (domain taken, S6); it stays listed as a guard if it is ever re-enabled
 * before a replacement domain is live. Checking them would alert on every run. Remove a host from
 * this list the day its DNS points at the app.
 */
const NOT_LIVE_YET: ReadonlySet<string> = new Set(["alquiler.com.py", "landforsaleparaguay.com"]);

/** Sitemap URLs sampled per door, on top of home + evergreen paths. */
const SITEMAP_SAMPLE = 25;
/** Listing detail pages among them — the rest are hubs, categories, guides. */
const LISTING_SAMPLE = 5;
const FETCH_TIMEOUT_MS = 10_000;
const CONCURRENCY = 6;
/** The tick gives every task together about a minute. */
const BUDGET_MS = 40_000;
/** URLs named in the alert; the rest are counted. */
const ALERT_LINES = 8;

export interface LiveCheckOptions extends OpsOptions {
  /** Why it runs, for the alert's first line: "deploy" or "daily". */
  reason?: string;
}

/**
 * `LIVE_CHECK=0` turns off BOTH automatic runs — the one after a deploy
 * (`instrumentation-node.ts`) and the daily one on the tick
 * (`src/lib/cron-tick.ts`). The /admin button and the CLI still work.
 */
export function liveCheckEnabled(): boolean {
  return process.env.LIVE_CHECK !== "0";
}

/** The hosts to check: `LIVE_CHECK_HOSTS` (comma list) when set, else every live door. */
export function liveHosts(): string[] {
  const env = process.env.LIVE_CHECK_HOSTS?.trim();
  if (env) return env.split(",").map((h) => h.trim()).filter(Boolean);
  return Object.entries(VERTICALS)
    .filter(([host, v]) => v.enabled && !NOT_LIVE_YET.has(host))
    .map(([host]) => host);
}

/** `<loc>` values of a sitemap document (a `<urlset>` or a `<sitemapindex>`). */
export function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
}

/**
 * Up to `SITEMAP_SAMPLE` URLs from a door's sitemap, same host only: a few
 * listing pages, the rest spread evenly over hubs, categories and guides.
 */
export function sampleSitemap(locs: string[], host: string): string[] {
  const own = locs.filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });
  const listings = own.filter((u) => new URL(u).pathname.startsWith("/propiedad/"));
  const other = own.filter((u) => !new URL(u).pathname.startsWith("/propiedad/"));
  const spread = (arr: string[], n: number) =>
    arr.length <= n ? arr : Array.from({ length: n }, (_, i) => arr[Math.floor((i * arr.length) / n)]);
  const pickedListings = spread(listings, LISTING_SAMPLE);
  return [...spread(other, SITEMAP_SAMPLE - pickedListings.length), ...pickedListings];
}

type Outcome = { url: string; ok: true } | { url: string; ok: false; why: string };

async function probe(url: string): Promise<Outcome> {
  try {
    const res = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      headers: { "user-agent": "live-check (own site)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    await res.body?.cancel().catch(() => {});
    if (res.status === 200) return { url, ok: true };
    if (res.status >= 300 && res.status < 400) {
      return { url, ok: false, why: `${res.status} → ${res.headers.get("location") ?? "?"}` };
    }
    return { url, ok: false, why: String(res.status) };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    return { url, ok: false, why: name === "TimeoutError" || name === "AbortError" ? "timeout" : "sin respuesta" };
  }
}

async function sitemapSample(host: string): Promise<string[]> {
  try {
    const res = await fetch(`https://${host}/sitemap.xml`, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    let locs = sitemapLocs(await res.text());
    // A sitemap index: sample from its first chunk, which holds the hubs.
    if (locs.length > 0 && locs.every((u) => /\/sitemap\/[^/]+$/.test(new URL(u).pathname))) {
      const chunk = await fetch(locs[0], { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      locs = chunk.ok ? sitemapLocs(await chunk.text()) : [];
    }
    return sampleSitemap(locs, host);
  } catch {
    return [];
  }
}

export async function runLiveCheck(opts: LiveCheckOptions): Promise<OpsResult> {
  return opsRun("check:live", opts.dry, async (out) => {
    out.track("revisadas", "fallan", "sin_revisar");
    const deadline = Date.now() + BUDGET_MS;
    const hosts = liveHosts();

    const urls = new Set<string>();
    for (const host of hosts) {
      const v = VERTICALS[host];
      urls.add(`https://${host}/`);
      if (v) for (const path of evergreenPathsFor(v.key)) urls.add(`https://${host}${path}`);
      // The sitemap itself must answer — a failed fetch leaves only the
      // fixed URLs above, and the sitemap URL is probed like any other.
      urls.add(`https://${host}/sitemap.xml`);
      for (const u of await sitemapSample(host)) urls.add(u);
    }

    let probed = 0;
    let skipped = 0;
    const queue = [...urls];
    const failures: Extract<Outcome, { ok: false }>[] = [];
    const worker = async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        if (Date.now() > deadline) {
          out.count("sin_revisar");
          skipped += 1;
          continue;
        }
        const r = await probe(url);
        probed += 1;
        out.count("revisadas");
        if (!r.ok) {
          out.count("fallan");
          failures.push(r);
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    out.note(`Dominios: ${hosts.join(", ")}`);
    for (const f of failures.slice(0, 20)) out.note(`${f.why}  ${f.url}`);
    if (failures.length > 20) out.note(`… y ${failures.length - 20} más`);

    // Every URL failing the same way (all 403, all timeouts) is far more
    // likely the check being blocked — a firewall or Cloudflare's bot
    // protection refusing the server's own request — than every page broken.
    const whole = failures.length > 0 && failures.length === probed && new Set(failures.map((f) => f.why)).size === 1;
    if (whole) {
      out.note(
        `Todas las URLs fallan igual (${failures[0].why}): probablemente la revisión está bloqueada (firewall o protección de bots), no el sitio. Abrí una en el navegador para confirmar.`,
      );
    }

    // A run cut short by its budget proves nothing about the pages it skipped,
    // so it can neither announce a recovery nor be compared with a full run.
    if (opts.dry || (failures.length === 0 && skipped > 0)) return;

    // Same broken pages as an alert already sent: stay quiet (a reminder a
    // day). The memory failing to load must never silence a real alert, so a
    // read error counts as "nothing sent yet".
    let prevRaw: string | undefined;
    try {
      prevRaw = (await readSiteSettingsRaw())[SETTING_KEYS.liveCheckAlerts];
    } catch {
      prevRaw = undefined;
    }
    const plan = planLiveCheckAlert(parseLiveCheckState(prevRaw), failures, Date.now());
    if (plan.next) {
      try {
        await setSystemSetting(SETTING_KEYS.liveCheckAlerts, JSON.stringify(plan.next));
      } catch {
        /* no memory this time: the next run may repeat the alert, never miss it */
      }
    }
    if (plan.kind === "none") {
      if (failures.length > 0) out.note("Mismo fallo que el último aviso: no se repite (recordatorio cada 24 h).");
      return;
    }
    if (plan.kind === "resolved") {
      await alertOperatorSystem({
        title: `✅ Todas las páginas revisadas cargan de nuevo${opts.reason ? ` (${opts.reason})` : ""}`,
        detail: `${probed} URLs revisadas, ninguna falla.`,
      });
      return;
    }

    const lines = failures.slice(0, ALERT_LINES).map((f) => `${f.why}  ${f.url}`);
    if (whole) {
      lines.unshift(
        `Todas fallan con ${failures[0].why}: probablemente la revisión misma está bloqueada (firewall o protección de bots de Cloudflare). Abrí el sitio en el navegador: si carga, el sitio está bien.`,
      );
    }
    if (failures.length > ALERT_LINES) lines.push(`… y ${failures.length - ALERT_LINES} más (ver /admin/operaciones)`);
    lines.push(
      plan.kind === "reminder"
        ? "Recordatorio: sigue igual que hace 24 h."
        : "No se vuelve a avisar por este mismo fallo hasta dentro de 24 h, salvo que cambie.",
    );
    await alertOperatorSystem({
      title: `⚠️ ${failures.length} página(s) del sitio no cargan${opts.reason ? ` (${opts.reason})` : ""}`,
      detail: lines.join("\n"),
    });
  });
}
