import type { PanelTab } from "@/components/panel/PanelBar";
import { esPanel } from "@/i18n/es";

/**
 * The /agencia tabs, active one flagged.
 *
 * `showTeam` is passed by pages that already know the caller is the agency's
 * responsable (`agency_admin` with an agency): an agent inside the agency has
 * no team to manage, and /agencia/equipo bounces them anyway — this only keeps
 * the nav honest about it.
 */
export function agencyTabs(
  active: "listings" | "leads" | "profile" | "import" | "team",
  showTeam = false,
  /**
   * Leads from the last 24 h, badged on the Consultas tab. Same rule as
   * `adminTabs`' `recentLeadCount`: a nudge, not a number every page must
   * pay a query for, so omitted where the caller hasn't loaded it.
   */
  recentLeadCount?: number,
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
      count: recentLeadCount,
      active: active === "leads",
    },
    ...(showTeam
      ? [
          {
            href: "/agencia/equipo",
            label: esPanel.teamTab,
            active: active === "team",
          },
        ]
      : []),
    {
      href: "/agencia/perfil",
      label: esPanel.profileTab,
      active: active === "profile",
    },
  ];
}
