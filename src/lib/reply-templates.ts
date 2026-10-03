/**
 * Saved reply texts (admin triage 3): the super-admin keeps a short list in
 * /admin/ajustes, and each lead card's reply boxes can fill their textarea
 * from it. Pure — no database, no `next/*` — so the client picker and the
 * settings action share one set of limits. Nothing here sends anything; a
 * template only ever lands in a textarea a person then reads and submits.
 *
 * Stored as a JSON array of strings in the `reply_templates` site setting.
 * Placeholders: `{nombre}` (the lead's name) and `{propiedad}` (its listing).
 */

export const REPLY_TEMPLATES_MAX = 20;
export const REPLY_TEMPLATE_CHARS = 1000;

/** What a stored value becomes: only valid strings survive, capped. */
export function parseReplyTemplates(raw: string | null | undefined): string[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: string[] = [];
  for (const item of data) {
    if (typeof item !== "string") continue;
    const text = item.trim();
    if (text && text.length <= REPLY_TEMPLATE_CHARS) out.push(text);
    if (out.length >= REPLY_TEMPLATES_MAX) break;
  }
  return out;
}

/** The settings textarea: templates separated by a line holding only `---`. */
export const TEMPLATE_SEPARATOR = "---";

export function templatesToText(templates: readonly string[]): string {
  return templates.join(`\n${TEMPLATE_SEPARATOR}\n`);
}

export type TemplatesFromText =
  | { ok: true; templates: string[] }
  | { ok: false; error: "too_many" | "too_long" };

export function templatesFromText(text: string): TemplatesFromText {
  const templates = text
    .replace(/\r\n/g, "\n")
    .split(/^[ \t]*---[ \t]*$/m)
    .map((s) => s.trim())
    .filter(Boolean);
  if (templates.length > REPLY_TEMPLATES_MAX) return { ok: false, error: "too_many" };
  if (templates.some((s) => s.length > REPLY_TEMPLATE_CHARS)) return { ok: false, error: "too_long" };
  return { ok: true, templates };
}

export interface TemplateVars {
  nombre: string | null;
  propiedad: string | null;
}

/** Placeholders replaced; a missing name leaves no stray space before punctuation. */
export function fillTemplate(text: string, vars: TemplateVars): string {
  return text
    .replace(/\{nombre\}/gi, (vars.nombre ?? "").trim())
    .replace(/\{propiedad\}/gi, (vars.propiedad ?? "").trim() || "la propiedad")
    .replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}

/** A short line for the picker: the template's first line, cut. */
export function templateLabel(text: string, max = 48): string {
  const line = text.split("\n")[0].trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}
