"use client";

/**
 * A reply textarea with a "Sugerir respuesta" button (src/lib/ai-reply.ts).
 *
 * The button calls a server action already bound to one lead or thread; the
 * action re-checks who may see it. A draft only ever lands in this textarea —
 * the surrounding form's own Send button is the only way anything leaves, so
 * a person always reads the text first. Rendered only when the feature is on
 * (`isAiReplyEnabled()` on the server); otherwise the page keeps its plain
 * textarea.
 */
import { useRef, useState, useTransition } from "react";
import type { SuggestError, SuggestOutcome } from "@/lib/ai-reply-prompt";

/**
 * Plain strings only — a server page passes this to a client component, and
 * the functions in the `aiReply` namespace (the usage lines) cannot cross that
 * boundary. Build it with `aiReplyLabels()` from `es-ai.ts`/`en-ai.ts`.
 */
export interface AiReplyLabels {
  button: string;
  working: string;
  replaceConfirm: string;
  filled: string;
  lowConfidence: string;
  hint: string;
  error: Record<SuggestError, string>;
}

export function AiReplyTextarea(props: {
  name: string;
  className?: string;
  required?: boolean;
  maxLength?: number;
  suggest: () => Promise<SuggestOutcome>;
  labels: AiReplyLabels;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<{ text: string; warn: boolean } | null>(null);

  function onSuggest() {
    const box = ref.current;
    if (!box) return;
    if (box.value.trim() && !window.confirm(props.labels.replaceConfirm)) return;
    setNote(null);
    startTransition(async () => {
      let out: SuggestOutcome;
      try {
        out = await props.suggest();
      } catch {
        out = { ok: false, error: "failed" };
      }
      if (!out.ok) {
        setNote({ text: props.labels.error[out.error] ?? props.labels.error.failed, warn: true });
        return;
      }
      box.value = out.text;
      box.focus();
      setNote(out.confident ? { text: props.labels.filled, warn: false } : { text: props.labels.lowConfidence, warn: true });
    });
  }

  return (
    <>
      <textarea
        ref={ref}
        className={props.className}
        name={props.name}
        required={props.required}
        maxLength={props.maxLength}
        aria-busy={pending}
      />
      <span style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 6 }}>
        <button type="button" className="panel-btn" onClick={onSuggest} disabled={pending}>
          {pending ? props.labels.working : `✨ ${props.labels.button}`}
        </button>
        <span className="panel-note" style={{ margin: 0 }}>
          {props.labels.hint}
        </span>
      </span>
      {note ? (
        <span role="status" className={note.warn ? "auth-error" : "panel-flash"} style={{ display: "block", marginTop: 6 }}>
          {note.text}
        </span>
      ) : null}
    </>
  );
}
