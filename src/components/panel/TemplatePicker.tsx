"use client";

/**
 * "Plantilla" select for a reply box (admin triage 3). Choosing one fills the
 * form's reply textarea with the saved text, `{nombre}` / `{propiedad}`
 * already replaced, and nothing else — the form's own Send button is the only
 * way anything leaves, so a person always reads the text first. Texts come
 * from /admin/ajustes (src/lib/reply-templates.ts).
 */
import { useRef } from "react";
import { fillTemplate, templateLabel, type TemplateVars } from "@/lib/reply-templates";

export interface TemplatePickerProps {
  templates: readonly string[];
  vars: TemplateVars;
  labels: { label: string; none: string; replaceConfirm: string };
}

export function TemplatePicker({ templates, vars, labels }: TemplatePickerProps) {
  const ref = useRef<HTMLSelectElement>(null);
  if (templates.length === 0) return null;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const select = e.currentTarget;
    const index = Number(select.value);
    const box = select.closest("form")?.querySelector<HTMLTextAreaElement>("textarea[name=body]");
    if (!box || !Number.isInteger(index) || !templates[index]) return;
    if (box.value.trim() && !window.confirm(labels.replaceConfirm)) {
      select.value = "";
      return;
    }
    const text = fillTemplate(templates[index], vars);
    box.value = box.maxLength > 0 ? text.slice(0, box.maxLength) : text;
    box.dispatchEvent(new Event("input", { bubbles: true }));
    box.focus();
    select.value = "";
  }

  return (
    <label className="panel-form__field" style={{ flexBasis: "100%" }}>
      <span className="auth-field__label">{labels.label}</span>
      <select ref={ref} className="panel-select" defaultValue="" onChange={onChange}>
        <option value="">{labels.none}</option>
        {templates.map((t, i) => (
          <option key={i} value={i}>
            {templateLabel(t)}
          </option>
        ))}
      </select>
    </label>
  );
}
