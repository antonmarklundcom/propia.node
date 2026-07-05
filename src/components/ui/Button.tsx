import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "whatsapp" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

function classes(variant: Variant, size: Size, block?: boolean, extra?: string) {
  return [
    "btn",
    `btn--${variant}`,
    size !== "md" && `btn--${size}`,
    block && "btn--block",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Full-width — the default choice on mobile CTAs. */
  block?: boolean;
  children: ReactNode;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

/**
 * The design system's one button (§6.5). Renders a <button>, or a link when
 * `href` is given — internal paths use next/link, external URLs a plain <a>.
 */
export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", block, children, className, ...rest } =
    props;
  const cls = classes(variant, size, block, className);

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...anchor } = rest as Omit<LinkProps, keyof CommonProps>;
    if (/^https?:|^mailto:|^tel:/.test(href)) {
      return (
        <a className={cls} href={href} {...anchor}>
          {children}
        </a>
      );
    }
    return (
      <Link className={cls} href={href} {...anchor}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
