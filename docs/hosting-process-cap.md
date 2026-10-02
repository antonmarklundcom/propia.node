# Hostinger "Max Processes" — findings, the one-origin plan, and how to prove it

Written 2026-10-02. Status: **code in this PR, nothing proven on the server
yet.** Every server step below is the founder's to run. Paste the output back.

## 1. The facts as measured (founder, over SSH)

- Only "Max Processes" (200) is exhausted. It counts **threads**: a healthy
  `next-server` has 7–11.
- The propia app (about 10 parked domains) grows to around 10 copies (about 156
  threads) within about 20 minutes of a clean restart. Single-domain apps stay
  at 1–2 copies.
- The extra copies have PPID 1 (their parent is gone), never exit, and come
  from the same version folder.
- Requesting each domain once from a clean state: 0 → 1 (realestateinparaguay.com)
  → 3 (inmobiliaria.com.py) → 4 (inmobiliarios.com.py).
- console.log shows every launch as a pair of startups 3–4 ms apart.
- `LIVE_CHECK=0` did not stop the growth.

## 2. Code review: what in this repo matters for a hostname-based launcher

Nothing in the app starts processes. Next 15.5's `next start` runs the server
in its own process (checked in `node_modules/next/dist/server/lib/start-server.js`:
no fork; the only `child_process` call is an `lsof` that runs when the port is
already taken). The launcher decides how many copies exist. What the app
**can** do, and what would **break** behind a proxy that rewrites the Host header:

