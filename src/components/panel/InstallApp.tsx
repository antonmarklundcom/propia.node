"use client";

import { useEffect, useState } from "react";
import { esAgency } from "@/i18n/es-agency";

/**
 * "Install the panel as an app" (plan-agency batch 4). Android Chrome fires
 * `beforeinstallprompt` when the manifest (app/manifest.ts) qualifies, and the
 * button replays it; iPhone has no such event, so it gets the Safari steps.
 * Both step lists always render — a partner reading this on a laptop is
 * choosing which phone to install on.
 */
type InstallPromptEvent = Event & { prompt: () => Promise<void> };

export function InstallApp() {
  const t = esAgency.install;
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return (
    <article className="panel-card">
      <h2 style={{ fontSize: 18, margin: "0 0 .5rem" }}>{t.title}</h2>
      <p className="panel-note">{t.intro}</p>
      {installed ? (
        <p className="panel-flash">{t.installed}</p>
      ) : prompt ? (
        <button
          className="panel-btn panel-btn--primary"
          type="button"
          onClick={() => {
            void prompt.prompt();
            setPrompt(null);
          }}
        >
          {t.installButton}
        </button>
      ) : null}
      <h3 style={{ fontSize: 16, margin: "1rem 0 .25rem" }}>{t.androidTitle}</h3>
      <ol style={{ paddingLeft: "1.25rem", margin: 0, lineHeight: 1.6 }}>
        {t.androidSteps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <h3 style={{ fontSize: 16, margin: "1rem 0 .25rem" }}>{t.iosTitle}</h3>
      <ol style={{ paddingLeft: "1.25rem", margin: 0, lineHeight: 1.6 }}>
        {t.iosSteps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="panel-note">{t.alerts}</p>
    </article>
  );
}
