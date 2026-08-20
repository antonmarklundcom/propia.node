import type { PanelTab } from "@/components/panel/PanelBar";
import { esPanel } from "@/i18n/es";

/** The /admin tabs, with the active one flagged and the review count badged. */
export function adminTabs(
  active:
    | "review"
    | "agencies"
    | "agents"
    | "users"
    | "listings"
    | "leads"
    | "posts"
    | "import",
  reviewCount: number,
  /** Draft count, badged on the editorial tab. Omitted where it isn't loaded. */
  draftPostCount?: number,
  /**
   * Leads from the last 24 h, badged on the Consultas tab. Omitted where it
   * isn't loaded — the badge is a nudge, not a number every screen must pay
   * a query for.
   */
  recentLeadCount?: number,
): PanelTab[] {
  return [
    {
      href: "/admin",
      label: esPanel.adminReviewTitle,
      count: reviewCount,
      active: active === "review",
    },
    {
      href: "/admin/propiedades",
      label: esPanel.adminListingsTitle,
      active: active === "listings",
    },
    {
      href: "/admin/leads",
      label: esPanel.adminLeadsTitle,
      count: recentLeadCount,
      active: active === "leads",
    },
    {
      href: "/admin/guias",
      label: "Guías y notas",
      count: draftPostCount,
      active: active === "posts",
    },
    {
      href: "/admin/importar",
      label: esPanel.adminImportTitle,
      active: active === "import",
    },
    {
      href: "/admin/inmobiliarias",
      label: esPanel.adminAgenciesTitle,
      active: active === "agencies",
    },
    {
      href: "/admin/agentes",
      label: esPanel.adminAgentsTitle,
      active: active === "agents",
    },
    {
      href: "/admin/usuarios",
      label: esPanel.adminUsersTitle,
      active: active === "users",
    },
  ];
}
