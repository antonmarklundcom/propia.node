# verify:live — is the live site saying what the code says it should?

`npm run verify:live` opens every domain the app answers for, the way a search
engine would, and checks what each one actually says against the domain table
in `src/config/verticals.ts`. It only reads (GET requests, no database, no
password needed) and takes about half a minute.

Run it after a deploy, and after changing any hPanel environment variable and
rebuilding — `NEXT_PUBLIC_CANONICAL_HOST` above all.

## How to run it (Windows PowerShell)

From your clone of the repo, on `main` and up to date:

```powershell
git pull
npm install
npm run verify:live
```

No environment variables are needed. **Do not** have `NEXT_PUBLIC_CANONICAL_HOST`
set in the same PowerShell window: the script computes what the site *should*
say from the code, and the code's default (`inmobiliaria.com.py`) is the
intended value. The first lines of the output say which value it used.

Useful options:

```powershell
npm run verify:live -- --only rentparaguay.com        # one domain
npm run verify:live -- --raw-host <name>.hostingersite.com
npm run verify:live -- --ascii                        # OK/FAIL instead of ✓/✗
npm run verify:live -- --json > verify-live.json      # for a bug report
```

`--raw-host` is worth passing when you know the Hostinger deploy name (hPanel →
your website → the `*.hostingersite.com` address): it checks that the raw deploy
address points search engines at the real domain. It is the most direct test of
`NEXT_PUBLIC_CANONICAL_HOST`.

If `✓` and `✗` come out as garbage characters, use `--ascii` (older PowerShell
consoles) or run it in Windows Terminal.

The last line reads `N passed, M failed, K skipped`. Any failure makes the
command exit with code 1.

## What it checks, per domain

