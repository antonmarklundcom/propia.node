/**
 * Pure checks for plan-admin-next O5 (who of a duplicate group holds the
 * slot) and O1 (the exclusive flag's form and state). No DB, no network. In
 * verify:local and the pre-push hook. The SQL twin of the O5 rule,
 * `notHiddenDuplicate()`, is checked against MariaDB by
 * tests/e2e/listing-duplicates.spec.ts.
 */
import { isHiddenDuplicate, primaryOf, type DuplicateMember } from "../src/lib/listing-duplicate-rules";
import { exclusiveFromForm, exclusiveState, parseDay } from "../src/lib/listing-exclusive-state";

let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    failed++;
    console.error(`FAIL ${name}:\n  got  ${g}\n  want ${w}`);
  }
}

const m = (id: number, status: string, listedAt: string | null): DuplicateMember => ({ id, status, listedAt });

// --- O5: the first published lister keeps the slot ---
const a = m(10, "published", "2026-01-05T10:00:00Z");
const b = m(11, "published", "2026-02-01T10:00:00Z");
const c = m(12, "published", "2026-03-01T10:00:00Z");
eq("earliest published is primary", primaryOf([c, b, a])?.id, 10);
eq("later ones are hidden", [a, b, c].map((x) => isHiddenDuplicate(x, [a, b, c])), [false, true, true]);
const aGone = { ...a, status: "sold" };
eq("primary goes: the next takes over", primaryOf([aGone, b, c])?.id, 11);
eq("an unpublished member is never 'hidden'", isHiddenDuplicate(aGone, [aGone, b, c]), false);
eq("the new primary is visible", isHiddenDuplicate(b, [aGone, b, c]), false);
eq("tie on date: lowest id", primaryOf([m(21, "published", "2026-01-01T00:00:00Z"), m(20, "published", "2026-01-01T00:00:00Z")])?.id, 20);
eq("no date sorts last", primaryOf([m(30, "published", null), m(31, "published", "2026-05-01T00:00:00Z")])?.id, 31);
eq("nothing published: no primary", primaryOf([m(40, "draft", "2026-01-01T00:00:00Z"), m(41, "paused", null)]), null);
eq("Date objects work too", primaryOf([{ id: 50, status: "published", listedAt: new Date("2026-02-02") }, { id: 51, status: "published", listedAt: new Date("2026-01-01") }])?.id, 51);

// --- O1: exclusive form and state ---
const form = (o: Record<string, string>) => (k: string) => (k in o ? o[k] : null);
eq("day ok", parseDay("2026-12-31"), "2026-12-31");
eq("day impossible", parseDay("2026-02-30"), null);
eq("day garbage", parseDay("31/12/2026"), null);
eq("form on", exclusiveFromForm(form({ exclusive: "on", until: "2026-12-31", note: " firmado " })), { on: true, until: "2026-12-31", note: "firmado" });
eq("form off", exclusiveFromForm(form({})), { on: false, until: null, note: null });
eq("form bad date", exclusiveFromForm(form({ exclusive: "on", until: "mañana" })), { error: "until" });
eq("note bounded", (exclusiveFromForm(form({ exclusive: "on", note: "x".repeat(400) })) as { note: string }).note.length, 280);
eq("state none", exclusiveState(null, "2026-10-03"), "none");
eq("state open-ended", exclusiveState({ until: null }, "2026-10-03"), "active");
eq("state last day still on", exclusiveState({ until: "2026-10-03" }, "2026-10-03"), "active");
eq("state expired", exclusiveState({ until: "2026-10-02" }, "2026-10-03"), "expired");

if (failed) {
  console.error(`verify:duplicates — ${failed} failed`);
  process.exit(1);
}
console.log("verify:duplicates — OK");
