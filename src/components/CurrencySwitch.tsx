"use client";

import { useEffect, useState } from "react";

type Currency = "usd" | "eur";

/** Per-visitor, per-door (each door is its own origin) preference. */
const STORAGE_KEY = "price-currency";
const EVENT = "price-currency-change";

function applyCurrency(c: Currency) {
  if (c === "eur") document.documentElement.dataset.currency = "eur";
  else delete document.documentElement.dataset.currency;
}

/**
 * The USD / EUR switch of the English marketplace doors. Rendered by the
 * header only when `USD_EUR_RATE` is valid (src/lib/eur-rate.ts).
 *
 * The server always renders US$; this sets `<html data-currency="eur">` after
 * mount when the visitor chose EUR before, and CSS swaps every `FxSwap` on
 * the page. Two toggle buttons in a labelled group (`aria-pressed`), so it is
 * a Tab stop and Enter/Space away for a keyboard user. localStorage can throw
 * (private mode, blocked site data) — then the choice simply lasts the page.
 */
export function CurrencySwitch({
  label,
  usdLabel,
  eurLabel,
  eurTitle,
}: {
  label: string;
  usdLabel: string;
  eurLabel: string;
  /** Says that EUR amounts are approximate. */
  eurTitle: string;
}) {
  const [currency, setCurrency] = useState<Currency>("usd");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* no storage: stay on US$ */
    }
    if (saved === "eur") {
      applyCurrency("eur");
      setCurrency("eur");
    }
    // Another switch on the page (desktop and phone chrome) stays in step.
    const sync = () =>
      setCurrency(document.documentElement.dataset.currency === "eur" ? "eur" : "usd");
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  function choose(c: Currency) {
    applyCurrency(c);
    setCurrency(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* the choice lasts this page */
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <div className="currency-switch" role="group" aria-label={label}>
      <button
        type="button"
        className="currency-switch__btn"
        aria-pressed={currency === "usd"}
        onClick={() => choose("usd")}
      >
        {usdLabel}
      </button>
      <button
        type="button"
        className="currency-switch__btn"
        aria-pressed={currency === "eur"}
        onClick={() => choose("eur")}
        title={eurTitle}
      >
        {eurLabel}
      </button>
    </div>
  );
}
