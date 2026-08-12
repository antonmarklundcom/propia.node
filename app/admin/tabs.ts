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
