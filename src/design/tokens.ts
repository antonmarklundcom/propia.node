/**
 * propia design tokens v1 (ARCHITECTURE.md §3.3).
 * Warm/ownership-coded, distinct from Tu Lugar's teal. Mobile-first:
 * Paraguayan traffic is overwhelmingly Android + WhatsApp.
 */
export const tokens = {
  color: {
    primary: "#1A5D3A", // deep green — ownership, trust
    accent: "#E8A13D", // warm amber — CTAs, cuota highlights, "Destacado"
    whatsapp: "#25D366", // never repurposed; it means one thing
    ink: "#1B1F24",
    inkSecondary: "#5B6470",
    surface: "#FFFFFF",
    background: "#F6F7F5",
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