| # | Finding | Effect | Fixed here |
|---|---|---|---|
| 1 | Next matches `has: [{ type: "host" }]` in `next.config.ts` against the raw Host header only, never `x-forwarded-host` (`prepare-destination.js`). | Behind any proxy that sends one origin Host, the rentparaguay.com WordPress 301 map, the rental cross-language map and the landforsaleinparaguay.com → landforsaleparaguay.com 308 **would silently stop matching**. | Each rule now has a twin on the `x-forwarded-host` header. The Worker also answers the landforsale 308 itself. |
| 2 | `client-ip.ts` keys rate limits on the last `x-forwarded-for` hop. | Behind Cloudflare that hop is a Cloudflare IP shared by many visitors, so one visitor could use up the lead-form, login and OG-image limits for everyone. | The Worker sends `x-client-ip` (from `cf-connecting-ip`). The app reads it only alongside the secret. |
| 3 | `x-forwarded-host` was believed from anyone. | Today anyone can make realestateinparaguay.com render as another door. That matters as soon as a cache sits in front. | `ORIGIN_PROXY_SECRET`: once set, the header counts only with a matching `x-origin-auth`. While it is unset, nothing changes. |
| 4 | `request-origin.ts` read the header itself. | It would have bypassed #3. | It now uses `visitorHostFrom()` in `host.ts`. |
| 5 | Every new copy ran `check:live` a minute after it started, and that check requests every door. | If the launcher starts one instance per hostname, each copy's check could wake more copies, making the problem grow on itself. The daily run ignored `LIVE_CHECK=0`. | It now runs once per **build** across all processes (an atomic lock file keyed by the build stamp). The daily run takes the same lock, and `LIVE_CHECK=0` turns off both runs. |
| 6 | Orphans never exit, and Next's SIGTERM handler waits for open connections before it exits. | Copies whose launcher has died live forever. Stop can look like it did nothing. | `src/lib/process-lifecycle.ts`: a copy whose parent changed and that has had no request for 120 s ends itself. SIGTERM now always ends the process within 10 s. |
| 7 | Server actions compare `Origin` with `x-forwarded-host` (Next's own check). | Behind the Worker this works only if LiteSpeed passes `x-forwarded-host` through unchanged. | Nothing to change. Test A below checks whether the header gets through. |

Middleware redirects already use absolute URLs to the marketplace primary. Cookies carry no `Domain`. Both are safe behind the Worker.

### Change #6 is a fix in its own right

The orphan exit doesn't depend on Cloudflare. Once this PR is deployed, a copy
with PPID 1 that nobody calls should log
`[lifecycle] pid N exiting: orphaned …` in console.log and disappear about 2–3
minutes after it was orphaned. If the copies are **born** with PPID 1 (the
launcher detaches them on purpose), the startup line
`[lifecycle] pid N ppid 1 …` shows it. In that case set `IDLE_EXIT_MINUTES=15`
in hPanel: idle copies then exit, and the copy that serves traffic stays.

### Fewer threads per copy (hPanel env vars, no code change)

Measured here on Node 22: a small HTTP server has **11 threads with the
defaults and 6** with
`NODE_OPTIONS=--v8-pool-size=1` and `UV_THREADPOOL_SIZE=2`. That roughly halves
every copy's cost against the cap, for every Node app on the account. It's safe
at this traffic: one GC helper thread, and two threads for fs, DNS and bcrypt.
Measure `nlwp` before and after (command in §4).

## 3. The one-origin plan

```
browser ── terreno.com.py ──▶ Cloudflare ──▶ Worker host-router
                                              │  Host: realestateinparaguay.com
                                              │  x-forwarded-host: terreno.com.py
                                              │  x-client-ip: <visitor>
                                              │  x-origin-auth: <secret>
                                              ▼
                                Hostinger (sees ONE hostname) ─▶ next-server
```

- `realestateinparaguay.com` stays the app's main domain on Hostinger, with its
  DNS unchanged. It must **not** get the Worker route (the Worker returns 508 if
  it does).
- Every other door moves to Cloudflare, gets the Worker route, and is
  **removed from the parked list** on Hostinger.
- Cloudflare caches only `/_next/static/*`. Pages, robots.txt, the sitemap and
  the manifest differ per door, and the cache key would not say which door asked.
- Cost: Workers Paid ($5/month, already on the account) includes 10 M requests
  a month. Assets count too, so keep an eye on the dashboard.

## 4. How to prove "one origin hostname gives one instance" — before moving any DNS

The Worker produces exactly one thing: requests to `realestateinparaguay.com`
with different `x-forwarded-host` values. **You can send those yourself today**,
with no DNS change and no deploy, because `ORIGIN_PROXY_SECRET` is not set yet.

**Test A — does the header reach the app?** (from anywhere)

```bash
curl -s -H 'X-Forwarded-Host: terreno.com.py' https://realestateinparaguay.com/ | grep -o '<title>[^<]*' | head -1
curl -s https://realestateinparaguay.com/ | grep -o '<title>[^<]*' | head -1
```

Look for: the first title is the terreno brand and the second is "Real Estate in
Paraguay". If both are the same, LiteSpeed strips the header. **Stop and tell
me**: the Worker plan would need another header name.

**Test B — the decisive one** (SSH, account 1). It is `dtest.sh` with one
change: every request goes to the **same** hostname with a different header.

```bash
cnt(){ pgrep -u "$USER" -f 'next-server' | while read p; do readlink /proc/$p/cwd; done | grep -c realestateinparaguay; }
pkill -u "$USER" next-server; sleep 5; echo "start $(cnt)"
for d in realestateinparaguay.com inmobiliaria.com.py www.inmobiliaria.com.py inmobiliarios.com.py terreno.com.py \
         www.terreno.com.py rentparaguay.com residenciaenparaguay.es landforsaleparaguay.com; do
  curl -s -o /dev/null -w "$d %{http_code} " -H "X-Forwarded-Host: $d" https://realestateinparaguay.com/
  sleep 20; echo "copies=$(cnt)"
done
```

(If `readlink` shows a different folder, replace `grep -c realestateinparaguay`
with whatever identifies the propia app in your `pmon2.log` script.)

Read the result like this:
- **Copies stay at 1, or 2 if the pair shows up again**, across all 9 → the
  launcher counts hostnames, and one origin fixes it. Go to §5.
- **Copies still grow per request** → it is not the hostname. Don't migrate any
  DNS; the orphan exit (#6) and the thread env vars are then the fix.

**Test C — the control, same session:** run your existing `~/dtest.sh` (real
hostnames) right after and paste `~/dtest.log`. That also covers the domains
the earlier test didn't reach (terreno, rentparaguay, residenciaenparaguay,
landforsale*, www variants).

**While watching:** this prints process tree, start time, threads and parent
for every copy. Paste it once at a moment with many copies:

```bash
ps -u "$USER" -o pid,ppid,pgid,lstart,nlwp,args --forest | grep -v grep | grep -E 'lsnode|next-server|node'
```

## 5. Migration checklist (one door at a time, pilot = terreno.com.py)

Before you start: merge this PR (Hostinger deploys it). Pick a secret:
`openssl rand -hex 32`.

1. **hPanel → realestateinparaguay.com → env vars:** add `ORIGIN_PROXY_SECRET=<secret>`,
   then redeploy. Run Test A again. With the secret set, the forged header must
   **no longer** change the title. That proves the guard works.
2. **Cloudflare:** add the zone terreno.com.py (skip this if it is already
   there). Before changing nameservers, compare Cloudflare's imported records
   with the current zone at the registrar: copy **every MX, the SPF TXT, DKIM
   TXT/CNAMEs and `_dmarc`** as DNS-only (grey cloud). Then send yourself a test
   mail to an address at that domain.
3. In the Cloudflare zone: the apex `A` and `www` records **proxied** (orange).
   The target doesn't matter (the Worker answers), but keep Hostinger's IP so
   that rollback is a single step. SSL/TLS mode: **Full (strict)**.
4. Change the nameservers at NIC.py to Cloudflare's pair. Wait until
   `dig NS terreno.com.py +short` shows them.
5. `cd workers/host-router && npm install && npx wrangler secret put ORIGIN_PROXY_SECRET && npx wrangler deploy`
   (the routes for terreno are already in `wrangler.toml`).
6. Check: `curl -sI https://terreno.com.py/` returns 200.
   `curl -s https://terreno.com.py/ | grep -o '<title>[^<]*'` shows the terreno
   brand. `curl -sI https://terreno.com.py/robots.txt` and `/sitemap.xml`
   contain `terreno.com.py` URLs. Send one test lead on the site and check it
   appears in /admin/leads with the right door.
7. **Only then:** remove terreno.com.py (and www) from the parked list on
   Hostinger.
8. **Measure (the decisive part):** leave `pmon2.log` running for 24 h. Compare
   the propia copy count and its growth rate with the days before. Count the
   reap.log kills per day before and after.
9. If it holds, repeat steps 2–7 per door. The order: landforsaleparaguay.com
   (+ landforsaleinparaguay.com, which the Worker answers with the 308 itself),
   rentparaguay.com, residenciaenparaguay.es, inmobiliarios.com.py, and
   inmobiliaria.com.py last. inmobiliaria's mail is already on Cloudflare Email
   Routing, so its MX records must stay exactly as they are.

**Rollback per door:** in Cloudflare set the two records to DNS-only (grey).
Traffic then goes straight to Hostinger's IP again, but this works only while
the domain is still parked there. If you already removed it, re-add it as
parked first. Or set the nameservers back at the registrar (takes hours).
The app needs no change to roll back: without the Worker, Host is read as
before.

## 6. Changes to reap.sh (optional)

Keep the thresholds (140 / 120) and "newest 3". One change makes each kill
cheaper: **kill PPID-1 copies first** (they get no traffic), and kill the
oldest PPID≠1 copies only if the total is still over the threshold. After this
PR is deployed, the app ends its own orphans and reap.sh should mostly find
nothing to do. That's the sign it worked.

## 7. Fallback: a VPS

One VPS, one Node process per app, with nginx or Caddy in front routing by Host header:

| | Hostinger Cloud Startup (today) | VPS (e.g. Hostinger KVM 2: 2 vCPU, 8 GB) |
|---|---|---|
| Copies per app | Up to the launcher | Exactly 1 (systemd or PM2) |
| Domains per app | Parked domains = extra copies (suspected) | Unlimited, one `server_name` list |
| Process cap | 200 threads | none (only RAM: about 120–200 MB per app) |
| 10 apps | does not fit | about 2 GB RAM, fits easily |
| Price | already paid ×2 | about US$7–12/month per VPS |
| Effort | none | 1–2 days setup (Node, Caddy auto-TLS, MySQL or a remote DB, deploy hook from GitHub), then OS updates and backups are yours |

A VPS is the guaranteed fix. The Worker plus the orphan exit is the cheap fix
that keeps Hostinger managed. Try them first; Test B in §4 tells you within an
hour whether the Worker plan can work at all.

## 8. Draft follow-up for Hostinger ticket #23157727

> Hello Fandy, follow-up with new measurements.
>
> 1. **Per-domain test (account u210059163, br-asc-web1724, site
>    realestateinparaguay.com).** I stopped every process of the app, then
>    requested each attached domain once. The next-server copies for that one
>    app went from 0 → 1 (realestateinparaguay.com) → 3 (inmobiliaria.com.py)
>    → 4 (inmobiliarios.com.py). Every copy runs from the same
>    `hbuilds/versions/<uuid>/nodejs` folder. Apps with one domain stay at
>    1–2 copies for hours. Apps with many parked domains grow to about 10
>    copies in 20 minutes.
> 2. **The copies are orphaned.** Their PPID is 1, they never exit, and Stop
>    in hPanel does not end them (9 copies stayed after Stop). Only killing
>    them by hand works. Every launch is logged as two full startups 3–4 ms
>    apart.
> 3. **Account u733677326 (br-asc-web1719)** shows the same pattern:
>    paraguayresidencyguide.com (many parked domains) 6 copies,
>    hospital.com.py 4, sitio.com.py 2, productos.com.py 1. That is 13
>    next-server processes and 95 threads at one moment, and Max Processes
>    has been at 200/200 since a new Node app was added.
> 4. CPU is about 1%, memory about 2 of 6 GB, and I/O is negligible. Only Max
>    Processes is exhausted. Your reply quoted 4 GB / 4 CPU / 100 entry
>    processes, but hPanel shows 6 GB / 200 max processes. Which is correct?
>
> Questions: (a) Does the Node.js launcher start a separate instance per
> domain or alias attached to one Node.js app? (b) Why are the instances
> orphaned (PPID 1) instead of stopped when idle? (c) Is there a setting for
> one instance per app, or an idle timeout? Until this is fixed I run a cron
> job that kills the extra copies every 5 minutes.
