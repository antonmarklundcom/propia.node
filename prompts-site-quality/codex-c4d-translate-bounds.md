Task: Act on candidate 2 of docs/log/process-audit.md (read it first), the Hostinger process-count problem. The translation cron can keep a Node runtime alive for a long time because the provider calls have no deadline and the batch is effectively unbounded. Make the run finite. In src/lib/translate.ts give the DeepL fetch and the Gemini fetch an AbortSignal.timeout of 30 seconds each (30000 ms), and construct the Anthropic client once per call with timeout 45000 and maxRetries 1 instead of the SDK defaults. In src/lib/ops/translate.ts change the loop so the limit counts attempted rows, successes plus failures, not only successes, and when no limit is given use a default of 50 instead of Infinity (update the note text that explains the default so it says the default cap and how to raise it with --limit). Once the cap is reached stop iterating the async generator (break out of the loop) instead of continuing to scan and count every remaining candidate; if the ops output helper needs a final count of postponed rows, compute it with one cheap COUNT query only if such a helper already exists, otherwise just note that further candidates were not scanned. Keep the dry-run path working with the same cap semantics. Do not change the DB schema, the hash logic, the provider fallback order, or the FX, cuotas, medians, images or sessions jobs.

Files to touch: src/lib/translate.ts, src/lib/ops/translate.ts, docs/log/c4d.md (new, short: what landed, what was not verified, deviations, and the one hPanel action the founder still has to take per candidate 1 of the audit).

Do not touch: anything else. No git commands. No npm run build. Do not print or write environment variables or secrets, and do not call any translation provider.

Definition of done:
- Both fetch calls in src/lib/translate.ts pass signal: AbortSignal.timeout(30000).
- The Anthropic client is created with an explicit timeout and maxRetries.
- src/lib/ops/translate.ts: no Infinity limit, default cap 50, cap counts attempts, loop breaks at the cap.
- npm run typecheck passes.
- docs/log/c4d.md written.

Commands to run before reporting (working directory C:\Users\anton\propia.node), run every one and report FAIL rather than skip:
- npm run typecheck
- npm run cron:translate -- --dry --limit 2 (this needs a database; if it fails to connect, report the exact error as FAIL and continue, do not retry)

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
