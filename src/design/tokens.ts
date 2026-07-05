/**
 * propia design tokens v2 (ARCHITECTURE.md §6.5).
 * Warm/ownership-coded, distinct from Tu Lugar's teal. Mobile-first:
 * Paraguayan traffic is overwhelmingly Android + WhatsApp.
 *
 * The runtime source of truth is the `:root` custom-property block in
 * app/globals.css. Everything here resolves to `var(--…)` so TS-side inline
 * styles can never drift from the CSS — there is nothing to keep in sync.
 * The raw values live in `hex` for the rare consumer that cannot resolve a
 * CSS variable (meta theme-color, canvas/map markers, email templates).
 */

/** Raw values — single place raw hex/px appear on the TS side. */
export const hex = {
  primary: "#1A5D3A", // deep green — ownership, trust
  primaryDark: "#12432A",
  accent: "#E8A13D", // warm amber — CTAs, cuota highlights, "Destacado"
  accentInk: "#3A2A08", // readable ink on amber
  accentSoft: "#FCF3E4", // amber tint for cuota chips
  whatsapp: "#25D366", // never repurposed; it means one thing
  ink: "#1B1F24",
  inkSecondary: "#5B6470",
  surface: "#FFFFFF",
  background: "#F6F7F5",
  border: "#E6E9E5",
  success: "#1E8E4E",
  error: "#C4453B",
} as const;

export const tokens = {
  color: {
    primary: "var(--color-primary)",
    primaryDark: "var(--color-primary-dark)",
    accent: "var(--color-accent)",
    accentInk: "var(--color-accent-ink)",
    accentSoft: "var(--color-accent-soft)",
    whatsapp: "var(--color-whatsapp)",
    ink: "var(--color-ink)",
    inkSecondary: "var(--color-ink-secondary)",
    surface: "var(--color-surface)",
    background: "var(--color-background)",
    border: "var(--color-border)",
    success: "var(--color-success)",
    error: "var(--color-error)",
  },
  /** 4px base scale. Use the step, not a px literal. */
  space: {
    1: "var(--space-1)", // 4px
    2: "var(--space-2)", // 8px
    3: "var(--space-3)", // 12px
    4: "var(--space-4)", // 16px
    5: "var(--space-5)", // 24px
    6: "var(--space-6)", // 32px
    7: "var(--space-7)", // 48px
    8: "var(--space-8)", // 64px
  },
  radius: {
    input: "var(--radius-input)", // 8px
    card: "var(--radius-card)", // 12px
    media: "var(--radius-media)", // 14px
    chip: "var(--radius-chip)", // pill
  },
  shadow: {
    card: "var(--shadow-card)",
    cardHover: "var(--shadow-card-hover)",
    float: "var(--shadow-float)", // search bar, modals, sticky aside
  },
  font: {
    family:
      "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    /** Type scale — never render body copy below `body` (16px). */
    size: {
      xs: "var(--text-xs)", // 12px — labels, badges
      sm: "var(--text-sm)", // 14px — secondary, chips
      body: "var(--text-body)", // 16px — minimum body
      md: "var(--text-md)", // 18px — lead paragraphs
      lg: "var(--text-lg)", // 20px — card price, section titles
      xl: "var(--text-xl)", // 24px — page titles
      "2xl": "var(--text-2xl)", // 28px — detail price
      "3xl": "var(--text-3xl)", // 34px — hero
    },
  },
  z: {
    header: "var(--z-header)", // 20
    sticky: "var(--z-sticky)", // 30
    sheet: "var(--z-sheet)", // 40
    modal: "var(--z-modal)", // 50
    toast: "var(--z-toast)", // 60
  },
} as const;
