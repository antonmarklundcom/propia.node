import Link from "next/link";
import { esPanel } from "@/i18n/es";
import { roleLabel, type UserRole } from "@/lib/auth/roles";
import { logoutAction } from "@/lib/auth/actions";

export interface PanelTab {
  href: string;
  label: string;
  count?: number;
  active?: boolean;
}

/**
 * Shared panel sub-header: title, the signed-in user's role, a logout form, and
 * a tab row. Server component — the logout button posts to the logout action,
 * so the panel needs no client JS.
 */
export function PanelBar({
  title,
  role,
  userName,
  tabs,
}: {
  title: string;
  role: UserRole;
  userName: string | null;
  tabs: PanelTab[];
}) {
  return (
    <div className="panel-bar">
      <div className="panel-bar__inner">
        <div className="panel-bar__top">
          <h1 className="panel-bar__title">{title}</h1>
          <div className="panel-bar__who">
            {userName ? <span>{userName}</span> : null}
            <span className="panel-bar__role">{roleLabel(role)}</span>
            <form action={logoutAction}>
              <button className="panel-btn" type="submit">
                {esPanel.logout}
              </button>
            </form>
          </div>
        </div>
        <nav className="panel-tabs" aria-label="Secciones del panel">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`panel-tab${t.active ? " panel-tab--active" : ""}`}
            >
              {t.label}
              {t.count ? <span className="panel-tab__count">{t.count}</span> : null}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
