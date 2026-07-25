import type { PanelTab } from "@/components/panel/PanelBar";
import { esPanel } from "@/i18n/es";

/** The /agencia tabs, active one flagged. */
export function agencyTabs(
  active: "listings" | "leads" | "profile" | "import",
): PanelTab[] {
  return [
    {
      href: "/agencia",
      label: esPanel.agencyListingsTitle,
      active: active === "listings",
    },
    {
      href: "/agencia/importar",
      label: esPanel.importTab,
      active: active === "import",
    },
    {
      href: "/agencia/leads",
      label: esPanel.agencyLeadsTitle,
      active: active === "leads",
    },
    {
      href: "/agencia/perfil",
      label: esPanel.profileTab,
      active: active === "profile",
    },
  ];
}
