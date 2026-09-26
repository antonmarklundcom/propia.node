import type { PanelTab } from "@/components/panel/PanelBar";
import { esOwner } from "@/i18n/es";
import { esA2 } from "@/i18n/es-a2";

/**
 * The /mis-avisos tabs. Deliberately few: a private seller has no team, no
 * import and no agency profile — offering those would be offering a
 * professional's panel to somebody selling one house (PLAN.md D8). "Mi
 * cuenta" is only their own login (name, email, password).
 */
export function ownerTabs(active: "listings" | "leads" | "account"): PanelTab[] {
  return [
    {
      href: "/mis-avisos",
      label: esOwner.listingsTab,
      active: active === "listings",
    },
    {
      href: "/mis-avisos/consultas",
      label: esOwner.leadsTab,
      active: active === "leads",
    },
    {
      href: "/mis-avisos/cuenta",
      label: esA2.accountTab,
      active: active === "account",
    },
  ];
}
