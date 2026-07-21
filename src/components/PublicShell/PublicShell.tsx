import { ShieldCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { APP_NAME } from "../../config";
import { useCompare } from "../../context/CompareContext";
import "./PublicShell.css";

interface PublicNavItem {
  label: string;
  path: string;
  comingSoon?: boolean;
}

const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { label: "Browse Listings", path: "/" },
  { label: "Loan Calculator", path: "/loan-calculator" },
  { label: "Sell Your Property", path: "/sell", comingSoon: true },
];

export function PublicShell() {
  const { compareIds } = useCompare();

  return (
    <div className="public-shell">
      <header className="public-shell__topnav">
        <NavLink to="/" className="public-shell__brand" end>
          <ShieldCheck size={20} strokeWidth={2} aria-hidden="true" />
          <span>{APP_NAME}</span>
        </NavLink>

        <nav className="public-shell__nav" aria-label="Primary">
          {PUBLIC_NAV_ITEMS.map((item) =>
            item.comingSoon ? (
              <span
                key={item.path}
                className="public-shell__nav-item public-shell__nav-item--soon"
                title="Coming in a later stage"
              >
                {item.label}
              </span>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `public-shell__nav-item${isActive ? " public-shell__nav-item--active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
          {compareIds.length > 0 ? (
            <NavLink
              to="/compare"
              className={({ isActive }) =>
                `public-shell__nav-item${isActive ? " public-shell__nav-item--active" : ""}`
              }
            >
              Compare
              <span className="public-shell__compare-count">{compareIds.length}</span>
            </NavLink>
          ) : null}
        </nav>

        <NavLink to="/login" className="public-shell__login-link">
          Staff Login
        </NavLink>
      </header>

      <main className="public-shell__content">
        <Outlet />
      </main>
    </div>
  );
}
