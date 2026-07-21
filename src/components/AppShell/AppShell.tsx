import { LogOut, ShieldCheck } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { APP_NAME } from "../../config";
import { NAV_ITEMS_BY_ROLE } from "../../constants/nav";
import { useAuth } from "../../context/AuthContext";
import { firms } from "../../mocks";
import "./AppShell.css";

export function AppShell() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  if (!session) {
    return null;
  }

  const navItems = NAV_ITEMS_BY_ROLE[session.role];
  const firm = session.firmId ? firms.find((f) => f.id === session.firmId) : undefined;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">
          <ShieldCheck size={20} strokeWidth={2} aria-hidden="true" />
          <span>{APP_NAME}</span>
        </div>

        <nav className="app-shell__nav" aria-label="Primary">
          {navItems.map((item) =>
            item.comingSoon ? (
              <span
                key={item.path}
                className="app-shell__nav-item app-shell__nav-item--soon"
                title="Coming in a later stage"
              >
                <item.icon size={18} strokeWidth={2} aria-hidden="true" />
                <span>{item.label}</span>
                <span className="app-shell__soon-tag">Soon</span>
              </span>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `app-shell__nav-item${isActive ? " app-shell__nav-item--active" : ""}`
                }
              >
                <item.icon size={18} strokeWidth={2} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>

        <div className="app-shell__user">
          <div className="app-shell__user-info">
            <span className="app-shell__user-name">{session.displayName}</span>
            <span className="app-shell__user-role">
              {session.role}
              {firm ? ` · ${firm.name}` : ""}
            </span>
          </div>
          <button
            type="button"
            className="app-shell__logout"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}
