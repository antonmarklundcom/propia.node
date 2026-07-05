import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Tappable pill — popular searches, quick filters, suggestion chips.
 * Link when `href` is given, otherwise a button.
 */
export function Chip({
  href,
  active,
  onClick,
  children,
}: {
  href?: string;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const cls = `chip${active ? " chip--active" : ""}`;
  if (href) {
    return (
      <Link className={cls} href={href}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
