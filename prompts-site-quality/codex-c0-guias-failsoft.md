Task: /guias returns HTTP 500 on both live marketplace doors (inmobiliaria.com.py and realestateinparaguay.com). Cause: drizzle/0014 added the column posts.locale but production has not run that migration, so the select in src/lib/post-queries.ts fails with ER_BAD_FIELD_ERROR (Unknown column). The existing fail-soft helper isMissingTable() only recognises ER_NO_SUCH_TABLE, so the error escapes and the page 500s. Make the editorial reads degrade to an empty result on ANY schema-drift error from MySQL (missing table, unknown column, unknown field in field list), log one warning line naming the error code, and never throw for those. This is finding F12 of fable-plan-site-quality-2026-09-13.md; read that file's section 1 row F12 and AGENTS.md before starting.

Files to touch: src/lib/post-queries.ts (rename or extend isMissingTable to something like isSchemaDrift, covering codes ER_NO_SUCH_TABLE, ER_BAD_FIELD_ERROR and messages matching doesn't exist, no such table, Unknown column; apply it in every catch in that file that today calls isMissingTable, including the detail and related reads used by app/guias/[slug]/page.tsx if they exist there), docs/log/c0.md (new: what changed, what was not verified).

Do not touch: src/db/schema.ts, drizzle/**, drizzle.config.ts, src/db/index.ts, any env handling, app/guias/**, any other file.

Definition of done:
- A MySQL error whose code is ER_BAD_FIELD_ERROR thrown from the posts select makes listPublishedPosts resolve to an empty array instead of rejecting.
- The same holds for the post detail read: a schema-drift error yields null / not-found instead of a 500.
- One console.warn per failure, format: [posts] schema drift, degrading to empty: <code>. No secrets, no SQL text printed.
- Behaviour for a healthy schema is unchanged.
- npm run typecheck passes. npm run verify:local passes.
- docs/log/c0.md written.

Commands to run before reporting (working directory C:\Users\anton\propia.node): npm run typecheck ; npm run verify:local

Run every command listed and report FAIL with the real output rather than skipping or substituting a different check. Commit on the current branch with message: C0 - /guias degrades to empty on schema drift instead of 500. Do not push.

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
