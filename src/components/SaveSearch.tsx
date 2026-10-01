"use client";

import { useId, useState } from "react";
import { getDictionary, type Locale } from "@/i18n";
import type { SavedSearchCriteria } from "@/lib/saved-search-criteria";

/**
 * "Alert me about new listings" under a category's results. The search it saves
 * is the one on screen (`criteria`, built on the server from the same facets the
 * grid used); the visitor only adds an email. Rendered only when email sending
 * is configured, so it never offers an alert that could not be delivered.
 */
export function SaveSearch({ locale, criteria }: { locale: Locale; criteria: SavedSearchCriteria }) {
  const t = getDictionary(locale).savedSearch;
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setState("sending");
    try {
      const res = await fetch("/api/alertas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...criteria, email: email.trim() }),
      });
      if (res.ok) {
        setState("done");
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error === "invalid_email" ? t.invalidEmail : t.error);
      setState("error");
    } catch {
      setMessage(t.error);
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="panel-flash" role="status">
        {t.done}
      </p>
    );
  }
  return (
    <form className="contact-form" onSubmit={onSubmit} aria-labelledby={`${id}-t`}>
      <h3 id={`${id}-t`}>{t.title}</h3>
      <p>{t.intro}</p>
      <label className="contact-form__field" htmlFor={`${id}-e`}>
        <span className="contact-form__label">{t.emailLabel}</span>
        <input
          id={`${id}-e`}
          className="contact-form__input"
          type="email"
          required
          autoComplete="email"
          maxLength={190}
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button className="contact-form__submit" type="submit" disabled={state === "sending"}>
        {state === "sending" ? t.sending : t.submit}
      </button>
      {message && (
        <p className="contact-form__error" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
