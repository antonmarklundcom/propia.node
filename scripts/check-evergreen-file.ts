/**
 * Self-check for one or more evergreen content files, before they are added
 * to the registry — the same per-page rules `npm run verify:seo` block (l)
 * applies, plus the shared-paragraph check across every file given and every
 * page already registered.
 *
 *   npx tsx scripts/check-evergreen-file.ts src/content/evergreen/venta-luque-casas.ts [more…]
 *
 * Pure: no database, no network.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  EVERGREEN_PAGES,
  evergreenParagraphs,
  evergreenWordCount,
  type EvergreenPage,
} from "../src/content/evergreen";
import { VERTICALS } from "../src/config/verticals";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: npx tsx scripts/check-evergreen-file.ts <file.ts> [...]");
  process.exit(2);
}

let failed = 0;
const fail = (msg: string) => {
  failed++;
  console.log(`  ✗ ${msg}`);
};
const norm = (x: string) => x.toLowerCase().replace(/\s+/g, " ").trim();

async function load(file: string): Promise<EvergreenPage[]> {
  const mod = await import(pathToFileURL(path.resolve(file)).href);
  return Object.values(mod).filter(
    (v): v is EvergreenPage => !!v && typeof v === "object" && "path" in v && "faq" in v,
  );
}

async function main() {
  const pages: EvergreenPage[] = [];
  for (const f of files) {
    const found = await load(f);
    if (found.length !== 1) fail(`${f}: expected exactly one exported EvergreenPage, found ${found.length}`);
    pages.push(...found);
  }

  const doors = new Set(Object.values(VERTICALS).map((v) => v.key));
  for (const p of pages) {
    console.log(`${p.path} (${p.door})`);
    if (!doors.has(p.door)) fail(`door "${p.door}" is not a vertical key`);
    const words = evergreenWordCount(p);
    if (words < 500 || words > 900) fail(`word count ${words}, needs 500–900`);
    if (p.faq.length < 4 || p.faq.length > 6) fail(`${p.faq.length} FAQ entries, needs 4–6`);
    if (p.metaDescription.length > 155) fail(`meta description ${p.metaDescription.length} chars, max 155`);
    if (p.claimsToVerify.length === 0) fail("claimsToVerify is empty");
    const digits = evergreenParagraphs(p).filter((x) => /\d/.test(x));
    for (const d of digits) fail(`digit in prose: "${d.slice(0, 80)}…"`);
    const bands = p.priceBands;
    const bandsOk =
      bands.length >= 3 &&
      bands.length <= 4 &&
      bands.every(
        (b, i, all) =>
          (b.min != null || b.max != null) &&
          (b.min == null || b.max == null || b.min < b.max) &&
          (i === 0 || (all[i - 1].max != null && b.min != null && b.min > all[i - 1].max!)),
      );
    if (!bandsOk) fail("price bands must be 3–4, ascending, non-overlapping");
    console.log(`  words ${words}, faq ${p.faq.length}, meta ${p.metaDescription.length} chars`);
  }

  // Shared paragraphs: within the given files and against the registry.
  const owners = new Map<string, string>();
  const idOf = (p: EvergreenPage) => `${p.door}${p.path}`;
  const given = new Set(pages.map(idOf));
  for (const p of [...EVERGREEN_PAGES.filter((x) => !given.has(idOf(x))), ...pages]) {
    for (const para of new Set(evergreenParagraphs(p).map(norm))) {
      const other = owners.get(para);
      if (other && other !== idOf(p)) fail(`${other} & ${idOf(p)} share: "${para.slice(0, 70)}…"`);
      owners.set(para, idOf(p));
    }
  }

  console.log(failed === 0 ? "\nOK" : `\n${failed} problem(s)`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
