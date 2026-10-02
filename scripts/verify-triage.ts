/**
 * Verify the pure halves of admin triage 3 — no database, no network:
 * reply templates (parse, limits, placeholders) and the analytics delta.
 *
 * Run: npm run verify:triage   (also part of npm run verify:local)
 */
import { deltaOf } from "../src/lib/analytics-delta";
import {
  REPLY_TEMPLATES_MAX,
  REPLY_TEMPLATE_CHARS,
  fillTemplate,
  parseReplyTemplates,
  templatesFromText,
  templatesToText,
} from "../src/lib/reply-templates";

let failed = 0;
function check(name: string, ok: boolean, detail = ""): void {
  if (!ok) {
    failed++;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// stored value -> list
check("parse: garbage is empty", parseReplyTemplates("nope").length === 0 && parseReplyTemplates(null).length === 0);
check("parse: non-array is empty", parseReplyTemplates('{"a":1}').length === 0);
check("parse: keeps strings, drops blanks and non-strings", JSON.stringify(parseReplyTemplates('["a"," ",3,"b"]')) === '["a","b"]');
check("parse: drops over-long", parseReplyTemplates(JSON.stringify(["x".repeat(REPLY_TEMPLATE_CHARS + 1), "ok"])).length === 1);
check("parse: caps at max", parseReplyTemplates(JSON.stringify(Array.from({ length: 30 }, (_, i) => `t${i}`))).length === REPLY_TEMPLATES_MAX);

// textarea <-> list
const two = templatesFromText("Hola {nombre}\r\nlinea 2\r\n---\r\nSegunda\n  ---  \n\n");
check("text: splits on --- lines", two.ok && two.templates.length === 2 && two.templates[0] === "Hola {nombre}\nlinea 2");
const back = two.ok ? templatesFromText(templatesToText(two.templates)) : null;
check("text: round trip", !!back && back.ok && JSON.stringify(back.templates) === JSON.stringify(two.ok ? two.templates : []));
check("text: a dash inside a line is not a separator", (() => { const r = templatesFromText("a --- b"); return r.ok && r.templates.length === 1; })());
const many = templatesFromText(Array.from({ length: REPLY_TEMPLATES_MAX + 1 }, (_, i) => `t${i}`).join("\n---\n"));
check("text: 21 refused", !many.ok && many.error === "too_many");
const long = templatesFromText("x".repeat(REPLY_TEMPLATE_CHARS + 1));
check("text: 1001 chars refused", !long.ok && long.error === "too_long");
check("text: exactly 1000 ok", templatesFromText("x".repeat(REPLY_TEMPLATE_CHARS)).ok);
check("text: empty is an empty list", (() => { const r = templatesFromText("  \n "); return r.ok && r.templates.length === 0; })());

// placeholders
check("fill: both", fillTemplate("Hola {nombre}, sobre {propiedad}.", { nombre: "Ana", propiedad: "Casa en Luque" }) === "Hola Ana, sobre Casa en Luque.");
check("fill: no name leaves no space before the comma", fillTemplate("Hola {nombre}, gracias", { nombre: null, propiedad: null }) === "Hola, gracias");
check("fill: no listing falls back", fillTemplate("Por {propiedad}", { nombre: "A", propiedad: null }) === "Por la propiedad");
check("fill: repeated and case-insensitive", fillTemplate("{nombre} {Nombre}", { nombre: "Ana", propiedad: "" }) === "Ana Ana");

// delta
check("delta: +20", deltaOf(120, 100).kind === "up" && deltaOf(120, 100).pct === "20");
check("delta: -50", deltaOf(50, 100).kind === "down" && deltaOf(50, 100).pct === "50");
check("delta: flat", deltaOf(100, 100).kind === "flat" && deltaOf(1001, 1000).kind === "flat");
check("delta: new", deltaOf(5, 0).kind === "fresh");
check("delta: nothing", deltaOf(0, 0).kind === "none");
check("delta: to zero is -100", deltaOf(0, 8).kind === "down" && deltaOf(0, 8).pct === "100");

if (failed) {
  console.error(`verify:triage — ${failed} failed`);
  process.exit(1);
}
console.log("verify:triage — ok");
