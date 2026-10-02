"use client";

/**
 * Keyboard shortcuts for the review queue (admin triage 3): j/k move a
 * highlighted row, x ticks its checkbox, a submits its approve form, r opens
 * its reject box, ? shows the key list. Ignored while typing in a field or
 * with a modifier held. The table, rows and forms are server-rendered; this
 * only drives them through the DOM (`data-review-table`, `data-review-approve`),
 * so a shortcut does exactly what a click does.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function ReviewShortcuts(props: {
  hint: string;
  title: string;
  keys: ReadonlyArray<readonly [string, string]>;
  close: string;
}) {
  const [help, setHelp] = useState(false);
  const active = useRef(-1);

  const rows = useCallback(
    () => Array.from(document.querySelectorAll<HTMLTableRowElement>("table[data-review-table] tbody tr")),
    [],
  );
  const mark = useCallback(
    (i: number) => {
      const all = rows();
      if (all.length === 0) return;
      const next = Math.max(0, Math.min(all.length - 1, i));
      all.forEach((r, idx) => r.classList.toggle("panel-row--active", idx === next));
      active.current = next;
      all[next].scrollIntoView({ block: "nearest" });
    },
    [rows],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const all = rows();
      const row = active.current >= 0 ? all[active.current] : undefined;
      switch (e.key) {
        case "j":
          mark(active.current + 1);
          break;
        case "k":
          mark(active.current < 0 ? 0 : active.current - 1);
          break;
        case "x":
          row?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();
          break;
        case "a":
          row?.querySelector<HTMLFormElement>("form[data-review-approve]")?.requestSubmit();
          break;
        case "r": {
          const details = row?.querySelector<HTMLDetailsElement>("details");
          if (details) {
            details.open = true;
            details.querySelector<HTMLTextAreaElement>("textarea")?.focus();
            e.preventDefault(); // keep the "r" out of the textarea we just focused
          }
          break;
        }
        case "?":
          setHelp((h) => !h);
          break;
        case "Escape":
          setHelp(false);
          break;
        default:
          return;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mark, rows]);

  return (
    <>
      <p className="panel-shortcuts__hint">{props.hint}</p>
      {help ? (
        <aside className="panel-shortcuts__help" role="dialog" aria-label={props.title}>
          <h4>{props.title}</h4>
          <dl>
            {props.keys.map(([k, what]) => (
              <div key={k} style={{ display: "contents" }}>
                <dt>
                  <kbd>{k}</kbd>
                </dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
          <button type="button" className="panel-btn" onClick={() => setHelp(false)}>
            {props.close}
          </button>
        </aside>
      ) : null}
    </>
  );
}
