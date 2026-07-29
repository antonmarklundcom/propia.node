/**
 * propia design tokens v2 — "Puerto Navy" (ARCHITECTURE.md §3.3).
 * Semi-dark navy + antique gold, distinct from Tu Lugar's teal. Mobile-first:
 * Paraguayan traffic is overwhelmingly Android + WhatsApp.
 *
 * accent (#C9A227) is 2.4:1 on white — below WCAG AA for text. Use it only
 * for fills, chips, hairlines, and large numerals; never for body text or
 * links (use `primary` for those).
 */
export const tokens = {
  color: {
    primary: "#14294A", // deep navy — trust, permanence
    primaryDark: "#0C1A30",
    accent: "#C9A227", // antique gold — CTAs, cuota highlights, "Destacado"
    accentSoft: "#F4E9C7",
    whatsapp: "#25D366", // never repurposed; it means one thing
    ink: "#101823",
    inkSecondary: "#56637A",
    surface: "#FFFFFF",
    background: "#F4F6FA",
    border: "#DFE5EE",
    success: "#1E8E4E",
    error: "#C4453B",
  },
  radius: { card: "12px", input: "8px", chip: "999px" },
  font: {
    family:
      "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    minBody: "16px",
  },
} as const;
