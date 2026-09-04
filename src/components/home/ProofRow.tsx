/**
 * Nórdico proof row (docs/style/inmobiliaria.com.py.md §5 "Proof row"):
 * white, hairline top and bottom, a numeral/short phrase with a label under
 * it. Extracted from `NordicoHome.tsx` so `/vender` (guide §5.2: "Proof row
 * (same component as home)") reuses the identical markup and CSS instead of
 * a second copy that could drift from it.
 */
export function ProofRow({
  rows,
}: {
  rows: readonly { numeral: string; label: string }[];
}) {
  return (
    <section className="nh-proof">
      <div className="ds-container nh-proof__row">
        {rows.map((p) => (
          <div key={p.label} className="nh-proof__cell">
            <div className="nh-proof__numeral">{p.numeral}</div>
            <div className="nh-proof__label">{p.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
