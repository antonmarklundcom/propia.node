# Prompt for the next Fable session (written 2026-09-14)

Paste into a new Fable chat, working directory `C:\Users\anton\propia.node`.

---

Continue the propia.node site-quality run. Read `docs/log/c4-director-2026-09-14.md` and my memory file `propia-site-quality-2026-09-13`. State: everything (C0–C4f) is merged into `main` and pushed. Prod on Hostinger is NOT redeployed automatically.

Do, in this order, code work by Codex via manager-worker-codex, you audit by rendering and commit:

1. Ask me whether the Hostinger deploy of `main` has happened. If yes: run the live audit (`docs/tools/audit-home.mjs`, `docs/tools/audit-inner.mjs`, playwright from `C:\Claude 1\contador-design-audit\node_modules`) against `https://inmobiliaria.com.py` and `https://realestateinparaguay.com`, write `docs/log/live-2026-09-14.md`, send anything red to Codex.
2. Small leftovers: `/precios` index empty state still uses `.panel-empty` (cheap tier); `.precios-table*` CSS never rendered because no medians group reaches 8 listings, verify once real inventory exists.
3. Founder steps, remind me: `npm run db:migrate` on prod (0014 pending); `NEXT_PUBLIC_CONTACT_WHATSAPP` in hPanel + rebuild; real listing photos; hPanel cron staggering + per-job lock (process-audit candidate 1).
