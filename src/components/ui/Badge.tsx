import type { ReactNode } from "react";

/**
 * Small non-interactive status label: operation on cards, ✓ Verificado,
 * Destacado, project stage (en pozo / en construcción / entrega inmediata).
 */
export function Badge({
  variant = "primary",
  children,
}: {
  variant?: "primary" | "accent" | "soft" | "success" | "neutral";
  children: ReactNode;
}) {
  return (
    <span className={`badge${variant === "primary" ? "" : ` badge--${variant}`}`}>
      {children}
    </span>
  );
}
