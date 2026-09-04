/**
 * Per-vertical themes — the mechanism PLAN.md D6 calls for, with the values
 * deliberately identical for now.
 *
 * A theme is just the subset of `:root` custom properties a host is allowed to
 * override. `app/layout.tsx` writes them onto <html> for the resolved vertical,
 * so every rule that reads `var(--color-*)` follows the domain with no
 * component changes. Today both live hosts get the same editorial system, so
 * this is a no-op at runtime — but the wire exists, and giving
 * realestateinparaguay.com its own palette later is an entry in this file
 * rather than a refactor of every component.
 *
 * Rules for adding one:
 *   - Values only. Structure (which sections a page has, which hero it uses)
 *     belongs in a shell/component registry, not here — a token can't express
 *     "this domain has a different homepage".
 *   - A shared component must never branch on the vertical key. If it needs to
 *     differ, it needs a token here or a fork in the registry; a conditional
 *     inside a shared component is how one component quietly becomes two.
 */
import type { VerticalKey } from "@/config/verticals";
import { tokens } from "./tokens";

export type ThemeVars = Record<`--${string}`, string>;

/** The editorial system: the base every host currently uses. */
const EDITORIAL: ThemeVars = {
  "--color-primary": tokens.color.primary,
  "--color-primary-dark": tokens.color.primaryDark,
  "--color-primary-soft": tokens.color.primarySoft,
  "--color-accent": tokens.color.accent,
  "--color-accent-hover": tokens.color.accentHover,
  "--color-accent-soft": tokens.color.accentSoft,
  "--color-link": tokens.color.link,
  "--color-link-hover": tokens.color.linkHover,
  "--color-ink": tokens.color.ink,
  "--color-ink-secondary": tokens.color.inkSecondary,
  "--color-ink-muted": tokens.color.inkMuted,
  "--color-background": tokens.color.background,
  "--color-border": tokens.color.border,
  "--color-border-accent": tokens.color.borderAccent,
  "--color-on-accent": tokens.color.onAccent,
  "--color-accent-on-dark": tokens.color.accentOnDark,
  "--font-display": tokens.font.display,
  "--font-sans": tokens.font.family,
  "--radius-control": tokens.radius.control,
  "--radius-photo": tokens.radius.photo,
  "--label-tracking": tokens.label.tracking,
  "--button-case": tokens.button.case,
  "--shadow-float": tokens.shadow.float,
  "--overlay-hero": tokens.overlay.hero,
  "--overlay-card": tokens.overlay.card,
  "--overlay-zone": tokens.overlay.zone,
  "--button-primary-bg": tokens.button.primaryBg,
  "--button-primary-bg-hover": tokens.button.primaryBgHover,
  "--button-primary-fg": tokens.button.primaryFg,
  /**
   * Layout scale — container width, section rhythm, grid gap. Not read from
   * `tokens.space` here on purpose: those stay the editorial system's own
   * constants (used directly by callers that don't go through the theme),
   * while these three are the per-vertical override surface PR 2 needs
   * (Nórdico's container 1280 / 120px sections / 24px flat gap, guide §4).
   * Baseline values match `tokens.space.*` exactly, so every vertical but
   * the one with an OVERRIDES entry renders unchanged.
   */
  "--container": tokens.space.container,
  "--section-y": tokens.space.section,
  "--grid-gap": tokens.space.grid,
  // Header/footer surfaces — see the comment on tokens.header/footer.
  "--header-bg": tokens.header.bg,
  "--header-border": tokens.header.border,
  "--header-brand-color": tokens.header.brandColor,
  "--header-nav-color": tokens.header.navColor,
  "--header-nav-size": tokens.header.navSize,
  "--header-nav-tracking": tokens.header.navTracking,
  "--header-nav-case": tokens.header.navCase,
  "--header-panel-bg": tokens.header.panelBg,
  "--header-panel-border": tokens.header.panelBorder,
  "--header-panel-label-color": tokens.header.panelLabelColor,
  "--header-panel-desc-color": tokens.header.panelDescColor,
  "--header-panel-hover-bg": tokens.header.panelHoverBg,
  "--header-cta-border": tokens.header.ctaBorder,
  "--header-cta-bg": tokens.header.ctaBg,
  "--header-cta-fg": tokens.header.ctaFg,
  "--header-cta-hover-bg": tokens.header.ctaHoverBg,
  "--header-cta-hover-fg": tokens.header.ctaHoverFg,
  "--footer-bg": tokens.footer.bg,
  "--footer-border": tokens.footer.border,
  "--footer-fg": tokens.footer.fg,
  "--footer-fg-strong": tokens.footer.fgStrong,
  "--footer-fg-muted": tokens.footer.fgMuted,
  "--footer-fg-faint": tokens.footer.fgFaint,
  "--footer-tagline-color": tokens.footer.taglineColor,
  "--footer-hairline": tokens.footer.hairline,
  "--site-notice-label-color": tokens.siteNotice.labelColor,
};

