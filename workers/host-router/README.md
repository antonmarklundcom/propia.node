# host-router — one Cloudflare Worker in front of every door

Sends every door's requests to ONE origin hostname on Hostinger, so the Node.js
launcher sees one virtual host for the app instead of one per parked domain.
Why, how to prove it works first, and the per-domain migration checklist:
**`docs/hosting-process-cap.md`**. Read that before deploying.

The rule is `src/route.ts` (pure; `npm run verify:proxy` in the app checks it).

```bash
cd workers/host-router
npm install
npx wrangler secret put ORIGIN_PROXY_SECRET   # same value as in hPanel
npx wrangler deploy                           # routes: wrangler.toml
npx wrangler tail                             # watch it
```

Never route `ORIGIN_HOST` (realestateinparaguay.com) to this Worker: it answers
508 instead of looping. Deployed by hand, never from CI.
