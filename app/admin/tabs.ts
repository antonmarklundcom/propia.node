import type { PanelTab } from "@/components/panel/PanelBar";
import { esPanel } from "@/i18n/es";

/** The /admin tabs, with the active one flagged and the review count badged. */
export function adminTabs(
  active: "review" | "agencies" | "users" | "listings",
  reviewCount: number,
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
      href: "/admin/inmobiliarias",
      label: esPanel.adminAgenciesTitle,
      active: active === "agencies",
    },
    {
      href: "/admin/usuarios",
      label: esPanel.adminUsersTitle,
      active: active === "users",
    },
  ];
}