/**
 * Overrides per vertical, merged onto EDITORIAL. An entry here is a
 * deliberate divergence, and the diff should show it.
 */
const OVERRIDES: Partial<Record<VerticalKey, ThemeVars>> = {
  /**
   * "Nórdico" (docs/style/inmobiliaria.com.py.md, locked 2026-09-04).
   * White space, one green accent used only for links/tags/numerals (never a
   * button fill — the primary button is black), Manrope for both display and
   * body type, 10px radius, one soft shadow reserved for the search bar and
   * the floating proof card.
   */
  inmobiliaria: {
    "--color-primary": "#121414", // the one dark section + footer top line
    "--color-primary-dark": "#0B0C0C",
    "--color-primary-soft": "#1E2122", // cards/fields on the dark section
    "--color-accent": "#2E6B4F", // links, tags, pills, step numerals — never a fill
    "--color-accent-hover": "#245741",
    "--color-accent-soft": "#E8F0EB",
    "--color-link": "#2E6B4F",
    "--color-link-hover": "#245741",
    "--color-ink": "#121414",
    "--color-ink-secondary": "#5F6663",
    "--color-ink-muted": "#9AA09D",
    "--color-background": "#FAFAF8",
    "--color-border": "rgba(18,20,20,0.10)",
    "--color-border-accent": "rgba(46,107,79,0.24)",
    "--color-on-accent": "#FFFFFF",
    "--color-accent-on-dark": "#2E6B4F",
    // §3: Manrope for everything, display and sans both.
    "--font-display": "'Manrope Variable', system-ui, sans-serif",
    "--font-sans": "'Manrope Variable', system-ui, sans-serif",
    // §4 shape: 10px radius everywhere, one soft shadow, hairlines elsewhere.
    "--radius-control": "10px",
    "--radius-photo": "10px",
    "--label-tracking": "0.08em",
    "--button-case": "none",
    "--shadow-float": "0 8px 30px rgba(0,0,0,0.08)",
    // The primary button is black fill / white text here (guide §5
    // "Buttons"), not the accent — accent stays reserved for links/tags.
    "--button-primary-bg": "#121414",
    "--button-primary-bg-hover": "#1E2122",
    "--button-primary-fg": "#FFFFFF",
    // Photo scrims: neutral black on the existing ramps (guide §2, "Overlays"
    // — photos carry the remaining colour, so no green/gold tint).
    "--overlay-hero":
      "linear-gradient(95deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.5) 34%, rgba(0,0,0,0.2) 62%, rgba(0,0,0,0.28) 100%)",
    "--overlay-card":
      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.78) 24%, rgba(0,0,0,0.5) 46%, rgba(0,0,0,0.16) 70%, rgba(0,0,0,0) 100%)",
    "--overlay-zone":
      "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 52%, rgba(0,0,0,0) 78%)",
    // §4: container 1280, sections 120px (clamp(80px,8vw,120px)), grid gap 24.
    "--container": "1280px",
    "--section-y": "clamp(80px, 8vw, 120px)",
    "--grid-gap": "24px",
    // §5 "Header": white, 72px, hairline bottom, sentence-case 15px nav —
    // the default header is a dark bar meant for a photo hero; Nórdico's
    // hero is white, so the header needs to actually be the white bar the
    // guide describes rather than reusing the dark default (review finding:
    // this was missing in the first pass, which also made the CTA's
    // dark-green-on-dark-green text unreadable).
    "--header-bg": "rgba(255,255,255,0.96)",
    "--header-border": "var(--color-border)",
    "--header-brand-color": "var(--color-ink)",
    "--header-nav-color": "var(--color-ink)",
    "--header-nav-size": "15px",
    "--header-nav-tracking": "0",
    "--header-nav-case": "none",
    "--header-panel-bg": "var(--color-surface)",
    "--header-panel-border": "var(--color-border)",
    "--header-panel-label-color": "var(--color-ink)",
    "--header-panel-desc-color": "var(--color-ink-secondary)",
    "--header-panel-hover-bg": "var(--color-accent-soft)",
    "--header-cta-border": "var(--button-primary-bg)",
    "--header-cta-bg": "var(--button-primary-bg)",
    "--header-cta-fg": "var(--button-primary-fg)",
    "--header-cta-hover-bg": "var(--button-primary-bg-hover)",
    "--header-cta-hover-fg": "var(--button-primary-fg)",
    // §5 "Footer": white, hairline top.
    "--footer-bg": "var(--color-surface)",
    "--footer-border": "var(--color-border)",
    "--footer-fg": "var(--color-ink-secondary)",
    "--footer-fg-strong": "var(--color-ink)",
    "--footer-fg-muted": "var(--color-ink-muted)",
    "--footer-fg-faint": "var(--color-ink-muted)",
    "--footer-tagline-color": "var(--color-ink-secondary)",
    "--footer-hairline": "var(--color-border)",
  },

  /**
   * "Variant A, guide-first" (docs/style/realestateinparaguay.com.md, locked
   * 2026-09-04). Palette "Petrol" — cool, deep, maritime, distinct from every
   * navy/gold competitor by hue and from the green Spanish portals in the
   * region. Newsreader (display) + IBM Plex Sans (text). Radius 0, hairline
   * borders everywhere, brass (#BFA265) IS the primary button fill here
   * (unlike Nórdico's black button) — guide §5 "Buttons": "Primary: brass
   * fill, petrol text". Contrast ratios below are computed (WCAG relative
   * luminance), not eyeballed — see the PR description for the full table.
   */
  en: {
    "--color-primary": "#0E2A30", // header, footer, dark sections, hero base
    "--color-primary-dark": "#0A2025", // footer bottom bar
    "--color-primary-soft": "#143A42", // search panel, dark cards
    "--color-accent": "#BFA265", // muted brass — fills, hairlines, labels/numerals on dark (6.16:1 on petrol)
    "--color-accent-hover": "#D9C48C",
    "--color-accent-soft": "#ECECE4", // facts strip / table header tint
    "--color-link": "#7A652F", // 5.06:1 on background
    "--color-link-hover": "#5C4B22", // 7.59:1 on background
    "--color-ink": "#131D1F",
    "--color-ink-secondary": "#4E5C5F", // 6.25:1
    "--color-ink-muted": "#77868A",
    "--color-background": "#F3F3EE", // paper — less yellow than the Spanish cream
    "--color-border": "rgba(19,29,31,0.12)",
    "--color-border-accent": "rgba(191,162,101,0.24)",
    "--color-on-accent": "#0E2A30", // text on brass fills — 6.16:1
    "--color-accent-on-dark": "#BFA265",
    // §3: Newsreader for display, IBM Plex Sans for text/UI.
    "--font-display":
      "'Newsreader Variable', Georgia, 'Times New Roman', serif",
    "--font-sans":
      "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    // §4 shape: radius 0, structure drawn with hairlines, no shadows.
    "--radius-control": "0",
    "--radius-photo": "0",
    "--label-tracking": "0.14em",
    "--button-case": "uppercase",
    "--shadow-float": "none",
    // §5 "Buttons": primary is a brass fill / petrol text (not black, unlike
    // Nórdico) — the guide's own rule for this domain.
    "--button-primary-bg": "#BFA265",
    "--button-primary-bg-hover": "#D9C48C",
    "--button-primary-fg": "#0E2A30",
    // Photo scrims: neutral near-black on the existing ramps, same reasoning
    // as Nórdico's (guide §2 "photos are colour-graded neither warm nor
    // cold; the palette does the temperature work").
    "--overlay-hero":
      "linear-gradient(95deg, rgba(6,18,22,0.80) 0%, rgba(6,18,22,0.56) 34%, rgba(6,18,22,0.22) 62%, rgba(6,18,22,0.30) 100%)",
    "--overlay-card":
      "linear-gradient(to top, rgba(6,18,22,0.88) 0%, rgba(6,18,22,0.8) 24%, rgba(6,18,22,0.5) 46%, rgba(6,18,22,0.16) 70%, rgba(6,18,22,0) 100%)",
    "--overlay-zone":
      "linear-gradient(to top, rgba(6,18,22,0.78) 0%, rgba(6,18,22,0.16) 52%, rgba(6,18,22,0) 78%)",
    // §4: container 1280, section rhythm clamp(80px,9vw,128px), grid gap 24.
    "--container": "1280px",
    "--section-y": "clamp(80px, 9vw, 128px)",
    "--grid-gap": "24px",
    // §5 "Header": petrol, 64px, wordmark in Newsreader. No login on this
    // domain (build-prompt.md / guide §8) — SiteHeader omits it via the
    // registry, not this token layer.
    "--header-bg": "var(--color-primary)",
    "--header-border": "rgba(191,162,101,0.16)",
    "--header-brand-color": "#fff",
    "--header-nav-color": "rgba(255,255,255,0.82)",
    "--header-nav-size": "14px",
    "--header-nav-tracking": "0.02em",
    "--header-nav-case": "none",
    "--header-panel-bg": "var(--color-primary-soft)",
    "--header-panel-border": "var(--color-border-accent)",
    "--header-panel-label-color": "#fff",
    "--header-panel-desc-color": "rgba(255,255,255,0.6)",
    "--header-panel-hover-bg": "rgba(191,162,101,0.12)",
    "--header-cta-border": "var(--button-primary-bg)",
    "--header-cta-bg": "var(--button-primary-bg)",
    "--header-cta-fg": "var(--button-primary-fg)",
    "--header-cta-hover-bg": "var(--button-primary-bg-hover)",
    "--header-cta-hover-fg": "var(--button-primary-fg)",
    // §5 "Footer": petrol, five columns, bottom bar in primary-dark.
    "--footer-bg": "var(--color-primary)",
    "--footer-border": "var(--color-border-accent)",
    "--footer-fg": "rgba(255,255,255,0.72)", // 8.44:1 on petrol
    "--footer-fg-strong": "#fff",
    "--footer-fg-muted": "rgba(255,255,255,0.5)",
    "--footer-fg-faint": "rgba(255,255,255,0.45)",
    "--footer-tagline-color": "rgba(255,255,255,0.62)",
    "--footer-hairline": "rgba(255,255,255,0.12)",
    // .site-notice__label (SiteNotice, renders site-wide): the EDITORIAL
    // baseline (#8C6829) is only 4.28:1 on THIS domain's --color-accent-soft
    // (#ECECE4) — below AA. Overridden here, for this vertical only, to the
    // same value as --color-link-hover (#5C4B22, 7.12:1 on #ECECE4,
    // computed) — a dedicated token rather than reusing --color-link-hover
    // directly, so this domain's SiteNotice color can change without ever
    // touching the other two verticals' (PR3 review, round 2).
    "--site-notice-label-color": "#5C4B22",
  },
};

export function themeFor(key: VerticalKey): ThemeVars {
  return { ...EDITORIAL, ...(OVERRIDES[key] ?? {}) };
}
