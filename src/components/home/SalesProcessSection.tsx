import Link from "next/link";

/**
 * The one dark section per page (guide §2, §5 "Sales-process section"):
 * `#121414`, white text, four numbered steps, one white-on-photo button.
 * Extracted from `NordicoHome.tsx` so `/vender` (guide §5.5: "The dark
 * sales-process band (same component as home)") reuses the identical markup
 * instead of a second copy — `ctaHref` is a prop rather than a hardcoded
 * `/vender` self-link so the same component can point home's CTA at
 * `/vender` and `/vender`'s own CTA at its closing form instead of reloading
 * itself (see the PR description for that call).
 */
export function SalesProcessSection({
  title,
  steps,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  steps: readonly { title: string; text: string }[];
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="ds-section ds-section--dark nh-process">
      <div className="ds-container">
        <h2 className="nh-process__title">{title}</h2>
        <div className="nh-process__grid">
          {steps.map((s, i) => (
            <div key={s.title} className="nh-process__step">
              <span className="nh-process__num" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="nh-process__step-title">{s.title}</h3>
              <p className="nh-process__step-text">{s.text}</p>
            </div>
          ))}
        </div>
        <Link className="ds-btn ds-btn--on-photo nh-process__cta" href={ctaHref}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
