"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/i18n";

/** Shown by the server only for an empty listing scope; dismissal lasts this visit. */
export function OnboardingPanel({ t }: { t: Dictionary["onboarding"] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <section className="panel-card" aria-labelledby="onboarding-title">
      <div className="panel-section__header">
        <h2 id="onboarding-title" className="panel-section__title">{t.title}</h2>
        <button type="button" className="panel-btn" onClick={() => setDismissed(true)}>
          {t.dismiss}
        </button>
      </div>
      <ol style={{ paddingLeft: "1.25rem", lineHeight: 1.7 }}>
        <li><Link href="/agencia/perfil">{t.contact}</Link></li>
        <li><Link href="/agencia/perfil">{t.photo}</Link></li>
        <li><Link href="/publicar">{t.publish}</Link></li>
      </ol>
      <p className="panel-note">{t.profileHint}</p>
      <p>{t.review}</p>
      <p>{t.visibility}</p>
    </section>
  );
}
