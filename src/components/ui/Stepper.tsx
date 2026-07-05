/**
 * Wizard progress indicator (§6.2). Pure render — the wizard owns the state.
 * Steps before `current` show as done, `current` is active.
 */
export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number; // 0-based
}) {
  return (
    <ol className="stepper" aria-label={`Paso ${current + 1} de ${steps.length}`}>
      {steps.map((label, i) => {
        const state =
          i < current ? "stepper__step--done" : i === current ? "stepper__step--active" : "";
        return (
          <li key={label} className={`stepper__step ${state}`.trim()}>
            <span className="stepper__dot" aria-hidden>
              {i < current ? "✓" : i + 1}
            </span>
            <span className="stepper__label">{label}</span>
            {i < steps.length - 1 && <span className="stepper__line" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