| Line | What it means when it passes |
| --- | --- |
| `home` | The home page answers 200. |
| `home canonical` | The home page names itself (`https://<that domain>/`) as the real address. |
| `home hreflang` | The "this page in other languages" tags are exactly what `languageAlternates()` in `src/lib/alternates.ts` computes — e.g. `inmobiliaria.com.py` ↔ `realestateinparaguay.com`, `rentparaguay.com` ↔ `alquiler.com.py`, none on the feeders. |
| `robots.txt` | Answers 200 and points at that same domain's `/sitemap.xml`. |
| `sitemap.xml` | Answers 200, is a real sitemap, and every URL in it is on that same domain. |
| `sitemap omits /propiedad` | Domains that send listing pages elsewhere (`terreno.com.py`, `rentparaguay.com`, `landforsaleparaguay.com`, `inmobiliarios.com.py`) do not list them. |
| `sitemap lists /propiedad` | Domains that own listing pages (`inmobiliaria.com.py`, `realestateinparaguay.com`) do. |
| `/api/health` | The app process behind that domain is alive. |
| `/propiedad canonical` | One real listing (taken from `inmobiliaria.com.py`'s sitemap) opened on this domain names the right owner: itself on the two owning domains, `inmobiliaria.com.py` on the Spanish feeders, `realestateinparaguay.com` on the English ones. |
| `/venta → marketplace` (directory only) | `inmobiliarios.com.py` sends marketplace pages to `inmobiliaria.com.py` with a permanent (308) redirect. |

And once per run:

| Line | Meaning |
| --- | --- |
| `landforsaleinparaguay.com (redirects)` | The whole domain 308s to `landforsaleparaguay.com`, keeping the path. |
| `rentparaguay.com (redirects)` | Two of the old WordPress addresses 308 to their new pages. |
| `database` | `/api/health/db` answers, with how long MySQL took. |
| `unknown host` | The raw `*.hostingersite.com` address points search engines at `NEXT_PUBLIC_CANONICAL_HOST`. Skipped unless you pass `--raw-host`. |
| `no *.hostingersite.com canonical` | No page checked named the raw Hostinger address as its real address. |

`alquiler.com.py` is skipped on purpose — it is not purchased. The list of
skipped domains is `NOT_LIVE` at the top of `scripts/verify-live.ts`; delete the
line the day the domain goes live (or pass `--all` to include it anyway).

## What a failure usually means

| Failure | Usual cause | What to do |
| --- | --- | --- |
| **Every check on one domain fails with "DNS does not resolve"** | The domain is not pointed at Hostinger (or not bought). | Check the domain's DNS / hPanel → Domains. If it is intentionally not live yet, add it to `NOT_LIVE`. |
| **Everything fails with `403`** | A firewall between you and the site (office/VPN network), or Hostinger's bot protection blocking the check. | Try from another network; check hPanel's security settings. |
| **Everything fails with "no answer within 10 s" or `503`** | The app is down or stuck. | hPanel → Node.js app → logs / restart. Check the `database` line too. |
| **`database` fails** (`timeout`, `refused`, `auth`, `exhausted`) | MySQL is unreachable, the password in hPanel is wrong, or the connection pool is full. | `auth`: the `DATABASE_URL` in hPanel does not match the database user. `refused`/`timeout`: MySQL itself. `exhausted`: too many requests at once — restart the app. |
| **`home hreflang` fails, and `x-default` or `es` names the wrong domain** | `NEXT_PUBLIC_CANONICAL_HOST` in hPanel is not `inmobiliaria.com.py`. (Measured: with it set to `realestateinparaguay.com`, the Spanish slot goes to `terreno.com.py` and `inmobiliaria.com.py` emits no language tags at all.) | hPanel → the Node.js app → Environment variables → set `NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py` → **rebuild** (not just restart: it is baked in at build time). Run this check again. |
| **`unknown host` canonical is wrong** | Same cause — `NEXT_PUBLIC_CANONICAL_HOST`. | Same fix. |
| **`home canonical` names another domain** | The request reached the app under a different name — usually the domain is attached in hPanel as an alias of another site, or a proxy rewrites the host. | Check hPanel → Domains for how that domain is attached. |
| **`/propiedad canonical` points at the wrong owner** | `verticals.ts` and the live build disagree — the deploy did not pick up the latest `main`, or `NEXT_PUBLIC_CANONICAL_HOST` is wrong. | Check hPanel's last deploy; then the env var. |
| **`sitemap <loc>s on this host` fails** | The sitemap lists another domain's URLs — same two causes as above. | Same. |
| **`sitemap omits /propiedad` fails** | A feeder domain is submitting listing pages it sends elsewhere (Search Console will report "not selected as canonical"). | A code bug — tell the developer; `npm run verify:seo` should have caught it. |
| **`robots.txt` sitemap line wrong** | Same as a wrong canonical. | Same. |
| **A redirect line fails with `200` instead of `308`** | The redirect rule did not deploy, or the domain is attached as its own site in hPanel instead of to this app. | Check the domain is attached to this Node.js app. |
| **`home` is `500` right after a deploy, and fine a minute later** | The site was cold and several pages were rendered at once (the database pool is deliberately small). | Run it again. If it persists, check the `database` line and the app log. |

## How this was verified (2026-09-27)

The cloud sandbox that wrote it cannot reach the live sites (outbound traffic is
blocked; a live run there gets `403` from the sandbox proxy on every request),
so it has only ever been run against a local production build: MariaDB 11.8,
all migrations, `seed:locations`, the four sample listings from
`data/sample-listings.csv`, `next build && next start`, then
`npm run verify:live -- --base http://localhost:3210`. `--base` sends each
domain's name as the `Host` header to the one local server — the same way
Hostinger's proxy reaches the app — so every check above, including the
`next.config.ts` and middleware redirects, ran for real: 62 passed, 0 failed.

Failure proof: the same data against a build made with
`NEXT_PUBLIC_CANONICAL_HOST=realestateinparaguay.com` — the "hPanel still has
the old value" case. Four checks failed, exit code 1:
`inmobiliaria.com.py`, `realestateinparaguay.com` and `terreno.com.py` home
hreflang (`es` went to `terreno.com.py`, `x-default` to the English door, and
`inmobiliaria.com.py` lost its tags), and the unknown-host canonical
(`https://realestateinparaguay.com` instead of `https://inmobiliaria.com.py/`).

**Not verified:** a run against the real domains. The first run on the
founder's PC is the first real one; expect `landforsaleparaguay.com` to fail
if its DNS is not live yet (CLAUDE.md says unconfirmed).
