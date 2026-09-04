/**
 * Design tokens v4 — "Editorial" (the Sistema de diseño / Inmobiliaria2 files).
 *
 * Deep green + contained gold + cream, Cormorant Garamond over Jost. The
 * system's own rules, which the components are expected to hold to:
 *   - Two backgrounds per page, maximum: cream `background` and deep green
 *     `primary`. Gold is never a full-section background — accent and the one
 *     primary button per block, nothing else.
 *   - No rounded corners anywhere. `radius` is kept at 0 rather than deleted so
 *     the handful of consumers that read it don't have to change shape.
 *   - Photography carries the design: cards are the photo with a gradient and
 *     text on top, never a white frame with a soft shadow.
 *
 * `accent` (#C19A4D) is 2.6:1 on cream — still below WCAG AA for body text.
 * It is for fills, hairlines, labels and large numerals; body text and links on
 * cream use `link` (#8A6626, ~4.7:1), the same hue darkened enough to pass —
 * the previous `link` value (#B5893C) measured 2.87:1, not the 4.6:1 an
 * earlier version of this comment claimed.
 *
 * CSS can't import this module, so `app/globals.css` duplicates the values in
 * `:root`. Change both, and prefer `var(--color-*)` in new CSS so the
 * per-vertical themes in `src/design/themes.ts` can override them per host.
 */
export const tokens = {
  color: {
    primary: "#0E1F17", // verde profundo — dark sections, header, hero base
    primaryDark: "#0B1710",
    primarySoft: "#12271D", // panels on green (search bar, dark CTA blocks)
    accent: "#C19A4D", // dorado — primary button, labels, hairlines
    accentHover: "#DDBC7C",
    accentSoft: "#F1EDE4", // the one tint that may fill a block on cream
    link: "#8A6626",
    linkHover: "#6B4F1C",
    whatsapp: "#1FAC54", // floating button only; never repurposed
    ink: "#16211B",
    inkSecondary: "#56605A",
    inkMuted: "#7D857F",
    surface: "#FFFFFF",
    background: "#F6F3EC", // crema
    border: "rgba(22,33,27,0.12)", // on cream
    borderOnDark: "rgba(255,255,255,0.18)",
    borderAccent: "rgba(193,154,77,0.24)",
    /** Text sitting on an accent (gold) fill — decoupled from `primary` so a
     *  vertical can retheme its accent-fill text without retheming its brand
     *  primary. Same value as `primary` today. */
    onAccent: "#0E1F17",
    /** Accent-colored text/icons on a dark (primary) ground. Same value as
     *  `accent` today. */
    accentOnDark: "#C19A4D",
    success: "#1E8E4E",
    error: "#C4453B",
  },
  /** Rectangles only — see the note above. */
  radius: {
    card: "0",
    input: "0",
    chip: "0",
    /** Form controls and buttons. */
    control: "0",
    /** Photo cards. */
    photo: "0",
  },
  font: {
    display: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    family: "Jost, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    minBody: "16px",
  },
  /** Uppercase micro-label tracking (`.ds-label`, buttons). */
  label: { tracking: "3.4px" },
  /** Button text-transform. */
  button: {
    case: "uppercase",
    /** `.ds-btn--primary` fill/text — decoupled from `accent` so a vertical
     *  whose accent is not a button colour (Nórdico's green, kept for links
     *  and tags only) can still retheme its primary button. Same values as
     *  `color.accent` / the fixed dark text today, so this is a no-op until
     *  a vertical overrides it. */
    primaryBg: "#C19A4D",
    primaryBgHover: "#DDBC7C",
    primaryFg: "#12100a",
  },
  shadow: { float: "none" },
  /**
   * Site header surface — today's dark-translucent-over-photo bar (guide
   * "system-agnostic" default), decoupled from `color.primary` so a vertical
   * whose header is meant to be a plain white bar (Nórdico) doesn't drag its
   * dark section along with it. All eight are read-only defaults; only
   * `OVERRIDES.inmobiliaria` diverges from them today.
   */
  header: {
    bg: "rgba(14,31,23,0.88)",
    border: "rgba(193,154,77,0.16)",
    brandColor: "#fff",
    navColor: "rgba(255,255,255,0.82)",
    navSize: "10.5px",
    navTracking: "1.7px",
    navCase: "uppercase",
    panelBg: "var(--color-primary-soft)",
    panelBorder: "var(--color-border-accent)",
    panelLabelColor: "#fff",
    panelDescColor: "rgba(255,255,255,0.6)",
    panelHoverBg: "rgba(193,154,77,0.12)",
    ctaBorder: "rgba(193,154,77,0.75)",
    ctaBg: "transparent",
    ctaFg: "var(--color-accent-hover)",
    ctaHoverBg: "var(--color-accent)",
    ctaHoverFg: "var(--color-on-accent)",
  },
  /** Site footer surface — same decoupling reason as `header` above. */
  footer: {
    bg: "var(--color-primary)",
    border: "var(--color-border-accent)",
    fg: "rgba(255,255,255,0.72)",
    fgStrong: "#fff",
    fgMuted: "rgba(255,255,255,0.5)",
    fgFaint: "rgba(255,255,255,0.45)",
    taglineColor: "rgba(255,255,255,0.62)",
    hairline: "rgba(255,255,255,0.12)",
  },
  /**
   * `.site-notice__label` — the pre-launch banner's "SITIO EN CONSTRUCCIÓN"
   * kicker. `SiteNotice` renders site-wide (every vertical, not just one
   * door's pages), so this is its own token rather than reusing
   * `color.linkHover`: that value differs per vertical, and a vertical that
   * only means to retheme its own label color must not also repaint every
   * other door's (PR3 review, round 2). Same literal the label always had.
   */
  siteNotice: { labelColor: "#8C6829" },
  /** Photo overlays. Text sits on the image; these keep it readable. */
  overlay: {
    hero: "linear-gradient(95deg, rgba(9,20,14,0.96) 0%, rgba(9,20,14,0.84) 34%, rgba(9,20,14,0.34) 62%, rgba(9,20,14,0.42) 100%)",
    /** Deepened ramp (audit F-scrim): holds ~0.9 through the text block
     *  instead of releasing at 0.42, so bright photos don't wash out white
     *  card text. Mirrors app/globals.css's `--overlay-card`. */
    card: "linear-gradient(to top, rgba(7,15,11,0.95) 0%, rgba(7,15,11,0.9) 24%, rgba(7,15,11,0.62) 46%, rgba(7,15,11,0.22) 70%, rgba(7,15,11,0) 100%)",
    zone: "linear-gradient(to top, rgba(7,15,11,0.88) 0%, rgba(7,15,11,0.2) 52%, rgba(7,15,11,0) 78%)",
  },
  space: {
    container: "1440px",
    containerPad: "clamp(20px, 4vw, 56px)",
    section: "clamp(88px, 10vw, 132px)",
    afterHeading: "44px",
    grid: "clamp(12px, 1.6vw, 24px)",
  },
  motion: {
    /** Nothing bounces, nothing rotates, no hard parallax. */
    ease: "cubic-bezier(0.22, 1, 0.36, 1)",
    photo: "1.1s cubic-bezier(0.22, 1, 0.36, 1)",
    reveal: "0.9s cubic-bezier(0.22, 1, 0.36, 1)",
  },
} as const;
