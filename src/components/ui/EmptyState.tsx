import type { ReactNode } from "react";

/** Branded empty state: icon + title + hint + optional action (a Button/Chip). */
export function EmptyState({
  icon = "🏡",
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden>
        {icon}
      </span>
      <p className="empty-state__title">{title}</p>
      {hint && <p className="empty-state__hint">{hint}</p>}
      {action}
    </div>
  );
}
