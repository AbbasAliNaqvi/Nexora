import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../../src/store/authStore";
import "./AppLayout.css";

const I = {
  dashboard: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  projects: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  usage: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  ai: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  logout: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  chevron: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
};

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/projects", label: "Projects", icon: "projects" },
  { to: "/usage", label: "Usage", icon: "usage" },
  { to: "/ai", label: "AI", icon: "ai" },
];

const TIER_COLOR = {
  free: "var(--text-3)",
  pro: "#3b82f6",
  enterprise: "var(--brand)",
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fn = () => setCollapsed(window.innerWidth < 1024);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <span className="sidebar-logo-mark">⚡</span>
            {!collapsed && <span className="sidebar-logo-text">nexora</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((v) => !v)}
          >
            <span
              style={{
                transform: collapsed ? "rotate(180deg)" : "none",
                display: "flex",
                transition: "transform .2s",
              }}
            >
              {I.chevron}
            </span>
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
            >
              <span className="sidebar-link-icon">{I[icon]}</span>
              {!collapsed && (
                <span className="sidebar-link-label">{label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {!collapsed && user && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name}</span>
                <span
                  className="sidebar-user-tier"
                  style={{ color: TIER_COLOR[user.subscription] }}
                >
                  {user.subscription}
                </span>
              </div>
            </div>
          )}
          <button
            className="sidebar-link sidebar-logout"
            onClick={() => {
              logout();
              navigate("/");
            }}
            title={collapsed ? "Log out" : undefined}
          >
            <span className="sidebar-link-icon">{I.logout}</span>
            {!collapsed && <span className="sidebar-link-label">Log out</span>}
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(({ to, label, icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`mobile-nav-tab ${active ? "mobile-nav-tab-active" : ""}`}
              >
                <span className="mobile-nav-icon">{I[icon]}</span>
                <span className="mobile-nav-label">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}