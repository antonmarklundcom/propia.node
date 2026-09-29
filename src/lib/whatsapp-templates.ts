/**
 * WhatsApp message templates — the pure half (no `next/*`, no database, no
 * network; `npm run verify:whatsapp` drives it).
 *
 * Meta lets a business write first, or after the customer's 24-hour window has
 * closed, only with a **template**: a message whose exact wording was submitted
 * and approved in WhatsApp Manager, with numbered variables (`{{1}}`) filled in
 * at send time. The app therefore cannot invent a template — it can only send
 * one that already exists there under the same name and language.
 *
 * So the registry below is the wording to **submit** to Meta
 * (`docs/whatsapp-templates.md` lists it with the category and the steps), and
 * a template is offered in the panel only when its name is listed in
 * `WHATSAPP_TEMPLATES` (comma-separated) — i.e. once the founder has confirmed
 * Meta approved it. With the variable empty nothing changes: outside the window
 * the panel keeps showing the `wa.me` link.
 *
 * The rendered text is what the thread stores as the message body, so the panel
 * shows what the customer received.
 */

export interface WaTemplate {
  /** Meta's template name: lowercase letters, digits and underscores. */
  name: string;
  /** What each `{{n}}` is, in the order Meta numbers them (Spanish, for the panel form). */
  params: readonly { label: string; /** Prefilled value; `"brand"` = this deployment's brand. */ prefill?: "brand" }[];
  /** The wording submitted to Meta, with `{{1}}`…`{{n}}`. Never starts or ends with a variable. */
  body: string;
  /** Meta's category. Utility = tied to something the customer asked for. */
  category: "UTILITY";
}

export const WA_TEMPLATES: readonly WaTemplate[] = [
  {
    name: "seguimiento_consulta",
    category: "UTILITY",
    params: [{ label: "Nombre" }, { label: "Marca", prefill: "brand" }, { label: "Tema de la consulta" }],
    body: "Hola {{1}}, te escribimos de {{2}} por tu consulta sobre {{3}}. Si seguís interesado, respondé a este mensaje y te ayudamos.",
  },
  {
    name: "recordatorio_visita",
    category: "UTILITY",
    params: [{ label: "Nombre" }, { label: "Propiedad" }, { label: "Día y hora" }],
    body: "Hola {{1}}, te recordamos tu visita a {{2}}: {{3}}. Si no podés venir, respondé a este mensaje para reprogramar.",
  },
];

/** Template language code as Meta lists it for the template (`es`, `es_AR`, …). */
export const DEFAULT_TEMPLATE_LANGUAGE = "es";

/** One variable's cap. Meta allows more; a short cap keeps a pasted paragraph out of a name slot. */
export const WA_TEMPLATE_PARAM_MAX = 100;

export function templateLanguage(env: Record<string, string | undefined> = process.env): string {
  const v = env.WHATSAPP_TEMPLATE_LANG?.trim();
  return v && /^[a-z]{2}(_[A-Z]{2})?$/.test(v) ? v : DEFAULT_TEMPLATE_LANGUAGE;
}

/** The registry templates the founder has listed in `WHATSAPP_TEMPLATES`. Unknown names are ignored. */
export function enabledTemplates(env: Record<string, string | undefined> = process.env): WaTemplate[] {
  const listed = new Set(
    (env.WHATSAPP_TEMPLATES ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return WA_TEMPLATES.filter((t) => listed.has(t.name));
}

export function findTemplate(name: string): WaTemplate | undefined {
  return WA_TEMPLATES.find((t) => t.name === name);
}

/**
 * One variable as Meta accepts it: no newline or tab, no run of more than four
 * spaces, trimmed and capped. Null when nothing is left (Meta rejects an empty
 * variable, so the send is refused here instead).
 */
export function cleanTemplateParam(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim()
    .slice(0, WA_TEMPLATE_PARAM_MAX)
    .trim();
  return s || null;
}

/** The text the customer receives: the body with each `{{n}}` replaced. */
export function renderTemplateBody(t: WaTemplate, params: readonly string[]): string {
  return t.body.replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] ?? "");
}

export type TemplateInput =
  | { ok: true; template: WaTemplate; params: string[] }
  | { ok: false; error: "template_off" | "template_invalid" };

/**
 * A form's template name and variables → a sendable template, or the reason
 * not. `template_off` = not in `WHATSAPP_TEMPLATES` (never approved as far as
 * the app knows); `template_invalid` = a variable missing or empty.
 */
export function validateTemplateInput(
  name: unknown,
  values: readonly unknown[],
  enabled: readonly WaTemplate[] = enabledTemplates(),
): TemplateInput {
  const template = typeof name === "string" ? enabled.find((t) => t.name === name) : undefined;
  if (!template) return { ok: false, error: "template_off" };
  const params: string[] = [];
  for (let i = 0; i < template.params.length; i++) {
    const p = cleanTemplateParam(values[i]);
    if (p == null) return { ok: false, error: "template_invalid" };
    params.push(p);
  }
  return { ok: true, template, params };
}

/** The Graph API `/messages` body for a template send (`to` is E.164 digits). */
export function templatePayload(to: string, t: WaTemplate, params: readonly string[], language = DEFAULT_TEMPLATE_LANGUAGE) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: t.name,
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: params.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };
}

/** Meta's structural rules for the wording itself, checked on the registry by `verify:whatsapp`. */
export function templateBodyProblems(t: WaTemplate): string[] {
  const out: string[] = [];
  if (!/^[a-z0-9_]{1,512}$/.test(t.name)) out.push("name must be lowercase letters, digits and underscores");
  if (t.body.length > 1024) out.push("body is over Meta's 1024 characters");
  const nums = [...t.body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  const expected = t.params.map((_, i) => i + 1);
  if (JSON.stringify(nums) !== JSON.stringify(expected)) out.push("variables must be {{1}}…{{n}} in order, once each");
  if (/^\s*\{\{/.test(t.body) || /\}\}\s*$/.test(t.body)) out.push("a template cannot start or end with a variable");
  if (/\n\s*\n\s*\n/.test(t.body) || / {5,}/.test(t.body)) out.push("no runs of blank lines or more than four spaces");
  return out;
}
