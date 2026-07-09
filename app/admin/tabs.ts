import type { PanelTab } from "@/components/panel/PanelBar";
import { esPanel } from "@/i18n/es";

/** The two /admin tabs, with the active one flagged and the review count badged. */
export function adminTabs(
  active: "review" | "agencies",
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
      href: "/admin/inmobiliarias",
      label: esPanel.adminAgenciesTitle,
      active: active === "agencies",
    },
  ];
}
