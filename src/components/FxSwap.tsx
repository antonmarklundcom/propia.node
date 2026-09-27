import type { ReactNode } from "react";

/**
 * A price shown in US$ with an EUR alternative the visitor can switch to
 * (`CurrencySwitch`). Both are server-rendered; which one is visible is a CSS
 * rule on `<html data-currency>` (globals.css, `.fx--usd` / `.fx--eur`), so
 * the server markup is the same for every visitor and hydration never
 * disagrees — the switch only flips the attribute after mount.
 *
 * No `eur` (Spanish doors, or `USD_EUR_RATE` unset): renders `usd` alone,
 * exactly as before. No hooks, so a server component can render it.
 */
export function FxSwap({ usd, eur }: { usd: ReactNode; eur: ReactNode | null | undefined }) {
  if (eur == null || eur === false) return <>{usd}</>;
  return (
    <>
      {usd != null && usd !== false && <span className="fx--usd">{usd}</span>}
      <span className="fx--eur">{eur}</span>
    </>
  );
}
