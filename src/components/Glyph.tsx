import type { ReactNode } from "react";

const GLYPHS = {
  home: <><path d="M3 11.5L12 4.5l9 7" /><path d="M5.5 10.6V20h13v-9.4M10 20v-5.2h4V20" /></>,
  bed: <><path d="M3 18V7m18 11V7M3 14h18M5 14V9h14v5M3 18h18M3 18v3m18-3v3" /><path d="M7 9V6h10v3" /></>,
  bath: <><path d="M3 12h18l-1.5 6h-15L3 12ZM6 18v3m12-3v3M6 12V5a2 2 0 0 1 4 0v1M8 6h4" /></>,
  car: <path d="m5 10 2-6h10l2 6M3 10h18v8H3zM5 18v3m14-3v3M6 14h2m8 0h2" />,
  area: <path d="M4 4h16v16H4zM4 9h3m-3 5h3m2 6v-3m5 3v-3M10 14l6-6m-4 0h4v4" />,
  land: <path d="m3 15 9-5 9 5-9 6-9-6ZM12 10V3m-3 4 3-4 3 4" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6.8V12l3.6 2.2" /></>,
  pin: <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1" />,
  doc: <path d="M5 3h9l5 5v13H5zM14 3v5h5M8 12h8M8 16h8" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.4 15.4L21 21" /></>,
  handshake: <path d="m2 8 4-3 4 2m12 1-4-3-5 2-4 4 3 2 4-3 5 6-6 5-9-7-4-6ZM6 14l-2 2m5 0-2 2m5 0-2 2" />,
  money: <><rect x="3" y="5" width="18" height="14" /><circle cx="12" cy="12" r="3" /><path d="M6 12h1m10 0h1" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1.1-2.6H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z" /><circle cx="7" cy="10" r="1" /><circle cx="11" cy="7" r="1" /><circle cx="16" cy="8" r="1" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  mail: <><rect x="3" y="5" width="18" height="14" /><path d="m3 6 9 7 9-7" /></>,
  phone: <path d="m5 3 4 1 1 5-3 2a14 14 0 0 0 6 6l2-3 5 1 1 4-3 2C10 21 3 14 3 6l2-3Z" />,
  whatsapp: <><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 21l1.5-5A8.5 8.5 0 1 1 20.5 11.5Z" /><path d="m8 7 2 3-1 1a8 8 0 0 0 4 4l1-1 3 1c-1 4-10-1-10-6l1-2Z" /></>,
  building: <path d="M4 20V4h10v16M14 20V9h6v11M7 7.5h1.5M10.5 7.5H12M7 11h1.5M10.5 11H12M7 14.5h1.5M10.5 14.5H12M16.5 12.5H18M16.5 16H18" />,
  key: <><circle cx="8" cy="8" r="5" /><path d="m11.5 11.5 9 9m-3-3 3-3m-6 0 3-3" /></>,
} satisfies Record<string, ReactNode>;

export type GlyphName = keyof typeof GLYPHS;

/** Shared decorative line family; safe in both server and client components. */
export function Glyph({ name, size = 16, className }: {
  name: GlyphName;
  size?: number;
  className?: string;
}) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={1.2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {GLYPHS[name]}
    </svg>
  );
}

// The home's two existing renderers are moved verbatim to preserve its visuals.
export function LineIcon({
  glyph,
  size,
  className,
}: {
  glyph: ReactNode;
  size: number;
  className: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {glyph}
    </svg>
  );
}

export function WhatsappGlyph() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.83c2.16 0 4.19.84 5.72 2.37a8.03 8.03 0 0 1 2.37 5.71c0 4.46-3.63 8.08-8.09 8.08a8.2 8.2 0 0 1-4.13-1.13l-.3-.18-3.11.82.83-3.04-.19-.31a8.02 8.02 0 0 1-1.24-4.29c0-4.45 3.63-8.03 8.14-8.03Zm-3.4 4.02c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03 0 1.2.87 2.35.99 2.52.12.16 1.69 2.7 4.19 3.68 2.08.82 2.5.66 2.95.61.45-.04 1.45-.59 1.66-1.17.2-.57.2-1.06.14-1.17-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.77.96-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.35-1.69-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.33-.76-1.82-.19-.43-.38-.4-.53-.41h-.45Z" />
    </svg>
  );
}

