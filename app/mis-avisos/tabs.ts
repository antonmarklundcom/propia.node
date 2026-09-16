import type { PanelTab } from "@/components/panel/PanelBar";
import { esOwner } from "@/i18n/es";

/**
 * The /mis-avisos tabs. Deliberately two: a private seller has no team, no
 * import and no agency profile — offering those would be offering a
 * professional's panel to somebody selling one house (PLAN.md D8).
 */
export function ownerTabs(
  active: "listings" | "leads",
  /**
   * Leads from the last 24 h, badged on the Consultas tab. Omitted where it
   * isn't loaded — same rule as `adminTabs`' `recentLeadCount`: a nudge, not
   * a number every page must pay a query for.
   */
  recentLeadCount?: number,
): PanelTab[] {
  return [
    {
      href: "/mis-avisos",
      label: esOwner.listingsTab,
      active: active === "listings",
    },
    {
      href: "/mis-avisos/consultas",
      label: esOwner.leadsTab,
      count: recentLeadCount,
      active: active === "leads",
    },
  ];
}
