/**
 * propia design tokens v3 — "Deep Teal" (ARCHITECTURE.md §3.3).
 * Petrol teal + warm gold — an "emerging market opportunity" read.
 * Mobile-first: Paraguayan traffic is overwhelmingly Android + WhatsApp.
 *
 * accent (#D4A24C) is 2.3:1 on white — below WCAG AA for text. Use it only
 * for fills, chips, hairlines, and large numerals; never for body text or
 * links (use `primary` for those).
 */
export const tokens = {
  color: {
    primary: "#0D3B4D", // petrol teal — modern, less generic-corporate than navy
    primaryDark: "#06212C",
    accent: "#D4A24C", // antique gold — CTAs, cuota highlights, "Destacado"
    accentSoft: "#EEE2CE",
    whatsapp: "#25D366", // never repurposed; it means one thing
    ink: "#12201F",
    inkSecondary: "#55655F",
    surface: "#FFFFFF",
    background: "#F6F8F7",
    border: "#DCE3E1",
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
